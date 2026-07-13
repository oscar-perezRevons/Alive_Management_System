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

  const getCardTheme = (index: number) => {
    const themes = [
      {
        border: 'border-l-[6px] border-l-indigo-600 dark:border-l-indigo-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
        badge: 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20',
        responsibleBadge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40',
        nextDateBadge: 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30',
        btnPrimary: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25',
        btnSecondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-900/40',
        accentText: 'text-indigo-600 dark:text-indigo-400'
      },
      {
        border: 'border-l-[6px] border-l-emerald-600 dark:border-l-emerald-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
        badge: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
        responsibleBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40',
        nextDateBadge: 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30',
        btnPrimary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25',
        btnSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-900/40',
        accentText: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        border: 'border-l-[6px] border-l-fuchsia-600 dark:border-l-fuchsia-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20',
        badge: 'bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20',
        responsibleBadge: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900/40',
        nextDateBadge: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/20 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-100/50 dark:border-fuchsia-900/30',
        btnPrimary: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white shadow-lg shadow-fuchsia-500/25',
        btnSecondary: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-100 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/40 dark:text-fuchsia-400 dark:border-fuchsia-900/40',
        accentText: 'text-fuchsia-600 dark:text-fuchsia-400'
      },
      {
        border: 'border-l-[6px] border-l-rose-600 dark:border-l-rose-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-rose-600 text-white shadow-md shadow-rose-600/20',
        badge: 'bg-rose-600 text-white shadow-sm shadow-rose-500/20',
        responsibleBadge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40',
        nextDateBadge: 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30',
        btnPrimary: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25',
        btnSecondary: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-400 dark:border-rose-900/40',
        accentText: 'text-rose-600 dark:text-rose-400'
      },
      {
        border: 'border-l-[6px] border-l-amber-600 dark:border-l-amber-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-amber-600 text-white shadow-md shadow-amber-600/20',
        badge: 'bg-amber-600 text-white shadow-sm shadow-amber-500/20',
        responsibleBadge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40',
        nextDateBadge: 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30',
        btnPrimary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25',
        btnSecondary: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 dark:text-amber-400 dark:border-amber-900/40',
        accentText: 'text-amber-600 dark:text-amber-400'
      }
    ];
    return themes[index % themes.length];
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f0f2fc] p-4 sm:p-6 min-h-screen relative selection:bg-fuchsia-500 selection:text-white transition-colors duration-300">
      
      {/* HEADER PREMIUM */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-lg z-20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        
        <div className="flex items-center gap-3.5 pt-1">
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-fuchsia-500/25">
              <BookOpen size={28} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-fuchsia-600">
              Matinales por Edades
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Distribución Devocional de Aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm text-[11px] font-black uppercase tracking-wider text-indigo-600">
          <Shield size={14} className={currentUserRole === 'ADMIN' ? 'text-indigo-600 animate-pulse' : 'text-slate-400'} />
          Módulo: <span className={currentUserRole === 'ADMIN' ? 'text-indigo-700' : 'text-slate-700'}>{currentUserRole}</span>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando registros devocionales...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matinales.map((mat, idx) => {
          const theme = getCardTheme(idx);
          return (
            <div 
              key={mat.id} 
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-5 relative group overflow-hidden ${theme.border}`}
            >
              <div className="absolute -right-6 -bottom-6 text-slate-100 dark:text-slate-800/20 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <BookOpen size={140} />
              </div>

              {currentUserRole === 'ADMIN' && (
                <button
                  onClick={() => openEditModal(mat)}
                  className="absolute top-5 right-5 z-30 p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl border border-slate-200/40 dark:border-slate-700 transition-all duration-200 shadow-sm hover:scale-110"
                  title="Configurar Tarjeta"
                >
                  <SlidersHorizontal size={16} />
                </button>
              )}

              <div className="flex items-start gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-transparent ${theme.avatar}`}>
                  <Users size={24} />
                </div>
                <div className="space-y-3 flex-1 min-w-0 pr-6">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{mat.category}</h3>
                    <span className={`text-[10px] ${theme.badge} shadow-sm px-2.5 py-1 rounded-lg font-black tracking-wide uppercase`}>
                      {mat.range}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-inner relative overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tema Activo</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300 italic mt-0.5 relative z-10">
                      "{mat.currentTheme || 'Lectura Semanal Regular'}"
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-[10px] font-black uppercase tracking-widest">
                    <span className={`px-2.5 py-1.5 rounded-lg ${theme.responsibleBadge}`}>Responsable: <span className="font-extrabold">{mat.responsible}</span></span>
                    <span className={`px-2.5 py-1.5 rounded-lg ${theme.nextDateBadge}`}>Próxima: <span className="font-extrabold font-mono">{mat.nextDate}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                
                {currentUserRole === 'ADMIN' && mat.pdfUrl && (
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => requestDeletePdf(mat.id)}
                    className="flex items-center gap-1.5 py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider border border-rose-100 dark:border-rose-900/40 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                )}

                {currentUserRole === 'ADMIN' && (
                  <label className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm border ${theme.btnSecondary} ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload size={14} /> {actionLoading === `upload-${mat.id}` ? 'Subiendo...' : 'Cargar PDF'}
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(mat.id, e)} />
                  </label>
                )}

                <a
                  href={mat.pdfUrl ? `http://localhost:5000${mat.pdfUrl}` : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${
                    mat.pdfUrl
                      ? `${theme.btnPrimary} border-transparent shadow-lg hover:scale-[1.03]`
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <Download size={14} /> {mat.pdfUrl ? 'Descargar PDF' : 'No Disponible'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 text-center space-y-6 shadow-2xl border border-slate-200/50 dark:border-slate-800 transform scale-100 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-orange-500" />
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-500/20 dark:to-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center shadow-inner ring-4 ring-rose-50 dark:ring-rose-500/10 relative">
              <HelpCircle size={32} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-rose-300/50 dark:border-rose-500/30"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 dark:from-rose-400 dark:to-orange-400 uppercase tracking-tight">¿Remover Material?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-2">
                ¿Estás completamente seguro de que deseas purgar el folleto activo de esta matinal?
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, matinalId: null })}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePdf}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-95"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden transform transition-all duration-300">
            
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/30">
                  <SlidersHorizontal size={20} />
                </div>
                <h3 className="font-black text-lg uppercase tracking-wider">Configurar Contenido</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl text-white/90 hover:text-white transition-all active:scale-90 relative z-10">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateInfo} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Categoría / Aula</label>
                  <input
                    type="text"
                    required
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    className="w-full text-sm font-black bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 uppercase transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Rango de Edad</label>
                  <input
                    type="text"
                    required
                    value={formFields.range}
                    onChange={(e) => setFormFields({ ...formFields, range: e.target.value })}
                    className="w-full text-sm font-black bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Tema Activo de Lectura</label>
                <input
                  type="text"
                  required
                  value={formFields.currentTheme}
                  onChange={(e) => setFormFields({ ...formFields, currentTheme: e.target.value })}
                  className="w-full text-sm font-bold bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-900 dark:text-indigo-200 border-2 border-indigo-200 dark:border-indigo-700/50 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Docente Responsable</label>
                  <input
                    type="text"
                    required
                    value={formFields.responsible}
                    onChange={(e) => setFormFields({ ...formFields, responsible: e.target.value })}
                    className="w-full text-sm font-black bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 uppercase transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Próxima Fecha Devocional</label>
                  <input
                    type="text"
                    required
                    value={formFields.nextDate}
                    onChange={(e) => setFormFields({ ...formFields, nextDate: e.target.value })}
                    className="w-full text-sm font-black font-mono bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                <button
                  type="button"
                  disabled={actionLoading === 'update'}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'update'}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 disabled:opacity-50"
                >
                  <Check size={16} /> {actionLoading === 'update' ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};