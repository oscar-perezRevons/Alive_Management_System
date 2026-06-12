import React, { useEffect, useState } from 'react';
import { groupsService } from '../services/api';
import { Plus, Trash2, Users, Trophy } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description: string;
  totalPoints: number;
  members?: any[];
}

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Cargando grupos...');
      const response = await groupsService.getAll();
      console.log('✅ Grupos cargados:', response.data);
      setGroups(response.data);
    } catch (err: any) {
      console.error('❌ Error cargando grupos:', err);
      setError(err.response?.data?.error || 'Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        setError('El nombre del grupo es requerido');
        return;
      }
      console.log('📝 Creando grupo:', formData);
      await groupsService.create(formData.name, formData.description);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear grupo');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este grupo?')) {
      try {
        console.log('🗑️ Eliminando grupo:', id);
        await groupsService.delete(id);
        await loadGroups();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al eliminar grupo');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Grupos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus size={20} />
          Nuevo Grupo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Crear Grupo</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: Grupo de Aventureros"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Descripción del grupo"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Cargando grupos...</p>
        </div>
      )}

      {/* Grupos vacíos */}
      {!loading && groups.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Trophy size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No hay grupos creados</p>
        </div>
      )}

      {/* Grid de Grupos */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {group.name}
                </h3>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-600 hover:text-red-700 transition"
                  title="Eliminar grupo"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {group.description || 'Sin descripción'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Trophy size={16} />
                  <span>Puntos totales: <strong>{group.totalPoints}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users size={16} />
                  <span>Miembros: <strong>{group.members?.length || 0}</strong></span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                Ver Detalles
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};