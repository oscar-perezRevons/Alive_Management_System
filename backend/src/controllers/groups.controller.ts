import { Response } from 'express';
import { AuthRequest } from '../types';
import { GroupsService } from '../services/groups.service';

const groupsService = new GroupsService();

export class GroupsController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del grupo es requerido' });
      }

      const group = await groupsService.createGroup(name, description, req.userId!);
      res.status(201).json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const groups = await groupsService.getAllGroups();
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const group = await groupsService.getGroupById(id);

      if (!group) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      res.json(group);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const group = await groupsService.updateGroup(id, req.body);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addMember(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.id);
      const { userId } = req.body;

      const group = await groupsService.addMemberToGroup(groupId, userId);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const group = await groupsService.removeGroupMember(groupId, userId);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}