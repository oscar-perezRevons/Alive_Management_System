import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acceso denegado. Token ausente o formato de cabecera inválido.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ALIVE_SECRET_KEY_2026') as any;
    const rawUserId = decoded?.id ?? decoded?.userId;
    const userId = Number(rawUserId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida. Identificador de usuario no válido.'
      });
    }

    const dbUser = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, groupRole: true, isActive: true }
    });

    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o usuario inactivo.'
      });
    }

    req.userId = dbUser.id;
    req.userEmail = dbUser.email;
    req.userRole = dbUser.role;
    req.userGroupRole = dbUser.groupRole || undefined;
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      groupRole: dbUser.groupRole || undefined
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Sesión inválida, token corrupto o expirado.' 
    });
  }
};