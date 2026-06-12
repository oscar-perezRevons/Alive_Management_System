import { Response } from 'express';
import { AuthRequest } from '../types';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const users = await usersService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await usersService.getUserById(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await usersService.updateUser(id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await usersService.deleteUser(id);
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}