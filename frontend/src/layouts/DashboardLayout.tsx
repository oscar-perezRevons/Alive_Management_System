import React, { useState, useEffect } from 'react';
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
  BarChart3, 
  Folder,
  BookOpen,
  User,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  X
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
        {/* Sidebar Background — Gradient with animated orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 dark:from-[#060818] dark:via-[#0a0e24] dark:to-[#050711]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent" />

        {/* Brand Section */}
        <div className="relative p-5 flex flex-col items-center justify-center min-h-[210px] border-b border-white/5">
          {isExpanded ? (
            <div className="text-center space-y-3 animate-fadeIn">
              <div className="w-24 h-24 mx-auto flex items-center justify-center transform transition hover:scale-110 duration-500 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 rounded-2xl blur-xl animate-glow-pulse" />
                <img 
                  src={logoImage} 
                  alt="Alive Shield" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] relative z-10" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-[0.25em] bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent leading-none">
                  ALIVE
                </h1>
                <p className="text-[9px] font-bold tracking-[0.3em] text-indigo-400/80 uppercase mt-1.5">
                  Maranata Adoración
                </p>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center transition-all transform hover:scale-110 duration-300 relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-lg animate-glow-pulse" />
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
          <MenuLink to="/dashboard/matinales" icon={<BookOpen size={19} />} label="Matinales" open={isExpanded} />
          <MenuLink to="/dashboard/eventos" icon={<Users size={19} />} label="Eventos" open={isExpanded} />
          <MenuLink to="/dashboard/ranking" icon={<BarChart3 size={19} />} label="Ranking" open={isExpanded} />
          <MenuLink to="/dashboard/materiales" icon={<Folder size={19} />} label="Materiales" open={isExpanded} />
          <MenuLink to="/dashboard/profile" icon={<User size={19} />} label="Mi Perfil" open={isExpanded} />

          {user?.role === 'ADMIN' && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
              <p className={`text-[9px] font-bold tracking-[0.2em] text-indigo-400/60 uppercase px-4 mb-1 ${isExpanded ? 'block' : 'hidden'}`}>Administración</p>
              <MenuLink to="/dashboard/users" icon={<Users size={18} />} label="Control Usuarios" open={isExpanded} />
            </div>
          )}
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="relative p-4 flex flex-col items-center justify-center space-y-1 animate-fadeIn border-t border-white/5">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Sparkles size={10} className="text-indigo-400/60" />
                <p className="text-[10px] font-black tracking-[0.2em] text-white/30">ALIVE SYSTEM</p>
                <Sparkles size={10} className="text-indigo-400/60" />
              </div>
              <p className="text-[8px] font-bold text-indigo-400/40 uppercase tracking-[0.3em]">v2.1 • 2026</p>
            </div>
          </div>
        )}
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Header */}
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 h-16 px-3 sm:px-6 flex justify-between items-center z-10 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition active:scale-95 cursor-pointer shrink-0"
              title="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
            </div>
            <h2 className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase truncate">
              Sistema de Gestión Colectiva
            </h2>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all duration-300 cursor-pointer active:scale-90"
              title={theme === 'light' ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-800"></div>

            {/* User Profile Link */}
            <Link 
              to="/dashboard/profile" 
              className="flex items-center gap-2 sm:gap-3 text-right group transition-all duration-300 py-1 px-1.5 sm:px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Ir a mi configuración de perfil"
            >
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors capitalize">{user?.name}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium mt-0.5">{user?.email}</span>
              </div>
              
              <div className={`w-8 h-8 sm:w-9 sm:h-9 ${user?.avatarUrl ? '' : avatarBg} rounded-xl flex items-center justify-center font-bold text-xs overflow-hidden shadow-md border-2 border-white dark:border-slate-700 shrink-0 transform transition-transform duration-200 group-hover:scale-105 ring-2 ring-indigo-500/20`}>
                {user?.avatarUrl ? (
                  <img src={`http://localhost:5000${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
            </Link>
            
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-extrabold rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 uppercase tracking-wider shadow-sm shrink-0">
              {accessRole === 'LIDER_GP' ? 'LIDER GP' : user?.role}
            </span>
            
            <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-800"></div>

            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all duration-300 cursor-pointer active:scale-90 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
 
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-3.5 sm:p-6 relative z-0 transition-colors duration-500 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-[#080c18] dark:via-[#0c1028] dark:to-[#0a0818]">
          {/* Ambient background orbs */}
          <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-indigo-400/8 dark:bg-indigo-500/5 blur-[150px] pointer-events-none -z-10 animate-float-slow"></div>
          <div className="absolute left-10 bottom-0 w-[400px] h-[400px] rounded-full bg-violet-400/8 dark:bg-violet-500/5 blur-[130px] pointer-events-none -z-10 animate-float-delayed"></div>
          <div className="absolute left-1/2 top-1/3 w-[300px] h-[300px] rounded-full bg-emerald-400/5 dark:bg-emerald-500/3 blur-[120px] pointer-events-none -z-10 animate-float"></div>
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
          ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-white font-bold shadow-lg shadow-indigo-500/10 border border-indigo-400/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-gradient-to-b from-amber-400 via-amber-300 to-orange-400 rounded-r-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
      )}
      
      <div className={`${isActive ? 'text-indigo-300 scale-110' : 'text-slate-500 group-hover:text-indigo-300'} transition-all duration-200 shrink-0`}>
        {icon}
      </div>
      
      {open && (
        <span className={`truncate tracking-wider uppercase text-[10px] ${isActive ? 'font-extrabold' : 'font-semibold'}`}>{label}</span>
      )}
      
      {open && isActive && (
        <ChevronRight size={14} className="ml-auto text-indigo-400/60 shrink-0" />
      )}
    </Link>
  );
};