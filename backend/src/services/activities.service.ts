import prisma from '../config/database';

export class ActivitiesService {
  async createActivity(
    name: string,
    description: string | undefined,
    points: number,
    groupSmallId: number,
    pointCategoryId: number,
    createdById: number
  ) {
    console.log('Registrando actividad en base de datos:', { name, points, groupSmallId });
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
        pointCategory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getAllActivities() {
    console.log('Listando historial general de actividades...');
    return await prisma.activity.findMany({
      include: {
        pointCategory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getActivitiesByGroup(groupSmallId: number) {
    console.log(`Buscando actividades asociadas al GP ID: ${groupSmallId}`);
    return await prisma.activity.findMany({
      where: {
        groupSmallId,
      },
      include: {
        pointCategory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async addScoreToUser(userId: number, activityId: number, groupId: number, points: number) {
    console.log('Ejecutando transacción ACID para asignación de puntos:', { userId, activityId, points });
    
    return await prisma.$transaction(async (tx) => {
      const score = await tx.score.create({
        data: {
          userId,
          activityId,
          groupId,
          points,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          activity: { select: { id: true, name: true } },
        },
      });

      await tx.groupSmall.update({
        where: { id: groupId },
        data: {
          totalPoints: {
            increment: points,
          },
        },
      });

      return score;
    });
  }
}

export const activitiesService = new ActivitiesService();