import { Router } from 'express';
import { eventosController } from '../controllers/eventos.controller';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';

const router = Router();
router.use(authMiddleware);

router.get('/', eventosController.getEvents);
router.get('/kpis', eventosController.getKpis);
router.post('/', requireAccessRoles(['ADMIN', 'LIDER_GP']), eventosController.storeEvent);
router.put('/:id', requireAccessRoles(['ADMIN', 'LIDER_GP']), eventosController.modifyEvent);
router.delete('/:id', requireAccessRoles(['ADMIN', 'LIDER_GP']), eventosController.removeEvent);
router.post('/:id/participar', eventosController.joinEvent);
router.get('/mis-participaciones', eventosController.getMyParticipations);

export default router;