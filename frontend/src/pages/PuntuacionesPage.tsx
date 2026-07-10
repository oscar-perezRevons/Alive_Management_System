import React, { useEffect, useState } from 'react';
import { scoreService, secretariaService } from '../services/api';
import { 
  Trophy, BarChart3, AlertTriangle, RefreshCw, Star, Shield,
  Clock, ShieldAlert, PlusCircle, CheckCircle2, ListFilter, 
  HelpCircle, Users, X, Layers, Plus
} from 'lucide-react';
import { Loader } from '../components/Loader';

export const PuntuacionesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OPERACIONES' | 'MATRIZ'>('OPERACIONES');
  
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
  const [selectedCategoryIdForActivity, setSelectedCategoryIdForActivity] = useState<number | ''>('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityPoints, setNewActivityPoints] = useState('');
  const [penaltyForm, setPenaltyForm] = useState({ groupId: '', reason: '', points: '', date: new Date().toISOString().split('T')[0] });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await scoreService.createCategory({ name: newCategoryName.trim() });
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      showAlert('success', '¡Categoría Creada!', 'La nueva columna se ha indexado correctamente en la matriz.');
      loadAllModuleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo guardar la categoría.');
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
    <div className="space-y-6 font-sans text-slate-800 bg-[#f4f6fc] p-2 min-h-screen">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="text-[#3730a3] bg-white p-2.5 rounded-2xl shadow-xs"><Trophy size={26} className="stroke-[2.5]" /></div>
          <div>
            <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Puntuaciones</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sistema Oficial de Puntos</p>
          </div>
        </div>

        <div className="flex bg-white/80 backdrop-blur-xs p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button 
            onClick={() => setActiveTab('OPERACIONES')}
            className={`px-5 py-2 text-xs font-black rounded-xl transition-all duration-200 ${activeTab === 'OPERACIONES' ? 'bg-[#3730a3] text-white shadow-md' : 'text-slate-500 hover:text-[#3730a3]'}`}
          >
            Panel Operativo
          </button>
          <button 
            onClick={() => setActiveTab('MATRIZ')}
            className={`px-5 py-2 text-xs font-black rounded-xl transition-all duration-200 ${activeTab === 'MATRIZ' ? 'bg-[#3730a3] text-white shadow-md' : 'text-slate-500 hover:text-[#3730a3]'}`}
          >
            Matriz de Criterios
          </button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GP Registrados</span><span className="text-lg font-black text-slate-800">{kpis.totalGroups} <span className="text-xs text-slate-400 font-bold">Equipos</span></span></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4 md:col-span-2">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Star size={20} className="fill-amber-400 stroke-amber-500" /></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos Totales Acumulados</span><span className="text-lg font-mono font-black text-slate-800">{kpis.totalPointsAccumulated.toLocaleString()} <span className="text-xs text-slate-400 font-bold">pts</span></span></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Trophy size={20} /></div>
            <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GP Líder Actual</span><span className="text-sm font-black text-emerald-600 block uppercase tracking-tight">GP {kpis.leaderGroupName}</span><span className="text-[11px] text-slate-400 font-mono font-bold">{kpis.leaderGroupPoints} puntos</span></div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
      )}

      {refreshing && (
        <div className="text-right text-[10px] text-indigo-600 font-bold flex items-center justify-end gap-1 px-1">
          <RefreshCw size={12} className="animate-spin" /> Sincronizando en tiempo real...
        </div>
      )}

      {activeTab === 'MATRIZ' && (
        <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ListFilter size={16} /></div>
              <div>
                <h2 className="text-sm font-black text-[#1e1b4b]">Categorías de Puntuación</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Configura dinámicamente las columnas de puntuación sabática</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all"><Plus size={13} /> Nueva Categoría</button>
              <button onClick={() => setIsActivityModalOpen(true)} className="flex items-center gap-1.5 text-[11px] font-black bg-[#3730a3] hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10"><PlusCircle size={13} /> Agregar Subcriterio</button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1100px] items-stretch">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="w-64 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between space-y-4 shadow-2xs hover:border-slate-300 transition-all">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-[#1e1b4b] uppercase tracking-wide block">{idx + 1}. {cat.name}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bloque Operativo</p>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs flex-1">
                    {cat.activities?.map((act: any) => (
                      <div key={act.id} className="p-3 flex justify-between items-center text-xs font-bold hover:bg-slate-50/40 transition-all">
                        <span className="text-slate-700 font-semibold truncate max-w-[140px]">{act.name}</span>
                        <span className="text-emerald-600 font-black font-mono text-sm">+{act.points}</span>
                      </div>
                    ))}
                    {(!cat.activities || cat.activities.length === 0) && (
                      <div className="p-4 text-center text-[11px] text-slate-400 font-medium italic">Sin criterios agregados.</div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedCategoryIdForActivity(cat.id); setIsActivityModalOpen(true); }}
                    className="text-[10px] text-[#3730a3] hover:text-indigo-700 font-black text-center block w-full pt-1 uppercase tracking-wider"
                  >
                    + Añadir Criterio
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OPERACIONES' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-fadeIn">
          
          <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
              <BarChart3 size={15} className="text-[#3730a3]" />
              <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider">Ranking General</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {[...groups]
                .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                .map((g, index) => (
                  <div key={g.id} className="p-3.5 flex justify-between items-center text-sm font-bold hover:bg-slate-50/40 transition-all">
                    <div className="flex items-center gap-3.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-black shadow-xs ${index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : index === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' : index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-400'}`}>{index + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <Shield size={14} className={`${index === 0 ? 'text-amber-500 fill-amber-300' : 'text-slate-300'}`} />
                        <span className="text-slate-800 font-black tracking-tight uppercase">GP {g.name}</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 font-mono text-base">{g.totalPoints?.toLocaleString() || 0}</span>
                  </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <PlusCircle size={15} className="text-indigo-600" /> Registrar Puntuación
            </h3>
            <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">1. Seleccionar GP</label>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] transition-all">
                  <option value="">-- Elige un grupo --</option>
                  {groups.map(g => (<option key={g.id} value={g.id}>GP {g.name.toUpperCase()}</option>))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">2. Seleccionar Categoría</label>
                <select value={selectedCategory} onChange={(e) => handleCategoryChange(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] transition-all">
                  <option value="">-- Criterios institucionales --</option>
                  {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>

              {selectedCategory && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">3. Seleccionar Actividad / Logro</label>
                  <select 
                    onChange={(e) => setSelectedActivity(categories.find(c => c.id === selectedCategory)?.activities?.find((a: any) => a.id === Number(e.target.value)))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] transition-all"
                  >
                    <option value="">-- Elige el logro alcanzado --</option>
                    {categories.find(c => c.id === selectedCategory)?.activities?.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} (+{a.points} pts)</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedActivity && (
                <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-2xl text-center space-y-0.5 animate-scaleUp">
                  <span className="text-[10px] font-black text-amber-700 uppercase block tracking-wider">Puntos Automatizados Asignados</span>
                  <span className="text-2xl font-mono font-black text-emerald-600">+{selectedActivity.points}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">4. Fecha de la Actividad</label>
                <input type="date" value={scoreDate} onChange={(e) => setScoreDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">5. Observación (opcional)</label>
                <textarea rows={2} placeholder="Escribe anotaciones complementarias..." value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none resize-none" />
              </div>

              <button type="submit" className="w-full py-3 bg-[#3730a3] hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition transform active:scale-95 text-xs uppercase tracking-wider">
                Guardar Puntuación
              </button>
            </form>
          </div>

          <div className="xl:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex justify-between items-center">
                <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5"><Clock size={14} className="text-indigo-600" /> Historial Reciente</h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">Últimas 10</span>
              </div>
              <div className="overflow-x-auto text-xs font-bold">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                      <th className="p-3 pl-4">Fecha</th>
                      <th className="p-3">GP</th>
                      <th className="p-3">Actividad</th>
                      <th className="p-3 text-center pr-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {scoreHistory.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 pl-4 font-mono text-slate-400">{h.date}</td>
                        <td className="p-3 font-black text-slate-800 uppercase">GP {h.groupName}</td>
                        <td className="p-3 truncate max-w-[130px] font-medium text-slate-700">{h.activityName}</td>
                        <td className="p-3 text-center pr-4 font-black text-emerald-600 font-mono">+{h.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex justify-between items-center">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert size={14} /> Penalizaciones</h3>
                <button onClick={() => setIsPenaltyModalOpen(true)} className="text-[10px] font-black text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-xl transition-all">+ Registrar Penalización</button>
              </div>
              <div className="overflow-x-auto text-xs font-bold">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {penaltyHistory.map(p => (
                      <tr key={p.id} className="hover:bg-rose-50/20 transition-all">
                        <td className="p-3 pl-4 font-mono text-slate-400">{p.date}</td>
                        <td className="p-3 font-black text-slate-800 uppercase">GP {p.groupName}</td>
                        <td className="p-3 text-slate-500 font-medium">{p.reason}</td>
                        <td className="p-3 text-center pr-4 font-black text-rose-600 font-mono">{p.points}</td>
                      </tr>
                    ))}
                    {penaltyHistory.length === 0 && (
                      <tr><td className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Sin incidencias en el registro activo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <h4 className="text-xs font-black text-[#1e1b4b] flex items-center gap-1.5"><HelpCircle size={15} /> ¿Cómo funciona el ciclo operativo?</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center text-slate-600 font-bold text-[11px] leading-relaxed">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative"><span className="absolute top-2 left-2 w-5 h-5 bg-[#3730a3] text-white rounded-full flex items-center justify-center font-black text-[9px]">1</span><p className="mt-4 text-slate-700">Selecciona el GP</p></div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative"><span className="absolute top-2 left-2 w-5 h-5 bg-[#3730a3] text-white rounded-full flex items-center justify-center font-black text-[9px]">2</span><p className="mt-4 text-slate-700">Elige Categoría</p></div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative"><span className="absolute top-2 left-2 w-5 h-5 bg-[#3730a3] text-white rounded-full flex items-center justify-center font-black text-[9px]">3</span><p className="mt-4 text-slate-700">Asignación Automática</p></div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative"><span className="absolute top-2 left-2 w-5 h-5 bg-[#3730a3] text-white rounded-full flex items-center justify-center font-black text-[9px]">4</span><p className="mt-4 text-slate-700">Guardar Actividad</p></div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative"><span className="absolute top-2 left-2 w-5 h-5 bg-[#3730a3] text-white rounded-full flex items-center justify-center font-black text-[9px]">5</span><p className="mt-4 text-slate-700">Ranking Refrescado</p></div>
        </div>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2"><h3 className="text-xs font-black text-[#1e1b4b] uppercase flex items-center gap-1.5"><Layers size={14} /> Nueva Categoría</h3><button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button></div>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs font-bold">
              <input type="text" required placeholder="Ej: Espíritu de Servicio..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#3730a3] text-white rounded-xl shadow-md">Crear</button></div>
            </form>
          </div>
        </div>
      )}

      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2"><h3 className="text-xs font-black text-[#1e1b4b] uppercase flex items-center gap-1.5"><PlusCircle size={14} /> Añadir Subcriterio</h3><button onClick={() => setIsActivityModalOpen(false)} className="text-slate-400 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button></div>
            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-bold text-slate-600">
              <select required value={selectedCategoryIdForActivity} onChange={(e) => setSelectedCategoryIdForActivity(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none">
                <option value="">-- Elige Columna Destino --</option>
                {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <input type="text" required placeholder="Nombre del criterio..." value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
              <input type="number" required placeholder="Puntos asignados..." value={newActivityPoints} onChange={(e) => setNewActivityPoints(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#3730a3] text-white rounded-xl shadow-md">Vincular</button></div>
            </form>
          </div>
        </div>
      )}

      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2"><h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert size={14} /> Registrar Infracción</h3><button onClick={() => setIsPenaltyModalOpen(false)} className="text-slate-400 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button></div>
            <form onSubmit={handlePenaltySubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <select required value={penaltyForm.groupId} onChange={(e) => setPenaltyForm({...penaltyForm, groupId: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none">
                <option value="">-- Selecciona el GP --</option>
                {groups.map(g => (<option key={g.id} value={g.id}>GP {g.name.toUpperCase()}</option>))}
              </select>
              <input type="text" required placeholder="Motivo del descuento..." value={penaltyForm.reason} onChange={(e) => setPenaltyForm({...penaltyForm, reason: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none" />
              <input type="number" required placeholder="Puntos a descontar..." value={penaltyForm.points} onChange={(e) => setPenaltyForm({...penaltyForm, points: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none" />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button type="button" onClick={() => setIsPenaltyModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl">Cancelar</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white font-black rounded-xl shadow-md">Aplicar Castigo</button></div>
            </form>
          </div>
        </div>
      )}

      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl text-center space-y-4 mx-4">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${alertConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{alertConfig.type === 'success' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}</div>
            <div className="space-y-1"><h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{alertConfig.title}</h4><p className="text-xs text-slate-500 font-semibold leading-relaxed">{alertConfig.message}</p></div>
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className={`w-full py-2.5 text-white font-black text-xs rounded-xl shadow-md ${alertConfig.type === 'success' ? 'bg-[#3730a3] hover:bg-indigo-700' : 'bg-rose-600'}`}>Entendido</button>
          </div>
        </div>
      )}

    </div>
  );
};