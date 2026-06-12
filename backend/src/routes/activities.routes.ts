import express from 'express';
import { ActivitiesService } from '../services/activities.service';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();
const activitiesService = new ActivitiesService();

// GET todas las actividades - SIN restricción
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('📡 GET /api/activities');
    const activities = await activitiesService.getAllActivities();
    console.log('✅ Actividades encontradas:', activities.length);
    res.json(activities);
  } catch (error) {
    console.error('❌ Error:', error);
    next(error);
  }
});

// POST crear actividad - SIN restricción
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, points, groupSmallId, pointCategoryId } = req.body;
    const activity = await activitiesService.createActivity(
      name,
      description,
      points,
      groupSmallId,
      pointCategoryId,
      req.userId || 1
    );
    res.json(activity);
  } catch (error) {
    console.error('❌ Error:', error);
    next(error);
  }
});

// GET actividades por grupo
router.get('/group/:groupId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { groupId } = req.params;
    const activities = await activitiesService.getActivitiesByGroup(Number(groupId));
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// POST agregar puntuación
router.post('/scores', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { userId, activityId, groupId, points } = req.body;
    const score = await activitiesService.addScore(userId, activityId, groupId, points);
    res.json(score);
  } catch (error) {
    next(error);
  }
});

export default router;