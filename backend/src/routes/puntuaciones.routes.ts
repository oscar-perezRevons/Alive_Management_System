import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';
import { AuthRequest } from '../types';
import { ScoreService } from '../services/score.service';

const router = Router();
const scoreService = new ScoreService();

router.use(authMiddleware);
router.use(requireAccessRoles(['ADMIN']));

router.get('/kpis', async (req: AuthRequest, res: Response) => {
  try {
    const kpis = await scoreService.getScoreKpis();
    return res.json(kpis);
  } catch (error) {
    return res.status(500).json({ error: 'Fallo al computar las métricas de KPIs.' });
  }
});

router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await scoreService.getCategoriesWithActivities();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Fallo al traccionar la matriz de criterios.' });
  }
});

router.get('/history/scores', async (req: AuthRequest, res: Response) => {
  try {
    const history = await scoreService.getRecentScores();
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener bitácora de puntos.' });
  }
});

router.get('/history/penalties', async (req: AuthRequest, res: Response) => {
  try {
    const history = await scoreService.getRecentPenalties();
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener bitácora de penalizaciones.' });
  }
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Acceso denegado. Sesión inválida.' });
    
    const score = await scoreService.registerScore(req.body, userId);
    return res.status(201).json({ message: 'Puntuación asignada e indexada correctamente.', data: score });
  } catch (error) {
    return res.status(400).json({ error: 'Fallo al registrar la puntuación.' });
  }
});

router.post('/penalty', async (req: AuthRequest, res: Response) => {
  try {
    const penalty = await scoreService.registerPenalty(req.body);
    return res.status(201).json({ message: 'Penalización aplicada y descontada.', data: penalty });
  } catch (error) {
    return res.status(400).json({ error: 'Fallo al registrar la penalización.' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
    
    const newCategory = await scoreService.createCategory(name);
    return res.status(201).json({ message: 'Categoría creada con éxito.', data: newCategory });
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear la categoría.' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });

    const updatedCategory = await scoreService.updateCategory(Number(id), name);
    return res.json({ message: 'Categoría actualizada con éxito.', data: updatedCategory });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar la categoría.' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await scoreService.deleteCategory(Number(id));
    return res.json({ message: 'Categoría eliminada con éxito.' });
  } catch (error) {
    return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene actividades vinculadas u ocurrió un error.' });
  }
});

router.post('/activities', async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, name, points } = req.body;
    if (!categoryId || !name || points === undefined) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    
    const newActivity = await scoreService.createActivity(Number(categoryId), name, Number(points));
    return res.status(201).json({ message: 'Criterio agregado con éxito.', data: newActivity });
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar la actividad.' });
  }
});

router.put('/activities/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, points } = req.body;
    if (!name || points === undefined) {
      return res.status(400).json({ error: 'Nombre y puntos son obligatorios.' });
    }
    const updated = await scoreService.updateActivity(Number(id), name, Number(points));
    return res.json({ message: 'Subcriterio actualizado con éxito.', data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el subcriterio.' });
  }
});

router.delete('/activities/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await scoreService.deleteActivity(Number(id));
    return res.json({ message: 'Subcriterio eliminado con éxito.' });
  } catch (error) {
    return res.status(400).json({ error: 'No se pudo eliminar el subcriterio.' });
  }
});

export default router;