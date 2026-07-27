import React, { useEffect, useState, useRef } from 'react';
import { scoreService, secretariaService } from '../services/api';
import { 
  Trophy, BarChart3, AlertTriangle, RefreshCw, Star, Shield,
  Clock, ShieldAlert, PlusCircle, CheckCircle2, ListFilter, 
  HelpCircle, Users, X, Layers, Plus, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, Zap
} from 'lucide-react';
import { Loader } from '../components/Loader';

export const PuntuacionesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OPERACIONES' | 'MATRIZ'>('OPERACIONES');
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  
  const scrollCategoriesLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollCategoriesRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };
  
  const [kpis, setKpis] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [penaltyHistory, setPenaltyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [observation, setObservation] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number, name: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number, name: string } | null>(null);
  const [viewingCategory, setViewingCategory] = useState<any | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ id: number, name: string, points: number } | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<{ id: number, name: string } | null>(null);
  const [selectedCategoryIdForActivity, setSelectedCategoryIdForActivity] = useState<number | ''>('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityPoints, setNewActivityPoints] = useState('');
  const [penaltyForm, setPenaltyForm] = useState({ groupId: '', reason: '', points: '', date: new Date().toISOString().split('T')[0] });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  const [showCalendar, setShowCalendar] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'gp' | 'cat' | 'act' | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (scoreDate) {
      const parts = scoreDate.split('-');
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [scoreDate]);

  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const DAYS_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} de ${MONTHS_ES[month]} de ${year}`;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleMonthChange = (offset: number) => {
    let nextMonth = currentMonth + offset;
    let nextYear = currentYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const loadAllModuleData = async () => {
    try {
      setRefreshing(true);
      setError('');
      const [resKpis, resCats, resGroups, resScores, resPenalties] = await Promise.all([
        scoreService.getKpis(),
        scoreService.getCategories(),
        secretariaService.getAllGroups(),
        scoreService.getScoresHistory(),
        scoreService.getPenaltiesHistory()
      ]);
      setKpis(resKpis.data);
      setCategories(resCats.data);
      setGroups(resGroups.data);
      setScoreHistory(resScores.data);
      setPenaltyHistory(resPenalties.data);
    } catch (err) {
      setError('Fallo de red al sincronizar el servidor de puntuaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAllModuleData(); }, []);

  const handleCategoryChange = (catId: number) => {
    setSelectedCategory(catId);
    setSelectedActivity(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategory) {
        await scoreService.updateCategory(editingCategory.id, { name: newCategoryName.trim() });
        showAlert('success', '¡Categoría Actualizada!', 'El nombre de la columna se ha modificado.');
      } else {
        await scoreService.createCategory({ name: newCategoryName.trim() });
        showAlert('success', '¡Categoría Creada!', 'La nueva columna se ha indexado correctamente en la matriz.');
      }
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setEditingCategory(null);
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', editingCategory ? 'No se pudo actualizar la categoría.' : 'No se pudo guardar la categoría.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await scoreService.deleteCategory(categoryToDelete.id);
      showAlert('success', '¡Categoría Eliminada!', 'La categoría ha sido eliminada correctamente.');
      setCategoryToDelete(null);
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo eliminar la categoría. Es posible que existan subcriterios vinculados a ella.');
    }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      await scoreService.updateActivity(editingActivity.id, { name: editingActivity.name, points: editingActivity.points });
      showAlert('success', '¡Subcriterio Actualizado!', 'El criterio ha sido modificado correctamente.');
      setEditingActivity(null);
      const refreshed = await scoreService.getCategories();
      const updatedCat = (refreshed.data as any[]).find((c: any) => c.id === viewingCategory?.id);
      if (updatedCat) setViewingCategory(updatedCat);
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo actualizar el subcriterio.');
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      await scoreService.deleteActivity(activityToDelete.id);
      showAlert('success', '¡Subcriterio Eliminado!', 'El criterio ha sido eliminado de la categoría.');
      setActivityToDelete(null);
      const refreshed = await scoreService.getCategories();
      const updatedCat = (refreshed.data as any[]).find((c: any) => c.id === viewingCategory?.id);
      if (updatedCat) setViewingCategory(updatedCat);
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo eliminar el subcriterio.');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryIdForActivity || !newActivityName.trim() || !newActivityPoints) return;
    try {
      await scoreService.createActivity({
        categoryId: Number(selectedCategoryIdForActivity),
        name: newActivityName.trim(),
        points: Number(newActivityPoints)
      });
      setIsActivityModalOpen(false);
      setNewActivityName('');
      setNewActivityPoints('');
      showAlert('success', 'Criterio Añadido', 'El logro y su puntaje ya están disponibles para calificar.');
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo registrar el subcriterio.');
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedActivity) {
      showAlert('error', 'Campos Incompletos', 'Por favor selecciona el grupo pequeño y el criterio de puntuación.');
      return;
    }
    try {
      await scoreService.registerScore({
        groupId: parseInt(selectedGroup),
        activityId: selectedActivity.id,
        points: selectedActivity.points,
        date: scoreDate,
        observation
      });
      showAlert('success', '¡Puntuación Asignada!', `Se han abonado +${selectedActivity.points} puntos de manera automática.`);
      setObservation('');
      setSelectedActivity(null);
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error Operativo', 'No se pudo guardar la puntuación.');
    }
  };

  const handlePenaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.groupId || !penaltyForm.reason || !penaltyForm.points) return;
    try {
      await scoreService.registerPenalty({
        groupId: parseInt(penaltyForm.groupId),
        reason: penaltyForm.reason,
        points: parseInt(penaltyForm.points),
        date: penaltyForm.date
      });
      setIsPenaltyModalOpen(false);
      showAlert('success', 'Penalización Registrada', 'Se ha restado la puntuación al acumulado del grupo.');
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'Fallo al procesar el descuento.');
    }
  };

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-sans text-slate-800 dark:text-slate-200 bg-[#f4f6fc] dark:bg-[#090d1a] px-2 sm:px-6 py-4 min-h-screen transition-colors duration-300">
      
      {/* ═══════ HEADER CON GRADIENTE ANIMADO ═══════ */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg transition-all duration-300 z-20 overflow-hidden">
        {/* Barra de gradiente animada superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 via-pink-500 via-amber-400 to-emerald-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite'}} />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-indigo-500/25">
              <Trophy size={22} className="stroke-[2.5] text-white sm:w-6 sm:h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">🏆 Puntuaciones</h1>
            <p className="text-[10px] sm:text-xs text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 font-black uppercase tracking-wider">Sistema Oficial de Puntos</p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex bg-slate-100/80 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button 
            onClick={() => setActiveTab('OPERACIONES')}
            className={`flex-1 sm:flex-none text-center px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-300 uppercase tracking-wider cursor-pointer ${activeTab === 'OPERACIONES' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-violet-600 dark:hover:text-indigo-400'}`}
          >
            ⚡ Panel Operativo
          </button>
          <button 
            onClick={() => setActiveTab('MATRIZ')}
            className={`flex-1 sm:flex-none text-center px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-300 uppercase tracking-wider cursor-pointer ${activeTab === 'MATRIZ' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-violet-600 dark:hover:text-indigo-400'}`}
          >
            📊 Matriz Criterios
          </button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fadeIn">
          {/* GP Registrados */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-l-4 border-l-emerald-500 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-emerald-500/15 transition-all duration-300 flex items-center gap-3.5 sm:gap-4 hover:-translate-y-0.5 group">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0"><Users size={20} /></div>
            <div><span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">GP Registrados</span><span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{kpis.totalGroups} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Equipos</span></span></div>
          </div>
          {/* Puntos Totales */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-l-4 border-l-amber-500 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-amber-500/15 transition-all duration-300 flex items-center gap-3.5 sm:gap-4 sm:col-span-2 hover:-translate-y-0.5 group">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-2xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0"><Star size={20} className="fill-white/30" /></div>
            <div><span className="text-[9px] sm:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">⭐ Puntos Totales Acumulados</span><span className="text-xl sm:text-2xl font-mono font-black text-slate-800 dark:text-white">{kpis.totalPointsAccumulated.toLocaleString()} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">pts</span></span></div>
          </div>
          {/* GP Líder */}
          <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-l-4 border-l-violet-500 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-violet-500/15 transition-all duration-300 flex items-center gap-3.5 sm:gap-4 hover:-translate-y-0.5 group overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-violet-500 to-purple-700 text-white rounded-2xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0"><Trophy size={20} /></div>
            <div className="relative z-10"><span className="text-[9px] sm:text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider block">👑 GP Líder Actual</span><span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 block uppercase tracking-tight">GP {kpis.leaderGroupName}</span><span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-mono font-black">{kpis.leaderGroupPoints} puntos</span></div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-450 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
      )}

      {refreshing && (
        <div className="text-right text-[10px] text-indigo-650 dark:text-indigo-400 font-bold flex items-center justify-end gap-1 px-1">
          <RefreshCw size={12} className="animate-spin" /> Sincronizando en tiempo real...
        </div>
      )}

      {activeTab === 'MATRIZ' && (
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/20"><ListFilter size={16} /></div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">📋 Categorías de Puntuación</h2>
                <p className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold">Configura dinámicamente las columnas de puntuación sabática</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              {/* Botones de navegación deslizable (Deslizar izquierda/derecha) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <button 
                  type="button"
                  onClick={scrollCategoriesLeft}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer shadow-xs"
                  title="Deslizar hacia la izquierda"
                >
                  <ChevronLeft size={16} className="stroke-[3]" />
                </button>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1.5 select-none hidden xs:inline">
                  Deslizar
                </span>
                <button 
                  type="button"
                  onClick={scrollCategoriesRight}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 rounded-lg transition-all duration-200 active:scale-90 cursor-pointer shadow-xs"
                  title="Deslizar hacia la derecha"
                >
                  <ChevronRight size={16} className="stroke-[3]" />
                </button>
              </div>

              <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:scale-105 hover:-translate-y-0.5">
                <Plus size={14} className="stroke-[3]" /> Nueva Categoría
              </button>
            </div>
          </div>

          {/* Indicador visual de deslizamiento en pantallas móviles */}
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-3.5 py-2 rounded-xl shadow-xs">
            <button 
              type="button"
              onClick={scrollCategoriesLeft} 
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} className="animate-pulse stroke-[3]" />
              <span>Volver a la izquierda</span>
            </button>
            <span className="text-[9px] text-slate-400 font-bold hidden sm:inline">Desliza para explorar categorías</span>
            <button 
              type="button"
              onClick={scrollCategoriesRight} 
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer transition-colors"
            >
              <span>Deslizar a la derecha</span>
              <ChevronRight size={14} className="animate-pulse stroke-[3]" />
            </button>
          </div>

          <div ref={categoryScrollRef} className="overflow-x-auto pb-4 border-transparent select-text scrollbar-none [&::-webkit-scrollbar]:hidden scroll-smooth">
            <div className="flex gap-4 min-w-[1100px] items-stretch">
              {categories.map((cat, idx) => {
                const colColors = ['from-violet-500 to-indigo-500', 'from-fuchsia-500 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-cyan-400 to-blue-500', 'from-rose-400 to-red-500'];
                const borderColor = colColors[idx % colColors.length];
                return (
                <div key={cat.id} className="w-64 bg-slate-50/60 dark:bg-slate-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-0 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                  <div className={`h-1.5 bg-gradient-to-r ${borderColor}`} />
                  <div className="p-4 space-y-4 flex flex-col flex-1 relative">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingCategory(cat)} className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-md transition-colors" title="Ver Criterios"><Eye size={13} /></button>
                      <button onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); setIsCategoryModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Editar Categoría"><Edit2 size={13} /></button>
                      <button onClick={() => setCategoryToDelete({ id: cat.id, name: cat.name })} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors" title="Eliminar Categoría"><Trash2 size={13} /></button>
                    </div>
                    <div className="text-center space-y-1">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r ${borderColor} text-white text-[11px] font-black shadow-md mb-1`}>{idx + 1}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide block">{cat.name}</span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Bloque Operativo</p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm flex-1">
                      {cat.activities?.map((act: any) => (
                        <div key={act.id} className="p-3 flex justify-between items-center text-xs font-bold hover:bg-violet-50/40 dark:hover:bg-violet-950/15 transition-all">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[140px]">{act.name}</span>
                          <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black font-mono text-xs px-2 py-0.5 rounded-lg">+{act.points}</span>
                        </div>
                      ))}
                      {(!cat.activities || cat.activities.length === 0) && (
                        <div className="p-4 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">Sin criterios agregados.</div>
                      )}
                    </div>
                    
                    {/* Footer actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setViewingCategory(cat)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 font-black uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        <Eye size={11} /> Ver todo
                      </button>
                      <button
                        onClick={() => { setSelectedCategoryIdForActivity(cat.id); setIsActivityModalOpen(true); }}
                        className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 font-black uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        <Plus size={11} /> Añadir
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OPERACIONES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start animate-fadeIn relative z-20">
          
          {/* ═══════ RANKING GENERAL CARD ═══════ */}
          <div className="lg:col-span-12 xl:col-span-3 bg-white dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition duration-300 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            <div className="p-3.5 sm:p-4 border-b border-slate-150 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-amber-50/30 dark:from-slate-950/50 dark:to-amber-950/10 flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white shadow-md shadow-amber-500/20"><BarChart3 size={13} /></div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">🏅 Ranking General</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                const sorted = [...groups].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                const maxPts = sorted[0]?.totalPoints || 1;
                return sorted.map((g, index) => {
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                  const barColor = index === 0 ? 'from-amber-400 to-yellow-500' : index === 1 ? 'from-slate-300 to-slate-400' : index === 2 ? 'from-amber-600 to-orange-500' : 'from-violet-400 to-indigo-500';
                  const pct = Math.max(8, ((g.totalPoints || 0) / maxPts) * 100);
                  return (
                  <div key={g.id} className={`p-3.5 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all relative ${index < 3 ? 'bg-gradient-to-r from-transparent to-amber-50/20 dark:to-amber-950/5' : ''}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black shadow-md shrink-0 ${
                          index === 0 
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-white border-2 border-amber-300' 
                            : index === 1 
                              ? 'bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-900 border-2 border-slate-200' 
                              : index === 2 
                                ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white border-2 border-orange-400' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                        }`}>{index + 1}</span>
                        <div className="flex items-center gap-1.5 truncate">
                          {medal && <span className="text-base shrink-0">{medal}</span>}
                          <Shield size={14} className={`shrink-0 ${
                            index === 0 
                              ? 'text-amber-500 fill-amber-300 dark:fill-amber-500/20 animate-pulse' 
                              : index === 1 
                                ? 'text-slate-400 fill-slate-200 dark:fill-slate-700/20' 
                                : index === 2 
                                  ? 'text-amber-600 fill-amber-200 dark:fill-amber-600/20' 
                                  : 'text-slate-300 dark:text-slate-600'
                          }`} />
                          <span className="text-slate-800 dark:text-slate-200 font-black tracking-tight uppercase text-xs sm:text-sm truncate">GP {g.name}</span>
                        </div>
                      </div>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm sm:text-base shrink-0 ml-2">{g.totalPoints?.toLocaleString() || 0}</span>
                    </div>
                    {/* Barra de progreso */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`} style={{width: `${pct}%`}} />
                    </div>
                  </div>
                )});
              })()}
            </div>
          </div>

          {/* ═══════ FORMULARIO REGISTRAR PUNTUACIÓN ═══════ */}
          <div className="lg:col-span-6 xl:col-span-4 bg-white dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 space-y-4 relative z-40">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-t-3xl" />
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg text-white shadow-md shadow-emerald-500/20"><PlusCircle size={13} /></div> Registrar Puntuación
              </h3>
              {(selectedGroup || selectedCategory || selectedActivity || observation) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroup('');
                    setSelectedCategory('');
                    setSelectedActivity(null);
                    setObservation('');
                    setScoreDate(new Date().toISOString().split('T')[0]);
                    setOpenDropdown(null);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer active:scale-95"
                  title="Limpiar formulario"
                >
                  <RefreshCw size={10} className="stroke-[3]" /> Limpiar
                </button>
              )}
            </div>
            <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs font-bold text-slate-600 dark:text-slate-350">
              {/* Backdrop invisible para cerrar los dropdowns al hacer clic fuera */}
              {openDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setOpenDropdown(null)} 
                  title="Cerrar opciones"
                />
              )}
              
              {/* ── Selector GP (custom) ── */}
              <div className={`space-y-1.5 ${openDropdown === 'gp' ? 'relative z-50' : 'relative z-30'}`}>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5"><span className="w-4 h-4 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full text-white flex items-center justify-center text-[8px] font-black">1</span> Seleccionar GP</label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l-xl z-10" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 rounded-lg flex items-center justify-center z-10"><Users size={13} className="text-violet-600 dark:text-violet-400" /></div>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'gp' ? null : 'gp')}
                    className={`w-full p-3 pl-12 pr-10 bg-slate-50/80 dark:bg-slate-950 border-2 rounded-xl font-bold text-left text-xs transition-all duration-200 flex items-center ${
                      selectedGroup ? 'text-slate-800 dark:text-white border-violet-400 dark:border-violet-600' : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                    } hover:border-violet-400 dark:hover:border-violet-600 focus:outline-none`}
                  >
                    {selectedGroup ? `GP ${groups.find(g => String(g.id) === selectedGroup)?.name?.toUpperCase() || ''}` : 'Elige un grupo...'}
                  </button>
                  <ChevronRight size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 pointer-events-none ${openDropdown === 'gp' ? 'rotate-90' : ''}`} />
                  {openDropdown === 'gp' && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                      {groups.map(g => (
                        <button
                          key={g.id} type="button"
                          onClick={() => { setSelectedGroup(String(g.id)); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 transition-all hover:bg-violet-50 dark:hover:bg-violet-950/30 ${
                            String(g.id) === selectedGroup ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">GP</span>
                          {g.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Selector Categoría (custom) ── */}
              <div className={`space-y-1.5 ${openDropdown === 'cat' ? 'relative z-50' : 'relative z-20'}`}>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5"><span className="w-4 h-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full text-white flex items-center justify-center text-[8px] font-black">2</span> Seleccionar Categoría</label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-fuchsia-500 to-pink-500 rounded-l-xl z-10" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-fuchsia-500/15 to-pink-500/15 rounded-lg flex items-center justify-center z-10"><Layers size={13} className="text-fuchsia-600 dark:text-fuchsia-400" /></div>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'cat' ? null : 'cat')}
                    className={`w-full p-3 pl-12 pr-10 bg-slate-50/80 dark:bg-slate-950 border-2 rounded-xl font-bold text-left text-xs transition-all duration-200 ${
                      selectedCategory ? 'text-slate-800 dark:text-white border-fuchsia-400 dark:border-fuchsia-600' : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                    } hover:border-fuchsia-400 dark:hover:border-fuchsia-600 focus:outline-none`}
                  >
                    {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || '' : 'Elige una categoría...'}
                  </button>
                  <ChevronRight size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 pointer-events-none ${openDropdown === 'cat' ? 'rotate-90' : ''}`} />
                  {openDropdown === 'cat' && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                      {categories.map(c => (
                        <button
                          key={c.id} type="button"
                          onClick={() => { handleCategoryChange(c.id); setOpenDropdown(null); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 transition-all hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30 ${
                            c.id === selectedCategory ? 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white flex items-center justify-center text-[8px] font-black shrink-0"><Layers size={9} /></span>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Selector Actividad (custom) ── */}
              {selectedCategory && (
                <div className={`space-y-1.5 animate-fadeIn ${openDropdown === 'act' ? 'relative z-50' : 'relative z-10'}`}>
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5"><span className="w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-white flex items-center justify-center text-[8px] font-black">3</span> Seleccionar Actividad / Logro</label>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-xl z-10" />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-amber-400/15 to-orange-500/15 rounded-lg flex items-center justify-center z-10"><Star size={13} className="text-amber-600 dark:text-amber-400" /></div>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'act' ? null : 'act')}
                      className={`w-full p-3 pl-12 pr-10 bg-slate-50/80 dark:bg-slate-950 border-2 rounded-xl font-bold text-left text-xs transition-all duration-200 flex items-center ${
                        selectedActivity ? 'text-slate-800 dark:text-white border-amber-400 dark:border-amber-600' : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                      } hover:border-amber-400 dark:hover:border-amber-600 focus:outline-none`}
                    >
                      {selectedActivity ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate pr-3">{selectedActivity.name}</span>
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded text-[10px] font-black shrink-0 shadow-sm shadow-emerald-500/20">+{selectedActivity.points} pts</span>
                        </div>
                      ) : (
                        'Elige el logro alcanzado...'
                      )}
                    </button>
                    <ChevronRight size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 pointer-events-none ${openDropdown === 'act' ? 'rotate-90' : ''}`} />
                    {openDropdown === 'act' && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                        {categories.find(c => c.id === selectedCategory)?.activities?.map((a: any) => (
                          <button
                            key={a.id} type="button"
                            onClick={() => { setSelectedActivity(a); setOpenDropdown(null); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2 transition-all hover:bg-amber-50 dark:hover:bg-amber-950/30 ${
                              selectedActivity?.id === a.id ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-2 pr-3"><Star size={12} className="text-amber-500 shrink-0" />{a.name}</span>
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black font-mono text-xs px-2.5 py-1 rounded-lg shadow-sm shadow-emerald-500/20 shrink-0">+{a.points} pts</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedActivity && (
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border-2 border-emerald-400/40 dark:border-emerald-500/30 p-6 rounded-3xl text-center space-y-3 animate-scaleUp shadow-xl shadow-emerald-500/10 mt-2">
                  <div className="absolute top-0 right-0 p-2 opacity-[0.07] dark:opacity-[0.04] rotate-12 pointer-events-none">
                     <Star size={100} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-inner"><Zap size={14} className="text-emerald-600 dark:text-emerald-400" /></span> 
                    Puntuación del Logro
                  </span>
                  <div className="relative z-10 flex items-baseline justify-center gap-1.5">
                    <span className="text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 drop-shadow-sm">+{selectedActivity.points}</span>
                    <span className="text-emerald-600/80 dark:text-emerald-400/80 font-bold text-xl tracking-tighter">pts</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5"><span className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full text-white flex items-center justify-center text-[8px] font-black">4</span> Fecha de la Actividad</label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-emerald-400/15 to-teal-500/15 dark:from-emerald-400/20 dark:to-teal-500/20 rounded-lg flex items-center justify-center"><Calendar size={13} className="text-emerald-600 dark:text-emerald-400" /></div>
                  <button 
                    type="button" 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full text-left p-3 pl-12 pr-10 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-lg focus:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span>{formatDateString(scoreDate)}</span>
                    <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400 select-none">Elegir</span>
                  </button>
                </div>

                {showCalendar && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowCalendar(false)} 
                    />
                    <div className="absolute top-[calc(100%+6px)] left-0 w-full sm:w-[320px] z-50 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-2xl shadow-2xl p-4 animate-scaleUp select-none">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850 mb-3">
                        <button 
                          type="button" 
                          onClick={() => handleMonthChange(-1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition active:scale-90"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          {MONTHS_ES[currentMonth]} {currentYear}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleMonthChange(1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition active:scale-90"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Días de la semana */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {DAYS_ES.map(d => (
                          <div key={d} className="py-1">{d}</div>
                        ))}
                      </div>

                      {/* Cuadrícula de días */}
                      <div className="grid grid-cols-7 gap-1 text-[11px] font-bold">
                        {(() => {
                          const cells = [];
                          const totalDays = getDaysInMonth(currentMonth, currentYear);
                          const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

                          // Prev month padding
                          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                          const prevMonthDays = getDaysInMonth(prevMonth, prevYear);
                          for (let i = firstDay - 1; i >= 0; i--) {
                            cells.push({
                              day: prevMonthDays - i,
                              month: prevMonth,
                              year: prevYear,
                              isCurrentMonth: false
                            });
                          }

                          // Current month days
                          for (let i = 1; i <= totalDays; i++) {
                            cells.push({
                              day: i,
                              month: currentMonth,
                              year: currentYear,
                              isCurrentMonth: true
                            });
                          }

                          // Next month padding to standard 6-week view
                          const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                          const remaining = 42 - cells.length;
                          for (let i = 1; i <= remaining; i++) {
                            cells.push({
                              day: i,
                              month: nextMonth,
                              year: nextYear,
                              isCurrentMonth: false
                            });
                          }

                          const isSelected = (day: number, month: number, year: number) => {
                            const formattedCell = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            return scoreDate === formattedCell;
                          };

                          const isToday = (day: number, month: number, year: number) => {
                            const today = new Date();
                            return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                          };

                          return cells.map((cell, idx) => {
                            const selected = isSelected(cell.day, cell.month, cell.year);
                            const today = isToday(cell.day, cell.month, cell.year);
                            return (
                              <button
                                key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                                type="button"
                                onClick={() => {
                                  const formatted = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                                  setScoreDate(formatted);
                                  setShowCalendar(false);
                                }}
                                className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-center transition-all duration-200 cursor-pointer text-xs
                                  ${cell.isCurrentMonth 
                                    ? 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850' 
                                    : 'text-slate-350 dark:text-slate-650 hover:bg-slate-100/50 dark:hover:bg-slate-850/40'}
                                  ${selected 
                                    ? '!bg-gradient-to-br from-emerald-500 to-teal-600 !text-white shadow-md shadow-emerald-500/20 font-black scale-105' 
                                    : ''}
                                  ${today && !selected 
                                    ? 'border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-extrabold' 
                                    : ''}
                                `}
                              >
                                {cell.day}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <button 
                          type="button"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setScoreDate(today);
                            setShowCalendar(false);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-black uppercase hover:underline"
                        >
                          Hoy
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowCalendar(false)}
                          className="text-slate-400 dark:text-slate-500 font-black uppercase hover:underline"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5"><span className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-white flex items-center justify-center text-[8px] font-black">5</span> Observación (opcional)</label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-xl" />
                  <div className="absolute left-3 top-3 w-7 h-7 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 dark:from-cyan-400/20 dark:to-blue-500/20 rounded-lg flex items-center justify-center"><HelpCircle size={13} className="text-cyan-600 dark:text-cyan-400" /></div>
                  <textarea rows={2} placeholder="Escribe anotaciones complementarias..." value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 resize-none transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-lg focus:shadow-cyan-500/10 hover:border-cyan-300 dark:hover:border-cyan-700" />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-wider cursor-pointer">
                🚀 Guardar Puntuación
              </button>
            </form>
          </div>

          {/* ═══════ HISTORIAL Y PENALIZACIONES ═══════ */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-cyan-50/30 dark:from-slate-950/50 dark:to-cyan-950/10 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-md text-white shadow-sm"><Clock size={12} /></div> 📜 Historial Reciente</h3>
                <span className="text-[10px] text-white bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1 rounded-full font-black shadow-sm">Últimas 10</span>
              </div>
              <div className="overflow-x-auto text-xs font-bold scrollbar-none">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50/50 to-cyan-50/20 dark:from-slate-950/20 dark:to-cyan-950/5 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black">
                      <th className="p-3 pl-4">Fecha</th>
                      <th className="p-3">GP</th>
                      <th className="p-3">Actividad</th>
                      <th className="p-3 text-center pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/10">
                    {scoreHistory.map((h, i) => (
                      <tr key={h.id} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10 transition-all">
                        <td className="p-3 pl-4 font-mono text-slate-400 dark:text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex-shrink-0" />{h.date}</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200 uppercase">GP {h.groupName}</td>
                        <td className="p-3 truncate max-w-[130px] font-medium text-slate-700 dark:text-slate-300">{h.activityName}</td>
                        <td className="p-3 text-center pr-4"><span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-black font-mono px-2 py-0.5 rounded-md">+{h.points}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Penalizaciones */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-red-500 to-orange-500" />
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-rose-50/30 dark:from-slate-950/50 dark:to-rose-950/10 flex justify-between items-center">
                <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-rose-400 to-red-600 rounded-md text-white shadow-sm"><ShieldAlert size={12} /></div> ⚠️ Penalizaciones</h3>
                <button onClick={() => setIsPenaltyModalOpen(true)} className="text-[10px] font-black text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer hover:scale-105 shadow-md shadow-rose-500/20">+ Registrar</button>
              </div>
              <div className="overflow-x-auto text-xs font-bold scrollbar-none">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/10">
                    {penaltyHistory.map(p => (
                      <tr key={p.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-all">
                        <td className="p-3 pl-4 font-mono text-slate-400 dark:text-slate-500 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-red-500 flex-shrink-0" />{p.date}</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200 uppercase">GP {p.groupName}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">{p.reason}</td>
                        <td className="p-3 text-center pr-4"><span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black font-mono px-2 py-0.5 rounded-md">{p.points}</span></td>
                      </tr>
                    ))}
                    {penaltyHistory.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sin incidencias en el registro activo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ GUÍA DE CICLO OPERATIVO ═══════ */}
      <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 via-amber-400 to-emerald-400" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md text-white shadow-sm"><HelpCircle size={12} /></div> 💡 ¿Cómo funciona el ciclo operativo?</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-center font-bold text-[10px] sm:text-[11px] leading-relaxed">
          {[
            { num: '1', label: 'Selecciona el GP', emoji: '🎯', gradient: 'from-violet-500 to-indigo-500', bg: 'from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20', border: 'border-violet-200 dark:border-violet-800/40' },
            { num: '2', label: 'Elige Categoría', emoji: '📂', gradient: 'from-fuchsia-500 to-pink-500', bg: 'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20', border: 'border-fuchsia-200 dark:border-fuchsia-800/40' },
            { num: '3', label: 'Asignación Automática', emoji: '⚡', gradient: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20', border: 'border-amber-200 dark:border-amber-800/40' },
            { num: '4', label: 'Guardar Actividad', emoji: '💾', gradient: 'from-emerald-400 to-teal-500', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20', border: 'border-emerald-200 dark:border-emerald-800/40' },
            { num: '5', label: 'Ranking Refrescado', emoji: '🏆', gradient: 'from-cyan-400 to-blue-500', bg: 'from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20', border: 'border-cyan-200 dark:border-cyan-800/40' },
          ].map(step => (
            <div key={step.num} className={`p-4 bg-gradient-to-br ${step.bg} rounded-2xl border ${step.border} relative hover:-translate-y-1 transition-all duration-300 group`}>
              <span className={`absolute top-2 left-2 w-6 h-6 bg-gradient-to-r ${step.gradient} text-white rounded-full flex items-center justify-center font-black text-[9px] shadow-md group-hover:scale-110 transition-transform`}>{step.num}</span>
              <span className="text-xl block mb-1">{step.emoji}</span>
              <p className="text-slate-700 dark:text-slate-300 font-bold">{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ MODAL NUEVA CATEGORÍA ═══════ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-0 mx-4 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-md text-white shadow-sm"><Layers size={11} /></div> {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }} className="text-slate-400 dark:text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-bold">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 dark:from-violet-500/20 dark:to-indigo-500/20 rounded-lg flex items-center justify-center"><Layers size={13} className="text-violet-600 dark:text-violet-400" /></div>
                  <input type="text" required placeholder="Ej: Espíritu de Servicio..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-violet-500/20 hover:border-violet-300 dark:hover:border-violet-700" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                  <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-all">{editingCategory ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL CONFIRMAR ELIMINACIÓN ═══════ */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-0 mx-4 overflow-hidden animate-scaleUp">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-red-500" />
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Eliminar Categoría</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                ¿Estás seguro de que deseas eliminar la columna <span className="text-slate-800 dark:text-slate-200 font-black">"{categoryToDelete.name}"</span>? Esta acción también podría eliminar las actividades vinculadas y <span className="text-rose-500">no se puede deshacer</span>.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button type="button" onClick={() => setCategoryToDelete(null)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                <button type="button" onClick={handleDeleteCategory} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-rose-500/20 cursor-pointer hover:scale-105 transition-all">Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL VER CRITERIOS ═══════ */}
      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl mx-4 overflow-hidden animate-scaleUp">
            {/* Gradient top bar */}
            <div className="h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{viewingCategory.name}</h3>
                    <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500 font-black uppercase tracking-wider">
                      Bloque Operativo · {viewingCategory.activities?.length || 0} criterio{viewingCategory.activities?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewingCategory(null)} className="text-slate-400 dark:text-slate-500 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition hover:text-slate-600 dark:hover:text-slate-300"><X size={16} /></button>
              </div>

              {/* Stats strip */}
              {viewingCategory.activities && viewingCategory.activities.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-violet-50 dark:bg-violet-950/30 rounded-2xl p-3 border border-violet-200/50 dark:border-violet-800/30">
                    <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Criterios</p>
                    <p className="text-lg font-black text-violet-700 dark:text-violet-300">{viewingCategory.activities.length}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Puntos Totales</p>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{viewingCategory.activities.reduce((s: number, a: any) => s + a.points, 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Lista de criterios */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {viewingCategory.activities && viewingCategory.activities.length > 0 ? (
                  viewingCategory.activities.map((act: any, aidx: number) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-violet-50/30 dark:from-slate-950/60 dark:to-violet-950/10 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-violet-300/50 dark:hover:border-violet-700/30 hover:shadow-md hover:shadow-violet-500/5 transition-all duration-200">
                      {/* Número */}
                      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm">{aidx + 1}</span>

                      {/* Nombre */}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1 min-w-0">{act.name}</span>

                      {/* Puntos badge */}
                      <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-sm shrink-0">+{act.points} pts</span>

                      {/* Acciones — siempre visibles */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingActivity({ id: act.id, name: act.name, points: act.points })}
                          className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-lg transition-all hover:scale-110 cursor-pointer"
                          title="Editar criterio"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => setActivityToDelete({ id: act.id, name: act.name })}
                          className="p-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800/60 rounded-lg transition-all hover:scale-110 cursor-pointer"
                          title="Eliminar criterio"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 rounded-2xl flex items-center justify-center shadow-inner">
                      <Layers size={22} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Esta categoría aún no tiene criterios.</p>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600">Haz clic en "Añadir Criterio" para comenzar.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setViewingCategory(null); setSelectedCategoryIdForActivity(viewingCategory.id); setIsActivityModalOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider shadow-lg shadow-indigo-500/25 cursor-pointer hover:scale-105 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={12} /> Añadir Criterio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL EDITAR SUBCRITERIO ═══════ */}
      {editingActivity && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl mx-4 overflow-hidden animate-scaleUp">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md text-white shadow-sm"><Edit2 size={11} /></div> Editar Subcriterio</h3>
                <button onClick={() => setEditingActivity(null)} className="text-slate-400 dark:text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleSaveActivity} className="space-y-4 text-xs font-bold">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded-lg flex items-center justify-center"><Star size={13} className="text-blue-600 dark:text-blue-400" /></div>
                  <input type="text" required placeholder="Nombre del criterio..." value={editingActivity.name} onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-700" />
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 rounded-lg flex items-center justify-center"><Trophy size={13} className="text-indigo-600 dark:text-indigo-400" /></div>
                  <input type="number" required placeholder="Puntos asignados..." value={editingActivity.points} onChange={(e) => setEditingActivity({ ...editingActivity, points: Number(e.target.value) })} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-700" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingActivity(null)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                  <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-all">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL CONFIRMAR ELIMINAR SUBCRITERIO ═══════ */}
      {activityToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl mx-4 overflow-hidden animate-scaleUp">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-red-500" />
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-2">
                <Trash2 size={22} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Eliminar Subcriterio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                ¿Eliminar <span className="text-slate-800 dark:text-slate-200 font-black">"{activityToDelete.name}"</span>? Esta acción <span className="text-rose-500">no se puede deshacer</span>.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button type="button" onClick={() => setActivityToDelete(null)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                <button type="button" onClick={handleDeleteActivity} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-rose-500/20 cursor-pointer hover:scale-105 transition-all">Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL NUEVO SUBCRITERIO ═══════ */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-0 mx-4 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-md text-white shadow-sm"><PlusCircle size={11} /></div> Añadir Subcriterio</h3>
                <button onClick={() => setIsActivityModalOpen(false)} className="text-slate-400 dark:text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-teal-500/15 to-cyan-500/15 dark:from-teal-500/20 dark:to-cyan-500/20 rounded-lg flex items-center justify-center"><Layers size={13} className="text-teal-600 dark:text-teal-400" /></div>
                  {selectedCategoryIdForActivity !== '' ? (
                    /* Categoría bloqueada: vino desde el botón de la tarjeta */
                    <div className="w-full p-3 pl-12 bg-teal-50/60 dark:bg-teal-950/20 border-2 border-teal-300/60 dark:border-teal-700/40 rounded-xl font-bold text-teal-800 dark:text-teal-300 select-none cursor-not-allowed opacity-90">
                      📂 {categories.find(c => c.id === selectedCategoryIdForActivity)?.name || ''}
                    </div>
                  ) : (
                    /* Sin categoría preseleccionada: mostrar select sin opción vacía */
                    <select required value={selectedCategoryIdForActivity} onChange={(e) => setSelectedCategoryIdForActivity(Number(e.target.value))} className="select-premium w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:shadow-lg focus:shadow-teal-500/10 hover:border-teal-300 dark:hover:border-teal-700">
                      <option value="" disabled>📋 Selecciona una columna</option>
                      {categories.map(c => (<option key={c.id} value={c.id}>📂 {c.name}</option>))}
                    </select>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-cyan-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-teal-400/15 to-cyan-500/15 dark:from-teal-400/20 dark:to-cyan-500/20 rounded-lg flex items-center justify-center"><Star size={13} className="text-teal-600 dark:text-teal-400" /></div>
                  <input type="text" required placeholder="Nombre del criterio..." value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-teal-500 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 hover:border-teal-300 dark:hover:border-teal-700" />
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-green-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-emerald-400/15 to-green-500/15 dark:from-emerald-400/20 dark:to-green-500/20 rounded-lg flex items-center justify-center"><Trophy size={13} className="text-emerald-600 dark:text-emerald-400" /></div>
                  <input type="number" required placeholder="Puntos asignados..." value={newActivityPoints} onChange={(e) => setNewActivityPoints(e.target.value)} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                  <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-all">Vincular</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL REGISTRAR INFRACCIÓN ═══════ */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-0 mx-4 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 via-red-500 to-orange-500" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><div className="p-1 bg-gradient-to-br from-rose-400 to-red-600 rounded-md text-white shadow-sm"><ShieldAlert size={11} /></div> ⚠️ Registrar Infracción</h3>
                <button onClick={() => setIsPenaltyModalOpen(false)} className="text-slate-400 dark:text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"><X size={16} /></button>
              </div>
              <form onSubmit={handlePenaltySubmit} className="space-y-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-red-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-rose-500/15 to-red-500/15 dark:from-rose-500/20 dark:to-red-500/20 rounded-lg flex items-center justify-center"><ShieldAlert size={13} className="text-rose-600 dark:text-rose-400" /></div>
                  <select required value={penaltyForm.groupId} onChange={(e) => setPenaltyForm({...penaltyForm, groupId: e.target.value})} className="select-premium w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-rose-500/20 focus:shadow-lg focus:shadow-rose-500/10 hover:border-rose-300 dark:hover:border-rose-700">
                    <option value="">⚠️ Selecciona el GP</option>
                    {groups.map(g => (<option key={g.id} value={g.id}>🛡️ GP {g.name.toUpperCase()}</option>))}
                  </select>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-orange-400/15 to-amber-500/15 dark:from-orange-400/20 dark:to-amber-500/20 rounded-lg flex items-center justify-center"><AlertTriangle size={13} className="text-orange-600 dark:text-orange-400" /></div>
                  <input type="text" required placeholder="Motivo del descuento..." value={penaltyForm.reason} onChange={(e) => setPenaltyForm({...penaltyForm, reason: e.target.value})} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-300 dark:hover:border-rose-700" />
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-rose-500 rounded-l-xl" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-red-400/15 to-rose-500/15 dark:from-red-400/20 dark:to-rose-500/20 rounded-lg flex items-center justify-center"><Star size={13} className="text-red-600 dark:text-red-400" /></div>
                  <input type="number" required placeholder="Puntos a descontar..." value={penaltyForm.points} onChange={(e) => setPenaltyForm({...penaltyForm, points: e.target.value})} className="w-full p-3 pl-12 bg-slate-50/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 focus:ring-2 focus:ring-rose-500/20 hover:border-rose-300 dark:hover:border-rose-700" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsPenaltyModalOpen(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                  <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer hover:scale-105 transition-all text-[10px] uppercase">Aplicar Castigo</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ALERTA FLOTANTE OPERATIVA ═══════ */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-center space-y-0 mx-4 overflow-hidden">
            <div className={`h-1.5 ${alertConfig.type === 'success' ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400' : 'bg-gradient-to-r from-rose-400 via-red-500 to-orange-500'}`} />
            <div className="p-6 space-y-4">
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${alertConfig.type === 'success' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/25' : 'bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-500/25'}`}>{alertConfig.type === 'success' ? <CheckCircle2 size={30} /> : <AlertTriangle size={30} />}</div>
              <div className="space-y-1"><h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{alertConfig.title}</h4><p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{alertConfig.message}</p></div>
              <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wider ${alertConfig.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'}`}>Entendido</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};