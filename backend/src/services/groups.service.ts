import prisma from '../config/database';

export class GroupsService {
  async createGroup(name: string, description: string, administratorId: number) {
    console.log('📝 Creando grupo:', { name, description, administratorId });
    return await prisma.groupSmall.create({
      data: {
        name,
        description,
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
    const groups = await prisma.groupSmall.findMany({
      include: {
        administrator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    console.log('✅ Grupos encontrados:', groups.length);
    return groups;
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