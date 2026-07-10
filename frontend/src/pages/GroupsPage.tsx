import React, { useEffect, useState } from 'react';
import { groupsService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Trophy, Calendar, Shield, Star, HelpCircle, Lock, Eye, Download, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { Loader } from '../components/Loader';

interface LeaderboardItem {
  id: number;
  name: string;
  motto: string | null;
  totalPoints: number;
  _count: { members: number };
}

interface UserProgress {
  groupName: string;
  totalPoints: number;
  position: number;
  level: string;
  levelDescription: string;
  membersCount: number;
  areas: {
    asistencia: number;
    evangelismo: number;
    estudioBiblico: number;
    recreacion: number;
    deportes: number;
  };
  history: { id: number; activity: string; points: number; date: string }[];
}

export const GroupsPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [myProgress, setMyProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [leaderboardRes, progressRes] = await Promise.all([
        groupsService.getLeaderboard(),
        groupsService.getMyProgress()
      ]);
      
      setLeaderboard(leaderboardRes.data);
      setMyProgress(progressRes.data);
    } catch (err: any) {
      console.error('Error cargando ranking:', err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor de clasificaciones.');
    } finally {
      setLoading(false);
    }
  };

  const getStarRating = (points: number): number => {
    if (points >= 1500) return 5;
    if (points >= 1200) return 4;
    if (points >= 900) return 3;
    if (points >= 500) return 2;
    return 1;
  };

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
            <Trophy size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Ranking</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Sistema Oficial de Clasificación de Grupos Pequeños (GP)</p>
          </div>
        </div>
        <button 
          onClick={loadRankingData}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-bold rounded-xl text-xs transition"
        >
          <RefreshCw size={14} /> Sincronizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <HelpCircle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
            <p>Cada GP solo puede ver sus propios puntos y progreso.</p>
          </div>
          <div className="flex items-start gap-2 border-t md:border-t-0 md:border-x border-indigo-100 pt-3 md:pt-0 md:px-4">
            <Lock className="text-indigo-600 shrink-0 mt-0.5" size={16} />
            <p>El ranking completo de todos los GP solo se puede ver si lo permite el organizador.</p>
          </div>
          <div className="flex items-start gap-2 border-t md:border-t-0 pt-3 md:pt-0">
            <Calendar className="text-indigo-600 shrink-0 mt-0.5" size={16} />
            <p>El ranking general se mostrará en fechas determinadas (mensual, trimestral o especial).</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <Trophy size={22} className="fill-amber-100" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase">Próxima Publicación</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">15 de Junio de 2026</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cierre de periodo: 31 de Mayo de 2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-4 space-y-6">
          {myProgress ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-emerald-50/60 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                  <Shield size={14} /> MI PROGRESO (SÓLO PARA TU GP)
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full truncate max-w-[120px]">
                  GP: {myProgress.groupName}
                </span>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-3 gap-1 text-center border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Mis Puntos Acumulados</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{myProgress.totalPoints}</p>
                  </div>
                  <div className="border-x border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Posición Actual</p>
                    <div className="inline-block bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full mt-2">
                      #{myProgress.position}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Nivel Actual</p>
                    <div className="flex items-center justify-center text-emerald-600 gap-0.5 mt-1">
                      <Star size={12} className="fill-emerald-500" />
                      <span className="text-xs font-black">{myProgress.level}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 truncate">{myProgress.levelDescription}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Desglose de Puntos por Área</h3>
                  <ProgressBar label="Asistencia y Participación" value={myProgress.areas.asistencia} color="bg-emerald-500" />
                  <ProgressBar label="Evangelismo y Misiones" value={myProgress.areas.evangelismo} color="bg-blue-500" />
                  <ProgressBar label="Estudio Bíblico y Discipulado" value={myProgress.areas.estudioBiblico} color="bg-indigo-500" />
                  <ProgressBar label="Eventos Recreativos" value={myProgress.areas.recreacion} color="bg-amber-500" />
                  <ProgressBar label="Deportes" value={myProgress.areas.deportes} color="bg-rose-500" />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Historial Reciente</h3>
                  <div className="space-y-2">
                    {myProgress.history.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="truncate max-w-[180px]">
                          <p className="font-bold text-slate-700 truncate">{item.activity}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{item.date}</p>
                        </div>
                        <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]">
                          +{item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-xs text-slate-400 font-medium shadow-sm">
              Tu cuenta no está enlazada a un grupo para calcular métricas de progreso.
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-400" /> VISTA DEL ORGANIZADOR (RANKING COMPLETO)
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentUser?.role === 'ADMIN' && (
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 text-[10px] font-bold rounded-xl transition">
                    <Eye size={12} /> Panel de Control
                  </button>
                )}
                <button className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl shadow-md transition">
                  <Download size={12} /> Exportar Ranking
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex justify-between items-center text-xs text-slate-400 font-bold">
              <span>Ranking General de GP (Cierre de periodo: 31 de Mayo de 2026)</span>
              <span className="flex items-center gap-1"><Users size={12} /> Total de GP: {leaderboard.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 text-center w-12">POS.</th>
                    <th className="px-6 py-3">GP</th>
                    <th className="px-6 py-3 text-right">PUNTOS TOTALES</th>
                    <th className="px-6 py-3 text-center">NIVEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-slate-700 font-bold">
                  {leaderboard.map((group, idx) => {
                    const position = idx + 1;
                    const isPodium = position <= 3;
                    const groupStars = getStarRating(group.totalPoints);

                    return (
                      <tr key={group.id} className="hover:bg-slate-50/40 transition duration-150">
                        <td className="px-4 py-4 text-center font-mono">
                          {isPodium ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-white text-[11px] ${
                              position === 1 ? 'bg-amber-500' :
                              position === 2 ? 'bg-slate-400' : 'bg-amber-700'
                            }`}>
                              {position}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">{position}</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm tracking-tight">{group.name}</span>
                            {group.motto && <span className="text-[10px] text-slate-400 font-normal italic mt-0.5">"{group.motto}"</span>}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-black text-slate-900 text-sm">
                          {group.totalPoints.toLocaleString()} pts
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-black text-slate-600 flex items-center gap-0.5">
                              Nivel {groupStars} 
                              <Star size={10} className="fill-emerald-500 text-emerald-500" />
                            </span>
                            <div className="flex gap-px">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={8} 
                                  className={i < groupStars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-500 border-t-4 border-t-indigo-600 shadow-sm">
        <div>
          <p className="text-slate-800">Fechas de Publicación del Ranking General</p>
          <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">El ranking completo se publicará en fechas determinadas para mantener la motivación y sana competencia entre los GP.</p>
        </div>
        <div className="border-t md:border-t-0 md:border-x border-gray-100 pt-2 md:pt-0 md:px-4">
          <p className="text-slate-700">Mensual</p>
          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Último sábado de cada mes.</p>
        </div>
        <div className="border-t md:border-t-0 md:border-r border-gray-100 pt-2 md:pt-0 md:pr-4">
          <p className="text-slate-700">Trimestral</p>
          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Cada 3 meses en programa especial.</p>
        </div>
        <div>
          <p className="text-slate-700">Anual</p>
          <p className="text-[10px] text-slate-400 font-normal mt-0.5">Gran final del año Alive Maranata.</p>
        </div>
      </div>

    </div>
  );
};

const ProgressBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const maxScale = 500;
  const percentage = Math.min((value / maxScale) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
        <span className="truncate max-w-[180px]">{label}</span>
        <span className="font-mono text-slate-800">{value} pts</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};