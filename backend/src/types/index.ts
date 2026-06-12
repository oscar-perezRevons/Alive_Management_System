import { Request } from 'express';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  userRole?: 'ADMIN' | 'USER';
}