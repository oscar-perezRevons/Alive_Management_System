import { Response } from 'express';
import { AuthRequest } from '../types';
import { ActivitiesService } from '../services/activities.service';

const activitiesService = new ActivitiesService();

export class ActivitiesController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, points, groupSmallId, pointCategoryId } = req.body;

      if (!name || !points || !groupSmallId || !pointCategoryId) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const activity = await activitiesService.createActivity(
        name,
        description,
        points,
        groupSmallId,
        pointCategoryId,
        req.userId!
      );

      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const activities = await activitiesService.getAllActivities();
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByGroup(req: AuthRequest, res: Response) {
    try {
      const groupId = parseInt(req.params.groupId);
      const activities = await activitiesService.getActivitiesByGroup(groupId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addScore(req: AuthRequest, res: Response) {
    try {
      const { userId, activityId, groupId, points } = req.body;

      if (!userId || !activityId || !groupId || !points) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const score = await activitiesService.addScore(userId, activityId, groupId, points);
      res.status(201).json(score);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}