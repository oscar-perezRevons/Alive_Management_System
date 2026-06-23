import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { DashboardHomeData } from '../types';
import { 
  Megaphone, Calendar, Clock, Trophy, Info, 
  Users, Star, RefreshCw, AlertTriangle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [homeData, setHomeData] = useState<DashboardHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardService.getHomeData();
      setHomeData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo sincronizar el panel de inicio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">Compilando Dashboard Oficial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-slate-800 animate-fadeIn">
      
      {/* MENSAJE DE BIENVENIDA OFICIAL DEL MOCKUP */}
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Inicio
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Bienvenido al sistema de Alive Maranata Adoración
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BANNER PRINCIPAL: IMAGEN REAL CON CAPA TRANSPARENTE AZUL OSCURA */}
      <div 
        className="rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 bg-cover bg-center min-h-[220px]"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(10, 31, 107, 0.95) 0%, rgba(0, 51, 204, 0.8) 100%), url('/assets/banner-default.png')` 
        }}
      >
        <div className="space-y-3 relative z-10 text-center md:text-left max-w-xl">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-white">
            "Jóvenes adventistas" <br />
            al servicio de Cristo."
          </h1>
          <div className="w-16 h-0.5 bg-white/40 my-2"></div>
          <p className="text-[10px] font-mono font-black tracking-widest text-blue-300 uppercase">
            Alive Maranata Adoración
          </p>
        </div>
        
        {/* LOGO EN GRANDE ASOCIADO AL ESCUDO DEL BANNER (CORREGIDO SEGÚN IMAGE_34E1A4) */}
        <div className="w-32 h-32 bg-white/10 border border-white/20 rounded-3xl flex flex-col items-center justify-center text-center p-3 backdrop-blur-md relative z-10 shrink-0 shadow-2xl transition hover:scale-105">
          <span className="text-xs font-black tracking-widest text-blue-200 uppercase">GP</span>
          <div className="w-16 h-16 my-1 flex items-center justify-center">
            <img 
              src="/assets/logo.png" 
              alt="Shield Asset" 
              className="w-full h-full object-contain filter brightness-0 invert" 
            />
          </div>
          <span className="text-xs font-black tracking-widest text-white uppercase">JA</span>
        </div>
      </div>

      {/* METRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><Users size={20} className="stroke-[2.5]" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GP Registrados</span>
            <span className="text-base font-black text-slate-800 tracking-tight">{homeData?.totalGroupsCount || 0} Equipos</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shrink-0"><Trophy size={20} className="stroke-[2.5]" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos Totales</span>
            <span className="text-base font-black text-slate-800 tracking-tight">{(homeData?.totalPointsAccumulated || 0).toLocaleString()} pts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0"><Star size={20} className="stroke-[2.5]" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GP Líder</span>
            <span className="text-base font-black text-slate-800 tracking-tight truncate max-w-[130px] block">
              {homeData?.featuredGroup?.name || 'Calculando...'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><Clock size={20} className="stroke-[2.5]" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sincronización</span>
            <button onClick={fetchHomeData} className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <RefreshCw size={12} /> Actualizado
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN ANUNCIOS Y DETACADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <Megaphone size={16} className="text-blue-600" /> Anuncios Oficiales
            </h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">Ver todos</button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {homeData?.announcements.map((announcement) => (
              <div key={announcement.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/40 transition">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">{announcement.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{announcement.content}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Clock size={12} /> {announcement.timeAgo}
                </span>
              </div>
            ))}
            {(!homeData?.announcements || homeData.announcements.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-12 font-medium">No hay comunicados vigentes en este momento.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-3xl text-white p-6 shadow-xl flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400 fill-amber-400/20" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-400">GP Destacado del Momento</h2>
          </div>

          {homeData?.featuredGroup ? (
            <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
              <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trophy size={26} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight uppercase text-amber-400">{homeData.featuredGroup.name}</h3>
                <p className="text-xs text-slate-300 font-medium px-2">{homeData.featuredGroup.reason}</p>
              </div>
              <div className="inline-block bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300">
                Acumulado: {homeData.featuredGroup.totalPoints} pts
              </div>
            </div>
          ) : (
            <p className="text-xs text-blue-200/50 text-center py-16 font-medium">Evaluando métricas de participación colectiva...</p>
          )}

          <p className="text-[10px] text-slate-400 text-center font-medium pt-4 border-t border-white/5">
            Por su destacada participación, puntualidad en las actividades e integración comunitaria.
          </p>
        </div>
      </div>

    </div>
  );
};