import prisma from '../config/database';

export class GroupsService {
  async createGroup(
    name: string, 
    description: string | undefined, 
    administratorId: number,
    motto?: string,
    leaderName?: string,
    subLeaderName?: string
  ) {
    console.log('Creando grupo:', { name, description, administratorId });
    return await prisma.groupSmall.create({
      data: {
        name,
        description,
        motto,
        leaderName,
        subLeaderName,
        administratorId,
        totalPoints: 0,
      },
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getAllGroups() {
    console.log('Obteniendo todos los grupos...');
    return await prisma.groupSmall.findMany({
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  async getLeaderboard() {
    console.log('Generando tabla de posiciones para los mockups...');
    return await prisma.groupSmall.findMany({
      select: {
        id: true,
        name: true,
        motto: true,
        totalPoints: true,
        leaderName: true,
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        totalPoints: 'desc'
      }
    });
  }

  async getGroupById(id: number) {
    console.log('Obteniendo desglose detallado para el perfil del grupo:', id);
    
    const group = await prisma.groupSmall.findUnique({
      where: { id },
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
        scores: {
          include: {
            user: { select: { id: true, name: true } },
            activity: { select: { name: true } }
          }
        },
        penalties: {
          orderBy: { date: 'desc' }
        },
      },
    });

    if (!group) return null;

    const membersWithContributions = group.members.map(member => {
      const totalContributed = group.scores
        .filter(score => score.userId === member.id)
        .reduce((sum, score) => sum + score.points, 0);

      return {
        ...member,
        contributedPoints: totalContributed
      };
    });

    const totalPenaltiesPoints = group.penalties.reduce((sum, penalty) => sum + penalty.points, 0);

    return {
      ...group,
      members: membersWithContributions,
      netPoints: group.totalPoints + totalPenaltiesPoints,
    };
  }

  async updateGroup(id: number, data: any) {
    console.log('Actualizando grupo:', id);
    return await prisma.groupSmall.update({
      where: { id },
      data,
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteGroup(id: number) {
    console.log('Eliminando grupo:', id);
    return await prisma.groupSmall.delete({
      where: { id },
    });
  }

  async addMemberToGroup(groupId: number, userId: number) {
    console.log('Agregando miembro:', { groupId, userId });

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new Error('El usuario que intenta añadir al grupo no existe.');
    }

    return await prisma.groupSmall.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async removeGroupMember(groupId: number, userId: number) {
    console.log('Eliminando miembro:', { groupId, userId });
    return await prisma.groupSmall.update({
      where: { id: groupId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}