import prisma from '../config/database';

export class RankingService {
  determinarNivel(puntos: number) {
    if (puntos >= 1500) return { nivel: 4, etiqueta: 'Excelente y Constante', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (puntos >= 1000) return { nivel: 3, etiqueta: 'Fiel y Constante', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (puntos >= 500) return { nivel: 2, etiqueta: 'En Crecimiento', color: 'text-amber-500 bg-amber-50 border-amber-200' };
    return { nivel: 1, etiqueta: 'Iniciando Camino', color: 'text-slate-400 bg-slate-50 border-slate-200' };
  }

  async getListaGrupos() {
    return await (prisma as any).groupSmall.findMany({
      select: { id: true, name: true }
    });
  }

  async getRankingGeneral() {
    const grupos = await (prisma as any).groupSmall.findMany({
      include: {
        scores: true,
        penalties: true
      }
    });

    const rankingCalculado = grupos.map((g: any) => {
      const puntosActividades = g.scores.reduce((acc: number, s: any) => acc + s.points, 0);
      const puntosPenalizaciones = g.penalties.reduce((acc: number, p: any) => acc + p.points, 0);
      const puntosTotalesReales = puntosActividades + puntosPenalizaciones;

      return {
        id: g.id,
        name: g.name,
        totalPoints: puntosTotalesReales < 0 ? 0 : puntosTotalesReales,
        variation: g.variation || 0,
        ...this.determinarNivel(puntosTotalesReales < 0 ? 0 : puntosTotalesReales)
      };
    });

    rankingCalculado.sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    return rankingCalculado.map((item: any, index: number) => ({
      ...item,
      posicion: index + 1
    }));
  }

  async getProgresoGrupo(groupId: number) {
    const grupo = await (prisma as any).groupSmall.findUnique({
      where: { id: groupId },
      include: { scores: true, penalties: true }
    });

    if (!grupo) throw new Error('Grupo Pequeño inexistente.');

    const puntosActividades = grupo.scores.reduce((acc: number, s: any) => acc + s.points, 0);
    const puntosPenalizaciones = grupo.penalties.reduce((acc: number, p: any) => acc + p.points, 0);
    const puntosTotalesReales = puntosActividades + puntosPenalizaciones;

    const categorias = await (prisma as any).pointCategory.findMany({
      include: {
        activities: {
          include: { scores: { where: { groupId } } }
        }
      }
    });

    const desgloseAreas = categorias.map((cat: any) => {
      let sumaPuntos = 0;
      cat.activities.forEach((act: any) => {
        act.scores.forEach((sc: any) => { sumaPuntos += sc.points; });
      });
      return {
        id: cat.id,
        name: cat.name,
        puntos: sumaPuntos,
        max: 600
      };
    });

    const historialRaw = await (prisma as any).score.findMany({
      where: { groupId },
      include: {
        activity: { include: { pointCategory: true } }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    const historialReciente = historialRaw.map((h: any) => ({
      id: h.id,
      actividad: h.activity?.name || 'Puntuación Directa',
      area: h.activity?.pointCategory?.name || 'General',
      puntos: h.points,
      fecha: h.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    }));

    const rankingGeneral = await this.getRankingGeneral();
    const posicionActual = rankingGeneral.findIndex((g: any) => g.id === groupId) + 1;

    return {
      grupoInfo: {
        id: grupo.id,
        name: grupo.name,
        totalPoints: puntosTotalesReales < 0 ? 0 : puntosTotalesReales,
        variation: grupo.variation || 0,
        ...this.determinarNivel(puntosTotalesReales < 0 ? 0 : puntosTotalesReales),
        posicionActual: posicionActual || '-'
      },
      desgloseAreas,
      historialReciente
    };
  }
}

export const rankingService = new RankingService();