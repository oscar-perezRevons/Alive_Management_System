import { Response } from 'express';
import prisma from '../config/database';

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
      const { role, groupRole } = req.body;
      const updatedUser = await prisma.user.update({ where: { id: userId }, data: { role, groupRole } });
      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  toggleUserStatus = async (req: any, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Denegado.' });
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      await prisma.user.update({ where: { id: userId }, data: { isActive } });
      return res.status(200).json({ success: true, message: 'Estado modificado.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

export const usersController = new UsersController();