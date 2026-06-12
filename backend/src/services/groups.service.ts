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
    console.log('📝 Creando grupo:', { name, description, administratorId });
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
    console.log('🔍 Obteniendo todos los grupos...');
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

  async getGroupById(id: number) {
    console.log('🔍 Obteniendo grupo:', id);
    return await prisma.groupSmall.findUnique({
      where: { id },
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
        scores: true,
        penalties: true,
      },
    });
  }

  async updateGroup(id: number, data: any) {
    console.log('✏️ Actualizando grupo:', id);
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
    console.log('🗑️ Eliminando grupo:', id);
    return await prisma.groupSmall.delete({
      where: { id },
    });
  }

  async addMemberToGroup(groupId: number, userId: number) {
    console.log('➕ Agregando miembro:', { groupId, userId });
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
    console.log('➖ Eliminando miembro:', { groupId, userId });
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