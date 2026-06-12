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
        createdBy: { select: { id: true, name: true, email: true } },
        pointCategory: true,
        groupSmall: { select: { id: true, name: true } }
      },
    });
  }

  async getAllActivities() {
    return await prisma.activity.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        pointCategory: true,
        groupSmall: { select: { id: true, name: true } },
      },
      orderBy: {
        date: 'desc',
      }
    });
  }

  async getActivitiesByGroup(groupId: number) {
    return await prisma.activity.findMany({
      where: { groupSmallId: groupId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        pointCategory: true,
      },
      orderBy: {
        date: 'desc',
      }
    });
  }

  async addScore(userId: number, activityId: number, groupId: number, points: number) {
    return await prisma.$transaction(async (tx) => {
      
      const score = await tx.score.create({
        data: {
          userId,
          activityId,
          groupId,
          points,
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