import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export type AccessRole = 'ADMIN' | 'LIDER_GP' | 'USUARIO';

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '')
    .trim()
    .toUpperCase();

export const isLeaderGroupRole = (groupRole?: string) => normalizeText(groupRole) === 'LIDER';

export const resolveAccessRole = (req: AuthRequest): AccessRole => {
  if (normalizeText(req.userRole) === 'ADMIN') return 'ADMIN';
  if (isLeaderGroupRole(req.userGroupRole)) return 'LIDER_GP';
  return 'USUARIO';
};

export const requireAccessRoles = (allowedRoles: AccessRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const currentRole = resolveAccessRole(req);
    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción.'
      });
    }

    next();
  };
};
