import { Request } from 'express';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'USER';
  groupRole?: string;
}

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  userRole?: 'ADMIN' | 'USER';
  userGroupRole?: string;
  user?: {
    id: number;
    email: string;
    role: 'ADMIN' | 'USER';
    groupRole?: string;
  };
}