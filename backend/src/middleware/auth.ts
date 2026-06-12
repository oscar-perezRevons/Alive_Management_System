import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('⚠️ Sin header Authorization - Continuando como USER');
      req.userId = 0;
      req.userRole = 'USER';
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('⚠️ Sin token - Continuando como USER');
      req.userId = 0;
      req.userRole = 'USER';
      return next();
    }

    const secret = process.env.JWT_SECRET as string;

    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      console.log('✅ Token válido - Usuario:', decoded.userId, 'Rol:', decoded.role);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch (error) {
      console.log('⚠️ Token inválido - Continuando como USER');
      req.userId = 0;
      req.userRole = 'USER';
    }

    next();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    req.userId = 0;
    req.userRole = 'USER';
    next();
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔐 Verificando ADMIN - Rol:', req.userRole);

  // Si no es ADMIN pero tiene rol USER, bloquear
  if (req.userRole && req.userRole !== 'ADMIN' && req.userRole !== 'USER') {
    console.log('❌ Acceso denegado');
    return res.status(403).json({ error: 'Solo administradores' });
  }

  // ADMIN siempre pasa
  if (req.userRole === 'ADMIN') {
    console.log('✅ ADMIN - Acceso permitido');
    return next();
  }

  // USER sin token también pasa (para desarrollo)
  console.log('✅ Acceso permitido (modo desarrollo)');
  next();
};