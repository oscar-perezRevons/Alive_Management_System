import { Response } from 'express';
import { AuthRequest } from '../types';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const users = await usersService.getAllUsers();
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID proporcionado debe ser un número válido.' });
      }

      const user = await usersService.getUserById(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const authenticatedUserId = req.userId;
      const authenticatedUserRole = req.userRole;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID proporcionado debe ser un número válido.' });
      }

      if (authenticatedUserRole !== 'ADMIN' && id !== authenticatedUserId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'No tienes permisos para modificar el perfil de otros usuarios.' 
        });
      }

      const { name, role, isActive } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;

      if (authenticatedUserRole === 'ADMIN') {
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
      } else {
        if (role !== undefined || isActive !== undefined) {
          return res.status(403).json({ 
            error: 'Acceso denegado', 
            message: 'Solo los administradores pueden cambiar roles o estados de activación.' 
          });
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar.' });
      }

      const updatedUser = await usersService.updateUser(id, updateData);
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const authenticatedUserId = req.userId;
      const authenticatedUserRole = req.userRole;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID proporcionado debe ser un número válido.' });
      }

      if (authenticatedUserRole !== 'ADMIN' && id !== authenticatedUserId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'No tienes permisos para eliminar la cuenta de otro usuario.' 
        });
      }

      await usersService.deleteUser(id);
      return res.json({ message: 'Usuario eliminado correctamente.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const usersController = new UsersController();