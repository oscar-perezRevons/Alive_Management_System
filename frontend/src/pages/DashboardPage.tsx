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

  // ═══════ HERO SLIDES (Tailored per role - Gold & Obsidian Luxury Theme) ═══════
  const slides = isAdmin ? [
    {
      id: 0,
      title: homeData?.featuredGroup?.name || "GP DESTACADO",
      subtitle: homeData?.featuredGroup?.reason || "Líder absoluto en el Ranking de Clasificación de este mes.",
      badge: "GP Destacado del Mes",
      points: `${homeData?.featuredGroup?.totalPoints || 0} PTS`,
      buttonText: "Ver Tabla de Posiciones",
      link: "/dashboard/ranking",
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(20, 22, 32, 0.92) 50%, rgba(234, 179, 8, 0.35) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-amber-500/40",
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
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(15, 23, 42, 0.92) 50%, rgba(245, 158, 11, 0.3) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/40",
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
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(17, 24, 39, 0.92) 50%, rgba(234, 179, 8, 0.25) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-amber-500/40",
      icon: <UserCheck size={36} className="shrink-0" />,
    }
  ] : [
    // REGULAR USER & LEADER SLIDES
    {
      id: 0,
      title: "RANKING DE CLASIFICACIÓN",
      subtitle: "Participa con tu Grupo Pequeño en las actividades semanales y acumula puntos en la tabla de posiciones.",
      badge: "Competencia Alive",
      points: "PUNTUACIÓN",
      buttonText: "Ver Tabla de Posiciones",
      link: "/dashboard/ranking",
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(20, 22, 32, 0.92) 50%, rgba(234, 179, 8, 0.35) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-amber-500/40",
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
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(15, 23, 42, 0.92) 50%, rgba(245, 158, 11, 0.3) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/40",
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
      bgGradient: "linear-gradient(135deg, rgba(7, 8, 12, 0.96) 0%, rgba(17, 24, 39, 0.92) 50%, rgba(234, 179, 8, 0.25) 100%)",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
      btnBg: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/30 hover:shadow-amber-500/50",
      iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500 text-black shadow-amber-500/40",
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

  // ═══════ KPI STAT CARDS (Vibrant Multicolored Luxury Palette) ═══════
  const statCards = isAdmin ? [
    {
      icon: <Users size={22} className="stroke-[2.5]" />,
      label: 'GP Registrados',
      value: `${homeData?.totalGroupsCount || 0} Equipos`,
      cardBg: 'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/60 to-[#fde68a]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-amber-300/80 dark:border-amber-500/30 hover:border-amber-400',
      iconBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/30 border-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-300 font-black',
    },
    {
      icon: <TrendingUp size={22} className="stroke-[2.5]" />,
      label: 'Puntos Totales',
      value: `${(homeData?.totalPointsAccumulated || 0).toLocaleString()} PTS`,
      cardBg: 'bg-gradient-to-br from-[#eff6ff] via-[#dbeafe]/60 to-[#bfdbfe]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-blue-300/80 dark:border-blue-500/30 hover:border-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 border-blue-400',
      valueColor: 'text-blue-950 dark:text-blue-300 font-black',
    },
    {
      icon: <Star size={22} className="stroke-[2.5]" />,
      label: 'GP Líder del Podio',
      value: homeData?.featuredGroup?.name || 'Calculando...',
      cardBg: 'bg-gradient-to-br from-[#fefce8] via-[#fef08a]/50 to-[#fde047]/20 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-yellow-300/80 dark:border-yellow-500/30 hover:border-yellow-400',
      iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-md shadow-yellow-500/30 border-yellow-300',
      valueColor: 'text-amber-900 dark:text-yellow-300 font-black uppercase',
      isHighlighted: true,
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      cardBg: 'bg-gradient-to-br from-[#ecfeff] via-[#cffafe]/60 to-[#a5f3fc]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-cyan-300/80 dark:border-cyan-500/30 hover:border-cyan-400',
      iconBg: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 text-black shadow-md shadow-cyan-500/30 border-cyan-300',
      valueColor: 'text-cyan-950 dark:text-cyan-300 font-black',
    },
  ] : isAdminOrLeader ? [
    {
      icon: <HeartHandshake size={22} className="stroke-[2.5]" />,
      label: 'Mi Grupo Pequeño',
      value: userGroupName || 'Sin grupo asignado',
      cardBg: 'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/60 to-[#fde68a]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-amber-300/80 dark:border-amber-500/30 hover:border-amber-400',
      iconBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/30 border-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-300 font-black',
      isHighlighted: !!userGroupName,
    },
    {
      icon: <Users size={22} className="stroke-[2.5]" />,
      label: 'GP Registrados',
      value: `${homeData?.totalGroupsCount || 0} Equipos`,
      cardBg: 'bg-gradient-to-br from-[#eff6ff] via-[#dbeafe]/60 to-[#bfdbfe]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-blue-300/80 dark:border-blue-500/30 hover:border-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 border-blue-400',
      valueColor: 'text-blue-950 dark:text-blue-300 font-black',
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      cardBg: 'bg-gradient-to-br from-[#ecfeff] via-[#cffafe]/60 to-[#a5f3fc]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-cyan-300/80 dark:border-cyan-500/30 hover:border-cyan-400',
      iconBg: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 text-black shadow-md shadow-cyan-500/30 border-cyan-300',
      valueColor: 'text-cyan-950 dark:text-cyan-300 font-black',
    },
  ] : [
    {
      icon: <HeartHandshake size={22} className="stroke-[2.5]" />,
      label: 'Mi Grupo Pequeño',
      value: userGroupName || 'Sin grupo asignado',
      cardBg: 'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/60 to-[#fde68a]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-amber-300/80 dark:border-amber-500/30 hover:border-amber-400',
      iconBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/30 border-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-300 font-black',
      isHighlighted: !!userGroupName,
    },
    {
      icon: <BookOpen size={22} className="stroke-[2.5]" />,
      label: 'Devocional Diario',
      value: 'Matinales del Mes',
      cardBg: 'bg-gradient-to-br from-[#eff6ff] via-[#dbeafe]/60 to-[#bfdbfe]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-blue-300/80 dark:border-blue-500/30 hover:border-blue-400',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 border-blue-400',
      valueColor: 'text-blue-950 dark:text-blue-300 font-black',
    },
    {
      icon: <Zap size={22} className="stroke-[2.5]" />,
      label: 'Sincronización',
      value: null,
      cardBg: 'bg-gradient-to-br from-[#ecfeff] via-[#cffafe]/60 to-[#a5f3fc]/30 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-cyan-300/80 dark:border-cyan-500/30 hover:border-cyan-400',
      iconBg: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 text-black shadow-md shadow-cyan-500/30 border-cyan-300',
      valueColor: 'text-cyan-950 dark:text-cyan-300 font-black',
    },
  ];

  // ═══════ QUICK ACCESS CARDS (Vibrant Distinct Color Identities) ═══════
  const quickAccessCards = isAdminOrLeader ? [
    {
      to: '/dashboard/secretaria',
      icon: <UserCheck size={22} />,
      title: 'Secretaría',
      desc: 'Control de integrantes, directiva e ideales de cada GP.',
      tag: 'Gestión',
      cardBg: 'bg-gradient-to-br from-[#fffdf5] via-[#fef3c7]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-amber-300/70 dark:border-amber-500/20 hover:border-amber-400',
      gradientOverlay: 'from-amber-500/10 to-yellow-600/10',
      iconBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/30 border-amber-300',
      tagBg: 'bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-300/60 font-black',
    },
    {
      to: '/dashboard/programa',
      icon: <Calendar size={22} />,
      title: 'Programa General',
      desc: 'Cronograma de cultos, himnos y oradores del sábado.',
      tag: 'Itinerario',
      cardBg: 'bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-indigo-300/70 dark:border-indigo-500/20 hover:border-indigo-400',
      gradientOverlay: 'from-indigo-500/10 to-blue-600/10',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30 border-indigo-400',
      tagBg: 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-300/60 font-black',
    },
    {
      to: '/dashboard/eventos',
      icon: <Trophy size={22} />,
      title: 'Eventos & Deportes',
      desc: 'Participación comunitaria y registro de torneos del mes.',
      tag: 'Actividades',
      cardBg: 'bg-gradient-to-br from-[#fff5f5] via-[#ffe4e6]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-rose-300/70 dark:border-rose-500/20 hover:border-rose-400',
      gradientOverlay: 'from-rose-500/10 to-pink-600/10',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30 border-rose-400',
      tagBg: 'bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300/60 font-black',
    },
    {
      to: '/dashboard/ranking',
      icon: <Star size={22} />,
      title: 'Ranking de GP',
      desc: 'Tabla de clasificación semanal del proyecto Alive.',
      tag: 'Posiciones',
      cardBg: 'bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-emerald-300/70 dark:border-emerald-500/20 hover:border-emerald-400',
      gradientOverlay: 'from-emerald-500/10 to-teal-600/10',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-md shadow-emerald-500/30 border-emerald-300',
      tagBg: 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300/60 font-black',
    },
  ] : [
    {
      to: '/dashboard/matinales',
      icon: <BookOpen size={22} />,
      title: 'Matinales',
      desc: 'Lecturas devocionales y lecciones para tu crecimiento espiritual diario.',
      tag: 'Espiritual',
      cardBg: 'bg-gradient-to-br from-[#fffdf5] via-[#fef3c7]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-amber-300/70 dark:border-amber-500/20 hover:border-amber-400',
      gradientOverlay: 'from-amber-500/10 to-yellow-600/10',
      iconBg: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md shadow-amber-500/30 border-amber-300',
      tagBg: 'bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-300/60 font-black',
    },
    {
      to: '/dashboard/eventos',
      icon: <Trophy size={22} />,
      title: 'Eventos & Deportes',
      desc: 'Consulta las actividades comunitarias, encuentros y torneos.',
      tag: 'Actividades',
      cardBg: 'bg-gradient-to-br from-[#fff5f5] via-[#ffe4e6]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-rose-300/70 dark:border-rose-500/20 hover:border-rose-400',
      gradientOverlay: 'from-rose-500/10 to-pink-600/10',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30 border-rose-400',
      tagBg: 'bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300/60 font-black',
    },
    {
      to: '/dashboard/ranking',
      icon: <Star size={22} />,
      title: 'Ranking de GP',
      desc: 'Tabla de posiciones y puntaje acumulado de tu Grupo Pequeño.',
      tag: 'Posiciones',
      cardBg: 'bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-emerald-300/70 dark:border-emerald-500/20 hover:border-emerald-400',
      gradientOverlay: 'from-emerald-500/10 to-teal-600/10',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-md shadow-emerald-500/30 border-emerald-300',
      tagBg: 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300/60 font-black',
    },
    {
      to: '/dashboard/materiales',
      icon: <Folder size={22} />,
      title: 'Biblioteca Digital',
      desc: 'Descarga recursos, guías, himnos e ideales oficiales del proyecto.',
      tag: 'Recursos',
      cardBg: 'bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff]/30 to-white dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 border-indigo-300/70 dark:border-indigo-500/20 hover:border-indigo-400',
      gradientOverlay: 'from-indigo-500/10 to-blue-600/10',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/30 border-indigo-400',
      tagBg: 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-300/60 font-black',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-200 animate-fadeIn w-full select-none transition-colors duration-300">

      {/* ═══════ HEADER CARD (Gold & Obsidian Luxury Theme) ═══════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-yellow-500/5 dark:from-[#0d0e15]/95 dark:to-[#0d0e15]/95 backdrop-blur-xl p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-400/30 dark:border-amber-400/20 shadow-md transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
        
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 sm:gap-3 font-display">
            <div className="p-2 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-xl text-black shadow-md shadow-amber-500/30 shrink-0">
              {isAdmin ? <Crown size={18} className="sm:w-5 sm:h-5" /> : <Sparkles size={18} className="sm:w-5 sm:h-5" />}
            </div>
            {isAdmin ? 'Panel de Administración' : `Bienvenido, ${userNameFirst}`}
          </h1>
          <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wider pl-0 sm:pl-12">
            IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/40 dark:border-amber-400/30 px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide shadow-xs transition-colors shrink-0">
          <Calendar size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{fechaHoy}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <AlertTriangle size={16} className="shrink-0 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════ KPI STATS CARDS (Vibrant Multicolored Luxury Cards) ═══════ */}
      <div className={`grid grid-cols-2 ${statCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`${card.cardBg} backdrop-blur-xl p-4 sm:p-5 rounded-2xl border shadow-md flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group cursor-default relative overflow-hidden`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />

            <div className={`p-2.5 sm:p-3 ${card.iconBg} rounded-xl shrink-0 border transition-transform duration-300 group-hover:scale-110`}>
              {card.icon}
            </div>
            <div className="space-y-0.5 min-w-0 relative z-10">
              <span className="text-[9.5px] sm:text-[10.5px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block truncate">{card.label}</span>
              {card.value ? (
                <span className={`text-xs sm:text-base ${card.valueColor} tracking-tight block uppercase truncate`}>
                  {card.value}
                </span>
              ) : (
                <button 
                  onClick={fetchHomeData} 
                  className="text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white flex items-center gap-1.5 px-3 py-1 rounded-lg shadow-md shadow-cyan-500/25 transition-all duration-200 active:scale-95 cursor-pointer uppercase tracking-wider mt-1 border border-cyan-400/50"
                >
                  <RefreshCw size={12} className="animate-spin [animation-duration:3s]" />
                  <span>Actualizar</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ HERO SLIDER PREMIUM ═══════ */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[290px] sm:min-h-[350px] md:min-h-[390px] shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-2 border-amber-400/40 dark:border-amber-400/30 transition-colors duration-300 group/slider">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full flex flex-col justify-between p-5 sm:p-8 md:p-10 text-white transition-all duration-700 ease-in-out ${
                isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
              }`}
              style={{
                backgroundImage: `${slide.bgGradient}, url(${bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Glowing ambient backdrop orbs */}
              <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -top-16 w-80 h-80 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="absolute top-4 right-4 grid grid-cols-3 gap-1.5 opacity-25">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white rounded-full" />
                ))}
              </div>

              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-2 sm:p-2.5 ${slide.iconBg} rounded-xl shadow-lg inline-flex items-center justify-center shrink-0`}>
                    {React.cloneElement(slide.icon as React.ReactElement<any>, { size: 18 })}
                  </div>
                  <span className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] backdrop-blur-md rounded-xl border ${slide.badgeBg} flex items-center gap-1.5 shadow-xs`}>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse bg-amber-400 shadow-[0_0_8px_rgba(234,179,8,1)]"></span>
                    {slide.badge}
                  </span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4 max-w-2xl relative z-10 text-left my-auto">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase leading-[1.05] drop-shadow-[0_4px_25px_rgba(0,0,0,0.6)] font-display">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
                  {slide.subtitle}
                </p>
                <div className="pt-1">
                  <Link
                    to={slide.link}
                    className={`inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${slide.btnBg}`}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Slide Progress indicators */}
              <div className="flex gap-2 sm:gap-3 items-center w-full relative z-10 pt-2 sm:pt-3">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlide(idx)}
                    className={`flex-1 h-1.5 sm:h-2 rounded-full relative overflow-hidden transition-all cursor-pointer ${idx === activeSlide ? 'bg-white/40' : 'bg-white/15 hover:bg-white/30'}`}
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full shadow-sm"
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

      {/* ═══════ QUICK ACCESS SECTION ═══════ */}
      <div className="space-y-3 sm:space-y-4 pt-1">
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase font-display">
              Accesos Rápidos
            </h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-300 dark:from-white/10 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickAccessCards.map((card, i) => (
            <Link 
              key={i}
              to={card.to} 
              className={`group ${card.cardBg} backdrop-blur-xl p-4 sm:p-5 rounded-2xl border shadow-md flex flex-col justify-between gap-3 sm:gap-4 transition-all duration-300 hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.98] hover:shadow-xl relative overflow-hidden focus:outline-none`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradientOverlay} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <span className={`text-[9px] ${card.tagBg} px-2.5 py-1 rounded-lg uppercase tracking-wider border`}>{card.tag}</span>
              </div>
              <div className="space-y-1 sm:space-y-1.5 relative z-10">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-2">
                  {card.title}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-500" />
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ ANNOUNCEMENTS MODAL ═══════ */}
      {isAnnouncementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-5 text-black flex justify-between items-center shrink-0 shadow-md relative overflow-hidden">
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="p-1.5 bg-black/15 rounded-lg">
                  <Megaphone size={16} className="text-black" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider">Tablón de Anuncios Oficiales</h3>
              </div>
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="text-black/80 hover:text-black p-1.5 rounded-lg hover:bg-black/10 transition cursor-pointer relative z-10"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/40">
              {homeData?.announcements && homeData.announcements.length > 0 ? (
                homeData.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900/90 hover:bg-amber-50/30 dark:hover:bg-slate-800/60 hover:border-amber-300 dark:hover:border-amber-400/50 transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-l-4 border-l-amber-500 shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">{announcement.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{announcement.content}</p>
                    </div>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 font-mono uppercase w-fit h-fit shadow-xs">
                      <Clock size={12} className="text-amber-500 dark:text-amber-400" /> {announcement.timeAgo}
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
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
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