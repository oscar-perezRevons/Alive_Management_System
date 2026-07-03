import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { DashboardHomeData } from '../types';
import { 
  Megaphone, Calendar, Clock, Trophy, Info, 
  Users, Star, RefreshCw, AlertTriangle
} from 'lucide-react';
import logoImage from '../assets/logo.png';

export const DashboardPage: React.FC = () => {
  const [homeData, setHomeData] = useState<DashboardHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fechaHoy = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getHomeData();
      setHomeData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo sincronizar el panel de inicio institucional.');
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-xs">
        <RefreshCw className="animate-spin text-[#0033cc] mb-4" size={32} />
        <p className="text-xs text-slate-400 font-black uppercase tracking-widest animate-pulse">Compilando Entorno Oficial ALIVE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn max-w-7xl mx-auto select-none">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-[#0033cc] tracking-tight flex items-center gap-2">
            <span className="text-3xl font-light text-slate-200">|</span> Panel de Inicio
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Bienvenido al centro neurálgico de operaciones de Alive Maranata Adoración
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl text-xs font-black text-[#0033cc] uppercase tracking-wide shadow-3xs">
          <Calendar size={15} className="text-[#0033cc]" />
          <span>{fechaHoy}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-fadeIn">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div 
        className="rounded-3xl p-8 md:p-12 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 bg-cover bg-center min-h-[240px] group transition-all duration-300"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(10, 31, 107, 0.95) 0%, rgba(0, 51, 204, 0.85) 100%), url('/assets/banner-default.png')` 
        }}
      >
        <div className="space-y-3.5 relative z-10 text-center md:text-left max-w-xl">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
            "Jóvenes adventistas <br />
            al servicio de Cristo"
          </h1>
          <div className="w-16 h-1 bg-amber-400 rounded-full my-2 shadow-sm"></div>
          <p className="text-[10px] font-mono font-black tracking-widest text-blue-200 uppercase">
            Ecosistema de Crecimiento Espiritual y Comunitario
          </p>
        </div>
        
        <div className="w-32 h-32 bg-white/10 border border-white/20 rounded-3xl flex flex-col items-center justify-center text-center p-3 backdrop-blur-md relative z-10 shrink-0 shadow-2xl transition-all duration-300 transform group-hover:scale-105 group-hover:bg-white/15">
          <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">GP</span>
          <div className="w-14 h-14 my-1.5 flex items-center justify-center p-1 bg-white/90 rounded-2xl border border-white/20 shadow-sm">
            <img 
              src={logoImage}
              alt="Shield Asset" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
          <span className="text-[10px] font-black tracking-widest text-white uppercase">JA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-50 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="p-3 bg-blue-500/10 text-[#0033cc] rounded-2xl shrink-0 border border-blue-50"><Users size={20} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">GP Registrados</span>
            <span className="text-base font-black text-slate-900 tracking-tight block">{homeData?.totalGroupsCount || 0} Equipos</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-50 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0 border border-amber-50"><Trophy size={20} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Puntos Totales</span>
            <span className="text-base font-black text-slate-900 tracking-tight block">{(homeData?.totalPointsAccumulated || 0).toLocaleString()} PTS</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-50 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl shrink-0 border border-purple-50"><Star size={20} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">GP Líder del Podio</span>
            <span className="text-base font-black text-purple-700 tracking-tight truncate block uppercase">
              {homeData?.featuredGroup?.name || 'Calculando...'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-50 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0 border border-emerald-50"><Clock size={20} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sincronización</span>
            <button onClick={fetchHomeData} className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-1 border-b border-emerald-200 hover:border-emerald-600 transition-colors cursor-pointer uppercase tracking-wider text-[9px]">
              <RefreshCw size={11} /> Actualizar UI
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-xs overflow-hidden border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <Megaphone size={16} className="text-[#0033cc]" /> Anuncios Oficiales
            </h2>
            <button className="text-xs font-black text-[#0033cc] uppercase tracking-wider hover:underline cursor-pointer">Ver todos</button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {homeData?.announcements.map((announcement) => (
              <div key={announcement.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/30 transition duration-150">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">{announcement.title}</h3>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">{announcement.content}</p>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-3xs font-mono uppercase">
                  <Clock size={12} className="text-slate-400" /> {announcement.timeAgo}
                </span>
              </div>
            ))}
            {(!homeData?.announcements || homeData.announcements.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-16 font-bold italic">No hay comunicados vigentes en la cartelera digital.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-3xl text-white p-6 shadow-md flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none transform scale-150">
            <Trophy size={140} className="fill-current" />
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <Trophy size={18} className="text-amber-400 fill-amber-400/10" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-400">GP Destacado del Mes</h2>
          </div>

          {homeData?.featuredGroup ? (
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md relative z-10 my-4 shadow-inner">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg border-2 border-white/20">
                <Trophy size={26} className="fill-current" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight uppercase text-amber-400">{homeData.featuredGroup.name}</h3>
                <p className="text-xs text-slate-300 font-bold px-2 leading-relaxed">{homeData.featuredGroup.reason}</p>
              </div>
              <div className="inline-block bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-black text-amber-300 tracking-wide">
                Puntaje Consolidado: {homeData.featuredGroup.totalPoints} pts
              </div>
            </div>
          ) : (
            <p className="text-xs text-blue-200/40 text-center py-20 font-bold italic">Evaluando métricas de participación colectiva...</p>
          )}

          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wide pt-4 border-t border-white/5 relative z-10 leading-tight">
            Cálculo automatizado basado en puntualidad, asistencia y misiones cumplidas.
          </p>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-4 flex items-start gap-3 shadow-3xs transition hover:bg-blue-50/80">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <p className="font-black text-[#1e3a8a] uppercase tracking-wider">Soporte Operacional Alive</p>
          <p className="text-slate-500 font-bold leading-relaxed">
            Recuerda que para mantener actualizadas las métricas del ranking en tiempo real, los directores de cada GP deben consolidar las puntuaciones semanales antes del cierre de periodo determinado.
          </p>
        </div>
      </div>

    </div>
  );
};