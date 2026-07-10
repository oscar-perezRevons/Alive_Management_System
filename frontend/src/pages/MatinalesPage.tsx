import React, { useEffect, useState, useCallback } from 'react';
import { matinalesService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  BookOpen, Upload, Download, Users, Shield, 
  SlidersHorizontal, Trash2, X, Check, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';

export const MatinalesPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserRole = user?.role || 'USER';

  const [matinales, setMatinales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatinal, setSelectedMatinal] = useState<any | null>(null);
  const [formFields, setFormFields] = useState({
    category: '',
    range: '',
    currentTheme: '',
    responsible: '',
    nextDate: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    matinalId: number | null;
  }>({
    isOpen: false,
    matinalId: null
  });

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const triggerNotification = useCallback((title: string, message: string, type: 'success' | 'error') => {
    setNotification({ isOpen: true, title, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isOpen: false }));
    }, 4000);
  }, []);

  const fetchMatinales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await matinalesService.getAll();
      setMatinales(res.data.matinales || []);
    } catch (err) {
      triggerNotification('Error de Sincronización', 'No se pudieron recuperar las categorías devocionales.', 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => { 
    fetchMatinales(); 
  }, [fetchMatinales]);

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
      setActionLoading('update');
      await matinalesService.updateInfo(selectedMatinal.id, formFields);
      setIsModalOpen(false);
      triggerNotification('¡Actualización Exitosa!', 'Los datos de la categoría fueron consolidados en el servidor.', 'success');
      fetchMatinales(); 
    } catch (err) {
      triggerNotification('Error de Guardado', 'No se pudieron almacenar los cambios del formulario.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      triggerNotification('Archivo Inválido', 'Por favor, introduce únicamente documentos con extensión .pdf', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      setActionLoading(`upload-${id}`);
      await matinalesService.uploadPdf(id, formData);
      triggerNotification('Documento Vinculado', 'El folleto devocional PDF fue indexado de forma correcta.', 'success');
      fetchMatinales();
    } catch (err) {
      triggerNotification('Fallo de Carga', 'El servidor rechazó el procesamiento del binario.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeletePdf = (id: number) => {
    setDeleteConfirm({ isOpen: true, matinalId: id });
  };

  const confirmDeletePdf = async () => {
    const id = deleteConfirm.matinalId;
    if (!id) return;

    try {
      setActionLoading(`delete-${id}`);
      setDeleteConfirm({ isOpen: false, matinalId: null });
      await matinalesService.deletePdf(id);
      triggerNotification('Archivo Removido', 'El material de lectura ha sido desvinculado con éxito.', 'success');
      fetchMatinales();
    } catch (err) {
      triggerNotification('Error de Eliminación', 'No se pudo completar la purga física del documento.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getAvatarColorClass = (id: number) => {
    if (id % 4 === 1) return 'bg-indigo-50 text-indigo-600 border-indigo-100/70';
    if (id % 4 === 2) return 'bg-emerald-50 text-emerald-600 border-emerald-100/70';
    if (id % 4 === 3) return 'bg-purple-50 text-purple-600 border-purple-100/70';
    return 'bg-rose-50 text-rose-600 border-rose-100/70';
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f4f6fc] p-4 sm:p-6 min-h-screen relative selection:bg-indigo-500 selection:text-white">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 p-2 rounded-2xl backdrop-blur-xs">
        <div className="flex items-center gap-3.5">
          <div className="text-emerald-600 bg-white p-3 rounded-2xl shadow-md border border-slate-100/80 transform hover:rotate-6 transition-transform duration-300">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight bg-gradient-to-r from-[#1e1b4b] to-indigo-700 bg-clip-text text-transparent">
              Matinales por Edades
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Distribución Devocional de Aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-xs text-[11px] font-black uppercase tracking-wider text-slate-500">
          <Shield size={14} className={currentUserRole === 'ADMIN' ? 'text-indigo-600 animate-pulse' : 'text-slate-400'} />
          Módulo: <span className={currentUserRole === 'ADMIN' ? 'text-indigo-600' : 'text-slate-700'}>{currentUserRole}</span>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando registros devocionales...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matinales.map((mat) => (
          <div 
            key={mat.id} 
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-5 relative group overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 text-slate-50/40 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <BookOpen size={140} />
            </div>

            {currentUserRole === 'ADMIN' && (
              <button
                onClick={() => openEditModal(mat)}
                className="absolute top-5 right-5 z-30 p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200/40 transition-all duration-200 shadow-2xs hover:scale-110 cursor-pointer pointer-events-auto"
                title="Configurar Tarjeta"
              >
                <SlidersHorizontal size={16} />
              </button>
            )}

            <div className="flex items-start gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${getAvatarColorClass(mat.id)} shadow-2xs`}>
                <Users size={24} />
              </div>
              <div className="space-y-2 flex-1 min-w-0 pr-6">
                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="text-lg font-black text-[#1e1b4b] uppercase tracking-tight truncate">{mat.category}</h3>
                  <span className="text-[10px] bg-slate-100 border border-slate-200/40 text-slate-500 px-2.5 py-0.5 rounded-lg font-extrabold tracking-wide">
                    {mat.range}
                  </span>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tema Activo</p>
                  <p className="text-xs font-bold text-slate-700 italic mt-0.5">
                    "{mat.currentTheme || 'Lectura Semanal Regular'}"
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="bg-white px-2 py-1 rounded-md border border-slate-100">Responsable: <span className="text-slate-700 font-black">{mat.responsible}</span></span>
                  <span className="bg-white px-2 py-1 rounded-md border border-slate-100">Próxima Fecha: <span className="text-indigo-600 font-black font-mono">{mat.nextDate}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100/80 relative z-10">
              
              {currentUserRole === 'ADMIN' && mat.pdfUrl && (
                <button
                  disabled={actionLoading !== null}
                  onClick={() => requestDeletePdf(mat.id)}
                  className="flex items-center gap-1.5 py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider border border-rose-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Remover
                </button>
              )}

              {currentUserRole === 'ADMIN' && (
                <label className={`flex items-center gap-1.5 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-[#3730a3] rounded-xl cursor-pointer text-xs font-black uppercase tracking-wider border border-indigo-100 transition-all duration-200 active:scale-95 ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={13} /> {actionLoading === `upload-${mat.id}` ? 'Subiendo...' : 'Cargar PDF'}
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(mat.id, e)} />
                </label>
              )}

              <a
                href={mat.pdfUrl ? `http://localhost:5000${mat.pdfUrl}` : '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${
                  mat.pdfUrl
                    ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed pointer-events-none'
                }`}
              >
                <Download size={13} /> {mat.pdfUrl ? 'Descargar' : 'No Disponible'}
              </a>
            </div>
          </div>
        ))}
      </div>

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 transform scale-100 transition-transform duration-300">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 shadow-2xs">
              <HelpCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">¿Remover Material?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ¿Estás completamente seguro de que deseas purgar el folleto activo de esta matinal?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, matinalId: null })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePdf}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-rose-600/10"
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-start gap-3.5 animate-slideUp">
          <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-sm font-black text-slate-900 tracking-tight">{notification.title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
            
            <div className="bg-[#4f46e5] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} />
                <h3 className="font-black text-sm uppercase tracking-wider">Configurar Contenido</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateInfo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Categoría / Aula</label>
                  <input
                    type="text"
                    required
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    className="w-full text-xs font-black border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-600 uppercase transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rango de Edad</label>
                  <input
                    type="text"
                    required
                    value={formFields.range}
                    onChange={(e) => setFormFields({ ...formFields, range: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
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
                  className="w-full text-xs font-medium border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
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
                    className="w-full text-xs font-black border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-600 uppercase transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Próxima Fecha Devocional</label>
                  <input
                    type="text"
                    required
                    value={formFields.nextDate}
                    onChange={(e) => setFormFields({ ...formFields, nextDate: e.target.value })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={actionLoading === 'update'}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'update'}
                  className="flex items-center gap-1 px-5 py-2 bg-[#4f46e5] text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition shadow-md shadow-indigo-700/10 disabled:opacity-50"
                >
                  <Check size={14} /> {actionLoading === 'update' ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};