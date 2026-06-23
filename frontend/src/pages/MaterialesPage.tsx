import React from 'react';
import { FolderOpen, FileText, Download } from 'lucide-react';

export const MaterialesPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Materiales Académicos
        </h1>
        <p className="text-xs text-slate-500 font-medium">Repositorio de recursos didácticos, guías de liderazgo y archivos multimedia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <h3 className="text-xs font-black text-slate-800">Reglamento Oficial de Grupos Pequeños</h3>
              <p className="text-[10px] text-slate-400 font-medium">PDF - 2.4 MB</p>
            </div>
          </div>
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"><Download size={16} /></button>
        </div>
      </div>
    </div>
  );
};