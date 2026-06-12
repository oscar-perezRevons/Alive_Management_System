import prisma from '../config/database';

export class ActivitiesService {
  async createActivity(
    name: string,
    description: string,
    points: number,
    groupSmallId: number,
    pointCategoryId: number,
    createdById: number
  ) {
    return await prisma.activity.create({
      data: {
        name,
        description,
        points,
        groupSmallId,
        pointCategoryId,
        createdById,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        pointCategory: true,
      },
    });
  }

  async getAllActivities() {
    return await prisma.activity.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        pointCategory: true,
        groupSmall: { select: { name: true } },
      },
    });
  }

  async getActivitiesByGroup(groupId: number) {
    return await prisma.activity.findMany({
      where: { groupSmallId: groupId },
      include: {
        createdBy: { select: { name: true, email: true } },
        pointCategory: true,
      },
    });
  }

  async addScore(userId: number, activityId: number, groupId: number, points: number) {
    // Crear registro de puntuación
    const score = await prisma.score.create({
      data: {
        userId,
        activityId,
        groupId,
        points,
      },
    });

    // Actualizar puntos totales del grupo
    await prisma.groupSmall.update({
      where: { id: groupId },
      data: {
        totalPoints: {
          increment: points,
        },
      },
    });

    return score;
  }
}