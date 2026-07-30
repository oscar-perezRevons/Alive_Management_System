import { Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { uploadBufferToCloudinary, isCloudinaryConfigured, deleteFromCloudinary } from '../services/cloudinary.service';
import fs from 'fs';
import path from 'path';

export const userPasswordStore = new Map<number, string>();

type AccessProfile = 'ADMIN' | 'LIDER_GP' | 'USUARIO';

const ACCESS_PROFILE_CONFIG: Record<AccessProfile, { role: 'ADMIN' | 'USER'; groupRole: string }> = {
  ADMIN: { role: 'ADMIN', groupRole: 'ADMINISTRADOR' },
  LIDER_GP: { role: 'USER', groupRole: 'LIDER' },
  USUARIO: { role: 'USER', groupRole: 'MIEMBRO' }
};

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '')
    .trim()
    .toUpperCase();

const resolveAccessProfileFromUser = (role: string, groupRole?: string): AccessProfile => {
  if (normalizeText(role) === 'ADMIN') return 'ADMIN';
  if (normalizeText(groupRole) === 'LIDER') return 'LIDER_GP';
  return 'USUARIO';
};

export class UsersController {
  getAllUsers = async (req: any, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true, name: true, email: true, role: true, groupRole: true,
          isActive: true, createdAt: true, avatarUrl: true,
          groupSmallId: true,
          groupSmall: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, users });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  uploadAvatar = async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.userId || req.user?.id;

      if (userId !== loggedInUserId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Operación denegada. Privilegios insuficientes.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha proporcionado ningún archivo binario.' });
      }

      let avatarUrl = '';

      if (isCloudinaryConfigured() && req.file.buffer) {
        const uploadResult = await uploadBufferToCloudinary(
          req.file.buffer,
          'avatars',
          `user-${userId}-${req.file.originalname}`
        );
        avatarUrl = uploadResult.secure_url;
      } else if (req.file.filename) {
        avatarUrl = `/uploads/${req.file.filename}`;
      } else {
        return res.status(500).json({ success: false, message: 'Error al procesar el archivo subido.' });
      }

      // Fetch user to check if old avatar needs cleanup
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
      if (currentUser?.avatarUrl && currentUser.avatarUrl.includes('cloudinary.com')) {
        deleteFromCloudinary(currentUser.avatarUrl).catch(() => {});
      }

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl }
      });

      return res.status(200).json({ success: true, message: 'Imagen de perfil guardada con éxito en la nube.', avatarUrl });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  updateUser = async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const loggedInUserId = req.userId || req.user?.id;

      if (userId !== loggedInUserId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Operación denegada.' });
      }

      const { name, birthDate } = req.body;
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name, birthDate: birthDate ? new Date(birthDate) : null },
        select: { id: true, name: true, email: true, role: true, groupRole: true, birthDate: true, avatarUrl: true }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateUserRole = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
      const userId = parseInt(req.params.id);

      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Identificador de usuario inválido.' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, groupRole: true, groupSmallId: true }
      });

      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const { accessProfile, role, groupRole } = req.body as {
        accessProfile?: AccessProfile;
        role?: 'ADMIN' | 'USER';
        groupRole?: string;
      };

      // Block demoting own system role
      if (userId === req.userId && role && normalizeText(role) !== 'ADMIN') {
        return res.status(400).json({ success: false, message: 'No puedes revocar tu propio acceso de Administrador.' });
      }

      let roleToSave: 'ADMIN' | 'USER' = existingUser.role;
      let groupRoleToSave: string = existingUser.groupRole || 'Integrante';

      const normalizedAccessProfile = normalizeText(accessProfile) as AccessProfile;
      if (normalizedAccessProfile && ACCESS_PROFILE_CONFIG[normalizedAccessProfile]) {
        roleToSave = ACCESS_PROFILE_CONFIG[normalizedAccessProfile].role;
        groupRoleToSave = ACCESS_PROFILE_CONFIG[normalizedAccessProfile].groupRole;
      } else {
        if (role) {
          const normRole = normalizeText(role);
          if (normRole === 'ADMIN' || normRole === 'USER') {
            roleToSave = normRole as 'ADMIN' | 'USER';
          }
        }
        if (groupRole !== undefined) {
          groupRoleToSave = groupRole.trim();
        }
      }

      // Check 1 Líder constraint per group
      const normGroupRole = normalizeText(groupRoleToSave);
      if (normGroupRole === 'LIDER' || normGroupRole === 'LIDERES') {
        if (existingUser.groupSmallId) {
          const existingLeader = await prisma.user.findFirst({
            where: {
              groupSmallId: existingUser.groupSmallId,
              id: { not: userId },
              groupRole: { in: ['Líder', 'LIDER', 'lider', 'Lider'] }
            },
            select: { id: true, name: true }
          });

          if (existingLeader) {
            return res.status(400).json({
              success: false,
              message: `El grupo ya cuenta con un Líder asignado (${existingLeader.name}). Solo se permite 1 Líder por Grupo Pequeño.`
            });
          }
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: roleToSave, groupRole: groupRoleToSave },
        select: {
          id: true, email: true, name: true, role: true, groupRole: true,
          avatarUrl: true, birthDate: true, isActive: true, createdAt: true,
          groupSmallId: true, groupSmall: { select: { id: true, name: true } }
        }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  toggleUserStatus = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
      }

      const userId = parseInt(req.params.id);
      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Identificador de usuario inválido.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !existingUser.isActive },
        select: {
          id: true, email: true, name: true, role: true, groupRole: true,
          avatarUrl: true, birthDate: true, isActive: true, createdAt: true,
          groupSmallId: true, groupSmall: { select: { id: true, name: true } }
        }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  resetUserPassword = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
      }

      const userId = parseInt(req.params.id);
      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Identificador de usuario inválido.' });
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Save updated plain password in active memory store
      userPasswordStore.set(userId, newPassword);

      return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getUserPassword = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
      }

      const userId = parseInt(req.params.id);
      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Identificador de usuario inválido.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const activePassword = userPasswordStore.get(userId) || (user.role === 'ADMIN' ? 'AdminPassword123*' : '123456');

      return res.status(200).json({
        success: true,
        currentPassword: activePassword
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

export const usersController = new UsersController();