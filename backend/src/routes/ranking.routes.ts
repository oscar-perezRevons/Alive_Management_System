import { Router } from 'express';
import { rankingController } from '../controllers/ranking.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/general', rankingController.getRankingGeneral);
router.get('/progreso/:id', rankingController.getProgresoGrupo);

export default router;