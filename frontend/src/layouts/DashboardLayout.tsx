import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
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
  BookOpen 
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#f4f6fc] font-sans overflow-hidden">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#0033cc] text-white transition-all duration-300 flex flex-col shadow-2xl z-20 shrink-0 select-none`}
      >
        <div className="p-5 flex flex-col items-center justify-center min-h-[190px] relative">
          {sidebarOpen ? (
            <div className="text-center animate-fadeIn space-y-2">
              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <img 
                  src="/assets/logo.png" 
                  alt="Alive Shield" 
                  className="max-w-full max-h-full object-contain filter drop-shadow-md" 
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-widest text-white leading-none">
                  ALIVE
                </h1>
                <p className="text-[10px] font-bold tracking-widest text-blue-200 uppercase mt-1">
                  Maranata Adoración
                </p>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/assets/logo.png" alt="Alive" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition"
          >
            <Menu size={16} />
          </button>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3 overflow-y-auto">
          <MenuLink to="/dashboard" icon={<Home size={20} />} label="Inicio" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/secretaria" icon={<UserCheck size={20} />} label="Secretaría" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/puntuaciones" icon={<Award size={20} />} label="Puntuaciones" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/programa" icon={<CalendarDays size={20} />} label="Programa General" open={sidebarOpen} />

          <MenuLink to="/dashboard/matinales" icon={<BookOpen size={20} />} label="Matinales" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/eventos" icon={<Users size={20} />} label="Eventos" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/ranking" icon={<BarChart3 size={20} />} label="Ranking" open={sidebarOpen} />
          
          <MenuLink to="/dashboard/materiales" icon={<Folder size={20} />} label="Materiales" open={sidebarOpen} />

          {user?.role === 'ADMIN' && sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <MenuLink to="/dashboard/users" icon={<Users size={18} />} label="Control Usuarios" open={sidebarOpen} />
            </div>
          )}
        </nav>

        {sidebarOpen && (
          <div className="p-5 flex flex-col items-center justify-center space-y-1 animate-fadeIn border-t border-white/10 bg-black/5">
            <div className="text-center">
              <p className="text-sm font-black tracking-widest text-white">ALIVE</p>
              <div className="w-8 h-0.5 bg-white/30 mx-auto my-1"></div>
              <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">Maranata Adoración</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
            <h2 className="text-sm font-black text-slate-700 tracking-tight">
              Sistema de Gestión - ALIVE
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-black text-slate-800">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.email}</span>
            </div>
            
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              {user?.role}
            </span>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-[#f4f6fc]">
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
      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition duration-150 group font-medium text-sm ${
        isActive 
          ? 'bg-white/20 text-white font-black shadow-inner' 
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className={`${isActive ? 'scale-105 text-white' : 'text-blue-100 group-hover:text-white'} transition`}>
        {icon}
      </div>
      {open && <span className="truncate tracking-wide">{label}</span>}
    </Link>
  );
};