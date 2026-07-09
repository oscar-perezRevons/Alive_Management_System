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
  User 
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
    <div className="flex h-screen bg-[#f4f6fc] font-sans overflow-hidden antialiased text-slate-800">
      
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#0033cc] text-white transition-all duration-300 flex flex-col shadow-2xl z-20 shrink-0 select-none`}
      >
        <div className="p-5 flex flex-col items-center justify-center min-h-[190px] relative border-b border-white/10 bg-black/5">
          {sidebarOpen ? (
            <div className="text-center space-y-2 animate-fadeIn">
              <div className="w-20 h-20 mx-auto flex items-center justify-center bg-white/10 rounded-2xl p-2 shadow-inner backdrop-blur-xs border border-white/10">
                <img 
                  src={logoImage} 
                  alt="Alive Shield" 
                  className="max-w-full max-h-full object-contain filter drop-shadow-md" 
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest text-white leading-none">
                  ALIVE
                </h1>
                <p className="text-[10px] font-black tracking-widest text-blue-200 uppercase mt-1">
                  Maranata Adoración
                </p>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl p-1 shadow-md border border-white/10 transition-all">
              <img src={logoImage} alt="Alive" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/15 rounded-lg text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
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
            <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5">
              <p className={`text-[10px] font-black tracking-widest text-blue-200 uppercase px-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Administración</p>
              <MenuLink to="/dashboard/users" icon={<Users size={18} />} label="Control Usuarios" open={sidebarOpen} />
            </div>
          )}
        </nav>

        {sidebarOpen && (
          <div className="p-4 flex flex-col items-center justify-center space-y-1 animate-fadeIn border-t border-white/10 bg-black/10">
            <div className="text-center opacity-40">
              <p className="text-xs font-black tracking-widest text-white">ALIVE SYSTEM</p>
              <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">v2.1 • 2026</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex justify-between items-center z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
            <h2 className="text-sm font-black text-slate-700 tracking-tight uppercase">
              Sistema de Gestión Colectiva
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/profile" 
              className="flex items-center gap-3 text-right group transition-all duration-150 p-1.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
              title="Ir a mi configuración de perfil"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors capitalize">{user?.name}</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{user?.email}</span>
              </div>
              
              <div className={`w-9 h-9 ${user?.avatarUrl ? '' : avatarBg} rounded-xl flex items-center justify-center font-black text-xs overflow-hidden shadow-sm border border-slate-200 shrink-0 transform transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md`}>
                {user?.avatarUrl ? (
                  <img src={`http://localhost:5000${user.avatarUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
            </Link>
            
            <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-blue-50 text-blue-700 border border-blue-100 uppercase shadow-3xs tracking-wider">
              {accessRole === 'LIDER_GP' ? 'LIDER GP' : user?.role}
            </span>
            
            <div className="w-px h-6 bg-slate-200/80 mx-0.5"></div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-[#f4f6fc] relative">
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
      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 group font-bold text-sm select-none relative ${
        isActive 
          ? 'bg-white/15 text-white font-black shadow-inner border border-white/5' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r-md"></div>
      )}
      
      <div className={`${isActive ? 'scale-105 text-white filter drop-shadow-xs' : 'text-blue-100 group-hover:text-white'} transition-transform duration-200`}>
        {icon}
      </div>
      {open && <span className="truncate tracking-wide font-black uppercase text-xs">{label}</span>}
    </Link>
  );
};