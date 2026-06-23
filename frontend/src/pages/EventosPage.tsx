import React from 'react';
import { Users, Sparkles, Map } from 'lucide-react';

export const EventosPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Eventos Especiales
        </h1>
        <p className="text-xs text-slate-500 font-medium">Calendario anual de congresos, campamentos y proyectos comunitarios</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-3">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Sparkles size={24} />
        </div>
        <div className="max-w-sm mx-auto space-y-1">
          <h3 className="text-sm font-black text-slate-800">Próximos Grandes Eventos</h3>
          <p className="text-xs text-slate-400 font-medium">Las comisiones ministeriales están coordinando las fechas de los próximos macroprogramas jóvenes.</p>
        </div>
      </div>
    </div>
  );
};