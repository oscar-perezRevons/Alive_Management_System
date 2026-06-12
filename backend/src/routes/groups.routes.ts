import express from 'express';
import prisma from '../config/database';
import { GroupsService } from '../services/groups.service';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();
const groupsService = new GroupsService();

// ✅ GET todos los grupos - SIN restricción
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('📡 GET /api/groups');
    const groups = await groupsService.getAllGroups();
    console.log('✅ Grupos encontrados:', groups.length);
    res.json(groups);
  } catch (error) {
    console.error('❌ Error:', error);
    next(error);
  }
});

// POST crear grupo - SIN restricción
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('📡 POST /api/groups - Datos:', req.body);
    const { name, description } = req.body;
    const group = await groupsService.createGroup(name, description, req.userId || 1);
    res.json(group);
  } catch (error) {
    console.error('❌ Error:', error);
    next(error);
  }
});

// GET un grupo por ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const group = await groupsService.getGroupById(Number(id));
    res.json(group);
  } catch (error) {
    next(error);
  }
});

// PUT actualizar grupo
router.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const group = await groupsService.updateGroup(Number(id), req.body);
    res.json(group);
  } catch (error) {
    next(error);
  }
});

// DELETE grupo
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.groupSmall.delete({ where: { id: Number(id) } });
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    next(error);
  }
});

// POST agregar miembro
router.post('/:id/members', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const group = await groupsService.addMemberToGroup(Number(id), Number(userId));
    res.json(group);
  } catch (error) {
    next(error);
  }
});

// DELETE eliminar miembro
router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await groupsService.removeGroupMember(Number(id), Number(userId));
    res.json(group);
  } catch (error) {
    next(error);
  }
});

export default router;