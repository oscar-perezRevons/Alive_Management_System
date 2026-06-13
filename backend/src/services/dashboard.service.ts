import prisma from '../config/database';

export class DashboardService {
  async getHomeData() {
    console.log('[DashboardService] Compilando métricas y agregaciones reales para el Inicio...');
    const activitiesAsAnnouncements = await prisma.activity.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      include: { pointCategory: true }
    });

    const announcements = activitiesAsAnnouncements.map((act) => {
      const diffMs = new Date().getTime() - new Date(act.date).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      let timeAgo = 'Hace momentos';
      if (diffHours > 24) {
        timeAgo = `Hace ${Math.floor(diffHours / 24)} día(s)`;
      } else if (diffHours > 0) {
        timeAgo = `Hace ${diffHours} h`;
      }

      return {
        id: act.id,
        title: act.name,
        content: act.description || 'Sin descripción adicional para este anuncio oficial.',
        timeAgo,
        type: act.points > 50 ? 'ALERT' : 'INFO'
      };
    });

    const upcomingActivitiesRaw = await prisma.activity.findMany({
      take: 3,
      orderBy: { date: 'asc' },
      include: { pointCategory: true }
    });

    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const activities = upcomingActivitiesRaw.map((act) => {
      const actDate = new Date(act.date);
      return {
        id: act.id,
        day: actDate.getDate().toString().padStart(2, '0'),
        month: months[actDate.getMonth()],
        title: act.name,
        time: actDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' p.m.',
        location: 'Templo Principal',
        iconType: act.pointCategory.name === 'DEPORTES' ? 'FUTBOL' : 
                  act.pointCategory.name === 'ASISTENCIA' ? 'PROGRAMA' : 'ALABANZA'
      };
    });

    const topGroup = await prisma.groupSmall.findFirst({
      orderBy: { totalPoints: 'desc' }
    });

    const featuredGroup = topGroup ? {
      name: `GP ${topGroup.name}`,
      reason: 'Líder absoluto en el Ranking de Clasificación',
      totalPoints: topGroup.totalPoints
    } : null;

    const totalGroupsCount = await prisma.groupSmall.count();
    
    const pointsSumAggregate = await prisma.groupSmall.aggregate({
      _sum: { totalPoints: true }
    });

    return {
      announcements,
      activities,
      featuredGroup,
      totalGroupsCount,
      totalPointsAccumulated: pointsSumAggregate._sum.totalPoints || 0
    };
  }
}