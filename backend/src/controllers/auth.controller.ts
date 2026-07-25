import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import prisma from '../config/database';

export class AuthController {
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Faltan credenciales obligatorias.' });
      }
      const data = await authService.loginUser(email, password);
      return res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name, birthDate } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Nombre, correo y contraseña requeridos.' });
      }
      const newUser = await authService.registerUser({ email, password, name, birthDate });
      return res.status(201).json({ success: true, message: 'Usuario registrado con éxito.', user: newUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getProfile = async (req: any, res: Response) => {
    try {
      const userId = req.userId; 
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          groupRole: true,
          birthDate: true,
          isActive: true,
          groupSmallId: true,
          groupSmall: {
            select: { id: true, name: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export const authController = new AuthController();