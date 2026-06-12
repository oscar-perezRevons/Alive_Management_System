import { Router } from 'express';
import { activitiesController } from '../controllers/activities.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.post('/', activitiesController.create);
router.get('/', activitiesController.getAll);
router.get('/group/:groupId', activitiesController.getByGroup);

router.post('/scores', activitiesController.addScore);

export default router;