import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', adminMiddleware, usersController.getAll); 
router.get('/:id', usersController.getById);             
router.put('/:id', usersController.update);              
router.delete('/:id', usersController.delete);         

export default router;