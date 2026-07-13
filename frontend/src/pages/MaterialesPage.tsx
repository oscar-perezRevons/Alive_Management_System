import React from 'react';
import { FileText, Download, BookOpen, Video, Image, Link2, ExternalLink, Star, Shield, Layers } from 'lucide-react';

const materiales = [
  {
    id: 1,
    title: 'Reglamento Oficial de Grupos Pequeños',
    description: 'Normas, estatutos y procedimientos operativos del sistema de GPs.',
    type: 'PDF',
    size: '2.4 MB',
    category: 'Reglamentos',
    icon: FileText,
    color: 'indigo',
    featured: true,
    url: '#'
  },
  {
    id: 2,
    title: 'Guía de Liderazgo Efectivo',
    description: 'Manual práctico para líderes de grupos pequeños y directores de área.',
    type: 'PDF',
    size: '5.1 MB',
    category: 'Liderazgo',
    icon: BookOpen,
    color: 'violet',
    featured: false,
    url: '#'
  },
  {
    id: 3,
    title: 'Presentación Ciclo Sabático 2026',
    description: 'Diapositivas y recursos del ciclo operativo vigente del trimestre.',
    type: 'PPTX',
    size: '8.7 MB',
    category: 'Presentaciones',
    icon: Layers,
    color: 'fuchsia',
    featured: false,
    url: '#'
  },
  {
    id: 4,
    title: 'Video Tutorial: Uso del Sistema',
    description: 'Walkthrough completo del sistema de gestión colectiva para nuevos usuarios.',
    type: 'VIDEO',
    size: '124 MB',
    category: 'Capacitación',
    icon: Video,
    color: 'emerald',
    featured: false,
    url: '#'
  },
  {
    id: 5,
    title: 'Recursos Gráficos Institucionales',
    description: 'Logos, paletas de colores y plantillas de comunicación oficial.',
    type: 'ZIP',
    size: '18.3 MB',
    category: 'Diseño',
    icon: Image,
    color: 'amber',
    featured: false,
    url: '#'
  },
  {
    id: 6,
    title: 'Directorio de Recursos Externos',
    description: 'Colección de enlaces y referencias a plataformas y estudios bíblicos.',
    type: 'LINK',
    size: '-',
    category: 'Referencias',
    icon: Link2,
    color: 'rose',
    featured: false,
    url: '#'
  }
];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; shadow: string; btnBg: string; borderLeft: string }> = {
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    shadow: 'shadow-indigo-500/20',
    btnBg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100',
    borderLeft: 'border-l-indigo-600'
  },
  violet: {
    bg: 'bg-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-100',
    badge: 'bg-violet-50 text-violet-700 border border-violet-100',
    shadow: 'shadow-violet-500/20',
    btnBg: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100',
    borderLeft: 'border-l-violet-600'
  },
  fuchsia: {
    bg: 'bg-fuchsia-600',
    text: 'text-fuchsia-600',
    border: 'border-fuchsia-100',
    badge: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100',
    shadow: 'shadow-fuchsia-500/20',
    btnBg: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border-fuchsia-100',
    borderLeft: 'border-l-fuchsia-600'
  },
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    shadow: 'shadow-emerald-500/20',
    btnBg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100',
    borderLeft: 'border-l-emerald-600'
  },
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-100',
    badge: 'bg-amber-50 text-amber-700 border border-amber-100',
    shadow: 'shadow-amber-500/20',
    btnBg: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100',
    borderLeft: 'border-l-amber-500'
  },
  rose: {
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    border: 'border-rose-100',
    badge: 'bg-rose-50 text-rose-700 border border-rose-100',
    shadow: 'shadow-rose-500/20',
    btnBg: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100',
    borderLeft: 'border-l-rose-600'
  }
};

export const MaterialesPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans bg-[#f0f2fc] min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* HEADER PREMIUM */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 via-pink-500 to-orange-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite' }} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 pt-7">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-violet-500/30">
                <FileText size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">
                Materiales Académicos
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Repositorio de recursos didácticos e institucionales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-[11px] font-black uppercase tracking-wider text-indigo-600">
            <Shield size={13} className="animate-pulse" />
            Sistema de Archivos
          </div>
        </div>
      </div>

      {/* STATS CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Documentos', value: '6', icon: FileText, color: 'from-indigo-500 to-violet-500' },
          { label: 'PDFs', value: '2', icon: FileText, color: 'from-violet-500 to-fuchsia-500' },
          { label: 'Multimedia', value: '2', icon: Video, color: 'from-fuchsia-500 to-pink-500' },
          { label: 'Destacados', value: '1', icon: Star, color: 'from-amber-400 to-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} shadow-md mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-black text-slate-800">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* GRID DE MATERIALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {materiales.map((mat) => {
          const theme = colorMap[mat.color];
          const IconComp = mat.icon;
          return (
            <div
              key={mat.id}
              className={`bg-white rounded-3xl p-5 border-t border-r border-b border-l-[5px] ${theme.borderLeft} border-slate-200/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}
            >
              {mat.featured && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  <Star size={9} fill="currentColor" /> Destacado
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={`${theme.bg} p-3 rounded-2xl shadow-md ${theme.shadow} shrink-0`}>
                  <IconComp size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${theme.badge}`}>{mat.type}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">{mat.category}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">{mat.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed line-clamp-2">{mat.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{mat.size}</span>
                <a
                  href={mat.url}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${theme.btnBg} hover:scale-[1.03] shadow-sm`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {mat.type === 'LINK' ? <ExternalLink size={13} /> : <Download size={13} />}
                  {mat.type === 'LINK' ? 'Abrir' : 'Descargar'}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};