import { Router } from 'express';
import { programController } from '../controllers/program.controller';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';

const router = Router();

router.use(authMiddleware);
router.use(requireAccessRoles(['ADMIN', 'LIDER_GP']));

router.get('/', programController.getFullSchedule);
router.post('/', programController.storeEvent);
router.put('/:id', programController.modifyEvent);
router.delete('/:id', programController.removeEvent);

export default router;