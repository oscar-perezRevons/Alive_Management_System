import React, { useEffect, useState } from 'react';
import { groupsService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { GroupSmall } from '../types';
import { Plus, Trash2, Users, Trophy, Shield, Bookmark, X, Users2 } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupSmall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    motto: '',
    leaderName: '',
    subLeaderName: '',
  });

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Cargando listado relacional de grupos pequeños...');
      const response = await groupsService.getAll();
      setGroups(response.data);
    } catch (err: any) {
      console.error('Error capturado al consultar grupos:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al conectar con el servidor de grupos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre del grupo es estrictamente requerido.');
      return;
    }

    try {
      console.log('📝 Despachando creación estructurada de grupo:', formData);
      await groupsService.create(
        formData.name,
        formData.description,
        formData.motto,
        formData.leaderName,
        formData.subLeaderName
      );
      
      setFormData({ name: '', description: '', motto: '', leaderName: '', subLeaderName: '' });
      setShowForm(false);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error interno al intentar dar de alta el grupo.');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm('¿Estás completamente seguro de que deseas eliminar este grupo? Todos los registros de puntajes asociados se perderán.')) {
      try {
        console.log('Despachando eliminación de grupo ID:', id);
        await groupsService.delete(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.error || 'No posees los permisos requeridos para eliminar este grupo.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Grupos Pequeños</h1>
          <p className="text-sm text-gray-500 mt-1">Monitoreo de puntajes acumulados y liderazgos de equipos.</p>
        </div>

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-95 ${
              showForm 
                ? 'bg-gray-600 shadow-gray-600/10 hover:bg-gray-700' 
                : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cerrar Panel' : 'Nuevo Grupo'}
          </button>
        )}
      </div>


      {showForm && currentUser?.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Registrar Nuevo Grupo</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Ej: Grupo de Adoración Maranata"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Lema o Eslogan</label>
                <input
                  type="text"
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Ej: Firmes y Adelante"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nombre del Líder</label>
                <input
                  type="text"
                  value={formData.leaderName}
                  onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Nombre del encargado"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nombre del Sublíder</label>
                <input
                  type="text"
                  value={formData.subLeaderName}
                  onChange={(e) => setFormData({ ...formData, subLeaderName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Nombre del asistente"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Descripción General</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  placeholder="Detalles sobre el punto de reunión u horarios..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition"
              >
                Guardar Grupo
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4 font-medium">Sincronizando grilla de puntajes acumulados...</p>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center space-y-3">
          <div className="p-4 bg-gray-50 inline-block rounded-2xl text-gray-400 shadow-inner">
            <Trophy size={36} />
          </div>
          <p className="text-gray-500 text-sm font-medium">No se han registrado grupos en el sistema todavía.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const canManageGroup = currentUser?.role === 'ADMIN' || group.administratorId === currentUser?.id;

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition duration-200 p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-800 tracking-tight group-hover:text-indigo-600 transition">
                      {group.name}
                    </h3>
                    
                    {canManageGroup && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-xl transition duration-150 shrink-0"
                        title="Eliminar grupo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {group.motto && (
                    <p className="text-[11px] font-bold text-indigo-500/90 italic tracking-wide mb-3 flex items-center gap-1">
                      <Bookmark size={12} />
                      "{group.motto}"
                    </p>
                  )}

                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
                    {group.description || 'Sin descripción descriptiva asignada.'}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <Trophy size={14} className="text-amber-500" /> Puntos Totales
                    </span>
                    <strong className="text-gray-800 text-sm font-black tracking-tight">{group.totalPoints} pts</strong>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <Users size={14} className="text-indigo-500" /> Miembros Activos
                    </span>
                    <strong className="text-gray-800 font-bold">{group.members?.length || 0} integrantes</strong>
                  </div>

                  {group.leaderName && (
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                      <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                        <Shield size={14} className="text-purple-500" /> Líder
                      </span>
                      <span className="text-gray-700 font-semibold truncate max-w-[140px]">{group.leaderName}</span>
                    </div>
                  )}

                  <button className="w-full mt-3 px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-600 rounded-xl transition duration-150 text-xs font-bold flex items-center justify-center gap-2">
                    <Users2 size={14} />
                    Ver Panel de Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};