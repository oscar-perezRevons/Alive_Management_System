import prisma from '../config/database';

export interface CreateScoreDTO {
  groupId: number;
  activityId: number;
  points: number;
  date?: string;
  observation?: string;
}

export interface CreatePenaltyDTO {
  groupId: number;
  reason: string;
  points: number;
  date?: string;
}

export class ScoreService {
  async getScoreKpis() {
    const totalGroups = await prisma.groupSmall.count();
    const totalPointsSum = await prisma.groupSmall.aggregate({
      _sum: { totalPoints: true }
    });
    const leaderGroup = await prisma.groupSmall.findFirst({
      orderBy: { totalPoints: 'desc' },
      select: { name: true, totalPoints: true }
    });

    return {
      totalGroups,
      totalPointsAccumulated: totalPointsSum._sum.totalPoints || 0,
      leaderGroupName: leaderGroup?.name || 'No asignado',
      leaderGroupPoints: leaderGroup?.totalPoints || 0
    };
  }

  async getCategoriesWithActivities() {
    return await prisma.pointCategory.findMany({
      include: {
        activities: {
          orderBy: { points: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });
  }

  async registerScore(data: CreateScoreDTO, userId: number) {
    const parsedDate = data.date ? new Date(data.date) : new Date();

    return await prisma.$transaction(async (tx) => {
      const score = await tx.score.create({
        data: {
          userId: userId,
          activityId: data.activityId,
          groupId: data.groupId,
          points: data.points,
          date: parsedDate
        }
      });

      await tx.groupSmall.update({
        where: { id: data.groupId },
        data: {
          totalPoints: { increment: data.points },
          variation: { increment: data.points }
        }
      });

      return score;
    });
  }

  async registerPenalty(data: CreatePenaltyDTO) {
    const parsedDate = data.date ? new Date(data.date) : new Date();
    const negativePoints = -Math.abs(data.points);

    return await prisma.$transaction(async (tx) => {
      const penalty = await tx.penalty.create({
        data: {
          reason: data.reason,
          points: negativePoints,
          groupSmallId: data.groupId,
          date: parsedDate
        }
      });

      await tx.groupSmall.update({
        where: { id: data.groupId },
        data: {
          totalPoints: { increment: negativePoints },
          variation: { increment: negativePoints }
        }
      });

      return penalty;
    });
  }

  async getRecentScores() {
    const scores = await prisma.score.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        groupSmall: { select: { name: true } },
        activity: {
          select: {
            name: true,
            pointCategory: { select: { name: true } }
          }
        }
      }
    });

    return scores.map(s => ({
      id: s.id,
      date: s.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      groupName: s.groupSmall.name.toUpperCase(),
      categoryName: s.activity.pointCategory.name,
      activityName: s.activity.name,
      points: s.points
    }));
  }

  async getRecentPenalties() {
    const penalties = await prisma.penalty.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { groupSmall: { select: { name: true } } }
    });

    return penalties.map(p => ({
      id: p.id,
      date: p.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      groupName: p.groupSmall.name.toUpperCase(),
      reason: p.reason,
      points: p.points
    }));
  }

  async createCategory(name: string) {
    return await prisma.pointCategory.create({
      data: { name }
    });
  }

  async updateCategory(id: number, name: string) {
    return await prisma.pointCategory.update({
      where: { id },
      data: { name }
    });
  }

  async deleteCategory(id: number) {
    // Note: Due to foreign key constraints, Prisma will fail if there are related Activities 
    // unless Cascade deletion is set up in schema. Prisma schema handles relations.
    // If cascade is not configured, we might need to manually delete activities first, 
    // but typically standard Prisma schema handles this or the controller returns a 400.
    return await prisma.pointCategory.delete({
      where: { id }
    });
  }

  async createActivity(categoryId: number, name: string, points: number) {
    return await prisma.activity.create({
      data: {
        pointCategoryId: categoryId,
        name: name,
        points: points,
        createdById: 1, 
        groupSmallId: 1 
      }
    });
  }

  async updateActivity(id: number, name: string, points: number) {
    return await prisma.activity.update({
      where: { id },
      data: { name, points }
    });
  }

  async deleteActivity(id: number) {
    return await prisma.activity.delete({
      where: { id }
    });
  }
}