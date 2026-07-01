import React, { useEffect, useState } from 'react';
import { matinalesService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Upload, Download, Users, Shield, Settings2, Trash2, X, Check } from 'lucide-react';

export const MatinalesPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserRole = user?.role || 'USER';

  const [matinales, setMatinales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para el Modal de Configuración
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatinal, setSelectedMatinal] = useState<any | null>(null);
  const [formFields, setFormFields] = useState({
    category: '',
    range: '',
    currentTheme: '',
    responsible: '',
    nextDate: ''
  });

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

  useEffect(() => { fetchMatinales(); }, []);

  const openEditModal = (matinal: any) => {
    setSelectedMatinal(matinal);
    setFormFields({
      category: matinal.category,
      range: matinal.range,
      currentTheme: matinal.currentTheme || '',
      responsible: matinal.responsible,
      nextDate: matinal.nextDate
    });
    setIsModalOpen(true);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatinal) return;

    try {
      await matinalesService.updateInfo(selectedMatinal.id, formFields);
      alert('¡Configuración de la tarjeta actualizada correctamente!');
      setIsModalOpen(false);
      fetchMatinales();
    } catch (err) {
      alert('Error al intentar modificar los datos en el servidor.');
    }
  };

  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await matinalesService.uploadPdf(id, formData);
      alert('¡Folleto devocional indexado correctamente!');
      fetchMatinales();
    } catch (err) {
      alert('Error en el servidor al intentar subir el archivo binario.');
    }
  };

  const handleDeletePdf = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea remover el PDF de este folleto matinal?')) return;

    try {
      await matinalesService.deletePdf(id);
      alert('Archivo PDF purgado de la matinal.');
      fetchMatinales();
    } catch (err) {
      alert('Error al procesar la desvinculación en el servidor.');
    }
  };

  const getAvatarColorClass = (id: number) => {
    if (id % 4 === 1) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (id % 4 === 2) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (id % 4 === 3) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f4f6fc] p-6 min-h-screen relative">
      
      {/* HEADER PRINCIPAL */}
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

      {/* REJILLA DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matinales.map((mat) => (
          <div key={mat.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between gap-4 relative group">
            
            {/* BOTÓN FLOTANTE DE AJUSTES (SOLO ADMIN) */}
            {currentUserRole === 'ADMIN' && (
              <button
                onClick={() => openEditModal(mat)}
                className="absolute top-4 right-4 p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition shadow-xs"
                title="Configurar Tarjeta"
              >
                <Settings2 size={16} />
              </button>
            )}

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getAvatarColorClass(mat.id)}`}>
                <Users size={22} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0 pr-6">
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

            {/* CONTROLES DE ACCIONES */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              
              {/* REMOVER PDF (SOLO ADMIN Y SI EXISTE EL ARCHIVO) */}
              {currentUserRole === 'ADMIN' && mat.pdfUrl && (
                <button
                  onClick={() => handleDeletePdf(mat.id)}
                  className="flex items-center gap-1.5 py-2 px-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase border border-rose-100 hover:bg-rose-100 transition-colors"
                  title="Eliminar PDF de la matinal"
                >
                  <Trash2 size={13} /> Remover
                </button>
              )}

              {/* CARGAR PDF (SOLO ADMIN) */}
              {currentUserRole === 'ADMIN' && (
                <label className="flex items-center gap-1.5 py-2 px-4 bg-blue-50 text-[#002ec4] rounded-xl cursor-pointer text-xs font-black uppercase border border-blue-100 hover:bg-blue-100 transition-colors shadow-2xs">
                  <Upload size={13} /> Cargar PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(mat.id, e)} />
                </label>
              )}

              {/* DESCARGAR (PÚBLICO) */}
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

      {/* MODAL CONFIGURADOR CORPORATIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            
            {/* Cabecera Modal */}
            <div className="bg-[#0033cc] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings2 size={18} />
                <h3 className="font-black text-sm uppercase tracking-wider">Configurar Contenido</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-white/70 hover:text-white rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            {/* Formulario Estilizado */}
            <form onSubmit={handleUpdateInfo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Categoría / Aula</label>
                  <input
                    type="text"
                    required
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    className="w-full text-xs font-black border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-600 uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rango de Edad</label>
                  <input
                    type="text"
                    required
                    value={formFields.range}
                    onChange={(e) => setFormFields({ ...formFields, range: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tema Activo de Lectura</label>
                <input
                  type="text"
                  required
                  value={formFields.currentTheme}
                  onChange={(e) => setFormFields({ ...formFields, currentTheme: e.target.value })}
                  className="w-full text-xs font-medium border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Docente Responsable</label>
                  <input
                    type="text"
                    required
                    value={formFields.responsible}
                    onChange={(e) => setFormFields({ ...formFields, responsible: e.target.value })}
                    className="w-full text-xs font-black border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-600 uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Próxima Fecha Devocional</label>
                  <input
                    type="text"
                    required
                    value={formFields.nextDate}
                    onChange={(e) => setFormFields({ ...formFields, nextDate: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-[#0033cc] text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition shadow-md"
                >
                  <Check size={14} /> Guardar Cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};