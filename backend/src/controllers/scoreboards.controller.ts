import { Request, Response } from 'express';
import prisma from '../config/database';

async function esAdmin(req: any): Promise<boolean> {
  const userId = req.user?.id || req.userId;
  if (!userId) return false;
  const u = await (prisma as any).user.findUnique({ where: { id: userId } });
  return u?.role === 'ADMIN';
}

export class ScoreboardsController {

  // GET /api/scoreboards
  async getAllScoreboards(req: Request, res: Response): Promise<Response> {
    try {
      const scoreboards = await (prisma as any).extraScoreboard.findMany({
        include: {
          challenges: true,
          groupScores: {
            include: {
              groupSmall: { select: { id: true, name: true, leaderName: true } },
              challenge: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          participantScores: {
            include: {
              user: { select: { id: true, name: true, email: true, groupRole: true } },
              groupSmall: { select: { id: true, name: true } },
              challenge: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ success: true, scoreboards });
    } catch (error: any) {
      console.error('Error al obtener tableros de puntuación:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  }

  // GET /api/scoreboards/:id
  async getScoreboardById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID de competencia inválido.' });

      const scoreboard = await (prisma as any).extraScoreboard.findUnique({
        where: { id },
        include: {
          challenges: { orderBy: { createdAt: 'asc' } },
          groupScores: {
            include: {
              groupSmall: { select: { id: true, name: true, leaderName: true } },
              challenge: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
          },
          participantScores: {
            include: {
              user: { select: { id: true, name: true, email: true, groupRole: true } },
              groupSmall: { select: { id: true, name: true } },
              challenge: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!scoreboard) {
        return res.status(404).json({ success: false, message: 'Competencia no encontrada.' });
      }

      // Compute Group Leaderboard
      const groupMap = new Map<number, { id: number; name: string; leaderName: string; totalPoints: number; scoreCount: number }>();
      const allGroups = await (prisma as any).groupSmall.findMany({ select: { id: true, name: true, leaderName: true } });
      
      allGroups.forEach((g: any) => {
        groupMap.set(g.id, { id: g.id, name: g.name, leaderName: g.leaderName || 'Sin Líder', totalPoints: 0, scoreCount: 0 });
      });

      scoreboard.groupScores.forEach((gs: any) => {
        if (groupMap.has(gs.groupId)) {
          const entry = groupMap.get(gs.groupId)!;
          entry.totalPoints += gs.points;
          entry.scoreCount += 1;
        } else if (gs.groupSmall) {
          groupMap.set(gs.groupId, { id: gs.groupId, name: gs.groupSmall.name, leaderName: gs.groupSmall.leaderName || 'Sin Líder', totalPoints: gs.points, scoreCount: 1 });
        }
      });

      // Sum individual participant scores into their Small Group total points
      scoreboard.participantScores.forEach((ps: any) => {
        if (ps.groupId && groupMap.has(ps.groupId)) {
          const entry = groupMap.get(ps.groupId)!;
          entry.totalPoints += ps.points;
          entry.scoreCount += 1;
        }
      });

      const groupLeaderboard = Array.from(groupMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);

      // Compute Participant Leaderboard
      const userMap = new Map<number, { id: number; name: string; email: string; groupRole?: string; groupName: string; totalPoints: number; scoreCount: number }>();
      
      scoreboard.participantScores.forEach((ps: any) => {
        if (!ps.user) return;
        if (!userMap.has(ps.userId)) {
          userMap.set(ps.userId, {
            id: ps.userId,
            name: ps.user.name,
            email: ps.user.email,
            groupRole: ps.user.groupRole || 'Integrante',
            groupName: ps.groupSmall?.name || 'Sin Grupo',
            totalPoints: ps.points,
            scoreCount: 1
          });
        } else {
          const entry = userMap.get(ps.userId)!;
          entry.totalPoints += ps.points;
          entry.scoreCount += 1;
        }
      });

      const participantLeaderboard = Array.from(userMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);

      return res.json({
        success: true,
        scoreboard,
        groupLeaderboard,
        participantLeaderboard
      });
    } catch (error: any) {
      console.error('Error al obtener detalle del tablero:', error);
      return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
    }
  }

  // POST /api/scoreboards
  async createScoreboard(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const { title, description, eventType, imageUrl, pdfUrl } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'El título de la competencia es obligatorio.' });
      }

      const newScoreboard = await (prisma as any).extraScoreboard.create({
        data: {
          title,
          description: description || '',
          eventType: eventType || 'Campamento',
          status: 'ACTIVO',
          imageUrl: imageUrl || '',
          pdfUrl: pdfUrl || ''
        }
      });

      return res.status(201).json({ success: true, message: 'Evento competitivo creado.', scoreboard: newScoreboard });
    } catch (error: any) {
      console.error('Error al crear tablero:', error);
      return res.status(500).json({ success: false, message: 'Error al crear competencia.' });
    }
  }

  // PUT /api/scoreboards/:id
  async updateScoreboard(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const id = parseInt(req.params.id);
      const { title, description, eventType, status, imageUrl, pdfUrl } = req.body;

      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;
      if (eventType !== undefined) dataToUpdate.eventType = eventType;
      if (status !== undefined) dataToUpdate.status = status;
      if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
      if (pdfUrl !== undefined) dataToUpdate.pdfUrl = pdfUrl;

      const updated = await (prisma as any).extraScoreboard.update({
        where: { id },
        data: dataToUpdate
      });

      return res.json({ success: true, message: 'Competencia actualizada.', scoreboard: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al actualizar competencia.' });
    }
  }

  // DELETE /api/scoreboards/:id
  async deleteScoreboard(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const id = parseInt(req.params.id);
      await (prisma as any).extraScoreboard.delete({ where: { id } });

      return res.json({ success: true, message: 'Competencia eliminada exitosamente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar competencia.' });
    }
  }

  // POST /api/scoreboards/:id/challenges
  async addChallenge(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreboardId = parseInt(req.params.id);
      const { title, description, category, maxPoints } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'El título del desafío es obligatorio.' });
      }

      const challenge = await (prisma as any).scoreChallenge.create({
        data: {
          scoreboardId,
          title,
          description: description || '',
          category: category || 'Desafío General',
          maxPoints: maxPoints ? parseInt(maxPoints) : 100
        }
      });

      return res.status(201).json({ success: true, message: 'Desafío agregado correctamente.', challenge });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al agregar desafío.' });
    }
  }

  // PUT /api/scoreboards/challenges/:challengeId
  async updateChallenge(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const challengeId = parseInt(req.params.challengeId);
      const { title, description, category, maxPoints } = req.body;

      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;
      if (category !== undefined) dataToUpdate.category = category;
      if (maxPoints !== undefined) dataToUpdate.maxPoints = parseInt(maxPoints);

      const challenge = await (prisma as any).scoreChallenge.update({
        where: { id: challengeId },
        data: dataToUpdate
      });

      return res.json({ success: true, message: 'Desafío actualizado correctamente.', challenge });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al actualizar desafío.' });
    }
  }

  // DELETE /api/scoreboards/challenges/:challengeId
  async deleteChallenge(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const challengeId = parseInt(req.params.challengeId);
      await (prisma as any).scoreChallenge.delete({ where: { id: challengeId } });

      return res.json({ success: true, message: 'Desafío eliminado.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar desafío.' });
    }
  }

  // POST /api/scoreboards/:id/scores/group
  async awardGroupScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreboardId = parseInt(req.params.id);
      const { groupId, points, reason, challengeId } = req.body;

      if (!groupId || points === undefined || !reason) {
        return res.status(400).json({ success: false, message: 'Grupo, puntos y motivo son obligatorios.' });
      }

      const adminUser = await (prisma as any).user.findUnique({ where: { id: req.user?.id || req.userId } });

      const scoreEntry = await (prisma as any).extraGroupScore.create({
        data: {
          scoreboardId,
          groupId: parseInt(groupId),
          challengeId: challengeId ? parseInt(challengeId) : null,
          points: parseInt(points),
          reason,
          awardedByName: adminUser?.name || 'Administración'
        },
        include: {
          groupSmall: { select: { id: true, name: true } }
        }
      });

      return res.status(201).json({ success: true, message: 'Puntos asignados al Grupo Pequeño.', scoreEntry });
    } catch (error: any) {
      console.error('Error al asignar puntos a grupo:', error);
      return res.status(500).json({ success: false, message: 'Error al asignar puntos.' });
    }
  }

  // POST /api/scoreboards/:id/scores/participant
  async awardParticipantScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreboardId = parseInt(req.params.id);
      const { userId, points, reason, challengeId } = req.body;

      if (!userId || points === undefined || !reason) {
        return res.status(400).json({ success: false, message: 'Participante, puntos y motivo son obligatorios.' });
      }

      const targetUser = await (prisma as any).user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true, groupSmallId: true }
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Participante no encontrado.' });
      }

      const adminUser = await (prisma as any).user.findUnique({ where: { id: req.user?.id || req.userId } });

      const scoreEntry = await (prisma as any).extraParticipantScore.create({
        data: {
          scoreboardId,
          userId: targetUser.id,
          groupId: targetUser.groupSmallId || null,
          challengeId: challengeId ? parseInt(challengeId) : null,
          points: parseInt(points),
          reason,
          awardedByName: adminUser?.name || 'Administración'
        },
        include: {
          user: { select: { id: true, name: true } }
        }
      });

      return res.status(201).json({ success: true, message: 'Puntos asignados al participante.', scoreEntry });
    } catch (error: any) {
      console.error('Error al asignar puntos a participante:', error);
      return res.status(500).json({ success: false, message: 'Error al asignar puntos.' });
    }
  }

  // DELETE /api/scoreboards/scores/group/:scoreId
  async deleteGroupScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreId = parseInt(req.params.scoreId);
      await (prisma as any).extraGroupScore.delete({ where: { id: scoreId } });

      return res.json({ success: true, message: 'Registro de puntuación eliminado.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar puntuación.' });
    }
  }

  // PUT /api/scoreboards/scores/group/:scoreId
  async updateGroupScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreId = parseInt(req.params.scoreId);
      const { points, reason } = req.body;

      const updated = await (prisma as any).extraGroupScore.update({
        where: { id: scoreId },
        data: {
          points: Number(points),
          reason: reason ? String(reason).trim() : undefined
        }
      });

      return res.json({ success: true, message: 'Puntuación actualizada correctamente.', scoreEntry: updated });
    } catch (error: any) {
      console.error('Error al actualizar puntuación de grupo:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar puntuación.' });
    }
  }

  // PUT /api/scoreboards/scores/participant/:scoreId
  async updateParticipantScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreId = parseInt(req.params.scoreId);
      const { points, reason } = req.body;

      const updated = await (prisma as any).extraParticipantScore.update({
        where: { id: scoreId },
        data: {
          points: Number(points),
          reason: reason ? String(reason).trim() : undefined
        }
      });

      return res.json({ success: true, message: 'Puntuación actualizada correctamente.', scoreEntry: updated });
    } catch (error: any) {
      console.error('Error al actualizar puntuación de participante:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar puntuación.' });
    }
  }

  // DELETE /api/scoreboards/scores/participant/:scoreId
  async deleteParticipantScore(req: any, res: Response): Promise<Response> {
    try {
      if (!(await esAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado.' });
      }

      const scoreId = parseInt(req.params.scoreId);
      await (prisma as any).extraParticipantScore.delete({ where: { id: scoreId } });

      return res.json({ success: true, message: 'Registro de puntuación eliminado.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar puntuación.' });
    }
  }
}

export default new ScoreboardsController();
