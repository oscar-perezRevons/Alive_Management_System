import express from 'express';
import prisma from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// ✅ GET todos los usuarios - SIN restricción
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('📡 GET /api/users');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    console.log('✅ Usuarios encontrados:', users.length);
    res.json(users);
  } catch (error) {
    console.error('❌ Error:', error);
    next(error);
  }
});

// GET usuario por ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// DELETE usuario
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;