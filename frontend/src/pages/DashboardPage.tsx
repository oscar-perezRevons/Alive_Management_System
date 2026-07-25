import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { resolveAccessRole, hasAnyAccessRole } from '../utils/access';
import { DashboardHomeData } from '../types';
import {
  Megaphone, Calendar, Clock, Trophy,
  Users, Star, RefreshCw, AlertTriangle, X,
  ArrowRight, Sparkles, TrendingUp, Zap,
  BookOpen, Folder, HeartHandshake,
  Crown, UserCheck
} from 'lucide-react';
import bannerImage from '../assets/banner-default.png';
import { Loader } from '../components/Loader';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const accessRole = resolveAccessRole(user);
  const isAdminOrLeader = hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']);
  const isAdmin = accessRole === 'ADMIN';

  const [homeData, setHomeData] = useState<DashboardHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const userNameFirst = user?.name ? user.name.split(' ')[0] : 'Usuario';

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getHomeData();
      setHomeData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo sincronizar el panel de inicio institucional.');
    } finally {
      setLoading(false);
    }
  };

  const rawGroupName = user?.groupSmall?.name || homeData?.myGroupSmall?.name || (user as any)?.groupSmallName || null;
  const userGroupName = rawGroupName 
    ? (rawGroupName.toUpperCase().startsWith('GP') ? rawGroupName : `GP ${rawGroupName}`) 
    : null;

  // ═══════ HERO SLIDES (Tailored per role - Only ADMIN sees featured leading group name) ═══════
  const slides = isAdmin ? [
    {
      id: 0,
      title: homeData?.featuredGroup?.name || "GP DESTACADO",
      subtitle: homeData?.featuredGroup?.reason || "Líder absoluto en el Ranking de Clasificación de este mes.",
      badge: "GP Destacado del Mes",
      points: `${homeData?.featuredGroup?.totalPoints || 0} PTS`,
      buttonText: "Ver Tabla de Posiciones",
      link: "/dashboard/ranking",
      bgGradient: "linear-gradient(135deg, rgba(30, 27, 75, 0.94) 0%, rgba(67, 56, 202, 0.88) 50%, rgba(147, 51, 234, 0.82) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/40",
      icon: <Trophy size={36} className="shrink-0" />,
    },
    {
      id: 1,
      title: "Culto de Sábado",
      subtitle: "Alabanza, Devoción y Adoración Comunitaria. Te invitamos a participar junto con tu GP en el auditorio central.",
      badge: "Itinerario de Adoración",
      points: "SÁBADO • 09:00 AM",
      buttonText: "Explorar Programa",
      link: "/dashboard/programa",
      bgGradient: "linear-gradient(135deg, rgba(6, 78, 59, 0.94) 0%, rgba(13, 148, 136, 0.88) 50%, rgba(16, 185, 129, 0.82) 100%)",
      badgeBg: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
      btnBg: "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50",
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/40",
      icon: <Calendar size={36} className="shrink-0" />,
    },
    {
      id: 2,
      title: "Gestión de GP",
      subtitle: "Organiza integrantes, ideales y directivas de tu grupo de forma centralizada y transparente.",
      badge: "Secretaría Oficial",
      points: "ALIVE SYSTEM",
      buttonText: "Ir a Secretaría",
      link: "/dashboard/secretaria",
      bgGradient: "linear-gradient(135deg, rgba(88, 28, 135, 0.94) 0%, rgba(126, 34, 206, 0.88) 50%, rgba(217, 70, 239, 0.82) 100%)",
      badgeBg: "bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/40",
      btnBg: "bg-gradient-to-r from-fuchsia-400 via-pink-300 to-rose-400 hover:from-fuchsia-300 hover:to-rose-300 text-slate-950 shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50",
      iconBg: "bg-gradient-to-br from-fuchsia-400 to-pink-500 text-slate-950 shadow-fuchsia-500/40",
      icon: <UserCheck size={36} className="shrink-0" />,
    }
  ] : [
    // REGULAR USER & LEADER SLIDES (Hides featured leading GP name)
    {
      id: 0,
      title: "RANKING DE CLASIFICACIÓN",
      subtitle: "Participa con tu Grupo Pequeño en las actividades semanales y acumula puntos en la tabla de posiciones.",
      badge: "Competencia Alive",
      points: "PUNTUACIÓN",
      buttonText: "Ver Tabla de Posiciones",
      link: "/dashboard/ranking",
      bgGradient: "linear-gradient(135deg, rgba(30, 27, 75, 0.94) 0%, rgba(67, 56, 202, 0.88) 50%, rgba(147, 51, 234, 0.82) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/40",
      icon: <Trophy size={36} className="shrink-0" />,
    },
    {
      id: 1,
      title: "Eventos & Deportes",
      subtitle: "Descubre las actividades planificadas, torneos comunitarios y encuentros de tu Grupo Pequeño.",
      badge: "Actividades de la Semana",
      points: "ALIVE COMUNIDAD",
      buttonText: "Ver Calendario de Eventos",
      link: "/dashboard/eventos",
      bgGradient: "linear-gradient(135deg, rgba(6, 78, 59, 0.94) 0%, rgba(13, 148, 136, 0.88) 50%, rgba(16, 185, 129, 0.82) 100%)",
      badgeBg: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
      btnBg: "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50",
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/40",
      icon: <Calendar size={36} className="shrink-0" />,
    },
    {
      id: 2,
      title: "Matinales & Devocionales",
      subtitle: "Fortalece tu vida espiritual cada mañana con la lectura del libro de matinales oficial de la iglesia.",
      badge: "Devoción Diaria",
      points: "LECTURA VITAL",
      buttonText: "Leer Matinales del Mes",
      link: "/dashboard/matinales",
      bgGradient: "linear-gradient(135deg, rgba(76, 29, 149, 0.94) 0%, rgba(124, 58, 237, 0.88) 50%, rgba(168, 85, 247, 0.82) 100%)",
      badgeBg: "bg-purple-400/20 text-purple-300 border-purple-400/40",
      btnBg: "bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 hover:from-purple-300 hover:to-pink-300 text-slate-950 shadow-purple-500/30 hover:shadow-purple-500/50",
      iconBg: "bg-gradient-to-br from-purple-400 to-fuchsia-500 text-slate-950 shadow-purple-500/40",
      icon: <BookOpen size={36} className="shrink-0" />,
    }
  ];

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (loading || !homeData) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [loading, homeData, slides.length]);

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  // ═══════ KPI STAT CARDS (Strict Role Privacy: Only ADMIN sees top leading group) ═══════
  const statCards = isAdmin ? [
    // ADMIN ONLY STAT CARDS
    {
      icon: <Users size={22} className="stroke-[2.5]" />,
      label: 'GP Registrados',
      value: `${homeData?.totalGroupsCount || 0} Equipos`,
      bgIcon: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/30 border-none',
      topBorder: 'stat-card-indigo',
    },
    {
      icon: <TrendingUp size={22} className="stroke-[2.5]" />,
      label: 'Puntos Totales',
      value: `${(homeData?.totalPointsAccumulated || 0).toLocaleString()} PTS`,
      bgIcon: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/30 border-none',
      topBorder: 'stat-card-amber',
    },
    {
      icon: <Star size={22} className="stroke-[2.5]" />,
      label: 'GP Líder del Podio',
      value: homeData?.featuredGroup?.name || 'Calculando...',
      bgIcon: 'bg-gradient-to-br from-purple-500 via-fuchsia-600 to-pink-600 text-white shadow-md shadow-purple-500/30 border-none',
      topBorder: 'stat-card-purple',
      isHighlighted: true,
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      bgIcon: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 border-none',
      topBorder: 'stat-card-emerald',
    },
  ] : isAdminOrLeader ? [
    // LIDER_GP (Líder, Colíder, Secretario, Tesorero): Hides featured leading group name
    {
      icon: <HeartHandshake size={22} className="stroke-[2.5]" />,
      label: 'Mi Grupo Pequeño',
      value: userGroupName || 'Sin grupo asignado',
      bgIcon: 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 border-none',
      topBorder: 'stat-card-indigo',
      isHighlighted: !!userGroupName,
    },
    {
      icon: <Users size={22} className="stroke-[2.5]" />,
      label: 'GP Registrados',
      value: `${homeData?.totalGroupsCount || 0} Equipos`,
      bgIcon: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/30 border-none',
      topBorder: 'stat-card-amber',
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      bgIcon: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 border-none',
      topBorder: 'stat-card-emerald',
    },
  ] : [
    // REGULAR USER STAT CARDS
    {
      icon: <HeartHandshake size={22} className="stroke-[2.5]" />,
      label: 'Mi Grupo Pequeño',
      value: userGroupName || 'Sin grupo asignado',
      bgIcon: 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 border-none',
      topBorder: 'stat-card-indigo',
      isHighlighted: !!userGroupName,
    },
    {
      icon: <BookOpen size={22} className="stroke-[2.5]" />,
      label: 'Devocional Diario',
      value: 'Matinales del Mes',
      bgIcon: 'bg-gradient-to-br from-purple-500 via-fuchsia-600 to-pink-600 text-white shadow-md shadow-purple-500/30 border-none',
      topBorder: 'stat-card-purple',
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      bgIcon: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 border-none',
      topBorder: 'stat-card-emerald',
    },
  ];

  // ═══════ QUICK ACCESS CARDS (Tailored per role) ═══════
  const quickAccessCards = isAdminOrLeader ? [
    {
      to: '/dashboard/secretaria',
      icon: <UserCheck size={22} />,
      title: 'Secretaría',
      desc: 'Control de integrantes, directiva e ideales de cada GP.',
      tag: 'Gestión',
      gradientOverlay: 'from-indigo-500/10 to-blue-600/10',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/30',
      titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-600',
      tagBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-700/40',
    },
    {
      to: '/dashboard/programa',
      icon: <Calendar size={22} />,
      title: 'Programa General',
      desc: 'Cronograma de cultos, himnos y oradores del sábado.',
      tag: 'Itinerario',
      gradientOverlay: 'from-emerald-500/10 to-teal-600/10',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-500/30',
      titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-600',
      tagBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/40',
    },
    {
      to: '/dashboard/eventos',
      icon: <Trophy size={22} />,
      title: 'Eventos & Deportes',
      desc: 'Participación comunitaria y registro de torneos del mes.',
      tag: 'Actividades',
      gradientOverlay: 'from-violet-500/10 to-purple-600/10',
      iconBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/60 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 group-hover:shadow-md group-hover:shadow-violet-500/30',
      titleHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
      borderHover: 'hover:border-violet-300 dark:hover:border-violet-600',
      tagBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-700/40',
    },
    {
      to: '/dashboard/ranking',
      icon: <Star size={22} />,
      title: 'Ranking de GP',
      desc: 'Tabla de clasificación semanal del proyecto Alive.',
      tag: 'Posiciones',
      gradientOverlay: 'from-amber-500/10 to-orange-600/10',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-md group-hover:shadow-amber-500/30',
      titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-600',
      tagBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/40',
    },
  ] : [
    // REGULAR USER QUICK ACCESS CARDS
    {
      to: '/dashboard/matinales',
      icon: <BookOpen size={22} />,
      title: 'Matinales',
      desc: 'Lecturas devocionales y lecciones para tu crecimiento espiritual diario.',
      tag: 'Espiritual',
      gradientOverlay: 'from-indigo-500/10 to-blue-600/10',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/30',
      titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-600',
      tagBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-700/40',
    },
    {
      to: '/dashboard/eventos',
      icon: <Trophy size={22} />,
      title: 'Eventos & Deportes',
      desc: 'Consulta las actividades comunitarias, encuentros y torneos.',
      tag: 'Actividades',
      gradientOverlay: 'from-emerald-500/10 to-teal-600/10',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-500/30',
      titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-600',
      tagBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/40',
    },
    {
      to: '/dashboard/ranking',
      icon: <Star size={22} />,
      title: 'Ranking de GP',
      desc: 'Tabla de posiciones y puntaje acumulado de tu Grupo Pequeño.',
      tag: 'Posiciones',
      gradientOverlay: 'from-amber-500/10 to-orange-600/10',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-md group-hover:shadow-amber-500/30',
      titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-600',
      tagBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/40',
    },
    {
      to: '/dashboard/materiales',
      icon: <Folder size={22} />,
      title: 'Materiales',
      desc: 'Descarga recursos, guías, himnos e ideales oficiales del proyecto.',
      tag: 'Recursos',
      gradientOverlay: 'from-violet-500/10 to-purple-600/10',
      iconBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/60 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 group-hover:shadow-md group-hover:shadow-violet-500/30',
      titleHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
      borderHover: 'hover:border-violet-300 dark:hover:border-violet-600',
      tagBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-700/40',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-200 animate-fadeIn w-full select-none transition-colors duration-300">

      {/* ═══════ HEADER CARD (Tailored for Admin vs User) ═══════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-premium transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              {isAdmin ? <Crown size={20} /> : <Sparkles size={20} />}
            </div>
            {isAdmin ? 'Panel de Administración' : `Bienvenido, ${userNameFirst}`}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider pl-12">
            {isAdminOrLeader
              ? 'Centro neurálgico de operaciones, supervisión y gestión colectiva'
              : 'Tu portal interactivo del Ministerio Joven Alive Maranata Adoración'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/30 border border-indigo-200/50 dark:border-indigo-800/40 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide shadow-sm transition-colors">
          <Calendar size={15} className="text-indigo-500 dark:text-indigo-400" />
          <span>{fechaHoy}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <AlertTriangle size={16} className="shrink-0 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════ KPI STATS CARDS ═══════ */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${statCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`${card.topBorder} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-premium flex items-center gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover dark:hover:shadow-card-hover-dark group cursor-default relative overflow-hidden`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />

            <div className={`p-3 ${card.bgIcon} rounded-xl shrink-0 border transition-transform duration-300 group-hover:scale-110`}>
              {card.icon}
            </div>
            <div className="space-y-0.5 min-w-0 relative z-10">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{card.label}</span>
              {card.value ? (
                <span className={`text-base font-extrabold tracking-tight block ${card.isHighlighted ? 'text-indigo-600 dark:text-indigo-400 uppercase truncate font-black' : 'text-slate-900 dark:text-white'}`}>
                  {card.value}
                </span>
              ) : (
                <button onClick={fetchHomeData} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer uppercase tracking-wider group/btn">
                  <RefreshCw size={12} className="animate-spin [animation-duration:3s] group-hover/btn:text-emerald-500" /> Actualizar UI
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ HERO SLIDER PREMIUM ═══════ */}
      <div className="relative rounded-3xl overflow-hidden min-h-[350px] md:min-h-[390px] shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-2 border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300 group/slider">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full flex flex-col justify-between p-7 md:p-10 text-white transition-all duration-700 ease-in-out ${
                isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
              }`}
              style={{
                backgroundImage: `${slide.bgGradient}, url(${bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Glowing ambient backdrop orbs */}
              <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="absolute top-4 right-4 grid grid-cols-3 gap-1.5 opacity-25">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white rounded-full" />
                ))}
              </div>

              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${slide.iconBg} rounded-xl shadow-lg inline-flex items-center justify-center shrink-0`}>
                    {React.cloneElement(slide.icon as React.ReactElement<any>, { size: 22 })}
                  </div>
                  <span className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md rounded-xl border ${slide.badgeBg} flex items-center gap-2 shadow-xs`}>
                    <span className="w-2 h-2 rounded-full animate-pulse bg-current shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                    {slide.badge}
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl relative z-10 text-left my-auto">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-[1.05] drop-shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
                  {slide.title}
                </h2>
                <p className="text-sm md:text-base text-white/90 font-medium leading-relaxed max-w-xl">
                  {slide.subtitle}
                </p>
                <div className="pt-1">
                  <Link
                    to={slide.link}
                    className={`inline-flex items-center justify-center gap-3 px-8 sm:px-9 py-3.5 ${slide.btnBg} font-black text-xs uppercase tracking-wider rounded-2xl transition-all duration-300 shadow-xl hover:scale-[1.03] active:scale-95 cursor-pointer whitespace-nowrap group/btn`}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform stroke-[3] shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Slide Progress indicators */}
              <div className="flex gap-3 items-center w-full relative z-10 pt-3">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlide(idx)}
                    className={`flex-1 h-2 rounded-full relative overflow-hidden transition-all cursor-pointer ${idx === activeSlide ? 'bg-white/40' : 'bg-white/15 hover:bg-white/30'}`}
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-white via-white to-amber-300 rounded-full shadow-sm"
                      style={{
                        width: idx === activeSlide ? "100%" : "0%",
                        transitionDuration: idx === activeSlide ? "6000ms" : "0ms",
                        transitionTimingFunction: "linear"
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════ QUICK ACCESS SECTION (Tailored per role) ═══════ */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase">
              Accesos Rápidos
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessCards.map((card, i) => (
            <Link 
              key={i}
              to={card.to} 
              className={`group bg-white dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-premium flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.98] hover:shadow-card-hover dark:hover:shadow-card-hover-dark ${card.borderHover} relative overflow-hidden focus:outline-none`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradientOverlay} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <span className={`text-[9px] font-bold ${card.tagBg} px-2.5 py-1 rounded-lg uppercase tracking-wider border`}>{card.tag}</span>
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className={`text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight ${card.titleHover} transition-colors flex items-center gap-2`}>
                  {card.title}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-slate-400" />
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ ANNOUNCEMENTS MODAL ═══════ */}
      {isAnnouncementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-5 text-white flex justify-between items-center shrink-0 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="p-1.5 bg-white/15 rounded-lg">
                  <Megaphone size={16} className="text-white" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider">Tablón de Anuncios Oficiales</h3>
              </div>
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/40">
              {homeData?.announcements && homeData.announcements.length > 0 ? (
                homeData.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-indigo-50/30 dark:hover:bg-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-l-4 border-l-indigo-500 shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">{announcement.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{announcement.content}</p>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/50 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 font-mono uppercase w-fit h-fit shadow-sm">
                      <Clock size={12} className="text-indigo-500 dark:text-indigo-400" /> {announcement.timeAgo}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-20 font-semibold italic">No hay comunicados vigentes en la cartelera digital.</p>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Cerrar Cartelera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};