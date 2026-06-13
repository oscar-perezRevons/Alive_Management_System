import { Response } from 'express';
import { AuthRequest } from '../types';
import { activitiesService } from '../services/activities.service';

export class ActivitiesController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, points, groupSmallId, pointCategoryId } = req.body;

      if (!name || !points || !groupSmallId || !pointCategoryId) {
        return res.status(400).json({ 
          error: 'Campos obligatorios ausentes.', 
          message: 'Se requiere name, points, groupSmallId y pointCategoryId.' 
        });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'No autorizado. Sesión inválida.' });
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
        return res.status(400).json({ error: 'El ID del grupo debe ser un número válido.' });
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
        return res.status(400).json({ 
          error: 'Campos inválidos', 
          message: 'Se requiere userId, activityId, groupId y points de forma obligatoria.' 
        });
      }

      const score = await activitiesService.addScoreToUser(
        Number(userId),
        Number(activityId),
        Number(groupId),
        Number(points)
      );

      return res.status(201).json({
        message: '¡Puntaje asignado y registro del GP actualizado con éxito transaccional!',
        data: score
      });
    } catch (error: any) {
      console.error('Error en controlador al asignar score:', error);
      return res.status(400).json({ error: error.message || 'Error al procesar la transacción de puntos.' });
    }
  }
}

export const activitiesController = new ActivitiesController();