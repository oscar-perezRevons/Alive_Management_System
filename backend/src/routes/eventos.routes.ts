import { Router } from 'express';
import { eventosController } from '../controllers/eventos.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', eventosController.getEvents);
router.get('/kpis', eventosController.getKpis);
router.post('/', eventosController.storeEvent);
router.put('/:id', eventosController.modifyEvent);
router.delete('/:id', eventosController.removeEvent);
router.post('/:id/participar', eventosController.joinEvent);
router.get('/mis-participaciones', eventosController.getMyParticipations);

export default router;