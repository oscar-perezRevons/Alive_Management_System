import prisma from '../config/database';

export class EventosService {
  async getAllEvents() {
    return await (prisma as any).event.findMany({
      include: {
        participations: {
          include: { groupSmall: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getEventKpis() {
    const totalEvents = await (prisma as any).event.count();
    const proximosEvents = await (prisma as any).event.count({ where: { status: 'Abierto' } });
    const totalParticipations = await (prisma as any).eventParticipation.count();
    
    // Obtener grupos pequeños únicos inscritos en el mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0,0,0,0);
    
    const gruposInscritosMes = await (prisma as any).eventParticipation.groupBy({
      by: ['groupId'],
      where: { enrolledAt: { gte: inicioMes } },
    });

    return {
      eventosProgramados: totalEvents,
      gpInscritosMes: gruposInscritosMes.length,
      eventosProximos: proximosEvents,
      participacionesTotales: totalParticipations
    };
  }

  async createEvent(data: any) {
    return await (prisma as any).event.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        typeTag: data.typeTag,
        startDate: data.startDate,
        timeSlot: data.timeSlot,
        location: data.location,
        maxSpots: Number(data.maxSpots || 15),
        status: data.status || 'Abierto'
      }
    });
  }

  async updateEvent(id: number, data: any) {
    return await (prisma as any).event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        typeTag: data.typeTag,
        startDate: data.startDate,
        timeSlot: data.timeSlot,
        location: data.location,
        maxSpots: Number(data.maxSpots),
        status: data.status
      }
    });
  }

  async deleteEvent(id: number) {
    return await (prisma as any).event.delete({ where: { id } });
  }

  async registerParticipation(eventId: number, groupId: number) {
    return await (prisma as any).eventParticipation.create({
      data: { eventId, groupId, status: 'Inscrito' }
    });
  }

  async getMyGroupParticipations(userId: number) {
    const userGroups = await (prisma as any).groupSmall.findMany({
      where: {
        OR: [
          { administratorId: userId },
          { members: { some: { id: userId } } }
        ]
      }
    });
    const groupIds = userGroups.map((g: any) => g.id);
    return await (prisma as any).eventParticipation.findMany({
      where: { groupId: { in: groupIds } },
      include: { event: true, groupSmall: true },
      orderBy: { enrolledAt: 'desc' }
    });
  }
}

export const eventosService = new EventosService();