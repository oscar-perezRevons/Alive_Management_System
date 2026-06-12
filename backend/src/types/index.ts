import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  body: any;
  params: any;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}