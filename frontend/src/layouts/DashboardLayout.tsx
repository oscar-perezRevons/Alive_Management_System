import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Menu, LogOut, Home, Users, Trophy, Calendar } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    console.log('Cerrando sesión desde el Dashboard');
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-indigo-700 to-blue-800 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 h-16">
          {sidebarOpen && (
            <span className="text-xl font-black tracking-wider text-white">
              ALIVE SYSTEM
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-2">
          <MenuLink
            to="/dashboard"
            icon={<Home size={20} />}
            label="Inicio"
            open={sidebarOpen}
          />
          
          {user?.role === 'ADMIN' && (
            <MenuLink
              to="/dashboard/users"
              icon={<Users size={20} />}
              label="Usuarios"
              open={sidebarOpen}
            />
          )}

          <MenuLink
            to="/dashboard/groups"
            icon={<Trophy size={20} />}
            label="Grupos"
            open={sidebarOpen}
          />
          
          <MenuLink
            to="/dashboard/activities"
            icon={<Calendar size={20} />}
            label="Actividades"
            open={sidebarOpen}
          />
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 px-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">
            Sistema de Gestión - ALIVE
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-gray-700">{user?.name}</span>
              <span className="text-xs text-gray-400 font-mono">{user?.email}</span>
            </div>
            
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              user?.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {user?.role}
            </span>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 group font-medium ${
        isActive 
          ? 'bg-white/20 text-white border-l-4 border-white' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition duration-200`}>
        {icon}
      </div>
      {open && <span className="truncate text-sm">{label}</span>}
    </Link>
  );
};