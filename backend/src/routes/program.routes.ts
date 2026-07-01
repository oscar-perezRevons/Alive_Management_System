import { Router } from 'express';
import { programController } from '../controllers/program.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', programController.getFullSchedule);
router.post('/', programController.storeEvent);
router.put('/:id', programController.modifyEvent);
router.delete('/:id', programController.removeEvent);

export default router;