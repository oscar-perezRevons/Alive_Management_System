import React from 'react';
import { CalendarDays, Clock, MapPin, Layers } from 'lucide-react';

export const ProgramaPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Programa General
        </h1>
        <p className="text-xs text-slate-500 font-medium">Cronograma de actividades sabáticas y distribución del Ministerio Joven</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Layers size={18} className="text-blue-600" /> Estructura General del Sábado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 items-start">
            <Clock size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-xs font-black text-slate-800">Escuela Sabática</h3>
              <p className="text-[11px] text-slate-400 font-semibold">09:00 a.m. - Salón Principal</p>
            </div>
          </div>
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-3 items-start">
            <Clock size={18} className="text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-xs font-black text-slate-800">Culto de Adoración</h3>
              <p className="text-[11px] text-slate-400 font-semibold">10:45 a.m. - Templo Mayor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};