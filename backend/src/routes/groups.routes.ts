import { Router } from 'express';
import { groupsController } from '../controllers/groups.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', groupsController.create);
router.get('/', groupsController.getAll);
router.get('/:id', groupsController.getById);
router.put('/:id', groupsController.update);
router.delete('/:id', groupsController.delete);
router.post('/:id/members', groupsController.addMember);
router.delete('/:id/members/:userId', groupsController.removeMember);

export default router;