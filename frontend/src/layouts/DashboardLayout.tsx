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
  Moon
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
  const [avatarBg, setAvatarBg] = useState('bg-gradient-to-tr from-blue-600 to-indigo-700 text-white');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

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
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden antialiased text-slate-800">
      
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar-alive text-white transition-all duration-300 flex flex-col shadow-premium z-20 shrink-0 select-none border-r border-white/5`}
      >
        <div className="p-5 flex flex-col items-center justify-center min-h-[220px] relative border-b border-white/5 bg-white/[0.02]">
          {sidebarOpen ? (
            <div className="text-center space-y-3 animate-fadeIn">
              <div className="w-28 h-28 mx-auto flex items-center justify-center transform transition hover:scale-105 duration-300 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <img 
                  src={logoImage} 
                  alt="Alive Shield" 
                  className="w-full h-full object-contain filter drop-shadow-lg" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent leading-none">
                  ALIVE
                </h1>
                <p className="text-[10px] font-black tracking-widest text-indigo-300 uppercase mt-1">
                  Maranata Adoración
                </p>
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 flex items-center justify-center transition-all filter drop-shadow-[0_0_10px_rgba(99,102,241,0.35)] transform hover:scale-105">
              <img src={logoImage} alt="Alive" className="w-full h-full object-contain" />
            </div>
          )}
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all active:scale-95 cursor-pointer"
            title={sidebarOpen ? "Contraer menú" : "Expandir menú"}
          >
            <Menu size={16} />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          <MenuLink to="/dashboard" icon={<Home size={20} />} label="Inicio" open={sidebarOpen} />
          {hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']) && (
            <MenuLink to="/dashboard/secretaria" icon={<UserCheck size={20} />} label="Secretaría" open={sidebarOpen} />
          )}
          {hasAnyAccessRole(user, ['ADMIN']) && (
            <MenuLink to="/dashboard/puntuaciones" icon={<Award size={20} />} label="Puntuaciones" open={sidebarOpen} />
          )}
          {hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']) && (
            <MenuLink to="/dashboard/programa" icon={<CalendarDays size={20} />} label="Programa General" open={sidebarOpen} />
          )}
          <MenuLink to="/dashboard/matinales" icon={<BookOpen size={20} />} label="Matinales" open={sidebarOpen} />
          <MenuLink to="/dashboard/eventos" icon={<Users size={20} />} label="Eventos" open={sidebarOpen} />
          <MenuLink to="/dashboard/ranking" icon={<BarChart3 size={20} />} label="Ranking" open={sidebarOpen} />
          <MenuLink to="/dashboard/materiales" icon={<Folder size={20} />} label="Materiales" open={sidebarOpen} />
          <MenuLink to="/dashboard/profile" icon={<User size={20} />} label="Mi Perfil" open={sidebarOpen} />

          {user?.role === 'ADMIN' && (
            <div className="pt-3 mt-3 border-t border-white/5 space-y-1.5">
              <p className={`text-[10px] font-black tracking-widest text-indigo-300 uppercase px-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Administración</p>
              <MenuLink to="/dashboard/users" icon={<Users size={18} />} label="Control Usuarios" open={sidebarOpen} />
            </div>
          )}
        </nav>

        {sidebarOpen && (
          <div className="p-4 flex flex-col items-center justify-center space-y-1 animate-fadeIn border-t border-white/5 bg-black/10">
            <div className="text-center opacity-40">
              <p className="text-xs font-black tracking-widest text-white">ALIVE SYSTEM</p>
              <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">v2.1 • 2026</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
           <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 h-16 px-6 flex justify-between items-center z-10 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></span>
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
              Sistema de Gestión Colectiva
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* TEMA OSCURO / CLARO TOGGLE */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title={theme === 'light' ? "Activar Modo Oscuro" : "Activar Modo Claro"}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <Link 
              to="/dashboard/profile" 
              className="flex items-center gap-3 text-right group transition-all duration-200 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              title="Ir a mi configuración de perfil"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors capitalize">{user?.name}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium mt-0.5">{user?.email}</span>
              </div>
              
              <div className={`w-9 h-9 ${user?.avatarUrl ? '' : avatarBg} rounded-xl flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm border border-slate-200 dark:border-slate-850 shrink-0 transform transition-transform duration-200 group-hover:scale-105`}>
                {user?.avatarUrl ? (
                  <img src={`http://localhost:5000${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
            </Link>
            
            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900/40 uppercase tracking-wider">
              {accessRole === 'LIDER_GP' ? 'LIDER GP' : user?.role}
            </span>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>
 
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
 
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-tr from-[#f3f4f6] via-[#f1f4fc] to-[#f7f5ff] dark:from-[#090d1a] dark:via-[#0e1124] dark:to-[#050711] relative z-0 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-[400px] h-[400px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
          <div className="absolute left-10 bottom-0 w-[400px] h-[400px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
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
      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm select-none relative ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/5 text-white font-semibold border border-indigo-500/15 shadow-glow-primary' 
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-amber-400 to-amber-500 rounded-r-md"></div>
      )}
      
      <div className={`${isActive ? 'scale-105 text-indigo-450 filter drop-shadow-xs' : 'text-slate-400 group-hover:text-white'} transition-transform duration-200`}>
        {icon}
      </div>
      {open && <span className="truncate tracking-wider uppercase text-[10px] font-semibold">{label}</span>}
    </Link>
  );
};