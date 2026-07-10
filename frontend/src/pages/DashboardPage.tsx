import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { DashboardHomeData } from '../types';
import {
  Megaphone, Calendar, Clock, Trophy,
  Users, Star, RefreshCw, AlertTriangle, X
} from 'lucide-react';
import bannerImage from '../assets/banner-default.png';
import { Loader } from '../components/Loader';

export const DashboardPage: React.FC = () => {
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

  const slides = [
    {
      id: 0,
      title: homeData?.featuredGroup?.name || "GP DESTACADO",
      subtitle: homeData?.featuredGroup?.reason || "Líder absoluto en el Ranking de Clasificación de este mes.",
      badge: "GP Destacado del Mes",
      points: `${homeData?.featuredGroup?.totalPoints || 0} PTS`,
      buttonText: "Ver Tabla de Posiciones",
      link: "/dashboard/ranking",
      bgGradient: "linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(99, 102, 241, 0.45) 100%)",
      icon: <Trophy size={48} className="text-amber-400 animate-bounce shrink-0" />
    },
    {
      id: 1,
      title: "Culto de Sábado",
      subtitle: "Alabanza, Devoción y Adoración Comunitaria. Te invitamos a participar junto con tu GP en el auditorio central.",
      badge: "Itinerario de Adoración",
      points: "SÁBADO • 09:00 AM",
      buttonText: "Explorar Programa",
      link: "/dashboard/programa",
      bgGradient: "linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(16, 185, 129, 0.45) 100%)",
      icon: <Calendar size={48} className="text-emerald-400 animate-pulse shrink-0" />
    },
    {
      id: 2,
      title: "Gestión de GP",
      subtitle: "Organiza integrantes, ideales y directivas de tu grupo de forma centralizada y transparente.",
      badge: "Secretaría Oficial",
      points: "ALIVE SYSTEM",
      buttonText: "Ir a Secretaría",
      link: "/dashboard/secretaria",
      bgGradient: "linear-gradient(to right, rgba(15, 23, 42, 0.95) 20%, rgba(139, 92, 246, 0.45) 100%)",
      icon: <Users size={48} className="text-indigo-400 shrink-0" />
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

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-200 animate-fadeIn w-full select-none transition-colors duration-300">

      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-850 shadow-premium transition-all duration-300">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold text-indigo-650 dark:text-indigo-400 tracking-tight flex items-center gap-2">
            <span className="text-3xl font-light text-slate-200 dark:text-slate-800">|</span> Panel de Inicio
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Bienvenido al centro neurálgico de operaciones de Alive Maranata Adoración
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-slate-850 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wide shadow-sm">
          <Calendar size={15} className="text-indigo-655 dark:text-indigo-400 animate-pulse" />
          <span>{fechaHoy}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <AlertTriangle size={16} className="shrink-0 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* SECCIÓN STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:ring-4 hover:ring-indigo-500/10 dark:hover:ring-indigo-500/5">
          <div className="p-3 bg-indigo-55 dark:bg-indigo-950/40 text-indigo-655 dark:text-indigo-400 rounded-2xl shrink-0 border border-indigo-100/50 dark:border-indigo-900/30"><Users size={20} className="stroke-[2] text-indigo-600 dark:text-indigo-400" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">GP Registrados</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight block">{homeData?.totalGroupsCount || 0} Equipos</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-700 hover:ring-4 hover:ring-amber-500/10 dark:hover:ring-amber-500/5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 border border-amber-100/55 dark:border-amber-900/30"><Trophy size={20} className="stroke-[2]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Puntos Totales</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight block">{(homeData?.totalPointsAccumulated || 0).toLocaleString()} PTS</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 hover:ring-4 hover:ring-purple-500/10 dark:hover:ring-purple-500/5">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-2xl shrink-0 border border-purple-100/55 dark:border-purple-900/30"><Star size={20} className="stroke-[2] text-purple-650 dark:text-purple-455" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">GP Líder del Podio</span>
            <span className="text-base font-extrabold text-purple-700 dark:text-purple-455 tracking-tight truncate block uppercase">
              {homeData?.featuredGroup?.name || 'Calculando...'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 hover:ring-4 hover:ring-emerald-500/10 dark:hover:ring-emerald-500/5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-100/55 dark:border-emerald-900/30"><Clock size={20} className="stroke-[2]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Sincronización</span>
            <button onClick={fetchHomeData} className="text-xs font-bold text-emerald-600 dark:text-emerald-405 flex items-center gap-1 mt-1 border-b border-emerald-250 dark:border-emerald-800 hover:border-emerald-600 dark:hover:border-emerald-400 transition-colors cursor-pointer uppercase tracking-wider text-[9px]">
              <RefreshCw size={11} className="animate-spin [animation-duration:3s]" /> Actualizar UI
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN HERO SLIDER PREMIUM (ESTILO CAR BRAND CAROUSEL) */}
      <div className="relative rounded-3xl overflow-hidden min-h-[350px] md:min-h-[385px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] border border-slate-200/60 dark:border-slate-850 transition-colors duration-300">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full flex flex-col justify-between p-6 md:p-8 text-white transition-all duration-700 ease-in-out ${
                isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"
              }`}
              style={{
                backgroundImage: `${slide.bgGradient}, url(${bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex justify-between items-start w-full relative z-10">
                <span className="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest bg-white/10 dark:bg-slate-900/50 backdrop-blur-md rounded-full border border-white/15">
                  {slide.badge}
                </span>
                <span className="text-xs font-mono font-black text-indigo-200 dark:text-indigo-305 tracking-wider">
                  {slide.points}
                </span>
              </div>

              <div className="space-y-4 max-w-2xl relative z-10 text-left">
                <div className="flex items-center gap-4">
                  <div className="transform transition-transform duration-350 hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {slide.icon}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none drop-shadow-md">
                    {slide.title}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-slate-200 dark:text-slate-350 font-medium leading-relaxed drop-shadow-sm max-w-xl">
                  {slide.subtitle}
                </p>
                <div className="pt-1">
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 dark:bg-indigo-650 dark:text-white hover:bg-slate-100 dark:hover:bg-indigo-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    {slide.buttonText}
                  </Link>
                </div>
              </div>

              {/* Slide Progress indicators */}
              <div className="flex gap-2.5 items-center w-full relative z-10 pt-4">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlide(idx)}
                    className="flex-1 h-1 rounded-full relative overflow-hidden bg-white/20 transition-all cursor-pointer"
                  >
                    <div
                      className={`absolute left-0 top-0 h-full bg-white transition-all`}
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

      {/* SECCIÓN ACCESOS RÁPIDOS */}
      <div className="space-y-3.5 pt-2">
        <h2 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-2 px-1">
          <span className="w-2 h-2 bg-indigo-650 dark:bg-indigo-400 rounded-full animate-ping"></span>
          Accesos Rápidos del Ecosistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Link 
            to="/dashboard/secretaria" 
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:ring-4 hover:ring-indigo-500/10 dark:hover:ring-indigo-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-455 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <Users size={20} className="group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Gestión</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Secretaría</h3>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">Control de integrantes, directiva e ideales de cada GP.</p>
            </div>
          </Link>

          <Link 
            to="/dashboard/programa" 
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-700 hover:ring-4 hover:ring-emerald-500/10 dark:hover:ring-emerald-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Calendar size={20} className="group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Itinerario</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Programa General</h3>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">Cronograma de cultos, himnos y oradores del sábado.</p>
            </div>
          </Link>

          <Link 
            to="/dashboard/eventos" 
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 hover:ring-4 hover:ring-purple-500/10 dark:hover:ring-purple-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-2xl border border-purple-100/55 dark:border-purple-900/30 group-hover:bg-purple-600 dark:group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Trophy size={20} className="group-hover:-rotate-12 transition-transform" />
              </div>
              <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Actividades</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Eventos & Deportes</h3>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">Participación comunitaria y registro de torneos del mes.</p>
            </div>
          </Link>

          <Link 
            to="/dashboard/ranking" 
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 shadow-premium flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-700 hover:ring-4 hover:ring-amber-500/10 dark:hover:ring-amber-500/5"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 rounded-2xl border border-amber-100/55 dark:border-amber-900/30 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <Star size={20} className="group-hover:scale-105 transition-transform text-amber-655" />
              </div>
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-405 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Posiciones</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Ranking de GP</h3>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">Tabla de clasificación semanal del proyecto Alive.</p>
            </div>
          </Link>
        </div>
      </div>

      {isAnnouncementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-650 p-5 text-white flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-white" />
                <h3 className="font-black text-sm uppercase tracking-wider">Tablón de Anuncios Oficiales</h3>
              </div>
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-950/20">
              {homeData?.announcements && homeData.announcements.length > 0 ? (
                homeData.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-l-4 border-l-indigo-500 shadow-sm"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">{announcement.title}</h4>
                      <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed font-medium">{announcement.content}</p>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-405 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 font-mono uppercase w-fit h-fit shadow-3xs">
                      <Clock size={12} className="text-indigo-455 dark:text-indigo-400" /> {announcement.timeAgo}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-450 dark:text-slate-500 text-center py-20 font-semibold italic">No hay comunicados vigentes en la cartelera digital.</p>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850 flex justify-end shrink-0">
              <button
                onClick={() => setIsAnnouncementsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
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