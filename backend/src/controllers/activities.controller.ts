import { Response } from 'express';
import { AuthRequest } from '../types';
import { ActivitiesService } from '../services/activities.service';
import prisma from '../config/database';

const activitiesService = new ActivitiesService();

export class ActivitiesController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, points, groupSmallId, pointCategoryId } = req.body;

      if (!name || points === undefined || !groupSmallId || !pointCategoryId) {
        return res.status(400).json({ error: 'Faltan campos requeridos: name, points, groupSmallId y pointCategoryId son obligatorios.' });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'No autorizado', message: 'Identificación de usuario ausente.' });
      }

      const group = await prisma.groupSmall.findUnique({ where: { id: Number(groupSmallId) } });
      if (!group) {
        return res.status(404).json({ error: 'El grupo especificado no existe.' });
      }

      if (req.userRole !== 'ADMIN' && group.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'Solo el administrador asignado a este grupo o un ADMIN global pueden crearle actividades.' 
        });
      }

      const activity = await activitiesService.createActivity(
        name,
        description,
        Number(points),
        Number(groupSmallId),
        Number(pointCategoryId),
        req.userId
      );

      return res.status(201).json(activity);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const activities = await activitiesService.getAllActivities();
      return res.json(activities);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getByGroup(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.groupId);

      if (isNaN(groupId)) {
        return res.status(400).json({ error: 'El parámetro groupId debe ser un número válido.' });
      }

      const activities = await activitiesService.getActivitiesByGroup(groupId);
      return res.json(activities);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async addScore(req: AuthRequest, res: Response) {
    try {
      const { userId, activityId, groupId, points } = req.body;

      if (!userId || !activityId || !groupId || points === undefined) {
        return res.status(400).json({ error: 'Faltan campos requeridos: userId, activityId, groupId y points son mandatorios.' });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'No autorizado', message: 'Identificación de usuario ausente.' });
      }

      const group = await prisma.groupSmall.findUnique({ where: { id: Number(groupId) } });
      if (!group) {
        return res.status(404).json({ error: 'El grupo especificado no existe.' });
      }

      if (req.userRole !== 'ADMIN' && group.administratorId !== req.userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'No posees permisos para asignar puntajes en este grupo.' 
        });
      }

      const userExists = await prisma.user.findUnique({ where: { id: Number(userId) } });
      if (!userExists) {
        return res.status(404).json({ error: 'El usuario al que intentas asignar puntos no existe.' });
      }

      const score = await activitiesService.addScore(
        Number(userId), 
        Number(activityId), 
        Number(groupId), 
        Number(points)
      );

      return res.status(201).json(score);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export const activitiesController = new ActivitiesController();