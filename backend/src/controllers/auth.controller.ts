import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import prisma from '../config/database';

const authService = new AuthService();

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan campos requeridos: email, password y name son obligatorios.' });
      }

      const result = await authService.register(email, password, name);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos.' });
      }

      const result = await authService.login(email, password);
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'No autorizado', message: 'No se encontró un ID de usuario válido en la petición.' });
      }
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      return res.json(user);
    } catch (error: any) {
      console.error('Error en getProfile:', error.message);
      return res.status(500).json({ error: 'Error interno del servidor al obtener el perfil.' });
    }
  }
}

export const authController = new AuthController();