import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { SecretariaService } from '../services/secretaria.service';
import prisma from '../config/database';
import bcrypt from 'bcrypt';

const router = Router();
const secretariaService = new SecretariaService();

router.use(authMiddleware);

router.get('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const groups = await secretariaService.getAllGroups();
    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ error: 'Error al traccionar los grupos.' });
  }
});

router.get('/panel/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const data = await secretariaService.getGroupPanel(groupId);
    return res.json(data);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

router.post('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.body.administratorId || req.userId; 
    
    if (!adminId) {
      return res.status(400).json({ error: 'Se requiere un ID de administrador válido.' });
    }

    const newGroup = await secretariaService.createGroup({ 
      ...req.body, 
      administratorId: parseInt(adminId) 
    });
    
    return res.status(201).json(newGroup);
  } catch (error: any) {
    return res.status(400).json({ error: 'El nombre del grupo ya existe o los datos son inválidos.' });
  }
});

router.put('/groups/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const updated = await secretariaService.updateGroup(groupId, req.body);
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: 'Error al actualizar la información del grupo.' });
  }
});

router.delete('/panel/:groupId/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);
    await secretariaService.unlinkMemberFromGroup(groupId, userId);
    return res.json({ message: 'Miembro desvinculado con éxito.' });
  } catch (error: any) {
    return res.status(400).json({ error: 'Error al remover al usuario.' });
  }
});

router.get('/users/available', async (req: AuthRequest, res: Response) => {
  try {
    const users = await secretariaService.getAvailableUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Fallo al obtener el catálogo de feligreses.' });
  }
});

router.post('/panel/:groupId/members', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { userId, groupRole } = req.body;
    await secretariaService.linkMemberToGroup(groupId, parseInt(userId), groupRole);
    return res.status(201).json({ message: '¡Integrante vinculado con éxito!' });
  } catch (error) {
    return res.status(400).json({ error: 'Fallo al asociar el integrante.' });
  }
});

router.post('/panel/:groupId/members/create-and-link', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { name, email, birthDate, groupRole } = req.body;

    if (!name || !email || !groupRole) {
      return res.status(400).json({ error: 'Datos mandatorios incompletos para el registro.' });
    }

    const hashedPassword = await bcrypt.hash('AliveMaranata2026', 10);

    const newMember = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          password: hashedPassword,
          role: 'USER', 
          groupRole: groupRole,
          birthDate: birthDate ? new Date(birthDate) : null,
          isActive: true
        }
      });

      await tx.groupSmall.update({
        where: { id: groupId },
        data: {
          members: {
            connect: { id: user.id }
          }
        }
      });

      return user;
    });

    return res.status(201).json({
      message: '¡Nuevo integrante registrado y vinculado con éxito!',
      user: { id: newMember.id, name: newMember.name, email: newMember.email }
    });

  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado en el sistema.' });
    }
    return res.status(500).json({ error: 'Fallo al procesar el alta transaccional del integrante.' });
  }
});

export default router;