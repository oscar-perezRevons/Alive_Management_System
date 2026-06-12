import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { groupsService, usersService } from '../services/api';
import { Trophy, Users, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalUsers: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          groupsService.getAll(),
          usersService.getAll(),
        ]);

        setStats({
          totalGroups: groupsRes.data.length,
          totalUsers: usersRes.data.length,
          totalActivities: 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Sistema de Gestión ALIVE Maranata Adoración
        </p>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-3 gap-6">
          <StatCard
            title="Grupos Pequeños"
            value={stats.totalGroups}
            icon={<Trophy className="text-blue-500" />}
            color="blue"
          />
          <StatCard
            title="Usuarios"
            value={stats.totalUsers}
            icon={<Users className="text-green-500" />}
            color="green"
          />
          <StatCard
            title="Actividades"
            value={stats.totalActivities}
            icon={<Activity className="text-purple-500" />}
            color="purple"
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Información del Sistema</h2>
        <p className="text-gray-600">
          Bienvenido al sistema de gestión de puntuaciones y actividades para
          grupos pequeños de ALIVE Maranata Adoración.
        </p>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};