import { Response } from 'express';
import prisma from '../config/database';

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
        select: { id: true, name: true, email: true, role: true, groupRole: true, isActive: true, createdAt: true, avatarUrl: true },
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

      const avatarUrl = `/uploads/${req.file.filename}`;

      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl }
      });

      return res.status(200).json({ success: true, message: 'Imagen de perfil guardada.', avatarUrl });
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
      if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Denegado.' });
      const userId = parseInt(req.params.id);

      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Identificador de usuario inválido.' });
      }

      if (userId === req.userId) {
        return res.status(400).json({ success: false, message: 'No puedes modificar tu propio perfil de acceso.' });
      }

      const { accessProfile, role, groupRole } = req.body as {
        accessProfile?: AccessProfile;
        role?: 'ADMIN' | 'USER';
        groupRole?: string;
      };

      const normalizedAccessProfile = normalizeText(accessProfile) as AccessProfile;
      let roleToSave: 'ADMIN' | 'USER' | null = null;
      let groupRoleToSave: string | null = null;

      if (normalizedAccessProfile && ACCESS_PROFILE_CONFIG[normalizedAccessProfile]) {
        roleToSave = ACCESS_PROFILE_CONFIG[normalizedAccessProfile].role;
        groupRoleToSave = ACCESS_PROFILE_CONFIG[normalizedAccessProfile].groupRole;
      } else if (role && groupRole) {
        const normalizedRole = normalizeText(role);
        if (normalizedRole !== 'ADMIN' && normalizedRole !== 'USER') {
          return res.status(400).json({ success: false, message: 'Rol de sistema inválido.' });
        }
        roleToSave = normalizedRole as 'ADMIN' | 'USER';
        groupRoleToSave = groupRole;
      } else {
        return res.status(400).json({ success: false, message: 'Debes enviar un perfil de acceso válido.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: roleToSave, groupRole: groupRoleToSave },
        select: { id: true, name: true, email: true, role: true, groupRole: true, isActive: true, createdAt: true, avatarUrl: true }
      });

      return res.status(200).json({
        success: true,
        user: updatedUser,
        accessProfile: resolveAccessProfileFromUser(updatedUser.role, updatedUser.groupRole)
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  toggleUserStatus = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Denegado.' });
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;

      if (userId === req.userId) {
        return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta.' });
      }

      await prisma.user.update({ where: { id: userId }, data: { isActive } });
      return res.status(200).json({ success: true, message: 'Estado modificado.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

export const usersController = new UsersController();