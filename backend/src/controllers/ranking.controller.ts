import { Response } from 'express';
import fs from 'fs';
import { rankingService } from '../services/ranking.service';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';

function extraerUserIdDesdeToken(req: any): number | null {
  let userId = req.userId;
  if (userId && !isNaN(Number(userId))) return Number(userId);

  userId = req.user?.id || req.user?.userId || req.user?.sub || req.user?.user?.id || req.user?.payload?.id;
  
  const authHeader = req.headers.authorization;
  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token) as any;
      if (decoded) userId = decoded.id || decoded.userId || decoded.user?.id || decoded.payload?.id;
    }
  }
  return userId && !isNaN(Number(userId)) ? Number(userId) : null;
}

export class RankingController {
  
  getRankingGeneral = async (req: any, res: Response) => {
    try {
      const rankingRaw = await rankingService.getRankingGeneral();
      const userId = extraerUserIdDesdeToken(req);
      const userRole = req.userRole || req.user?.role;
      const isAdmin = String(userRole || '').toUpperCase() === 'ADMIN';
      
      const palette = ['text-amber-500', 'text-blue-600', 'text-purple-600', 'text-orange-500', 'text-emerald-600', 'text-red-500', 'text-teal-600', 'text-indigo-500'];
      
      const ranking = rankingRaw.map((item: any) => ({
        ...item,
        shieldColor: palette[item.id % palette.length]
      }));

      if (!isAdmin) {
        if (!userId) {
          return res.status(401).json({ success: false, message: 'Sesión inválida.' });
        }

        const userGroup = await (prisma as any).groupSmall.findFirst({
          where: { OR: [{ administratorId: userId }, { members: { some: { id: userId } } }] },
          select: { id: true, name: true }
        });

        if (!userGroup) {
          return res.status(404).json({ success: false, message: 'No asignado a ningún GP activo.' });
        }

        return res.status(200).json({
          success: true,
          ranking: ranking.filter((item: any) => item.id === userGroup.id),
          grupos: [{ id: userGroup.id, name: userGroup.name }]
        });
      }

      const grupos = await rankingService.getListaGrupos();

      return res.status(200).json({ success: true, ranking, grupos });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getProgresoGrupo = async (req: any, res: Response) => {
    try {
      let groupId = parseInt(req.params.id);
      const userId = extraerUserIdDesdeToken(req);

      const userRole = 
        req.user?.role || 
        req.user?.user?.role || 
        req.user?.payload?.role || 
        req.user?.userRole ||
        (req.user && jwt.decode(req.headers.authorization?.split(' ')[1] || '') as any)?.role;

      if (userRole !== 'ADMIN') {
        const userGroup = await (prisma as any).groupSmall.findFirst({
          where: { OR: [{ administratorId: userId }, { members: { some: { id: userId } } }] },
          select: { id: true }
        });
        if (!userGroup) {
          return res.status(404).json({ success: false, message: 'No asignado a ningún GP activo.' });
        }
        groupId = userGroup.id;
      }

      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({ success: false, message: 'Identificador de grupo inválido.' });
      }

      const datosProgreso = await rankingService.getProgresoGrupo(groupId);
      return res.status(200).json({ success: true, data: datosProgreso });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getCalendar = async (req: any, res: Response) => {
    try {
      const filePath = './uploads/calendar-config.json';
      let data = { fechaPublicacion: '15 de junio de 2026' };
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent);
      }
      return res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  saveCalendar = async (req: any, res: Response) => {
    try {
      const userRole = req.userRole || req.user?.role;
      const isAdmin = String(userRole || '').toUpperCase() === 'ADMIN';
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const { fechaPublicacion } = req.body;
      if (!fechaPublicacion) {
        return res.status(400).json({ success: false, message: 'Fecha de publicación requerida.' });
      }

      const dir = './uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = './uploads/calendar-config.json';
      fs.writeFileSync(filePath, JSON.stringify({ fechaPublicacion }, null, 2), 'utf8');

      return res.status(200).json({ success: true, message: 'Calendario actualizado.', fechaPublicacion });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export const rankingController = new RankingController();