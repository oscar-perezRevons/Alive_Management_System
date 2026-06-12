import { Response } from 'express';
import { AuthRequest } from '../types';
import { GroupsService } from '../services/groups.service';

const groupsService = new GroupsService();

export class GroupsController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, motto, leaderName, subLeaderName } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del grupo es requerido.' });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'No autorizado', message: 'Identificación de usuario ausente.' });
      }

      const group = await groupsService.createGroup(
        name, 
        description, 
        req.userId, 
        motto, 
        leaderName, 
        subLeaderName
      );
      return res.status(201).json(group);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const groups = await groupsService.getAllGroups();
      return res.json(groups);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID del grupo debe ser un número válido.' });
      }

      const group = await groupsService.getGroupById(id);

      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado.' });
      }

      return res.json(group);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID del grupo debe ser un número válido.' });
      }

      const existingGroup = await groupsService.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({ error: 'El grupo solicitado no existe.' });
      }

      if (req.userRole !== 'ADMIN' && existingGroup.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'Solo el administrador de este grupo o un ADMIN global pueden modificarlo.' 
        });
      }

      const { name, description, motto, leaderName, subLeaderName } = req.body;
      const filteredData: any = {};

      if (name !== undefined) filteredData.name = name;
      if (description !== undefined) filteredData.description = description;
      if (motto !== undefined) filteredData.motto = motto;
      if (leaderName !== undefined) filteredData.leaderName = leaderName;
      if (subLeaderName !== undefined) filteredData.subLeaderName = subLeaderName;

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar.' });
      }

      const updatedGroup = await groupsService.updateGroup(id, filteredData);
      return res.json(updatedGroup);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El ID del grupo debe ser un número válido.' });
      }

      const existingGroup = await groupsService.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({ error: 'El grupo que intenta eliminar no existe.' });
      }

      if (req.userRole !== 'ADMIN' && existingGroup.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'No posees los privilegios necesarios para eliminar este grupo.' 
        });
      }

      await groupsService.deleteGroup(id);
      return res.json({ message: 'Grupo eliminado correctamente junto con sus dependencias en cascada.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async addMember(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);

      if (isNaN(groupId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Tanto el ID del grupo como el ID del usuario deben ser números válidos.' });
      }

      const existingGroup = await groupsService.getGroupById(groupId);
      if (!existingGroup) {
        return res.status(404).json({ error: 'El grupo solicitado no existe.' });
      }

      if (req.userRole !== 'ADMIN' && existingGroup.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'Solo el encargado del grupo o un administrador pueden gestionar los miembros.' 
        });
      }

      const group = await groupsService.addMemberToGroup(groupId, userId);
      return res.json(group);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      if (isNaN(groupId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Parámetros de URL malformados. Se requieren números válidos.' });
      }

      const existingGroup = await groupsService.getGroupById(groupId);
      if (!existingGroup) {
        return res.status(404).json({ error: 'El grupo solicitado no existe.' });
      }

      if (req.userRole !== 'ADMIN' && existingGroup.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'Solo el encargado del grupo o un administrador pueden gestionar los miembros.' 
        });
      }

      const group = await groupsService.removeGroupMember(groupId, userId);
      return res.json(group);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export const groupsController = new GroupsController();