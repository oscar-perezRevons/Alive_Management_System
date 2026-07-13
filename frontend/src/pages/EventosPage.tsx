import React, { useEffect, useState, useCallback } from 'react';
import { eventosService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { canManageEvents } from '../utils/access';
import { 
  Calendar, Trophy, Plus, MoreVertical, CheckCircle2, ArrowRight,
  AlertCircle, X, CalendarDays, MapPin, Clock, Users, Eye, 
  Layers, HelpCircle, Check, Info, Trash2, Edit2
} from 'lucide-react';

export const EventosPage: React.FC = () => {
  const { user } = useAuthStore();
  const userCanManageEvents = canManageEvents(user);

  const [events, setEvents] = useState<any[]>([]);
  const [myParticipations, setMyParticipations] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ eventosProgramados: 0, gpInscritosMes: 0, eventosProximos: 0, participacionesTotales: 0 });
  const [loading, setLoading] = useState(false);
  
  const [activeTabRecreativos, setActiveTabRecreativos] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');
  const [activeTabDeportes, setActiveTabDeportes] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<number | null>(null);

  const [formFields, setFormFields] = useState({
    title: '', description: '', category: 'RECREATIVO', typeTag: 'Campamento',
    startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto'
  });

  const [notification, setNotification] = useState({
    isOpen: false, title: '', message: '', type: 'success' as 'success' | 'error'
  });

  const triggerNotification = useCallback((title: string, message: string, type: 'success' | 'error') => {
    setNotification({ isOpen: true, title, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resEvents, resMy, resKpi] = await Promise.all([
        eventosService.getAll(),
        eventosService.getMyParticipations(),
        eventosService.getKpis().catch(() => ({ data: { stats: null } }))
      ]);
      
      const fetchedEvents = resEvents.data.events || [];
      setEvents(fetchedEvents);
      setMyParticipations(resMy.data.participations || []);
      
      if (resKpi.data?.stats) {
        setKpis({
          eventosProgramados: resKpi.data.stats.eventosProgramados,
          gpInscritosMes: resKpi.data.stats.gpInscritosMes,
          eventosProximos: resKpi.data.stats.eventosProximos,
          participacionesTotales: resKpi.data.stats.participacionesTotales
        });
      } else {
        setKpis({
          eventosProgramados: fetchedEvents.length,
          gpInscritosMes: 8, 
          eventosProximos: fetchedEvents.filter((e: any) => e.status === 'Abierto').length,
          participacionesTotales: fetchedEvents.reduce((acc: number, e: any) => acc + (e.participations?.length || 0), 0)
        });
      }
    } catch (err) {
      triggerNotification('Error', 'No se pudieron sincronizar los datos de las convocatorias.', 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreateModal = (category: 'RECREATIVO' | 'DEPORTE') => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol solo permite consultar eventos.', 'error');
      return;
    }
    setEditingEvent(null);
    setFormFields({
      title: '', description: '', category, typeTag: category === 'RECREATIVO' ? 'Campamento' : 'Torneo de Fútbol',
      startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol solo permite consultar eventos.', 'error');
      return;
    }
    setEditingEvent(event);
    setFormFields({
      title: event.title, description: event.description || '', category: event.category,
      typeTag: event.typeTag, startDate: event.startDate, timeSlot: event.timeSlot,
      location: event.location, maxSpots: String(event.maxSpots), status: event.status
    });
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openDetailsModal = (participation: any) => {
    setSelectedDetails(participation);
    setIsDetailsModalOpen(true);
  };

  const triggerDeleteConfirm = (id: number) => {
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede eliminar convocatorias.', 'error');
      return;
    }
    setEventIdToDelete(id);
    setIsDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const executeDelete = async () => {
    if (!eventIdToDelete) return;
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede eliminar convocatorias.', 'error');
      return;
    }
    try {
      await eventosService.delete(eventIdToDelete);
      triggerNotification('Purgado', 'Convocatoria eliminada del cronograma de forma definitiva.', 'success');
      setIsDeleteModalOpen(false);
      setEventIdToDelete(null);
      loadData();
    } catch (err) {
      triggerNotification('Error', 'No se pudo procesar la eliminación del registro.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanManageEvents) {
      triggerNotification('Acceso restringido', 'Tu rol no puede crear ni editar convocatorias.', 'error');
      return;
    }
    try {
      if (editingEvent) {
        await eventosService.update(editingEvent.id, formFields);
        triggerNotification('Modificado', 'Cambios guardados correctamente en el servidor.', 'success');
      } else {
        await eventosService.create(formFields);
        triggerNotification('Publicado', 'Nueva convocatoria subida con éxito.', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      triggerNotification('Error', 'Por favor verifica la consistencia de los campos.', 'error');
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await eventosService.join(id);
      triggerNotification('¡Inscripción Exitosa!', 'Tu Grupo Pequeño ha asegurado su participación.', 'success');
      loadData();
    } catch (err: any) {
      triggerNotification('Denegado', err.response?.data?.message || 'Error de inscripción.', 'error');
    }
  };

  const filterEvents = (category: 'RECREATIVO' | 'DEPORTE', tab: string) => {
    return events.filter(e => {
      if (e.category !== category) return false;
      if (tab === 'Próximos') return e.status === 'Abierto';
      if (tab === 'En Curso') return e.status === 'En Curso';
      return e.status === 'Finalizado';
    });
  };

  return (
    <div className="space-y-6 bg-[#f0f2fc] min-h-screen text-slate-800 p-4 sm:p-6 font-sans antialiased selection:bg-violet-500 selection:text-white">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      
      {/* HEADER PREMIUM */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 pt-7">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Calendar size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">Eventos</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sistema de Convocatorias y Participación GP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-[11px] font-black uppercase tracking-wider text-indigo-600">
            <Layers size={13} className="animate-pulse" />
            Gestión de Eventos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border-l-[5px] border-l-indigo-600 border-t border-r border-b border-slate-200/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Users size={24} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elige una categoría</span>
              <h3 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 uppercase tracking-tight">1. Eventos Recreativos</h3>
              <p className="text-[11px] text-slate-400 font-bold leading-tight">Campamentos, confraternizaciones y más.</p>
              <button className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 pt-1 hover:text-indigo-800 transition-colors">Ver Eventos Recreativos <ArrowRight size={11} /></button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border-l-[5px] border-l-emerald-600 border-t border-r border-b border-slate-200/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <Trophy size={24} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elige una categoría</span>
              <h3 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700 uppercase tracking-tight">2. Deportes</h3>
              <p className="text-[11px] text-slate-400 font-bold leading-tight">Campeonatos, torneos y competencias GP.</p>
              <button className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 pt-1 hover:text-emerald-800 transition-colors">Ver Eventos Deportivos <ArrowRight size={11} /></button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100"><Layers size={14} className="text-indigo-600" /></div>
            <h3 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 uppercase tracking-widest">Resumen General</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-3.5 rounded-2xl text-center shadow-sm hover:shadow-md transition">
              <p className="text-xl font-black text-indigo-700 leading-none">{kpis.eventosProgramados}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-1.5">Eventos Programados</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3.5 rounded-2xl text-center shadow-sm hover:shadow-md transition">
              <p className="text-xl font-black text-emerald-700 leading-none">{kpis.gpInscritosMes}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-1.5">GP Inscritos Este Mes</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-3.5 rounded-2xl text-center shadow-sm hover:shadow-md transition">
              <p className="text-xl font-black text-amber-700 leading-none">{kpis.eventosProximos}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-1.5">Eventos Próximos</p>
            </div>
            <div className="bg-gradient-to-br from-fuchsia-50 to-violet-50 border border-fuchsia-100 p-3.5 rounded-2xl text-center shadow-sm hover:shadow-md transition">
              <p className="text-xl font-black text-fuchsia-700 leading-none">{kpis.participacionesTotales}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-1.5">Participaciones Totales</p>
            </div>
          </div>
        </div>

      </div>

      {loading && (
        <div className="text-center py-1 text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">
          Sincronizando registros activos ALIVE...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-md flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20"><Users size={16} /></div>
              <h2 className="font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 uppercase tracking-wide">Eventos Recreativos</h2>
            </div>
            {userCanManageEvents && (
              <button onClick={() => openCreateModal('RECREATIVO')} className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[10px] font-black rounded-xl shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1"><Plus size={12} /> Convocar</button>
            )}
          </div>
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTabRecreativos(tab)} className={`flex-1 text-center text-[10px] py-2 rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${activeTabRecreativos === tab ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{tab}</button>
            ))}
          </div>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {filterEvents('RECREATIVO', activeTabRecreativos).map(ev => (
              <div key={ev.id} className="border-l-[4px] border-l-indigo-500 border-t border-r border-b border-slate-200/60 rounded-2xl p-4 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative group flex gap-3 shadow-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex flex-col items-center justify-center shrink-0 text-white shadow-md shadow-indigo-500/20">
                  <Calendar size={22} className="opacity-90" />
                  <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-white/90">JA EVENT</span>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md truncate">{ev.typeTag}</span>
                    {userCanManageEvents && (
                      <div className="relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg hover:bg-slate-100 transition"><MoreVertical size={14} /></button>
                        {activeMenuId === ev.id && (
                          <div className="absolute right-0 top-6 bg-white border border-slate-100 rounded-xl shadow-xl py-1 w-24 z-40 animate-fadeIn">
                            <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-1"><Edit2 size={11} /> Editar</button>
                            <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50 flex items-center gap-1"><Trash2 size={11} /> Eliminar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-xs text-slate-800 tracking-tight truncate">{ev.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 leading-tight">{ev.description || 'Sin descripción.'}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    <span className="flex items-center gap-0.5 text-slate-500"><CalendarDays size={10} className="text-indigo-600" /> {ev.startDate}</span>
                    <span className="flex items-center gap-0.5 text-slate-500"><MapPin size={10} className="text-indigo-600" /> {ev.location}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">Inscritos: {ev.participations?.length || 0} / {ev.maxSpots} GP</span>
                    {ev.status === 'Abierto' && <button onClick={() => handleJoin(ev.id)} className="py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-95">Participar</button>}
                  </div>
                </div>
              </div>
            ))}
            {filterEvents('RECREATIVO', activeTabRecreativos).length === 0 && (
              <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">No hay convocatorias vigentes.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-md flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20"><Trophy size={16} /></div>
              <h2 className="font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700 uppercase tracking-wide">Deportes</h2>
            </div>
            {userCanManageEvents && (
              <button onClick={() => openCreateModal('DEPORTE')} className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] font-black rounded-xl shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1"><Plus size={12} /> Convocar</button>
            )}
          </div>
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTabDeportes(tab)} className={`flex-1 text-center text-[10px] py-2 rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${activeTabDeportes === tab ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{tab}</button>
            ))}
          </div>
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {filterEvents('DEPORTE', activeTabDeportes).map(ev => (
              <div key={ev.id} className="border-l-[4px] border-l-emerald-500 border-t border-r border-b border-slate-200/60 rounded-2xl p-4 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative group flex gap-3 shadow-sm">

                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex flex-col items-center justify-center shrink-0 text-white shadow-md shadow-emerald-500/20">
                  <Trophy size={22} className="opacity-90" />
                  <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-white/90">JA MATCH</span>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md truncate">{ev.typeTag}</span>
                    {userCanManageEvents && (
                      <div className="relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg hover:bg-slate-100 transition"><MoreVertical size={14} /></button>
                        {activeMenuId === ev.id && (
                          <div className="absolute right-0 top-6 bg-white border border-slate-100 rounded-xl shadow-xl py-1 w-24 z-40 animate-fadeIn">
                            <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 flex items-center gap-1"><Edit2 size={11} /> Editar</button>
                            <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50 flex items-center gap-1"><Trash2 size={11} /> Eliminar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-xs text-slate-800 tracking-tight truncate">{ev.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 leading-tight">{ev.description || 'Sin descripción.'}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">
                    <span className="flex items-center gap-0.5 text-slate-500"><CalendarDays size={10} className="text-emerald-600" /> {ev.startDate}</span>
                    <span className="flex items-center gap-0.5 text-slate-500"><MapPin size={10} className="text-emerald-600" /> {ev.location}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Equipos: {ev.participations?.length || 0} / {ev.maxSpots}</span>
                    {ev.status === 'Abierto' && <button onClick={() => handleJoin(ev.id)} className="py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95">Participar</button>}
                  </div>
                </div>
              </div>
            ))}
            {filterEvents('DEPORTE', activeTabDeportes).length === 0 && (
              <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">No hay convocatorias vigentes.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#fffbeb] border border-amber-100 p-4 rounded-3xl shadow-2xs flex flex-col justify-between gap-3">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1"><HelpCircle size={14} /> ¿Cómo participar?</h3>
            <ol className="space-y-2 text-[10px] font-bold text-amber-900/80 list-decimal pl-3.5 leading-tight">
              <li><span className="font-black text-amber-950">Explora:</span> Revisa las convocatorias vigentes.</li>
              <li><span className="font-black text-amber-950">Inscríbete:</span> Pulsa en "Participar".</li>
              <li><span className="font-black text-amber-950">Validación:</span> El administrador confirmará el cupo.</li>
              <li><span className="font-black text-amber-950">Suma:</span> Acumula puntos para el ranking.</li>
            </ol>
          </div>
          <button className="w-full text-center py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-amber-700 transition">Ver Guía</button>
        </div>

      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <h2 className="font-black text-[#1e1b4b] text-sm uppercase tracking-tight">Mis Participaciones (GP)</h2>
          <p className="text-[11px] text-slate-400 font-bold">Bitácora institucional de eventos y torneos correspondientes a tu aula o grupo asignado</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="p-4">Evento</th>
                <th className="p-4">Grupo Pequeño</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Lugar</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
              {myParticipations.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50/40 transition">
                  <td className="p-4 font-black text-[#1e1b4b]">{part.event?.title}</td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-md font-black">{part.groupSmall?.name || 'Mi Grupo'}</span></td>
                  <td className="p-4"><span className={`px-2 py-0.5 text-[10px] rounded-md font-black uppercase ${part.event?.category === 'DEPORTE' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{part.event?.category}</span></td>
                  <td className="p-4 text-slate-500 font-mono">{part.event?.startDate}</td>
                  <td className="p-4 text-slate-400">{part.event?.location}</td>
                  <td className="p-4"><span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md font-black uppercase border border-emerald-100">✓ {part.status}</span></td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openDetailsModal(part)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200/50 hover:bg-blue-50 hover:text-blue-700 transition font-black uppercase text-[10px]"
                    >
                      <Eye size={12} /> Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
              {myParticipations.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-black uppercase tracking-wider italic">Tu Grupo Pequeño aún no registra participaciones en el historial.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-200">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 shadow-2xs">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">¿Eliminar Convocatoria?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ¿Estás completamente seguro de que deseas eliminar permanentemente esta convocatoria? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setEventIdToDelete(null); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
            <div className="bg-[#1e1b4b] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Info size={18} />
                <h3 className="font-black text-sm uppercase tracking-wider">Ficha Técnica de Participación</h3>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{selectedDetails.event?.category}</span>
                <h2 className="text-base font-black text-[#1e1b4b] mt-1">{selectedDetails.event?.title}</h2>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-600 font-medium leading-relaxed">
                {selectedDetails.event?.description || "Este evento no cuenta con una descripción extendida registrada en la convocatoria."}
              </div>
              <div className="grid grid-cols-2 gap-3 bg-white border border-slate-100 rounded-xl p-3 font-bold text-slate-600 shadow-2xs">
                <div className="space-y-1 border-r border-slate-100 pr-2">
                  <p className="text-[9px] text-slate-400 uppercase">Fecha y Jornada</p>
                  <p className="font-black flex items-center gap-1 text-slate-700"><CalendarDays size={13} className="text-blue-600" /> {selectedDetails.event?.startDate}</p>
                </div>
                <div className="space-y-1 pl-1">
                  <p className="text-[9px] text-slate-400 uppercase">Hora Programada</p>
                  <p className="font-black flex items-center gap-1 text-slate-700"><Clock size={13} className="text-blue-600" /> {selectedDetails.event?.timeSlot || 'Por definir'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-white border border-slate-100 rounded-xl p-3 font-bold text-slate-600 shadow-2xs">
                <div className="space-y-1 border-r border-slate-100 pr-2">
                  <p className="text-[9px] text-slate-400 uppercase">Ubicación / Sede</p>
                  <p className="font-black flex items-center gap-1 text-slate-700"><MapPin size={13} className="text-blue-600" /> {selectedDetails.event?.location}</p>
                </div>
                <div className="space-y-1 pl-1">
                  <p className="text-[9px] text-slate-400 uppercase">Grupo Registrado</p>
                  <p className="font-black flex items-center gap-1 text-emerald-600"><Check size={13} /> {selectedDetails.groupSmall?.name}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 transition">Cerrar Ficha</button>
              </div>
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
          <button onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
            <div className="bg-[#4f46e5] p-5 text-white flex justify-between items-center">
              <h3 className="font-black text-sm uppercase tracking-wider">{editingEvent ? 'Configurar Convocatoria' : 'Nueva Convocatoria'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Título de la Convocatoria</label>
                <input type="text" required value={formFields.title} onChange={(e) => setFormFields({ ...formFields, title: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Descripción / Detalles</label>
                <textarea rows={2} value={formFields.description} onChange={(e) => setFormFields({ ...formFields, description: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-medium focus:outline-none focus:border-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fechas</label>
                  <input type="text" placeholder="e.g. 15 - 17 Julio 2026" value={formFields.startDate} onChange={(e) => setFormFields({ ...formFields, startDate: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sede / Ubicación</label>
                  <input type="text" value={formFields.location} onChange={(e) => setFormFields({ ...formFields, location: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hora / Ranura</label>
                  <input type="text" placeholder="e.g. 7:00 AM" value={formFields.timeSlot} onChange={(e) => setFormFields({ ...formFields, timeSlot: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Etiqueta Visual</label>
                  <input type="text" placeholder="e.g. Campamento" value={formFields.typeTag} onChange={(e) => setFormFields({ ...formFields, typeTag: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cupo Máximo (Grupos)</label>
                  <input type="number" value={formFields.maxSpots} onChange={(e) => setFormFields({ ...formFields, maxSpots: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Estado Operativo</label>
                  <select value={formFields.status} onChange={(e) => setFormFields({ ...formFields, status: e.target.value })} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-600 bg-white">
                    <option value="Abierto">Abierto</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#4f46e5] text-white rounded-xl font-black uppercase tracking-wider hover:bg-blue-700 shadow-md transition-colors">Guardar Convocatoria</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};