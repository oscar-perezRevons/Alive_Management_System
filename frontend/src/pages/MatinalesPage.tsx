import React, { useEffect, useState } from 'react';
import { matinalesService } from '../services/api'; 
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Upload, Download, Users, Shield } from 'lucide-react';

export const MatinalesPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserRole = user?.role || 'USER';

  const [matinales, setMatinales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatinales = async () => {
    try {
      setLoading(true);
      const res = await matinalesService.getAll(); 
      setMatinales(res.data.matinales || []);
    } catch (err) {
      console.error("Error al sincronizar matinales", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMatinales(); 
  }, []);

  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Seleccione un archivo PDF válido.');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await matinalesService.uploadPdf(id, formData); 
      alert('¡Folleto matinal guardado y sincronizado correctamente!');
      fetchMatinales();
    } catch (err) {
      alert('Error en el servidor al intentar subir el archivo.');
    }
  };

  const getAvatarColorClass = (id: number) => {
    if (id === 1) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (id === 2) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (id === 3) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f4f6fc] p-6 min-h-screen">
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div className="text-emerald-600 bg-white p-2.5 rounded-2xl shadow-xs"><BookOpen size={26} /></div>
          <div>
            <h1 className="text-2xl font-black text-[#1e3a8a] tracking-tight">Matinales por Edades</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Distribución Devocional de Aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-100 text-xs font-black uppercase text-slate-500">
          <Shield size={14} className={currentUserRole === 'ADMIN' ? 'text-blue-600' : 'text-slate-400'} />
          Rol asignado: {currentUserRole}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Sincronizando Archivos Devocionales...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matinales.map((mat) => (
          <div key={mat.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getAvatarColorClass(mat.id)}`}>
                <Users size={22} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#1e3a8a] uppercase tracking-tight">{mat.category}</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">{mat.range}</span>
                </div>
                <p className="text-xs text-slate-700 font-black truncate uppercase tracking-tight">
                  Tema activo: <span className="font-medium text-slate-600 italic normal-case">"{mat.currentTheme || 'Lectura Semanal'}"</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Responsable: <span className="text-slate-700 font-black">{mat.responsible}</span></span>
                  <span>Próxima Fecha: <span className="text-slate-700 font-black font-mono">{mat.nextDate}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {currentUserRole === 'ADMIN' && (
                <label className="flex items-center gap-1.5 py-2 px-4 bg-blue-50 text-[#002ec4] rounded-xl cursor-pointer text-xs font-black uppercase border border-blue-100 hover:bg-blue-100 transition-colors">
                  <Upload size={13} /> Cargar PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(mat.id, e)} />
                </label>
              )}
              <a
                href={mat.pdfUrl ? `http://localhost:5000${mat.pdfUrl}` : '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  mat.pdfUrl
                    ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed pointer-events-none'
                }`}
              >
                <Download size={13} /> {mat.pdfUrl ? 'Descargar' : 'No Disponible'}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};