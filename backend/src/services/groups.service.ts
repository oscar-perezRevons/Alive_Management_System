import prisma from '../config/database';

export class GroupsService {
  async createGroup(
    name: string, 
    description: string | undefined, 
    administratorId: number,
    motto?: string,
    leaderName?: string,
    subLeaderName?: string,
    bibleVerse?: string,
    anthemUrl?: string
  ) {
    console.log('Creando grupo con identidad extendida:', { name, administratorId });
    return await prisma.groupSmall.create({
      data: {
        name,
        description,
        motto,
        leaderName,
        subLeaderName,
        bibleVerse,
        anthemUrl,
        administratorId,
        totalPoints: 0,
      },
      include: {
        administrator: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getAllGroups() {
    return await prisma.groupSmall.findMany({
      include: {
        administrator: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } }
      },
      orderBy: { id: 'asc' }
    });
  }

  async getLeaderboard() {
    return await prisma.groupSmall.findMany({
      select: {
        id: true,
        name: true,
        motto: true,
        totalPoints: true,
        leaderName: true,
        _count: { select: { members: true } }
      },
      orderBy: { totalPoints: 'desc' }
    });
  }

  async getGroupById(id: number) {
    console.log(`[Secretaría] Extrayendo ficha e integrantes del grupo ID: ${id}`);
    
    const group = await prisma.groupSmall.findUnique({
      where: { id },
      include: {
        administrator: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            groupRole: true, 
            birthDate: true 
          }
        },
        scores: true,
        penalties: { orderBy: { date: 'desc' } }
      },
    });

    if (!group) return null;

    const membersWithScores = group.members.map(member => {
      const personalPoints = group.scores
        .filter(score => score.userId === member.id)
        .reduce((sum, score) => sum + score.points, 0);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        groupRole: member.groupRole,
        birthDate: member.birthDate ? member.birthDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'No registrado',
        contributedPoints: personalPoints
      };
    });

    const totalPenaltiesPoints = group.penalties.reduce((sum, p) => sum + p.points, 0);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      motto: group.motto,
      bibleVerse: group.bibleVerse || '"Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él." - Proverbios 22:6',
      anthemUrl: group.anthemUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      totalPoints: group.totalPoints,
      netPoints: group.totalPoints + totalPenaltiesPoints,
      leaderName: group.leaderName,
      subLeaderName: group.subLeaderName,
      administratorId: group.administratorId,
      administrator: group.administrator,
      members: membersWithScores,
      penalties: group.penalties
    };
  }

  async updateGroup(id: number, data: any) {
    return await prisma.groupSmall.update({
      where: { id },
      data,
      include: {
        administrator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteGroup(id: number) {
    return await prisma.groupSmall.delete({
      where: { id },
    });
  }

  async addMemberToGroup(groupId: number, userId: number) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new Error('El usuario que intenta añadir al grupo no existe.');
    }
    return await prisma.groupSmall.update({
      where: { id: groupId },
      data: { members: { connect: { id: userId } } },
      include: { members: true }
    });
  }

  async removeGroupMember(groupId: number, userId: number) {
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

  async getGroupProgress(userId: number) {
    const group = await prisma.groupSmall.findFirst({
      where: { members: { some: { id: userId } } },
      include: {
        _count: { select: { members: true } },
        scores: {
          take: 5,
          orderBy: { date: 'desc' },
          include: { activity: { include: { pointCategory: true } } }
        }
      }
    });

    if (!group) return null;

    const assistanceSum = await prisma.score.aggregate({
      where: { groupId: group.id, activity: { pointCategory: { name: 'ASISTENCIA' } } },
      _sum: { points: true }
    });
    const evangelismSum = await prisma.score.aggregate({
      where: { groupId: group.id, activity: { pointCategory: { name: 'EVANGELISMO' } } },
      _sum: { points: true }
    });
    const bibleSum = await prisma.score.aggregate({
      where: { groupId: group.id, activity: { pointCategory: { name: 'ESTUDIO_BIBLICO' } } },
      _sum: { points: true }
    });
    const recreationSum = await prisma.score.aggregate({
      where: { groupId: group.id, activity: { pointCategory: { name: 'ACTIVIDADES_RECREATIVAS' } } },
      _sum: { points: true }
    });
    const sportsSum = await prisma.score.aggregate({
      where: { groupId: group.id, activity: { pointCategory: { name: 'DEPORTES' } } },
      _sum: { points: true }
    });

    const higherGroupsCount = await prisma.groupSmall.count({
      where: { totalPoints: { gt: group.totalPoints } }
    });

    let level = 'Nivel 1';
    let levelDescription = 'Iniciando';
    if (group.totalPoints >= 1500) {
      level = 'Nivel 4';
      levelDescription = 'Sobresaliente';
    } else if (group.totalPoints >= 1000) {
      level = 'Nivel 3';
      levelDescription = 'Fiel y Constante';
    } else if (group.totalPoints >= 500) {
      level = 'Nivel 2';
      levelDescription = 'En Crecimiento';
    }

    return {
      groupName: group.name,
      totalPoints: group.totalPoints,
      position: higherGroupsCount + 1,
      level,
      levelDescription,
      membersCount: group._count.members,
      areas: {
        asistencia: assistanceSum._sum.points || 0,
        evangelismo: evangelismSum._sum.points || 0,
        estudioBiblico: bibleSum._sum.points || 0,
        recreacion: recreationSum._sum.points || 0,
        deportes: sportsSum._sum.points || 0,
      },
      history: group.scores.map(s => ({
        id: s.id,
        activity: s.activity.name,
        points: s.points,
        date: s.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      }))
    };
  }
}