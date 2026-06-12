import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { groupsService, usersService, activitiesService } from '../services/api';
import { Trophy, Users, Calendar } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalUsers: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const [groupsRes, usersRes, activitiesRes] = await Promise.all([
            groupsService.getAll(),
            usersService.getAll(),
            activitiesService.getAll(),
          ]);

          setStats({
            totalGroups: groupsRes.data.length,
            totalUsers: usersRes.data.length,
            totalActivities: activitiesRes.data.length,
          });
        } else {
          const [groupsRes, activitiesRes] = await Promise.all([
            groupsService.getAll(),
            activitiesService.getAll(),
          ]);

          setStats({
            totalGroups: groupsRes.data.length,
            totalUsers: 0,
            totalActivities: activitiesRes.data.length,
          });
        }
      } catch (error) {
        console.error('Error capturado al cargar métricas del Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-500">Cargando métricas del sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            ¡Hola de nuevo, {user?.name}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Panel de control general de ALIVE Maranata Adoración
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-wider">
            Sesión activa como: {user?.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <StatCard
          title="Grupos Pequeños"
          value={stats.totalGroups}
          icon={<Trophy className="w-6 h-6 text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        
        {user?.role === 'ADMIN' && (
          <StatCard
            title="Usuarios Registrados"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            bgColor="bg-emerald-50"
          />
        )}
        
        <StatCard
          title="Actividades Creadas"
          value={stats.totalActivities}
          icon={<Calendar className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Información de la Plataforma</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Bienvenido al núcleo de control y visualización para grupos pequeños de ALIVE Maranata Adoración. 
          A través de este panel interactivo podrás supervisar el avance de las puntuaciones acumuladas, el calendario de 
          actividades vigentes y las métricas integradas de rendimiento comunitario de manera centralizada.
        </p>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex items-center justify-between transition-all duration-200 hover:shadow-md">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
        <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
      </div>
      <div className={`p-4 ${bgColor} rounded-xl shadow-inner flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
};