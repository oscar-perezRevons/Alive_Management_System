import React, { useEffect, useState } from 'react';
import { activitiesService, groupsService, usersService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Activity as ActivityType, GroupSmall, User } from '../types';
import { Calendar, Plus, Trophy, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [groups, setGroups] = useState<GroupSmall[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  const [activityData, setActivityData] = useState({
    name: '',
    description: '',
    points: '',
    groupSmallId: '',
    pointCategoryId: '1', 
  });

  const [scoreData, setScoreData] = useState({
    userId: '',
    points: '',
  });

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [activitiesRes, groupsRes] = await Promise.all([
        activitiesService.getAll(),
        groupsService.getAll()
      ]);
      
      setActivities(activitiesRes.data);
      setGroups(groupsRes.data);

      if (currentUser?.role === 'ADMIN') {
        const usersRes = await usersService.getAll();
        setUsers(usersRes.data);
      }
    } catch (err: any) {
      console.error('Error capturado al inicializar actividades:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al obtener registros de actividades.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, description, points, groupSmallId, pointCategoryId } = activityData;

    if (!name || !points || !groupSmallId || !pointCategoryId) {
      setError('Por favor, completa todos los campos obligatorios del formulario.');
      return;
    }

    try {
      console.log('Despachando creación de actividad...');
      await activitiesService.create(
        name,
        description,
        Number(points),
        Number(groupSmallId),
        Number(pointCategoryId)
      );

      setSuccess('Actividad creada exitosamente.');
      setActivityData({ name: '', description: '', points: '', groupSmallId: '', pointCategoryId: '1' });
      setShowActivityForm(false);
      
      const response = await activitiesService.getAll();
      setActivities(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No tienes permisos para añadir actividades en este grupo.');
    }
  };

  const handleOpenScoreModal = async (activity: ActivityType) => {
    setError('');
    setSuccess('');
    setSelectedActivity(activity);
    setScoreData({ userId: '', points: String(activity.points) }); 

    try {
      const groupDetails = await groupsService.getById(activity.groupSmallId);
      setUsers(groupDetails.data.members || []);
      setShowScoreForm(true);
    } catch (err: any) {
      setError('Error al consultar la nómina de miembros para asignar puntajes.');
    }
  };

  const handleAssignScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedActivity || !scoreData.userId || !scoreData.points) {
      setError('Por favor, selecciona un usuario y define la puntuación a otorgar.');
      return;
    }

    try {
      console.log('Despachando asignación transaccional de score a la API...');
      await activitiesService.addScore(
        Number(scoreData.userId),
        selectedActivity.id,
        selectedActivity.groupSmallId,
        Number(scoreData.points)
      );

      setSuccess(`¡Puntaje asignado correctamente! Los puntos acumulados del grupo fueron actualizados.`);
      setShowScoreForm(false);
      setSelectedActivity(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la puntuación del usuario.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Registro de Actividades</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión integral de cronogramas y asignación atómica de puntajes comunitarios.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          
          <button
            onClick={() => { setShowActivityForm(!showActivityForm); setShowScoreForm(false); }}
            className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition active:scale-95"
          >
            <Plus size={18} />
            Programar Actividad
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

      {showActivityForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-xl animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Programar Nueva Actividad</h2>
          <form onSubmit={handleCreateActivity} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nombre de la Actividad *</label>
              <input
                type="text"
                value={activityData.name}
                onChange={(e) => setActivityData({ ...activityData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                placeholder="Ej: Asistencia a Reunión de Oración"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Grupo Destinatario *</label>
                <select
                  value={activityData.groupSmallId}
                  onChange={(e) => setActivityData({ ...activityData, groupSmallId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                >
                  <option value="">-- Selecciona un Equipo --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Puntos Base Otorgados *</label>
                <input
                  type="number"
                  value={activityData.points}
                  onChange={(e) => setActivityData({ ...activityData, points: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  placeholder="Ej: 50"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Observaciones o Descripción</label>
              <textarea
                value={activityData.description}
                onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                placeholder="Detalles adicionales sobre la actividad obligatoria..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowActivityForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition">Publicar Actividad</button>
            </div>
          </form>
        </div>
      )}

      {showScoreForm && selectedActivity && (
        <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-xl p-6 max-w-xl animate-fadeIn">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Calificar Participante</h2>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">Actividad: {selectedActivity.name}</p>
            </div>
            <button onClick={() => setShowScoreForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"><X size={18} /></button>
          </div>
          
          <form onSubmit={handleAssignScore} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Seleccionar Miembro *</label>
                <select
                  value={scoreData.userId}
                  onChange={(e) => setScoreData({ ...scoreData, userId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  required
                >
                  <option value="">-- Seleccionar Integrante --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Puntos Finales Modificables *</label>
                <input
                  type="number"
                  value={scoreData.points}
                  onChange={(e) => setScoreData({ ...scoreData, points: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowScoreForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition">Confirmar y Cargar Puntos</button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4 font-medium">Consultando grilla general de actividades...</p>
        </div>
      )}

      {!loading && activities.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <div className="p-4 bg-gray-50 inline-block rounded-2xl text-gray-400 shadow-inner"><Calendar size={36} /></div>
          <p className="text-gray-500 text-sm font-medium">No se han registrado actividades ni eventos en la agenda.</p>
        </div>
      )}

      {!loading && activities.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial Operativo Activo</span>
            <span className="px-3 py-0.5 bg-gray-200 text-gray-600 font-mono text-[11px] font-bold rounded-full">Total: {activities.length} registros</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Actividad / Evento</th>
                  <th className="px-6 py-4">Descripción u Observación</th>
                  <th className="px-6 py-4 text-center">Valor Base</th>
                  <th className="px-6 py-4 text-center">Fecha de Creación</th>
                  <th className="px-6 py-4 text-center">Acciones Transaccionales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{activity.name}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate">{activity.description || 'Sin comentarios descriptivos.'}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">+{activity.points} pts</td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-gray-500">{new Date(activity.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenScoreModal(activity)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                        title="Asignar puntos de esta actividad a un miembro"
                      >
                        <Trophy size={12} />
                        Asignar Puntos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};