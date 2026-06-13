import React, { useEffect, useState } from 'react';
import { dashboardService, configService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { DashboardHomeData } from '../types';
import { 
  Megaphone, Calendar, Clock, Trophy, Info, 
  Users, Star, RefreshCw, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [homeData, setHomeData] = useState<DashboardHomeData | null>(null);
  const [brandAssets, setBrandAssets] = useState<{ logoUrl: string | null; bannerUrl: string | null }>({ logoUrl: null, bannerUrl: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentUser = useAuthStore((state) => state.user);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Solicitando datos y recursos de marca en tiempo real para el Inicio...');
      
      const [homeRes, assetsRes] = await Promise.all([
        dashboardService.getHomeData(),
        configService.getBrandAssets()
      ]);
      
      setHomeData(homeRes.data);
      setBrandAssets(assetsRes.data);
    } catch (err: any) {
      console.error('Error cargando panel de inicio:', err);
      setError(err.response?.data?.error || 'No se pudo sincronizar el panel de inicio con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">Cargando Tablero Alive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div 
        className="rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 bg-cover bg-center transition-all duration-500"
        style={
          brandAssets.bannerUrl 
            ? { backgroundImage: `linear-gradient(to right, rgba(29, 78, 216, 0.95), rgba(15, 23, 42, 0.85)), url(${brandAssets.bannerUrl})` }
            : { backgroundColor: '#1d4ed8' } 
        }
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none drop-shadow-md">
            "Jóvenes adventistas" <br className="hidden sm:inline"/> al servicio de Cristo.
          </h1>
          <p className="text-xs font-mono font-bold tracking-widest text-blue-200 uppercase pt-2">
            Alive Maranata Adoración
          </p>
        </div>
        
        <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-2xl flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm relative z-10 shrink-0">
          <span className="text-[10px] font-black tracking-wider text-blue-300 uppercase">GP</span>
          <ShieldCheck size={32} className="text-white my-1" />
          <span className="text-[10px] font-black tracking-wider text-white uppercase">JA</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Users size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">GP Registrados</span>
            <span className="text-sm font-black text-slate-800 tracking-tight">{homeData?.totalGroupsCount || 0} Equipos</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500 shrink-0"><Trophy size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Puntos Totales</span>
            <span className="text-sm font-black text-slate-800 tracking-tight">{(homeData?.totalPointsAccumulated || 0).toLocaleString()} pts</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 shrink-0"><Star size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">GP Líder</span>
            <span className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[110px] block">
              {homeData?.featuredGroup?.name || 'Calculando...'}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0"><Clock size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Sincronización</span>
            <button onClick={fetchHomeData} className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
              <RefreshCw size={10} /> Actualizado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
              <Megaphone size={14} className="text-blue-600" /> Anuncios Oficiales
            </h2>
            <button className="text-[10px] font-bold text-blue-600 hover:underline">Ver todos</button>
          </div>
          
          <div className="divide-y divide-gray-100">
            {homeData?.announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/40 transition">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-800">{announcement.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{announcement.content}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Clock size={10} /> {announcement.timeAgo}
                </span>
              </div>
            ))}
            {homeData?.announcements.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">No hay comunicados vigentes en cartelera.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-b from-blue-900 to-indigo-950 rounded-2xl text-white p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-4 -translate-y-4"></div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400 fill-amber-400/20" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-300">GP Destacado del Momento</h2>
          </div>

          {homeData?.featuredGroup ? (
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 backdrop-blur-sm">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Trophy size={22} className="text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black tracking-tight uppercase text-amber-400">{homeData.featuredGroup.name}</h3>
                <p className="text-[11px] text-blue-200 font-semibold">{homeData.featuredGroup.reason}</p>
              </div>
              <div className="inline-block bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold">
                Acumulado: {homeData.featuredGroup.totalPoints} pts
              </div>
            </div>
          ) : (
            <p className="text-xs text-blue-200/60 text-center py-8 font-medium">Evaluando puntajes del fin de semana...</p>
          )}
          <p className="text-[10px] text-blue-300/80 text-center leading-relaxed font-medium">Por su destacada participación, puntualidad en las actividades e integración comunitaria.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
            <Calendar size={14} /> Próximas Actividades Obligatorias
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {homeData?.activities.map((act) => (
              <div key={act.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                      {act.day} {act.month}
                    </span>
                    <Clock size={12} className="text-slate-300" />
                  </div>
                  <h3 className="text-xs font-black text-slate-800 line-clamp-2 min-h-[32px]">{act.title}</h3>
                </div>
                <div className="pt-3 border-t border-slate-100 mt-2 text-[10px] font-semibold text-slate-400 truncate">
                  Sede: {act.location}
                </div>
              </div>
            ))}
            {homeData?.activities.length === 0 && (
              <p className="sm:col-span-3 text-xs text-slate-400 text-center py-8 bg-white border border-gray-200 rounded-xl font-medium">
                No hay actividades agendadas en el calendario cercano.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Info size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider">Información del Proyecto</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-black text-slate-900 tracking-tight">ALIVE MARANATA ADORACIÓN</p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Somos un proyecto ministerial de la Iglesia Adventista del Séptimo Día que busca potenciar y articular el crecimiento de los jóvenes mediante una sana y transparente competencia de fidelidad en grupos pequeños.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-center font-bold text-xs text-indigo-600 italic">
            ¡Unidos de corazón para servir al Señor!
          </div>
        </div>

      </div>

    </div>
  );
};