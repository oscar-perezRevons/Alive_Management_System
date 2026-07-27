import { Response } from 'express';
import { eventosService } from '../services/eventos.service';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';

function extraerUserIdDesdeToken(req: any): number | null {
  let userId = 
    req.user?.id || 
    req.user?.userId || 
    req.user?.sub || 
    req.user?.user?.id || 
    req.user?.payload?.id;
    
  const authHeader = req.headers.authorization;
  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token) as any;
      if (decoded) {
        userId = decoded.id || decoded.userId || decoded.sub || decoded.user?.id || decoded.payload?.id;
      }
    }
  }

  if (!userId || isNaN(Number(userId))) return null;
  return Number(userId);
}

export class EventosController {
  
  getEvents = async (req: any, res: Response) => {
    try {
      const events = await eventosService.getAllEvents();
      return res.status(200).json({ success: true, events });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getKpis = async (req: any, res: Response) => {
    try {
      const stats = await eventosService.getEventKpis();
      return res.status(200).json({ success: true, stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  storeEvent = async (req: any, res: Response) => {
    try {
      const newEvent = await eventosService.createEvent(req.body);
      return res.status(201).json({ success: true, data: newEvent });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Fallo al estructurar el evento.' });
    }
  };

  modifyEvent = async (req: any, res: Response) => {
    try {
      const updated = await eventosService.updateEvent(parseInt(req.params.id), req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'No se pudo actualizar la convocatoria.' });
    }
  };

  removeEvent = async (req: any, res: Response) => {
    try {
      await eventosService.deleteEvent(parseInt(req.params.id));
      return res.status(200).json({ success: true, message: 'Convocatoria eliminada.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Error al purgar el registro.' });
    }
  };

  joinEvent = async (req: any, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = extraerUserIdDesdeToken(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado o sesión inválida.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const normGroupRole = (user.groupRole || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[_\s]+/g, '')
        .trim();

      const isAllowedToJoin = user.role === 'ADMIN' || ['LIDER', 'SUBLIDER', 'COLIDER', 'SECRETARIO', 'SECRETARIA', 'TESORERO', 'TESORERA'].includes(normGroupRole);

      if (!isAllowedToJoin) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para registrar a tu grupo en este evento. Solo el Líder, Colíder, Secretario o Tesorero pueden confirmar la participación.' });
      }

      const userGroup = await (prisma as any).groupSmall.findFirst({
        where: {
          OR: [
            { administratorId: userId },
            { members: { some: { id: userId } } }
          ]
        }
      });

      if (!userGroup) {
        return res.status(400).json({ success: false, message: 'No perteneces a ningún Grupo Pequeño calificado.' });
      }

      const registration = await eventosService.registerParticipation(eventId, userGroup.id);
      return res.status(201).json({ success: true, data: registration });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'Tu grupo ya se encuentra registrado en este evento.' });
    }
  };

  getMyGroupMembers = async (req: any, res: Response) => {
    try {
      const userId = extraerUserIdDesdeToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado o sesión inválida.' });
      }

      const userGroup = await (prisma as any).groupSmall.findFirst({
        where: {
          OR: [
            { administratorId: userId },
            { members: { some: { id: userId } } }
          ]
        },
        include: {
          members: {
            select: { id: true, name: true, groupRole: true }
          }
        }
      });

      if (!userGroup) {
        return res.status(200).json({ success: true, members: [], groupName: '' });
      }

      return res.status(200).json({ success: true, members: userGroup.members, groupName: userGroup.name });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  updateConfirmedMembers = async (req: any, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = extraerUserIdDesdeToken(req);
      const { userIds } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado o sesión inválida.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const normGroupRole = (user.groupRole || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[_\s]+/g, '')
        .trim();

      const isAllowedToManage = user.role === 'ADMIN' || ['LIDER', 'SUBLIDER', 'COLIDER', 'SECRETARIO', 'SECRETARIA'].includes(normGroupRole);

      if (!isAllowedToManage) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para modificar la lista de participantes. Solo el Líder, Colíder o Secretario pueden hacerlo.' });
      }

      const userGroup = await (prisma as any).groupSmall.findFirst({
        where: {
          OR: [
            { administratorId: userId },
            { members: { some: { id: userId } } }
          ]
        }
      });

      if (!userGroup) {
        return res.status(400).json({ success: false, message: 'No perteneces a ningún Grupo Pequeño calificado.' });
      }

      const participation = await (prisma as any).eventParticipation.findUnique({
        where: {
          eventId_groupId: {
            eventId,
            groupId: userGroup.id
          }
        }
      });

      if (!participation) {
        return res.status(404).json({ success: false, message: 'Tu grupo no está registrado en este evento.' });
      }

      const updated = await (prisma as any).eventParticipation.update({
        where: { id: participation.id },
        data: {
          confirmedMembers: Array.isArray(userIds) ? userIds.map(Number).join(',') : ''
        }
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  leaveEvent = async (req: any, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = extraerUserIdDesdeToken(req);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado o sesión inválida.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const normGroupRole = (user.groupRole || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[_\s]+/g, '')
        .trim();

      const isAllowedToCancel = user.role === 'ADMIN' || ['LIDER', 'SUBLIDER'].includes(normGroupRole);

      if (!isAllowedToCancel) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para cancelar la inscripción. Solo el Administrador o el Líder del Grupo Pequeño pueden hacerlo.' });
      }

      let targetGroupId: number | null = null;
      if (user.role === 'ADMIN' && (req.body?.groupId || req.query?.groupId)) {
        targetGroupId = parseInt(req.body?.groupId || req.query?.groupId);
      } else {
        const userGroup = await (prisma as any).groupSmall.findFirst({
          where: {
            OR: [
              { administratorId: userId },
              { members: { some: { id: userId } } }
            ]
          }
        });
        if (userGroup) targetGroupId = userGroup.id;
      }

      if (!targetGroupId) {
        return res.status(400).json({ success: false, message: 'Grupo no encontrado para cancelar la inscripción.' });
      }

      await (prisma as any).eventParticipation.delete({
        where: {
          eventId_groupId: {
            eventId,
            groupId: targetGroupId
          }
        }
      });

      return res.status(200).json({ success: true, message: 'Inscripción cancelada con éxito.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: 'No se pudo cancelar la participación o el grupo no estaba inscrito.' });
    }
  };

  getMyParticipations = async (req: any, res: Response) => {
    try {
      const userId = extraerUserIdDesdeToken(req);
      
      if (!userId) {
        return res.status(200).json({ success: true, participations: [] });
      }

      const list = await eventosService.getMyGroupParticipations(userId);
      return res.status(200).json({ success: true, participations: list });
    } catch (error: any) {
      console.error('Error en getMyParticipations:', error);
      return res.status(200).json({ success: true, participations: [] });
    }
  };

  getEventAdminDetails = async (req: any, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = extraerUserIdDesdeToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      }

      const event = await (prisma as any).event.findUnique({
        where: { id: eventId },
        include: {
          participations: {
            include: {
              groupSmall: {
                include: {
                  administrator: { select: { id: true, name: true, email: true } },
                  members: { select: { id: true, name: true, groupRole: true, email: true } }
                }
              }
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
      }

      const allGroups = await (prisma as any).groupSmall.findMany({
        include: {
          administrator: { select: { id: true, name: true, email: true } },
          members: { select: { id: true, name: true, groupRole: true, email: true } }
        },
        orderBy: { name: 'asc' }
      });

      const enrolledMap = new Map();
      event.participations.forEach((p: any) => {
        enrolledMap.set(p.groupId, p);
      });

      const enrolledGroups = [];
      const notEnrolledGroups = [];

      for (const group of allGroups) {
        const leaderMember = group.members.find((m: any) => {
          const norm = (m.groupRole || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[_\s-]+/g, '')
            .trim();
          return norm === 'LIDER';
        });
        const computedLeaderName = leaderMember
          ? leaderMember.name
          : (group.leaderName && group.leaderName.trim() ? group.leaderName.trim() : 'Sin Líder Asignado');

        const participation = enrolledMap.get(group.id);
        if (participation) {
          const confirmedIds = participation.confirmedMembers
            ? participation.confirmedMembers.split(',').map(Number).filter((id: number) => !isNaN(id))
            : [];

          enrolledGroups.push({
            id: group.id,
            name: group.name,
            leaderName: computedLeaderName,
            participationId: participation.id,
            enrolledAt: participation.enrolledAt,
            status: participation.status,
            confirmedCount: confirmedIds.length,
            totalMembersCount: group.members.length,
            members: group.members.map((m: any) => ({
              id: m.id,
              name: m.name,
              groupRole: m.groupRole,
              isConfirmed: confirmedIds.includes(m.id)
            }))
          });
        } else {
          notEnrolledGroups.push({
            id: group.id,
            name: group.name,
            leaderName: computedLeaderName,
            totalMembersCount: group.members.length,
            members: group.members.map((m: any) => ({
              id: m.id,
              name: m.name,
              groupRole: m.groupRole
            }))
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            typeTag: event.typeTag,
            startDate: event.startDate,
            timeSlot: event.timeSlot,
            location: event.location,
            maxSpots: event.maxSpots,
            status: event.status,
            imageUrl: event.imageUrl,
            pdfUrl: event.pdfUrl
          },
          enrolledGroups,
          notEnrolledGroups
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export const eventosController = new EventosController();
