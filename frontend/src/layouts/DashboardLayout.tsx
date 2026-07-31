import React, { useState, useEffect } from 'react';
import { getFullMediaUrl } from '../utils/mediaUtils';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { hasAnyAccessRole, resolveAccessRole } from '../utils/access';
import { 
  Menu, 
  LogOut, 
  Home, 
  UserCheck, 
  Award, 
  CalendarDays, 
  Users, 
  Folder,
  BookOpen,
  User,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  Trophy,
  X,
  Globe
} from 'lucide-react';
import logoImage from '../assets/logo.png';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const accessRole = resolveAccessRole(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [avatarBg, setAvatarBg] = useState('bg-gradient-to-tr from-blue-600 to-indigo-700 text-white');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const isExpanded = sidebarOpen || mobileSidebarOpen;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    if (user?.id) {
      const savedBg = localStorage.getItem(`avatar_bg_${user.id}`);
      if (savedBg) setAvatarBg(savedBg);
    }
  }, [user?.id, location.pathname]); 

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden antialiased text-slate-800 dark:text-slate-200 transition-colors duration-500">
      
      {/* Mobile Sidebar Overlay (Backdrop) */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-fadeIn"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ═══════ SIDEBAR DESKTOP + MOBILE DRAWER ═══════ */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 select-none overflow-hidden transition-all duration-300
          ${mobileSidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        {/* Sidebar Background — Obsidian Slate Gradient with Gold ambient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#07080c] to-slate-950 dark:from-[#050608] dark:via-[#090b10] dark:to-[#050608]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-amber-500/30 via-yellow-500/15 to-transparent" />

        {/* Brand Section */}
        <div className="relative p-5 flex flex-col items-center justify-center min-h-[210px] border-b border-white/5">
          {isExpanded ? (
            <div className="text-center space-y-3 animate-fadeIn">
              <div className="w-24 h-24 mx-auto flex items-center justify-center transform transition hover:scale-110 duration-500 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 to-yellow-500/30 rounded-2xl blur-xl animate-glow-pulse" />
                <img 
                  src={logoImage} 
                  alt="Alive Shield" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] relative z-10" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-[0.25em] bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent leading-none">
                  ALIVE
                </h1>
                <p className="text-[9px] font-bold tracking-[0.25em] text-amber-400/90 uppercase mt-1">
                  Maranata Adoración
                </p>
                <p className="text-[7.5px] font-extrabold tracking-tight text-white/50 uppercase mt-1 leading-tight max-w-[190px] mx-auto">
                  IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
                </p>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center transition-all transform hover:scale-110 duration-300 relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-lg animate-glow-pulse" />
              <img src={logoImage} alt="Alive" className="w-full h-full object-contain relative z-10" />
            </div>
          )}
          
          <button
            onClick={() => {
              if (mobileSidebarOpen) {
                setMobileSidebarOpen(false);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all active:scale-90 cursor-pointer"
            title={mobileSidebarOpen ? "Cerrar menú" : sidebarOpen ? "Contraer menú" : "Expandir menú"}
          >
            <span className="hidden lg:inline"><Menu size={16} /></span>
            <span className="lg:hidden"><X size={18} /></span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative mt-3 flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          <MenuLink to="/" icon={<Globe size={19} />} label="Página Landing" open={isExpanded} />
          <MenuLink to="/dashboard" icon={<Home size={19} />} label="Inicio" open={isExpanded} />
          {hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']) && (
            <MenuLink to="/dashboard/secretaria" icon={<UserCheck size={19} />} label="Secretaría" open={isExpanded} />
          )}
          {hasAnyAccessRole(user, ['ADMIN']) && (
            <MenuLink to="/dashboard/puntuaciones" icon={<Award size={19} />} label="Puntuaciones" open={isExpanded} />
          )}
          {hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']) && (
            <MenuLink to="/dashboard/programa" icon={<CalendarDays size={19} />} label="Programa General" open={isExpanded} />
          )}
          <MenuLink to="/dashboard/ranking" icon={<Trophy size={19} />} label="Scoreboards & Rankings" open={isExpanded} />
          <MenuLink to="/dashboard/materiales" icon={<Folder size={19} />} label="Biblioteca Digital" open={isExpanded} />
          <MenuLink to="/dashboard/matinales" icon={<BookOpen size={19} />} label="Devocionales Matutinos" open={isExpanded} />
          <MenuLink to="/dashboard/eventos" icon={<Sparkles size={19} />} label="Eventos & Actividades" open={isExpanded} />
          <MenuLink to="/dashboard/profile" icon={<User size={19} />} label="Mi Perfil" open={isExpanded} />

          {hasAnyAccessRole(user, ['ADMIN']) && (
            <MenuLink to="/dashboard/users" icon={<Users size={19} />} label="Control de Usuarios" open={isExpanded} />
          )}
        </nav>

        {/* Footer info inside sidebar */}
        {isExpanded && (
          <div className="relative p-4 flex flex-col items-center justify-center space-y-1 animate-fadeIn border-t border-white/5">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Sparkles size={10} className="text-amber-400/80" />
                <p className="text-[10px] font-black tracking-[0.2em] text-white/40">ALIVE SYSTEM</p>
                <Sparkles size={10} className="text-amber-400/80" />
              </div>
              <p className="text-[8px] font-bold text-amber-400/60 uppercase tracking-[0.3em]">v2.1 • 2026</p>
            </div>
          </div>
        )}
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 px-2.5 sm:px-6 flex justify-between items-center backdrop-blur-xl bg-white/90 dark:bg-[#07080c]/90 border-b border-slate-200 dark:border-amber-500/20 shadow-md transition-colors duration-300">
          {/* Left: Mobile Trigger & System Tag */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0">
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl lg:hidden transition-all duration-200 active:scale-95 cursor-pointer shrink-0 border border-slate-200/60 dark:border-white/10 shadow-sm"
              title="Abrir menú"
            >
              <Menu size={19} />
            </button>

            {/* System Capsule Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-amber-500/20 shadow-inner min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 dark:bg-amber-400/60 inline-block"></span>
              </div>
              <h2 className="text-[9px] sm:text-[11px] font-extrabold tracking-wider text-amber-600 dark:text-amber-400 uppercase truncate">
                IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
              </h2>
            </div>
          </div>
          
          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Landing Page Link Button */}
            <Link
              to="/"
              className="relative group p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all duration-300 cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
              title="Volver a la Página de Inicio (Landing)"
            >
              <Globe size={17} className="transition-transform duration-300 group-hover:rotate-45 text-amber-500 dark:text-amber-400" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider hidden lg:inline">Ir a Landing</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative group p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all duration-300 cursor-pointer active:scale-95 shadow-sm"
              title={theme === 'light' ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            >
              {theme === 'light' ? (
                <Moon size={17} className="transition-transform duration-300 group-hover:-rotate-12 text-amber-600" />
              ) : (
                <Sun size={17} className="text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              )}
            </button>

            <div className="w-px h-6 bg-slate-300 dark:bg-white/10 hidden sm:block"></div>

            {/* User Profile Link */}
            <Link 
              to="/dashboard/profile" 
              className="flex items-center gap-2.5 p-1 sm:p-1.5 sm:pl-2.5 rounded-2xl bg-slate-100/60 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-all duration-300 group shadow-sm hover:shadow-md hover:border-amber-400/50"
              title="Ir a mi configuración de perfil"
            >
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight capitalize">
                  {user?.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-medium leading-tight">
                  {user?.email}
                </span>
              </div>
              
              <div className="relative shrink-0">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 ${user?.avatarUrl ? '' : avatarBg} rounded-xl flex items-center justify-center font-black text-xs text-white overflow-hidden shadow-md border-2 border-white dark:border-slate-800 transition-transform duration-300 group-hover:scale-105 group-hover:ring-2 group-hover:ring-amber-400/50`}>
                  {user?.avatarUrl ? (
                    <img src={getFullMediaUrl(user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              </div>
            </Link>
            
            {/* Role Badge */}
            <span className="px-2.5 py-1 text-[8px] sm:text-[9px] font-black tracking-widest rounded-xl bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 uppercase shadow-xs shrink-0 hidden md:inline-flex">
              {accessRole === 'LIDER_GP' ? 'LIDER GP' : user?.role}
            </span>
            
            <div className="w-px h-6 bg-slate-300 dark:bg-white/10 hidden sm:block"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/80 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-800/50 rounded-xl transition-all duration-300 cursor-pointer active:scale-95 shrink-0 shadow-sm"
              title="Cerrar Sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
 
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-3.5 sm:p-6 relative z-0 transition-colors duration-500 bg-slate-100 dark:bg-[#07080c]">
          {/* Ambient background orbs */}
          <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-amber-500/5 dark:bg-amber-400/5 blur-[150px] pointer-events-none -z-10 animate-float-slow"></div>
          <div className="absolute left-10 bottom-0 w-[400px] h-[400px] rounded-full bg-yellow-500/5 dark:bg-yellow-400/4 blur-[130px] pointer-events-none -z-10 animate-float-delayed"></div>
          {children}
        </main>
      </div>
    </div>
  );
};

interface MenuLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
}

const MenuLink: React.FC<MenuLinkProps> = ({ to, icon, label, open }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm select-none relative ${
        isActive 
          ? 'bg-amber-400/15 text-amber-400 font-bold border border-amber-400/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 rounded-r-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
      )}
      
      <div className={`${isActive ? 'text-amber-400 scale-110' : 'text-slate-500 group-hover:text-amber-400'} transition-all duration-200 shrink-0`}>
        {icon}
      </div>
      
      {open && (
        <span className={`truncate tracking-wider uppercase text-[10px] ${isActive ? 'font-extrabold text-amber-400' : 'font-semibold'}`}>{label}</span>
      )}
      
      {open && isActive && (
        <ChevronRight size={14} className="ml-auto text-amber-400 shrink-0" />
      )}
    </Link>
  );
};