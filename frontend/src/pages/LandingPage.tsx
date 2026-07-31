import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getFullMediaUrl } from '../utils/mediaUtils';
import { resolveAccessRole } from '../utils/access';
import { 
  LogIn, 
  UserPlus, 
  Users, 
  CalendarDays, 
  Trophy, 
  Folder, 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Moon, 
  Sun, 
  ArrowRight,
  Layers,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

import logoImage from '../assets/logo.png';
import bg2Image from '../assets/background2.jpg';
import bannerDefault from '../assets/banner-default.png';
import campamentoImg from '../assets/campamento.jpg';
import confraternizacionImg from '../assets/confraternizacion.jpg';
import viajesImg from '../assets/viajes.jpg';

import ninosImg from '../assets/matinal_niños.jpg';
import adolescentesImg from '../assets/matinal_adolescentes.jpg';
import jovenesImg from '../assets/matinal_jovenes.jpg';
import mujeresImg from '../assets/matinal_mujeres.jpg';
import adultosImg from '../assets/matinal_adultos.jpg';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const accessRole = resolveAccessRole(user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  // Preloader Intro Loader State
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando entorno visual ALIVE...');

  // Lamborghini-Style Interactive Hero Showcase State
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isAdmin = accessRole === 'ADMIN';
  const isLeader = accessRole === 'LIDER_GP';
  const isMember = !!user && !isAdmin && !isLeader;

  // ═══════ DYNAMIC ROLE-BASED LANDING SHOWCASE ITEMS ═══════
  const SHOWCASE_ITEMS = (isAdmin || isLeader) ? [
    {
      id: 'secretaria',
      tabLabel: 'SECRETARÍA & GP',
      badge: isAdmin ? '👑 CONTROL EJECUTIVO' : '🤝 LIDERAZGO DE GP',
      title: 'SUPERVISIÓN Y CONTROL DE',
      highlight: 'GRUPOS PEQUEÑOS',
      subtitle: `Hola, ${user?.name.split(' ')[0]}. Administra los integrantes de tu GP, directivas, ideales y el control de asistencia institucional en tiempo real.`,
      image: confraternizacionImg,
      btnText: 'ACCEDER A SECRETARÍA',
      route: '/dashboard/secretaria'
    },
    {
      id: 'puntuaciones',
      tabLabel: 'PUNTUACIONES',
      badge: 'COMPETENCIAS COMUNITARIAS',
      title: 'CONTROL DE CLASIFICACIÓN',
      highlight: 'EN VIVO',
      subtitle: 'Supervisa y actualiza los puntajes de campamentos, eventos deportivos y ránkings oficiales de la iglesia.',
      image: campamentoImg,
      btnText: isAdmin ? 'GESTIONAR PUNTUACIONES' : 'VER CLASIFICACIÓN',
      route: isAdmin ? '/dashboard/puntuaciones' : '/dashboard/ranking'
    },
    {
      id: 'itinerario',
      tabLabel: 'PROGRAMA SABÁTICO',
      badge: 'CULTOS Y PROGRAMAS',
      title: 'ORGANIZACIÓN DEL',
      highlight: 'PROGRAMA GENERAL',
      subtitle: 'Administra la orden del culto del sábado, oradores, lecturas e itinerarios con scanner automático.',
      image: bannerDefault,
      btnText: 'CONFIGURAR PROGRAMA',
      route: '/dashboard/programa'
    },
    {
      id: 'materiales',
      tabLabel: 'BIBLIOTECA DIGITAL',
      badge: 'RECURSOS INSTITUCIONALES',
      title: 'BIBLIOTECA',
      highlight: 'DIGITAL',
      subtitle: 'Accede, descarga y consulta guías devocionales, manuales de ideales y documentos PDF oficiales para la comunidad.',
      image: bg2Image,
      btnText: 'VER MATERIALES',
      route: '/dashboard/materiales'
    },
    {
      id: 'usuarios',
      tabLabel: isAdmin ? 'CONTROL USUARIOS' : 'ACTIVIDADES',
      badge: isAdmin ? 'ADMINISTRACIÓN DEL SISTEMA' : 'ACTIVIDADES Y EVENTOS',
      title: isAdmin ? 'GESTIÓN DE CUENTAS' : 'CONVOCATORIAS',
      highlight: isAdmin ? 'Y ROLES' : 'DE LA SEMANA',
      subtitle: isAdmin ? 'Administra permisos de usuarios, líderes de GP y asignaciones en la plataforma ALIVE.' : 'Descubre los torneos deportivos, campamentos e inscripciones comunitarias.',
      image: jovenesImg,
      btnText: isAdmin ? 'ADMINISTRAR USUARIOS' : 'VER CALENDARIO',
      route: isAdmin ? '/dashboard/users' : '/dashboard/eventos'
    }
  ] : isMember ? [
    {
      id: 'matinales',
      tabLabel: 'DEVOCIONALES',
      badge: `✦ ESPACIO DE ${user?.name.split(' ')[0].toUpperCase()} ✦`,
      title: 'DEVOCIONES Y LECTURAS',
      highlight: 'DIARIAS',
      subtitle: `Bienvenido a tu portal devocional, ${user?.name.split(' ')[0]}. Fortalece tu vida espiritual diariamente con guías organizadas por 5 rangos de edad.`,
      image: jovenesImg,
      btnText: 'LEER DEVOCIONAL DE HOY',
      route: '/dashboard/matinales'
    },
    {
      id: 'itinerario',
      tabLabel: 'PROGRAMA SABÁTICO',
      badge: 'ORDEN DEL CULTO',
      title: 'ITINERARIO EN VIVO DEL',
      highlight: 'SÁBADO',
      subtitle: 'Consulta el programa sabático, himnos, lecturas bíblicas y horarios en tiempo real desde tu dispositivo.',
      image: bannerDefault,
      btnText: 'VER ORDEN DEL CULTO',
      route: '/dashboard/programa'
    },
    {
      id: 'migp',
      tabLabel: 'MI GRUPO PEQUEÑO',
      badge: 'COMUNIDAD Y FRATERNIDAD',
      title: 'POSICIONES Y RÁNKINGS DE',
      highlight: 'MI GP',
      subtitle: 'Sigue el avance de tu Grupo Pequeño en las actividades semanales y apoya a tu equipo en la tabla oficial.',
      image: confraternizacionImg,
      btnText: 'VER RANKING DE MI GP',
      route: '/dashboard/ranking'
    },
    {
      id: 'materiales',
      tabLabel: 'BIBLIOTECA DIGITAL',
      badge: 'RECURSOS Y GUÍAS',
      title: 'BIBLIOTECA',
      highlight: 'DIGITAL',
      subtitle: 'Visualiza y descarga materiales devocionales, cantarios e ideales oficiales directamente en el visor 3D.',
      image: bg2Image,
      btnText: 'EXPLORAR BIBLIOTECA DIGITAL',
      route: '/dashboard/materiales'
    },
    {
      id: 'eventos',
      tabLabel: 'ACTIVIDADES',
      badge: 'CONVOCATORIAS COMUNITARIAS',
      title: 'PRÓXIMOS ENCUENTROS Y',
      highlight: 'ACTIVIDADES',
      subtitle: 'Participa en campamentos, eventos juveniles, torneos deportivos y encuentros comunitarios de ALIVE.',
      image: campamentoImg,
      btnText: 'VER ACTIVIDADES',
      route: '/dashboard/eventos'
    }
  ] : [
    {
      id: 'bienvenida',
      tabLabel: 'UNIRME A ALIVE',
      badge: '✦ PLATAFORMA OFICIAL ADORACIÓN ✦',
      title: 'ÚNETE A LA COMUNIDAD',
      highlight: 'ALIVE MARANATA',
      subtitle: 'Conecta con tu Grupo Pequeño, consulta el orden del culto sabático en vivo, compite en Scoreboards y accede a guías devocionales HD.',
      image: confraternizacionImg,
      btnText: '🚀 CREAR MI CUENTA GRATIS',
      route: '/register'
    },
    {
      id: 'itinerario_pub',
      tabLabel: 'PROGRAMA SABÁTICO',
      badge: 'CULTOS EN TIEMPO REAL',
      title: 'ITINERARIO SABÁTICO Y',
      highlight: 'PROGRAMACIÓN EN VIVO',
      subtitle: 'No te pierdas la orden del culto. Revisa los horarios, himnos, oradores e itinerarios institucionales en una interfaz ultra moderna.',
      image: bannerDefault,
      btnText: '✨ REGÍSTRATE PARA VER EL CULTO',
      route: '/register'
    },
    {
      id: 'scoreboards_pub',
      tabLabel: 'SCOREBOARDS',
      badge: 'COMPETENCIAS COMUNITARIAS',
      title: 'TABLAS DE CLASIFICACIÓN Y',
      highlight: 'SCOREBOARDS EN VIVO',
      subtitle: 'Accede a los puntajes en vivo de campamentos, competencias deportivas por Grupos Pequeños y desafíos individuales.',
      image: campamentoImg,
      btnText: '🔥 VER PUNTUACIONES (REGISTRARME)',
      route: '/register'
    },
    {
      id: 'materiales_pub',
      tabLabel: 'BIBLIOTECA DIGITAL',
      badge: 'RECURSOS INSTITUCIONALES',
      title: 'BIBLIOTECA',
      highlight: 'DIGITAL',
      subtitle: 'Explora la biblioteca digital con visor interactivo de documentos PDF en alta resolución y descarga de ideales institucionales.',
      image: bg2Image,
      btnText: '🔓 ACCEDER A BIBLIOTECA DIGITAL',
      route: '/register'
    },
    {
      id: 'matinales_pub',
      tabLabel: 'DEVOCIONALES',
      badge: '5 CATEGORÍAS DE EDAD',
      title: 'DEVOCIONES MATINALES',
      highlight: 'PERSONALIZADAS',
      subtitle: 'Lecturas diarias estructuradas para niños, adolescentes, jóvenes, ministerio de la mujer y adultos.',
      image: jovenesImg,
      btnText: '📖 COMENZAR MI LECTURA DIARIA',
      route: '/register'
    }
  ];

  // Preloader progress bar timer
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 350);
          return 100;
        }
        const increment = Math.floor(Math.random() * 9) + 4;
        const next = Math.min(prev + increment, 100);
        
        if (next < 30) {
          setStatusText('Cargando interfaz y activos gráficos...');
        } else if (next < 70) {
          setStatusText('Sincronizando módulos devocionales e itinerario...');
        } else if (next < 99) {
          setStatusText('Optimizando entorno ALIVE Maranata v2.1...');
        } else {
          setStatusText('¡Bienvenido a ALIVE System!');
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // AUTO-PLAY 3-SECOND TIMER WITH KINETIC MOTION
  useEffect(() => {
    if (isPaused || isLoading) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused, isLoading, SHOWCASE_ITEMS.length]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const activeShowcase = SHOWCASE_ITEMS[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07080c] text-slate-900 dark:text-white font-sans selection:bg-amber-400 selection:text-black relative overflow-x-hidden antialiased w-full transition-colors duration-500">
      
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes slowBgPan {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.08) translate(1.5%, -1.5%); }
          100% { transform: scale(1.03) translate(-1.5%, 1.5%); }
        }
        @keyframes heroImagePan {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.09) rotate(0.8deg); }
          100% { transform: scale(1.04) rotate(-0.5deg); }
        }
        @keyframes timerProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(1.5deg); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(14px) rotate(-1.5deg); }
        }
        @keyframes pulseGlowGold {
          0%, 100% { opacity: 0.3; transform: scale(1); filter: blur(50px); }
          50% { opacity: 0.75; transform: scale(1.15); filter: blur(70px); }
        }
        @keyframes orbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-slow-bg {
          animation: slowBgPan 25s ease-in-out infinite alternate;
        }
        .animate-hero-pan {
          animation: heroImagePan 3s ease-in-out infinite alternate;
        }
        .animate-timer-progress {
          animation: timerProgress 3s linear infinite;
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatDelayed 10s ease-in-out infinite 2s;
        }
        .animate-pulse-glow-gold {
          animation: pulseGlowGold 4s ease-in-out infinite;
        }
        .animate-orbit-spin {
          animation: orbitSpin 12s linear infinite;
        }
      `}</style>

      {/* ════════════════ MONOCHROME INTRO PRELOADER SCREEN ════════════════ */}
      <div 
        className={`fixed inset-0 z-[100] bg-black flex flex-col justify-between p-4 sm:p-8 md:p-12 lg:p-16 select-none transition-all duration-700 ease-in-out overflow-hidden ${
          isLoading ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'
        }`}
      >
        {/* Animated Background Image Layer (background2.jpg) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80 animate-slow-bg pointer-events-none filter brightness-110 contrast-125 saturate-130 transition-opacity duration-700"
          style={{ backgroundImage: `url(${bg2Image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/75 to-black/90 pointer-events-none" />

        {/* Top Header inside Preloader */}
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(234,179,8,0.2)] backdrop-blur-md">
              <img src={logoImage} alt="Alive" className="w-full h-full object-contain filter brightness-200 animate-pulse" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-white leading-none block">
                ALIVE MARANATA
              </span>
              <p className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase tracking-[0.2em] mt-0.5">Sistema de Gestión Colectiva</p>
            </div>
          </div>
          
          <div className="hidden xs:flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-300 uppercase backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Cargando Entorno</span>
          </div>
        </div>

        {/* Center Content: Orbiting Ring & Gold Shield Logo (Shifted down so background watermark image is 100% visible) */}
        <div className="flex flex-col items-center justify-center mt-auto mb-4 sm:mb-8 space-y-5 sm:space-y-6 max-w-xs sm:max-w-md md:max-w-xl mx-auto w-full text-center relative z-10 pt-24 sm:pt-32 pb-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-orbit-spin" />
            <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-amber-400/30 border-t-amber-400 animate-orbit-spin" style={{ animationDirection: 'reverse', animationDuration: '8s' }} />

            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse-glow-gold" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#090a0f]/90 border border-amber-400/40 p-3 sm:p-4 backdrop-blur-xl relative z-10 flex items-center justify-center shadow-[0_0_35px_rgba(234,179,8,0.3)]">
              <img src={logoImage} alt="Alive" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(234,179,8,0.9)] animate-float-slow" />
            </div>
          </div>

          <div className="w-full space-y-3 sm:space-y-4">
            <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/10 border border-amber-400/30 overflow-hidden relative p-0.5 shadow-inner backdrop-blur-md">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 transition-all duration-150 relative shadow-[0_0_25px_rgba(234,179,8,1)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/60 blur-xs" />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 tracking-[0.2em] uppercase truncate max-w-full px-2 animate-pulse">
              {statusText}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Giant Gold Percentage Counter */}
        <div className="flex items-end justify-between w-full border-t border-white/15 pt-4 sm:pt-6 relative z-10">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Estado de Inicio</p>
            <p className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-wider">ALIVE SYSTEM V2.1</p>
          </div>

          <div className="font-mono text-5xl xs:text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 leading-none drop-shadow-[0_0_35px_rgba(234,179,8,0.4)]">
            {String(progress).padStart(2, '0')}<span className="text-xl xs:text-2xl sm:text-4xl md:text-5xl text-amber-400 font-sans ml-0.5 sm:ml-1">%</span>
          </div>
        </div>
      </div>

      {/* BACKGROUND DECORATIVE ANIMATED IMAGE (background2.jpg) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-60 filter brightness-105 contrast-120 saturate-130 transition-all duration-1000 animate-slow-bg"
          style={{ backgroundImage: `url(${bg2Image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/65 to-slate-50/85 dark:from-[#0a0b10]/90 dark:via-[#0a0b10]/75 dark:to-[#0a0b10]/95 pointer-events-none" />
        
        <div className="absolute top-0 right-1/4 w-[900px] h-[900px] bg-amber-500/10 rounded-full blur-[200px] animate-pulse-glow-gold" />
        <div className="absolute top-1/3 -left-32 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-[200px] animate-float-delayed" />
      </div>



      {/* ════════════════ LAMBORGHINI OFFICIAL STYLE FULL-SCREEN OVERLAY MENU (ROOT LEVEL Z-[999]) ════════════════ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-50 dark:bg-[#07080c] text-slate-900 dark:text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 overflow-y-auto animate-fadeIn select-none transition-colors duration-300">
          
          {/* Top Header inside Overlay */}
          <div className="flex items-center justify-between w-full border-b border-slate-200 dark:border-white/10 pb-6 shrink-0">
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-[0.2em] shadow-lg transition cursor-pointer active:scale-95"
            >
              <X size={20} />
              <span>MENÚ</span>
            </button>

            {/* Brand Shield Logo Center */}
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 group">
              <img src={logoImage} alt="Alive Shield" className="w-10 h-10 object-contain filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xl font-black tracking-[0.2em] text-slate-900 dark:text-white leading-none">
                  ALIVE <span className="text-amber-600 dark:text-amber-400">MARANATA</span>
                </span>
                <span className="text-[8px] font-extrabold tracking-[0.1em] text-amber-600 dark:text-amber-400/90 uppercase mt-0.5">
                  IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
                </span>
              </div>
            </Link>

            {/* Right Actions inside Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 transition cursor-pointer shadow-sm"
                title="Cambiar Modo de Color"
              >
                {theme === 'light' ? <Moon size={20} className="text-amber-600" /> : <Sun size={20} className="text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Center 2-Column Luxury Layout with Icon Badges (Tailored per role) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-14 my-auto py-10 w-full max-w-6xl mx-auto">
            
            {/* Column 1 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-amber-500/30 dark:border-amber-400/30 pb-3">
                <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                  {(isAdmin || isLeader) ? 'SUPERVISIÓN Y ADMINISTRACIÓN' : isMember ? 'MI ESPACIO COMUNITARIO' : 'MÓDULOS DE GESTIÓN'}
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to={user ? ((isAdmin || isLeader) ? "/dashboard/secretaria" : "/dashboard/ranking") : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                      <Users size={22} />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider block">
                        {(isAdmin || isLeader) ? 'SECRETARÍA DE GP' : isMember ? 'MI GRUPO PEQUEÑO' : 'SECRETARÍA & GP'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">
                        {(isAdmin || isLeader) ? 'Control de Asistencia e Integrantes' : isMember ? 'Tabla de Posiciones y Puntuación' : 'Integración y Asistencia'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                </Link>

                <Link
                  to={user ? "/dashboard/programa" : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                      <CalendarDays size={22} />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider block">PROGRAMA SABÁTICO</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">
                        {(isAdmin || isLeader) ? 'Configurar Guion e Itinerario en Vivo' : 'Consulta de Cultos e Himnos en Vivo'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                </Link>

                <Link
                  to={user ? (isAdmin ? "/dashboard/puntuaciones" : "/dashboard/ranking") : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider block">
                        {isAdmin ? 'CARGAR PUNTUACIONES' : 'RANKING Y SCOREBOARDS'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">
                        {isAdmin ? 'Asignación de Puntos Oficiales' : 'Clasificación de Campamentos y GP'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-amber-500/30 dark:border-amber-400/30 pb-3">
                <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                  {(isAdmin || isLeader) ? 'RECURSOS INSTITUCIONALES' : isMember ? 'DEVOCIONALES Y RECURSOS' : 'RECURSOS & COMUNIDAD'}
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to={user ? "/dashboard/materiales" : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                      <Folder size={22} />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider block">BIBLIOTECA DIGITAL</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">Visor de PDF e Ideales 3D</p>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                </Link>

                <Link
                  to={user ? "/dashboard/matinales" : "/login"}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black uppercase tracking-wider block">DEVOCIONALES MATUTINOS</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">Lecturas Diarias por 5 Edades</p>
                    </div>
                  </div>
                  <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                </Link>

                {isAdmin ? (
                  <Link
                    to="/dashboard/users"
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                        <Award size={22} />
                      </div>
                      <div>
                        <span className="text-base sm:text-lg font-black uppercase tracking-wider block">CONTROL DE USUARIOS</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">Gestión de Cuentas y Asignación de Roles</p>
                      </div>
                    </div>
                    <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                  </Link>
                ) : (
                  <Link
                    to={user ? "/dashboard/eventos" : "/login"}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-400 dark:hover:bg-amber-400 text-slate-900 dark:text-white hover:text-black dark:hover:text-black border border-slate-200 dark:border-white/10 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-400/15 group-hover:bg-black group-hover:text-amber-400 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors">
                        <Award size={22} />
                      </div>
                      <div>
                        <span className="text-base sm:text-lg font-black uppercase tracking-wider block">EVENTOS & ACTIVIDADES</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-black/80 font-bold uppercase tracking-widest mt-0.5">Convocatorias e Inscripciones</p>
                      </div>
                    </div>
                    <ChevronRight size={22} className="text-slate-400 group-hover:text-black group-hover:translate-x-1.5 transition-all" />
                  </Link>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Footer inside Overlay */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-white/10 pt-6 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider shrink-0 gap-4">
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md hover:bg-amber-300 transition"
                >
                  <LayoutDashboard size={16} /> {(isAdmin || isLeader) ? 'Panel de Administración' : 'Mi Panel Personal'} ({user.name.split(' ')[0]})
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md hover:bg-amber-300 transition"
                >
                  <LogIn size={16} /> Iniciar Sesión / Registro
                </Link>
              )}
            </div>
            <span>ALIVE MARANATA ADORACIÓN • SISTEMA DE GESTIÓN V2.1</span>
          </div>

        </div>
      )}

      {/* ════════════════ HEADER / NAVIGATION ════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/90 dark:bg-[#0a0b10]/90 border-b border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-300 w-full">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Left Side: Functional Menu Toggle Button & Quick Nav */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all duration-300 cursor-pointer active:scale-95 group"
              title="Abrir menú de navegación"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
              <span>MENÚ</span>
            </button>
          </div>

          {/* Center: Brand Shield Logo */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-400/40 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <img src={logoImage} alt="Alive Shield" className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-lg font-black tracking-[0.2em] text-slate-900 dark:text-white leading-none block">
                ALIVE <span className="text-amber-600 dark:text-amber-400 font-bold">MARANATA</span>
              </span>
              <p className="text-[8px] font-extrabold tracking-[0.12em] text-amber-600 dark:text-amber-400/90 uppercase mt-0.5">
                IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
              </p>
            </div>
          </Link>

          {/* Right Side: Theme & User Capsule */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer active:scale-95 shadow-sm"
              title={theme === 'light' ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            >
              {theme === 'light' ? <Moon size={18} className="text-amber-600" /> : <Sun size={18} className="text-amber-400" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-2.5 p-1 sm:p-1.5 sm:pl-3 rounded-xl bg-white hover:bg-amber-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 transition-all duration-300 shadow-sm group"
                >
                  <div className="flex flex-col text-right hidden md:flex">
                    <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors capitalize">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      {accessRole === 'LIDER_GP' ? 'Líder GP' : user.role}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-black font-black text-xs flex items-center justify-center overflow-hidden border border-amber-300">
                    {user.avatarUrl ? (
                      <img src={getFullMediaUrl(user.avatarUrl)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition active:scale-95 cursor-pointer font-bold"
                >
                  <LayoutDashboard size={15} /> <span className="hidden sm:inline">{(isAdmin || isLeader) ? 'Panel Admin' : 'Mi Panel'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151722] dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/15 transition active:scale-95 cursor-pointer"
                >
                  <LogIn size={15} className="text-amber-600 dark:text-amber-400" /> <span className="hidden xs:inline">Iniciar Sesión</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition active:scale-95 cursor-pointer"
                >
                  <UserPlus size={15} /> Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════ HERO SECTION (LAMBORGHINI LUXURY TABBED SHOWCASE 3-SECOND KINETIC ROTATION) ════════════════ */}
      <section 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative pt-8 pb-20 lg:pt-14 lg:pb-28 px-4 sm:px-6 md:px-10 lg:px-12 w-full"
      >
        
        {/* Top Interactive Selector Tabs (Luxury Telemetry Capsule - Anti-Overflow) */}
        <div className="w-full flex items-center justify-center mb-10 px-2">
          <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0d0e15]/95 border border-slate-300/80 dark:border-white/15 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-x-auto no-scrollbar max-w-full justify-start md:justify-center">
            {SHOWCASE_ITEMS.map((item, idx) => {
              const TabIcon = idx === 0 ? Users : idx === 1 ? CalendarDays : idx === 2 ? Trophy : idx === 3 ? Folder : BookOpen;
              const isActive = activeTab === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 group/tab ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-[0_6px_25px_rgba(234,179,8,0.45)] scale-[1.02] border border-yellow-200/90' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md transition-colors ${
                    isActive ? 'bg-black/20 text-black' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 group-hover/tab:text-slate-900 dark:group-hover/tab:text-white'
                  }`}>
                    0{idx + 1}
                  </span>
                  
                  <TabIcon size={14} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/tab:scale-110'}`} />
                  
                  <span className="truncate">{item.tabLabel}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping ml-0.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Showcase Main Display Grid */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full"
        >
          
          {/* Left Column: Bold Condensed Typography & Vivid Gold CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]">
              <Sparkles size={14} />
              <span>{activeShowcase.badge}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-[1.08] sm:leading-[1.05]">
              {activeShowcase.title}{' '}
              {activeShowcase.highlight && (
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-yellow-200 dark:to-amber-400 bg-clip-text text-transparent block sm:inline">
                  {activeShowcase.highlight}
                </span>
              )}
            </h1>

            <p className="text-base sm:text-xl text-slate-700 dark:text-slate-300 font-semibold leading-relaxed max-w-2xl">
              {activeShowcase.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link
                to={user ? activeShowcase.route : "/login"}
                className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-400/25 hover:shadow-amber-400/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 border border-amber-300 cursor-pointer group"
              >
                <span>{activeShowcase.btnText}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>

              <a
                href="#modules"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/20 hover:border-amber-500 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-md group"
              >
                <Layers size={16} className="text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>TODOS LOS MÓDULOS</span>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Pop-Out Showcase Image Display (KINETIC 3-SECOND ROTATION & PROGRESS LINE) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/30 dark:border-amber-400/30 shadow-[0_0_60px_rgba(234,179,8,0.2)] group hover:border-amber-500 dark:hover:border-amber-400 transition-all duration-500">
              
              {/* Top Animated Progress Bar Line (Fills 0% to 100% every 3 seconds) */}
              <div className="w-full h-1 bg-white/20 absolute top-0 left-0 right-0 z-30 overflow-hidden">
                <div key={activeTab} className="h-full bg-amber-400 shadow-[0_0_10px_rgba(234,179,8,1)] animate-timer-progress" />
              </div>

              <div className="h-80 sm:h-[420px] lg:h-[480px] w-full relative overflow-hidden">
                <img 
                  key={activeShowcase.image}
                  src={activeShowcase.image} 
                  alt={activeShowcase.title} 
                  className="w-full h-full object-cover animate-hero-pan transition-all duration-1000 filter brightness-105 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                


                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">ALIVE MANAGEMENT</p>
                    <p className="text-lg font-black uppercase">{activeShowcase.tabLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Realtime Metrics Summary Bar (Coherent System Data per Role) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-16 w-full">
          {!user ? (
            <>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">+500</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Integrantes Registrados</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">5 EDADES</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Guías Devocionales Diarias</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Trophy size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">100% EN VIVO</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Scoreboards & Ránkings GP</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarDays size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">GRATIS</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Programa & Biblioteca Digital</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">SECRETARÍA</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Asistencia & Grupos Pequeños</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">5 EDADES</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Devocionales Matutinos</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Trophy size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">EN VIVO</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Scoreboards & Ránkings GP</p>
              </div>
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/50 rounded-3xl p-6 text-center space-y-2 hover:-translate-y-2 transition-all duration-500 shadow-xl group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Folder size={20} />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">REPOSITORIO</p>
                <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Biblioteca Digital</p>
              </div>
            </>
          )}
        </div>

      </section>

      {/* ════════════════ CORE MODULES SHOWCASE GRID ════════════════ */}
      <section id="modules" className="py-20 px-4 sm:px-6 md:px-10 lg:px-12 w-full space-y-16 relative">
        <div className="text-center space-y-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Ecosistema Completo</h2>
          <p className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Módulos Diseñados para cada Área
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-8 w-full">
          
          {/* Card 1: Secretaría & GP */}
          <Link to={user ? "/dashboard/secretaria" : "/login"} className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={confraternizacionImg} alt="Secretaría" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <Users size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Secretaría y Grupos Pequeños</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Registro de asistencia semanal, control de integrantes, asignación de líderes y consolidación de reportes institucionales.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>Gestión de Integrantes</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Card 2: Itinerario Sabático */}
          <Link to={user ? "/dashboard/programa" : "/login"} className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={bannerDefault} alt="Programa" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <CalendarDays size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Programa General Sabático</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Planificación horaria en vivo, scanner inteligente de archivos Word/PDF para auto-importación y plantilla oficial exportable.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>Auto-Scanner PDF</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Card 3: Competencias & Scoreboards */}
          <Link to={user ? "/dashboard/scoreboards" : "/login"} id="scoreboards" className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={campamentoImg} alt="Puntuaciones" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <Trophy size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Scoreboards & Puntuaciones</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Tablas de clasificación dinámicas para campamentos, eventos deportivos, desafíos por GP y puntuación individual.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>Tablas de Clasificación</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Card 4: Biblioteca de Materiales */}
          <Link to={user ? "/dashboard/materiales" : "/login"} id="materials" className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={bg2Image} alt="Materiales" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <Folder size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Repositorio de Materiales</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Visor de PDF integrado directamente en la web, previsualizaciones 3D, descargas formateadas y soporte multi-archivo.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>Visor de PDF Web</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Card 5: Eventos Comunitarios */}
          <Link to={user ? "/dashboard/eventos" : "/login"} className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={viajesImg} alt="Eventos" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <Award size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Eventos & Actividades</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Gestión de inscripciones comunitarias, confirmación de integrantes por GP y publicación de convocatorias oficiales.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>Inscripción en Línea</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

          {/* Card 6: Devocionales Matutinos */}
          <Link to={user ? "/dashboard/matinales" : "/login"} id="matinales" className="bg-white/90 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.25)] hover:-translate-y-3 transition-all duration-500 flex flex-col group relative">
            <div className="h-56 relative overflow-hidden">
              <img src={jovenesImg} alt="Matinales" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-amber-400 text-black font-black shadow-lg">
                <BookOpen size={22} />
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Devocionales Matutinos</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Organización sabática por rangos de edad (Niños, Adolescentes, Jóvenes, Mujeres y Adultos) con guías en formato digital.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <span>5 Rangos de Edad</span>
                <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ════════════════ DEVOTIONAL CATEGORIES GALLERY ════════════════ */}
      <section className="py-20 px-4 sm:px-6 md:px-10 lg:px-12 w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Guías Devocionales</h2>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase">Categorías por Edades</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
          <Link to={user ? "/dashboard/matinales" : "/login"} className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 group shadow-xl hover:-translate-y-2 transition-all duration-500">
            <img src={ninosImg} alt="Niños" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">0 a 10 Años</span>
              <p className="text-base font-black text-white uppercase mt-0.5 group-hover:text-amber-300 transition-colors">Niños</p>
            </div>
          </Link>

          <Link to={user ? "/dashboard/matinales" : "/login"} className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 group shadow-xl hover:-translate-y-2 transition-all duration-500">
            <img src={adolescentesImg} alt="Adolescentes" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">11 a 16 Años</span>
              <p className="text-base font-black text-white uppercase mt-0.5 group-hover:text-amber-300 transition-colors">Adolescentes</p>
            </div>
          </Link>

          <Link to={user ? "/dashboard/matinales" : "/login"} className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 group shadow-xl hover:-translate-y-2 transition-all duration-500">
            <img src={jovenesImg} alt="Jóvenes" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">17+ Años</span>
              <p className="text-base font-black text-white uppercase mt-0.5 group-hover:text-amber-300 transition-colors">Jóvenes</p>
            </div>
          </Link>

          <Link to={user ? "/dashboard/matinales" : "/login"} className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 group shadow-xl hover:-translate-y-2 transition-all duration-500">
            <img src={mujeresImg} alt="Mujeres" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Ministerio</span>
              <p className="text-base font-black text-white uppercase mt-0.5 group-hover:text-amber-300 transition-colors">Mujeres</p>
            </div>
          </Link>

          <Link to={user ? "/dashboard/matinales" : "/login"} className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-amber-500 dark:hover:border-amber-400/60 group shadow-xl col-span-2 sm:col-span-1 hover:-translate-y-2 transition-all duration-500">
            <img src={adultosImg} alt="Adultos" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">General</span>
              <p className="text-base font-black text-white uppercase mt-0.5 group-hover:text-amber-300 transition-colors">Adultos</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ════════════════ UNREGISTERED GUEST EXCLUSIVE VIBRANT DISCOVERY SECTION ════════════════ */}
      {!user && (
        <section className="py-20 px-4 sm:px-6 md:px-10 lg:px-12 w-full space-y-16 animate-fadeIn">
          <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-transparent border-2 border-amber-500/30 dark:border-amber-400/30 p-8 sm:p-14 lg:p-16 shadow-[0_20px_60px_rgba(234,179,8,0.15)] text-center space-y-10">
            
            <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-amber-400/15 border border-amber-400/40 backdrop-blur-md">
              <Sparkles size={16} className="text-amber-600 dark:text-amber-400 animate-spin-slow" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                ✦ ACCESO PÚBLICO • DESCUBRE ALIVE MARANATA ✦
              </span>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                CONECTA, GESTIONA Y VIVE LA <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-clip-text text-transparent">EXPERIENCIA DE ADORACIÓN</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed">
                Únete a la plataforma oficial de la iglesia. Explora itinerarios sabáticos en vivo, guías devocionales por edades y ránkings de fidelidad comunitaria.
              </p>
            </div>

            {/* 4 Vibrant Feature Cards for Unregistered Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-6xl mx-auto pt-4">
              
              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg hover:border-amber-400 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <CalendarDays size={28} />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">ITINERARIO EN VIVO</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">Escaneo inteligente de guiones y programas del sábado en tiempo real.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg hover:border-amber-400 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">5 EDADES DEVOCIONALES</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">Lecturas matutinas diarias para niños, adolescentes, jóvenes y más.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg hover:border-amber-400 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <Trophy size={28} />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">SCOREBOARDS & GP</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">Tablas de posiciones en vivo para competencias y campamentos.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-lg hover:border-amber-400 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <Folder size={28} />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">REPOSITORIO DIGITAL HD</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">Descarga de ideales, cantarios y materiales en formato PDF HD.</p>
              </div>

            </div>

            {/* High Impact Call to Action Card */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm sm:text-base font-black uppercase tracking-[0.2em] shadow-[0_10px_35px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <UserPlus size={22} />
                <span>REGISTRARME AHORA GRATIS</span>
                <ChevronRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] border border-slate-700 hover:border-amber-400 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <LogIn size={20} className="text-amber-400" />
                <span>INICIAR SESIÓN</span>
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ════════════════ BOTTOM BANNER CTA (LUXURY OVERHAUL - HIGH-CONTRAST DUAL LIGHT/DARK MODE) ════════════════ */}
      <section className="py-24 px-4 sm:px-6 md:px-10 lg:px-12 w-full">
        <div className="relative rounded-[3rem] overflow-hidden bg-white/95 dark:bg-[#08090e]/95 border-2 border-amber-500/30 dark:border-amber-400/30 shadow-[0_25px_70px_rgba(234,179,8,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] p-8 sm:p-16 md:p-20 text-center space-y-10 w-full group transition-all duration-500">
          
          {/* Subtle Dimmed Background Layer without Text Collisions */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />
          
          {/* Ambient Gold Glow Orbs */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Card Content */}
          <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
            
            {/* Top Orbiting Shield Emblem */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-amber-400/30 blur-xl animate-pulse" />
              <div className="absolute -inset-2 rounded-3xl border border-amber-500/30 dark:border-amber-400/40 animate-spin-slow opacity-60" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 p-0.5 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center p-3">
                  <img src={logoImage} alt="Alive" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(234,179,8,0.9)]" />
                </div>
              </div>
            </div>

            {/* Platform Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 backdrop-blur-md">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400 animate-spin-slow" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {user ? (isAdmin ? "👑 PANEL ADMINISTRATIVO ALIVE" : "✦ COMUNIDAD DIGITAL ALIVE ✦") : "✦ PLATAFORMA INTEGRAL ALIVE MARANATA ✦"}
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                {user ? (
                  isAdmin ? (
                    <>¿LISTO PARA SUPERVISAR <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-yellow-200 dark:to-amber-400 bg-clip-text text-transparent">TU COMUNIDAD?</span></>
                  ) : (
                    <>¿LISTO PARA CONTINUAR <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-yellow-200 dark:to-amber-400 bg-clip-text text-transparent">TU DEVOCIÓN DIARIA?</span></>
                  )
                ) : (
                  <>¿LISTO PARA UNIRTE A <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-yellow-200 dark:to-amber-400 bg-clip-text text-transparent">ALIVE MARANATA?</span></>
                )}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed">
                {user ? (
                  isAdmin ? 'Accede a la consola de administración para actualizar ránkings, gestionar listas de integrantes y verificar el programa general.' : 'Sigue tus lecturas devocionales, revisa el itinerario sabático en vivo y apoya a tu Grupo Pequeño.'
                ) : (
                  'Crea tu cuenta hoy mismo de forma gratuita y accede en tiempo real al módulo de Secretaría, guías devocionales HD y Scoreboards oficiales.'
                )}
              </p>
            </div>

            {/* Metric Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm">
                <Users size={18} className="text-amber-600 dark:text-amber-400" />
                <span>+500 INTEGRANTES</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm">
                <Folder size={18} className="text-amber-600 dark:text-amber-400" />
                <span>REPOSITORIO HD</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm">
                <Trophy size={18} className="text-amber-600 dark:text-amber-400" />
                <span>RÁNKINGS EN VIVO</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm sm:text-base font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group/btn"
                >
                  <LayoutDashboard size={20} />
                  <span>MI PANEL DE CONTROL ({user.name.split(' ')[0]})</span>
                  <ChevronRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm sm:text-base font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(234,179,8,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group/btn"
                  >
                    <UserPlus size={20} />
                    <span>CREAR MI CUENTA GRATIS</span>
                    <ChevronRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 border border-slate-800 dark:border-white/20 text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} className="text-amber-400" />
                    <span>INICIAR SESIÓN</span>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-12 bg-white/90 dark:bg-[#050608] backdrop-blur-md w-full transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <img src={logoImage} alt="Alive Shield" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform duration-300" />
            <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-widest text-xs group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">ALIVE MARANATA ADORACIÓN</span>
          </div>
          <p className="text-center sm:text-right text-xs font-semibold">
            © {new Date().getFullYear()} Sistema de Gestión Colectiva. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
