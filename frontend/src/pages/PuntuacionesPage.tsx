import React from 'react';
import { Trophy, PlusCircle, Calendar, ShieldAlert } from 'lucide-react';

export const PuntuacionesPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      {/* Encabezado */}
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Puntuaciones
        </h1>
        <p className="text-xs text-slate-500 font-medium">Asignación transaccional de puntos y penalizaciones por Grupo Pequeño</p>
      </div>

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Simulado */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <PlusCircle size={18} className="text-blue-600" /> Registrar Nueva Puntuación
          </h2>
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Trophy size={36} className="text-slate-300 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-bold text-slate-500">Módulo de Carga en Preparación</p>
            <p className="text-[10px] text-slate-400 mt-1">Aquí se desplegará el listado de miembros con checkboxes para asistencias y misiones.</p>
          </div>
        </div>

        {/* Historial Corto */}
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> Últimos Movimientos
          </h2>
          <div className="text-xs text-slate-400 font-medium py-8 text-center">
            Sincronizando el flujo de auditoría de la base de datos...
          </div>
        </div>
      </div>
    </div>
  );
};