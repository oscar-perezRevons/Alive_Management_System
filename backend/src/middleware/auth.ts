import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Intento de acceso sin token o formato incorrecto.');
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'Acceso denegado. Token no proporcionado o formato inválido.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('Error de configuración: JWT_SECRET no está definido en el entorno.');
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.userRole = decoded.role;
      
      console.log(`Token válido - Usuario ID: ${req.userId} | Email: ${req.userEmail} | Rol: ${req.userRole}`);
      next();
    } catch (error) {
      console.log('⚠️ Token inválido o expirado.');
      return res.status(401).json({ 
        error: 'No autorizado', 
        message: 'El token proporcionado es inválido o ha expirado.' 
      });
    }
  } catch (error: any) {
    console.error('Error crítico en authMiddleware:', error.message);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`Verificando permisos de administrador - Rol actual: ${req.userRole}`);

  if (!req.userRole || req.userRole !== 'ADMIN') {
    console.log(`Acceso denegado para el Usuario ID: ${req.userId}. Permisos insuficientes.`);
    return res.status(403).json({ 
      error: 'Acceso denegado', 
      message: 'Esta zona requiere privilegios de Administrador.' 
    });
  }

  console.log('Acceso de administrador concedido.');
  next();
};