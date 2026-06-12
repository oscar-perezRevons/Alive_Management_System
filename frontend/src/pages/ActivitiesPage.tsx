import React, { useEffect, useState } from 'react';
import { activitiesService } from '../services/api';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesService.getAll();
      setActivities(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Actividades</h1>
      
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Total de actividades: {activities.length}</p>
          {/* Aquí agregar la tabla de actividades */}
        </div>
      )}
    </div>
  );
};