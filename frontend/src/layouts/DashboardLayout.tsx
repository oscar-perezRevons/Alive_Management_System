import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    console.log('👋 Logout');
    logout();
    navigate('/login', { replace: true });
  };

  console.log('📊 DashboardLayout - User:', user?.email, 'Role:', user?.role);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-primary to-secondary text-white transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">ALIVE</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          <NavLink
            to="/dashboard"
            icon={<Home size={20} />}
            label="Inicio"
            open={sidebarOpen}
          />
          {user?.role === 'ADMIN' && (
            <>
              <NavLink
                to="/dashboard/users"
                icon={<Users size={20} />}
                label="Usuarios"
                open={sidebarOpen}
              />
              <NavLink
                to="/dashboard/groups"
                icon={<Trophy size={20} />}
                label="Grupos"
                open={sidebarOpen}
              />
              <NavLink
                to="/dashboard/activities"
                icon={<Calendar size={20} />}
                label="Actividades"
                open={sidebarOpen}
              />
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Sistema de Gestión - ALIVE
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            <span className="px-3 py-1 bg-primary text-white text-xs rounded-full">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, open }) => {
  return (
    <a
      href={to}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded transition cursor-pointer"
    >
      {icon}
      {open && <span>{label}</span>}
    </a>
  );
};