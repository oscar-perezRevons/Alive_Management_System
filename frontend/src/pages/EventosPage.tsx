import React, { useEffect, useState, useCallback } from 'react';
import { eventosService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Calendar, Trophy, Plus, MoreVertical, CheckCircle2, ArrowRight,
  AlertCircle, X, CalendarDays, MapPin, Clock, Users, Eye, 
  Layers, Check, Info, Trash2, Edit2, FileText, Upload
} from 'lucide-react';

import campamentoImg from '../assets/campamento.jpg';
import confraternizacionImg from '../assets/confraternizacion.jpg';
import viajesImg from '../assets/viajes.jpg';
import basquetImg from '../assets/basquet.jpg';
import futbolImg from '../assets/futbol.jpg';
import recreacionImg from '../assets/recreacion.jpg';

export const EventosPage: React.FC = () => {
  const { user } = useAuthStore();
  const userCanManageEvents = user?.role === 'ADMIN';

  // Carrusel de Imágenes de Eventos Recreativos
  const [recreativoImgIndex, setRecreativoImgIndex] = useState(0);
  const recreativoImages = [campamentoImg, confraternizacionImg, viajesImg];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRecreativoImgIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Carrusel de Imágenes de Deportes
  const [deporteImgIndex, setDeporteImgIndex] = useState(0);
  const deporteImages = [basquetImg, futbolImg, recreacionImg];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDeporteImgIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Normalización de roles grupales
  const normGroupRole = (user?.groupRole || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[_\s]+/g, '')
    .trim();

  // Lider, Colider, Tesorero (y Admin) pueden registrar la participación
  const canRegisterGroup = user?.role === 'ADMIN' || ['LIDER', 'SUBLIDER', 'COLIDER', 'TESORERO', 'TESORERA'].includes(normGroupRole);

  // Lider, Colider, Secretario (y Admin) pueden modificar/tickear los participantes
  const canManageAttendance = user?.role === 'ADMIN' || ['LIDER', 'SUBLIDER', 'COLIDER', 'SECRETARIO', 'SECRETARIA'].includes(normGroupRole);

  // Estados del modal de Asistencia
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [checkedMemberIds, setCheckedMemberIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const openAttendanceModal = async (event: any, participation: any) => {
    setSelectedAttendanceEvent(event);
    setIsAttendanceModalOpen(true);
    setAttendanceLoading(true);
    try {
      const res = await eventosService.getMyGroupMembers();
      setGroupMembers(res.data.members || []);
      setGroupName(res.data.groupName || '');
      
      const confirmedStr = participation.confirmedMembers || '';
      const ids = confirmedStr ? confirmedStr.split(',').map(Number).filter((id: number) => !isNaN(id)) : [];
      setCheckedMemberIds(ids);
    } catch (error) {
      triggerNotification('Error', 'No se pudieron cargar los integrantes del grupo.', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleMember = (memberId: number) => {
    if (!canManageAttendance) return;
    setCheckedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  const saveAttendance = async () => {
    if (!selectedAttendanceEvent) return;
    setSavingAttendance(true);
    try {
      await eventosService.updateConfirmedMembers(selectedAttendanceEvent.id, checkedMemberIds);
      triggerNotification('Asistencia Guardada', 'La lista de participantes del grupo ha sido actualizada.', 'success');
      setIsAttendanceModalOpen(false);
      loadData();
    } catch (error: any) {
      triggerNotification('Error', error.response?.data?.message || 'No se pudo guardar la asistencia.', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const [events, setEvents] = useState<any[]>([]);
  const [myParticipations, setMyParticipations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [kpis, setKpis] = useState({ eventosProgramados: 0, gpInscritosMes: 0, eventosProximos: 0, participacionesTotales: 0 });
  const [loading, setLoading] = useState(false);
  
  const [activeTabRecreativos, setActiveTabRecreativos] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');
  const [activeTabDeportes, setActiveTabDeportes] = useState<'Próximos' | 'En Curso' | 'Finalizados'>('Próximos');
  const [selectedCategoryView, setSelectedCategoryView] = useState<'ALL' | 'RECREATIVO' | 'DEPORTE'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<number | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [eventIdToLeave, setEventIdToLeave] = useState<number | null>(null);

  const [formFields, setFormFields] = useState({
    title: '', description: '', category: 'RECREATIVO', typeTag: '',
    startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto',
    imageUrl: '', pdfUrl: ''
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
      title: '', description: '', category, typeTag: '',
      startDate: '', timeSlot: '', location: '', maxSpots: '15', status: 'Abierto',
      imageUrl: '', pdfUrl: ''
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
      location: event.location, maxSpots: String(event.maxSpots), status: event.status,
      imageUrl: event.imageUrl || '', pdfUrl: event.pdfUrl || ''
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

  const handleLeave = (id: number) => {
    setEventIdToLeave(id);
    setIsLeaveModalOpen(true);
  };

  const executeLeave = async () => {
    if (!eventIdToLeave) return;
    try {
      await eventosService.leave(eventIdToLeave);
      triggerNotification('Inscripción Cancelada', 'Se ha revocado la participación del grupo.', 'success');
      setIsLeaveModalOpen(false);
      setEventIdToLeave(null);
      loadData();
    } catch (err: any) {
      triggerNotification('Error', err.response?.data?.message || 'No se pudo cancelar la inscripción.', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await eventosService.uploadFile(formData);
      setFormFields(prev => ({ ...prev, imageUrl: res.data.fileUrl }));
      triggerNotification('Subido', 'Imagen de evento cargada con éxito.', 'success');
    } catch (err) {
      triggerNotification('Error', 'No se pudo subir la imagen.', 'error');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await eventosService.uploadFile(formData);
      setFormFields(prev => ({ ...prev, pdfUrl: res.data.fileUrl }));
      triggerNotification('Subido', 'PDF informativo cargado con éxito.', 'success');
    } catch (err) {
      triggerNotification('Error', 'No se pudo subir el PDF.', 'error');
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
    <div className="space-y-6 bg-[#f0f2fc] dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 p-4 sm:p-6 font-sans antialiased selection:bg-violet-500 selection:text-white">
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes border-glow-indigo {
          0% { border-color: #818cf8; box-shadow: 0 0 15px rgba(129, 140, 248, 0.12); }
          50% { border-color: #f472b6; box-shadow: 0 0 25px rgba(244, 114, 182, 0.22); }
          100% { border-color: #818cf8; box-shadow: 0 0 15px rgba(129, 140, 248, 0.12); }
        }
        @keyframes border-glow-emerald {
          0% { border-color: #34d399; box-shadow: 0 0 15px rgba(52, 211, 153, 0.12); }
          50% { border-color: #2dd4bf; box-shadow: 0 0 25px rgba(45, 212, 191, 0.22); }
          100% { border-color: #34d399; box-shadow: 0 0 15px rgba(52, 211, 153, 0.12); }
        }
        @keyframes border-glow-orange {
          0% { border-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.12); }
          50% { border-color: #f97316; box-shadow: 0 0 25px rgba(249, 115, 22, 0.22); }
          100% { border-color: #ec4899; box-shadow: 0 0 15px rgba(236, 72, 153, 0.12); }
        }
        .animate-glow-indigo {
          animation: border-glow-indigo 2.5s infinite ease-in-out;
        }
        .animate-glow-emerald {
          animation: border-glow-emerald 2.5s infinite ease-in-out;
        }
        .animate-glow-orange {
          animation: border-glow-orange 2.5s infinite ease-in-out;
        }
      `}</style>
      
      {/* HEADER PREMIUM */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg overflow-hidden">
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
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400">Eventos</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sistema de Convocatorias y Participación GP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Layers size={13} className="animate-pulse" />
            Gestión de Eventos
          </div>
        </div>
      </div>

      {selectedCategoryView === 'ALL' && (
        <div className="space-y-6">
          {/* Resumen General Banner Horizontal */}
          <div className="bg-white/80 dark:bg-slate-900/20 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/50 shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 via-orange-500 to-rose-500" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
            {/* Colorful glowing radial orbs behind the glass */}
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}} />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="p-3.5 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-110 transition duration-300">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Resumen General</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-350 font-black uppercase tracking-widest mt-0.5">Estadísticas del periodo activo ALIVE</p>
              </div>
            </div>
            <div className="w-full lg:w-auto flex justify-end relative z-10">
              <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white px-8 py-4.5 rounded-2xl text-center shadow-lg shadow-orange-500/30 hover:scale-[1.03] active:scale-95 transition duration-300 min-w-[200px] border border-white/20">
                <p className="text-3xl font-black leading-none tracking-tight">{events.length}</p>
                <p className="text-[10px] font-black text-white/95 uppercase tracking-widest mt-2">Eventos Programados</p>
              </div>
            </div>
          </div>

          {/* Grid de Selección de Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div 
              onClick={() => setSelectedCategoryView('RECREATIVO')}
              className="group cursor-pointer relative overflow-hidden rounded-[2rem] border-2 border-indigo-500/40 animate-glow-indigo shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[380px] p-8 gap-4"
            >
              {/* Background Carousel of movement */}
              <div className="absolute inset-0 z-0">
                {recreativoImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                      recreativoImgIndex === idx 
                        ? 'opacity-80 scale-105 z-10' 
                        : 'opacity-0 scale-100 z-0'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                {/* Lighter Gradient Tint Overlay for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-indigo-955/20 to-slate-950/15 z-20" />
              </div>

              <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition duration-300 relative z-30">
                <Users size={30} />
              </div>
              <div className="space-y-3 flex-1 flex flex-col items-center justify-between w-full relative z-30">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">Categoría 1</span>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">Eventos Recreativos</h3>
                  <p className="text-xs text-slate-200/90 font-bold leading-normal max-w-xs">Campamentos, confraternizaciones, integraciones y más.</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedCategoryView('RECREATIVO'); }} 
                  className="w-full mt-2 py-3 px-6 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-black uppercase rounded-2xl shadow-md group-hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Eventos Recreativos <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
                </button>
              </div>
            </div>
            <div 
              onClick={() => setSelectedCategoryView('DEPORTE')}
              className="group cursor-pointer relative overflow-hidden rounded-[2rem] border-2 border-orange-500/40 animate-glow-orange shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[380px] p-8 gap-4"
            >
              {/* Background Carousel of movement */}
              <div className="absolute inset-0 z-0">
                {deporteImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                      deporteImgIndex === idx 
                        ? 'opacity-80 scale-105 z-10' 
                        : 'opacity-0 scale-100 z-0'
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
                {/* Lighter Gradient Tint Overlay for better image visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-orange-950/20 to-slate-950/15 z-20" />
              </div>

              <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 border border-white/20 group-hover:scale-110 group-hover:-rotate-3 transition duration-300 relative z-20">
                <Trophy size={30} />
              </div>
              <div className="space-y-3 flex-1 flex flex-col items-center justify-between w-full relative z-20">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Categoría 2</span>
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">Deportes</h3>
                  <p className="text-xs text-slate-200/90 font-bold leading-normal max-w-xs">Campeonatos, torneos, competencias deportivas y juegos GP.</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedCategoryView('DEPORTE'); }} 
                  className="w-full mt-2 py-3 px-6 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-black uppercase rounded-2xl shadow-md group-hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Eventos Deportivos <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-1 text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">
          Sincronizando registros activos ALIVE...
        </div>
      )}

      {selectedCategoryView !== 'ALL' && (
        <div className="relative rounded-[2.5rem] p-5 sm:p-8 border bg-white/50 dark:bg-slate-900/10 backdrop-blur-2xl shadow-xl min-h-[600px] flex flex-col gap-6" style={{ borderColor: selectedCategoryView === 'RECREATIVO' ? 'rgba(129,140,248,0.25)' : 'rgba(251,146,60,0.25)', boxShadow: selectedCategoryView === 'RECREATIVO' ? '0 15px 35px -10px rgba(129,140,248,0.08)' : '0 15px 35px -10px rgba(251,146,60,0.08)' }}>
          {/* Top Image Carousel Banner */}
          <div className="relative w-full h-48 sm:h-60 rounded-3xl overflow-hidden shadow-md border border-slate-200/50 bg-slate-100 shrink-0">
            {selectedCategoryView === 'RECREATIVO' ? (
              recreativoImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                    recreativoImgIndex === idx ? 'opacity-90 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            ) : (
              deporteImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out transform ${
                    deporteImgIndex === idx ? 'opacity-90 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))
            )}
            {/* Lighter Gradient Tint Overlay on Banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 z-20" />
            
            {/* Content overlay on the banner */}
            <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 text-white">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider border border-white/25">
                  {selectedCategoryView === 'RECREATIVO' ? 'Categoría 1' : 'Categoría 2'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-2">
                  {selectedCategoryView === 'RECREATIVO' ? 'Eventos Recreativos' : 'Deportes'}
                </h2>
                <p className="text-xs text-slate-200/90 font-bold max-w-md mt-0.5">
                  {selectedCategoryView === 'RECREATIVO' 
                    ? 'Convocatorias de integración, campamentos, confraternizaciones y más.' 
                    : 'Torneos, campeonatos, competencias deportivas y juegos GP.'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-30 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ==================== RECREATIVO VIEW ==================== */}
            {selectedCategoryView === 'RECREATIVO' && (
              <>
                {/* Left Column: Events List */}
                <div className="lg:col-span-8 bg-gradient-to-br from-white/90 via-slate-50/80 to-indigo-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-indigo-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-indigo-200/80 dark:border-slate-800 shadow-xl shadow-indigo-500/5 flex flex-col gap-5 relative overflow-hidden">
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-t-3xl" />
                  <div className="flex justify-between items-center pb-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-650 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Users size={20} /></div>
                      <div>
                        <h2 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">Convocatorias</h2>
                        <p className="text-[10px] text-indigo-600/90 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Lista de eventos registrados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedCategoryView('ALL')} 
                        className="px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/80 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase tracking-wider transition duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-sm"
                      >
                        ← Volver
                      </button>
                      {userCanManageEvents && (
                        <button 
                          onClick={() => openCreateModal('RECREATIVO')} 
                          className="py-2.5 px-5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} /> Convocar
                        </button>
                      )}
                    </div>
                  </div>

                <div className="flex gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-inner">
                  {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTabRecreativos(tab)} 
                      className={`flex-1 text-center text-xs py-2.5 rounded-xl font-black uppercase tracking-wider transition-all duration-300 ${activeTabRecreativos === tab ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filterEvents('RECREATIVO', activeTabRecreativos).map(ev => (
                    <div key={ev.id} className="border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-white/90 dark:hover:bg-slate-900 hover:shadow-indigo-500/10 hover:shadow-lg transition-all duration-300 relative group flex gap-4">
                      <div className="w-32 h-32 rounded-2xl shrink-0 overflow-hidden relative shadow-md border border-slate-200/60 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/40">
                        {ev.imageUrl ? (
                           <img src={`http://localhost:5000${ev.imageUrl}`} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center text-white">
                            <Calendar size={26} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-lg">{ev.typeTag || 'Actividad'}</span>
                            {userCanManageEvents && (
                              <div className="relative">
                                <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><MoreVertical size={16} /></button>
                                {activeMenuId === ev.id && (
                                  <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 w-28 z-40 font-bold">
                                    <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition"><Edit2 size={13} /> Editar</button>
                                    <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition"><Trash2 size={13} /> Eliminar</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">{ev.title}</h3>
                          <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed mt-1.5">{ev.description || 'Sin descripción adicional en la convocatoria.'}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wide items-center">
                          <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl"><CalendarDays size={14} className="text-indigo-500" /> {ev.startDate}</span>
                          <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl"><MapPin size={14} className="text-indigo-500" /> {ev.location}</span>
                          {ev.pdfUrl && (
                            <a href={`http://localhost:5000${ev.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400/30 shadow-md shadow-rose-500/20 px-3 py-1.5 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all duration-200">
                              <FileText size={14} /> PDF Adjunto
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5"><Users size={14} /> Inscritos: {ev.participations?.length || 0} / {ev.maxSpots} GP</span>
                          {(() => {
                            const groupParticipation = myParticipations.find((p: any) => p.eventId === ev.id);
                            if (groupParticipation) {
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5"><CheckCircle2 size={14} /> INSCRITO</span>
                                  <button onClick={() => openAttendanceModal(ev, groupParticipation)} className="py-2 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5">
                                    {canManageAttendance ? <Check size={14} /> : <Eye size={14} />} {canManageAttendance ? 'Asistencia' : 'Ver Asistencia'}
                                  </button>
                                  {canManageAttendance && (
                                    <button onClick={() => handleLeave(ev.id)} className="py-2 px-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 text-xs font-black rounded-xl hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-200 flex items-center gap-1.5"><X size={14} /> Cancelar</button>
                                  )}
                                </div>
                              );
                            }
                            if (ev.status === 'Abierto') {
                              return canRegisterGroup ? (
                                <button onClick={() => handleJoin(ev.id)} className="py-2 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"><Plus size={16} /> Participar</button>
                              ) : (
                                <span className="py-2 px-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-not-allowed"><Plus size={14} /> Inscribir GP</span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filterEvents('RECREATIVO', activeTabRecreativos).length === 0 && (
                    <div className="text-center py-16 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">No hay convocatorias vigentes.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Registrations */}
              <div className="lg:col-span-4 bg-gradient-to-br from-white/90 via-slate-50/80 to-violet-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-violet-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-violet-200/80 dark:border-slate-800 shadow-xl shadow-violet-500/5 flex flex-col gap-5 relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-t-3xl" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0"><CheckCircle2 size={20} /></div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">
                      Mi Participación
                    </h3>
                    <p className="text-[10px] text-violet-600/90 dark:text-violet-400 font-bold uppercase tracking-wider mt-0.5">Eventos recreativos de tu grupo pequeño</p>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {myParticipations.filter(p => p.event?.category === 'RECREATIVO').map(part => (
                    <div key={part.id} className="p-4 bg-white/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-lg tracking-wider">{part.event?.typeTag || 'Actividad'}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 shrink-0"><CheckCircle2 size={12}/> {part.status}</span>
                        </div>
                        <h4 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight leading-snug">{part.event?.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-slate-800 pt-3">
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><CalendarDays size={12} className="text-violet-500" /> {part.event?.startDate}</span>
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><MapPin size={12} className="text-violet-500" /> {part.event?.location}</span>
                      </div>
                      <div className="flex justify-end items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                        <button 
                          onClick={() => openDetailsModal(part)}
                          className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 hover:text-white transition-all border border-indigo-100 dark:border-indigo-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                          title="Ver Ficha"
                        >
                          <Eye size={14} /> Ver Ficha
                        </button>
                        {canManageAttendance && (
                          <button 
                            onClick={() => handleLeave(part.eventId)}
                            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-100 dark:border-rose-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                            title="Cancelar Inscripción"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {myParticipations.filter(p => p.event?.category === 'RECREATIVO').length === 0 && (
                    <div className="text-center py-14 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                      <Layers size={24} className="text-violet-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">No estás participando en esta categoría.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

      {/* ==================== DEPORTE VIEW ==================== */}
      {selectedCategoryView === 'DEPORTE' && (
        <>
          {/* Left Column: Events List */}
          <div className="lg:col-span-8 bg-gradient-to-br from-white/90 via-slate-50/80 to-amber-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-amber-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-amber-200/80 dark:border-slate-800 shadow-xl shadow-amber-500/5 flex flex-col gap-5 relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-t-3xl" />
            <div className="flex justify-between items-center pb-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20"><Trophy size={20} /></div>
                    <div>
                      <h2 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">Convocatorias</h2>
                      <p className="text-[10px] text-orange-600/90 dark:text-orange-400 font-bold uppercase tracking-wider mt-0.5">Lista de eventos registrados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedCategoryView('ALL')} 
                      className="px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/80 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase tracking-wider transition duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-sm"
                    >
                      ← Volver
                    </button>
                    {userCanManageEvents && (
                      <button 
                        onClick={() => openCreateModal('DEPORTE')} 
                        className="py-2.5 px-5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 text-white text-xs font-black rounded-xl shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Convocar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-inner">
                  {(['Próximos', 'En Curso', 'Finalizados'] as const).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTabDeportes(tab)} 
                      className={`flex-1 text-center text-xs py-2.5 rounded-xl font-black uppercase tracking-wider transition-all duration-300 ${activeTabDeportes === tab ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filterEvents('DEPORTE', activeTabDeportes).map(ev => (
                    <div key={ev.id} className="border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:border-orange-300 dark:hover:border-orange-700/60 hover:bg-white/90 dark:hover:bg-slate-900 hover:shadow-orange-500/10 hover:shadow-lg transition-all duration-300 relative group flex gap-4">
                      <div className="w-32 h-32 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-md border border-slate-200/60 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/40">
                        {ev.imageUrl ? (
                          <img src={`http://localhost:5000${ev.imageUrl}`} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex flex-col items-center justify-center text-white">
                            <Trophy size={28} className="opacity-95" />
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-white/90">JA MATCH</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 rounded-lg truncate">{ev.typeTag || 'Torneo'}</span>
                            {userCanManageEvents && (
                              <div className="relative">
                                <button onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><MoreVertical size={16} /></button>
                                {activeMenuId === ev.id && (
                                  <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 w-28 z-40 font-bold">
                                    <button type="button" onClick={() => openEditModal(ev)} className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"><Edit2 size={13} /> Editar</button>
                                    <button type="button" onClick={() => triggerDeleteConfirm(ev.id)} className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition"><Trash2 size={13} /> Eliminar</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">{ev.title}</h3>
                          <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed mt-1.5">{ev.description || 'Sin descripción adicional en la convocatoria.'}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wide items-center">
                          <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl"><CalendarDays size={14} className="text-orange-500" /> {ev.startDate}</span>
                          <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl"><MapPin size={14} className="text-orange-500" /> {ev.location}</span>
                          {ev.pdfUrl && (
                            <a 
                              href={`http://localhost:5000${ev.pdfUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-rose-500 to-red-600 border border-rose-400/30 shadow-md shadow-rose-500/20 px-3 py-1.5 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <FileText size={14} /> PDF Adjunto
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                          <span className="text-xs text-orange-700 dark:text-orange-300 font-black uppercase bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5"><Users size={14} /> Equipos: {ev.participations?.length || 0} / {ev.maxSpots} GP</span>
                          {(() => {
                            const groupParticipation = myParticipations.find((p: any) => p.eventId === ev.id);
                            if (groupParticipation) {
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5"><CheckCircle2 size={14} /> INSCRITO</span>
                                  <button
                                    onClick={() => openAttendanceModal(ev, groupParticipation)}
                                    className="py-2 px-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                                  >
                                    {canManageAttendance ? <Check size={14} /> : <Eye size={14} />}
                                    {canManageAttendance ? 'Asistencia' : 'Ver Asistencia'}
                                  </button>
                                  {canManageAttendance && (
                                    <button
                                      onClick={() => handleLeave(ev.id)}
                                      className="py-2 px-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60 text-xs font-black rounded-xl hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                                    >
                                      <X size={14} /> Cancelar
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (ev.status === 'Abierto') {
                              return canRegisterGroup ? (
                                <button 
                                  onClick={() => handleJoin(ev.id)} 
                                  className="py-2 px-6 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                                >
                                  <Plus size={16} /> Participar
                                </button>
                              ) : (
                                <span className="py-2 px-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-not-allowed"><Plus size={14} /> Inscribir GP</span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filterEvents('DEPORTE', activeTabDeportes).length === 0 && (
                    <div className="text-center py-16 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">No hay convocatorias vigentes.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Registrations */}
              <div className="lg:col-span-4 bg-gradient-to-br from-white/90 via-slate-50/80 to-rose-50/15 dark:from-slate-900/90 dark:via-slate-900/95 dark:to-rose-950/40 backdrop-blur-2xl p-6 rounded-3xl border border-rose-200/80 dark:border-slate-800 shadow-xl shadow-rose-500/5 flex flex-col gap-5 relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 rounded-t-3xl" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0"><Trophy size={20} /></div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wide">
                      Mi Participación
                    </h3>
                    <p className="text-[10px] text-orange-600/90 dark:text-orange-400 font-bold uppercase tracking-wider mt-0.5">Competencias de tu grupo pequeño</p>
                  </div>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {myParticipations.filter(p => p.event?.category === 'DEPORTE').map(part => (
                    <div key={part.id} className="p-4 bg-white/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/60 rounded-lg tracking-wider">{part.event?.typeTag || 'Torneo'}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 rounded-lg flex items-center gap-1 shrink-0"><CheckCircle2 size={12}/> {part.status}</span>
                        </div>
                        <h4 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight leading-snug">{part.event?.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold border-t border-slate-200 dark:border-slate-800 pt-3">
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><CalendarDays size={12} className="text-orange-500" /> {part.event?.startDate}</span>
                        <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"><MapPin size={12} className="text-orange-500" /> {part.event?.location}</span>
                      </div>
                      <div className="flex justify-end items-center pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                        <button 
                          onClick={() => openDetailsModal(part)}
                          className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-500 text-orange-600 dark:text-orange-300 hover:text-white transition-all border border-orange-100 dark:border-orange-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                          title="Ver Ficha"
                        >
                          <Eye size={14} /> Ver Ficha
                        </button>
                        {canManageAttendance && (
                          <button 
                            onClick={() => handleLeave(part.eventId)}
                            className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-100 dark:border-rose-800/60 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 duration-200 font-black text-[10px] uppercase tracking-wide"
                            title="Cancelar Inscripción"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {myParticipations.filter(p => p.event?.category === 'DEPORTE').length === 0 && (
                    <div className="text-center py-14 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                      <Trophy size={24} className="text-orange-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">No estás participando en esta categoría.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}

      {/* MODALS AREA */}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-rose-500 to-orange-450 rounded-[28px] max-w-sm w-full shadow-2xl shadow-rose-950/10 overflow-hidden transform scale-100 transition-all duration-200">
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-[27px] p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60 shadow-inner">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">¿Eliminar Convocatoria?</h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-bold leading-relaxed">
                  ¿Estás completamente seguro de que deseas eliminar permanentemente esta convocatoria? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setEventIdToDelete(null); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer animate-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-650 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 cursor-pointer animate-press"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-rose-500 to-orange-450 rounded-[28px] max-w-sm w-full shadow-2xl shadow-rose-950/10 overflow-hidden transform scale-100 transition-all duration-200">
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-[27px] p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60 shadow-inner">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">¿Cancelar Participación?</h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 font-bold leading-relaxed">
                  ¿Estás seguro de que deseas cancelar la participación de tu grupo en este evento? Se perderán las asistencias registradas.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLeaveModalOpen(false); setEventIdToLeave(null); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer animate-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeLeave}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-650 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-rose-600/10 cursor-pointer animate-press"
                >
                  Sí, Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedDetails && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 rounded-[26px] max-w-md w-full shadow-2xl shadow-indigo-950/10 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 rounded-[25px] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-650 to-fuchsia-600 p-5 text-white flex justify-between items-center relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                <div className="flex items-center gap-2 relative z-10">
                  <Info size={18} />
                  <h3 className="font-black text-sm uppercase tracking-wider">Ficha Técnica de Participación</h3>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors relative z-10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 rounded-md">{selectedDetails.event?.category}</span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-1">{selectedDetails.event?.title}</h2>
                </div>
                {selectedDetails.event?.imageUrl && (
                  <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <img src={`http://localhost:5000${selectedDetails.event.imageUrl}`} className="w-full h-full object-cover" alt="Vista previa de portada" />
                  </div>
                )}
                <div className="bg-indigo-50/30 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-800/40 rounded-xl p-3 text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                  {selectedDetails.event?.description || "Este evento no cuenta con una descripción extendida registrada en la convocatoria."}
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 font-bold text-slate-650 dark:text-slate-300 shadow-sm">
                  <div className="space-y-1 border-r border-slate-200/80 dark:border-slate-700/80 pr-2">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Fecha y Jornada</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><CalendarDays size={13} className="text-indigo-500" /> {selectedDetails.event?.startDate}</p>
                  </div>
                  <div className="space-y-1 pl-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Hora Programada</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><Clock size={13} className="text-indigo-500" /> {selectedDetails.event?.timeSlot || 'Por definir'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 font-bold text-slate-650 dark:text-slate-300 shadow-sm">
                  <div className="space-y-1 border-r border-slate-200/80 dark:border-slate-700/80 pr-2">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Ubicación / Sede</p>
                    <p className="font-black flex items-center gap-1 text-slate-700 dark:text-slate-200"><MapPin size={13} className="text-indigo-500" /> {selectedDetails.event?.location}</p>
                  </div>
                  <div className="space-y-1 pl-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-black">Grupo Registrado</p>
                    <p className="font-black flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Check size={13} /> {selectedDetails.groupSmall?.name}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60 animate-press">Cerrar Ficha</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-start gap-3.5 animate-slideUp">
          <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{notification.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={15} /></button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[26px] max-w-md w-full shadow-2xl shadow-indigo-950/10 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 rounded-[25px] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-650 p-5 text-white flex justify-between items-center relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                <div className="flex items-center gap-2 relative z-10">
                  <Edit2 size={18} />
                  <h3 className="font-black text-sm uppercase tracking-wider">{editingEvent ? 'Configurar Convocatoria' : 'Nueva Convocatoria'}</h3>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors relative z-10"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-transparent">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Título de la Convocatoria</label>
                <input type="text" required value={formFields.title} onChange={(e) => setFormFields({ ...formFields, title: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" placeholder="Ej. Retiro Espiritual" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Descripción / Detalles</label>
                <textarea rows={2} value={formFields.description} onChange={(e) => setFormFields({ ...formFields, description: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" placeholder="Detalles de la convocatoria..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Calendar size={12} className="text-indigo-500" /> Fecha
                  </label>
                  <input type="date" required value={formFields.startDate} onChange={(e) => setFormFields({ ...formFields, startDate: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-indigo-500" /> Sede / Ubicación
                  </label>
                  <input type="text" value={formFields.location} onChange={(e) => setFormFields({ ...formFields, location: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" placeholder="Lugar del evento" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Clock size={12} className="text-indigo-500" /> Hora
                  </label>
                  <input type="time" required value={formFields.timeSlot} onChange={(e) => setFormFields({ ...formFields, timeSlot: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Layers size={12} className="text-indigo-500" /> Etiqueta Visual
                  </label>
                  <input type="text" placeholder="e.g. Campamento" value={formFields.typeTag} onChange={(e) => setFormFields({ ...formFields, typeTag: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Users size={12} className="text-indigo-500" /> Cupo Máximo
                  </label>
                  <input type="number" value={formFields.maxSpots} onChange={(e) => setFormFields({ ...formFields, maxSpots: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200" />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Info size={12} className="text-indigo-500" /> Estado Operativo
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white flex items-center justify-between text-left cursor-pointer transition-all duration-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        formFields.status === 'Abierto' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                        formFields.status === 'En Curso' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
                      }`} />
                      {formFields.status}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[9px]">▼</span>
                  </button>
                  
                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn font-bold backdrop-blur-xl">
                      {(['Abierto', 'En Curso', 'Finalizado'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFormFields({ ...formFields, status: opt });
                            setIsStatusDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            opt === 'Abierto' ? 'bg-emerald-400' :
                            opt === 'En Curso' ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ARCHIVOS Y DOCUMENTOS PRE-CARGADOS */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <Upload size={12} className="text-indigo-500" /> Imagen Cover
                  </label>
                  {formFields.imageUrl ? (
                    <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none group">
                      <img src={`http://localhost:5000${formFields.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Vista previa" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => setFormFields(prev => ({ ...prev, imageUrl: '' }))}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer shadow-lg transform hover:scale-110 transition-all"
                          title="Quitar imagen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-28 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={14} className="text-indigo-500" />
                      </div>
                      Subir Imagen
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="space-y-1 flex flex-col justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                    <FileText size={12} className="text-indigo-500" /> PDF Informativo
                  </label>
                  {formFields.pdfUrl ? (
                    <div className="relative w-full h-28 rounded-2xl border border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-rose-100/50 dark:shadow-none group overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-2">
                        <FileText size={18} className="text-rose-500" />
                      </div>
                      <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest w-full truncate">PDF Listo</span>
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button 
                          type="button" 
                          onClick={() => setFormFields(prev => ({ ...prev, pdfUrl: '' }))}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 cursor-pointer shadow-lg transform hover:scale-110 transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Quitar PDF"
                        >
                          <Trash2 size={12} /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-28 border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={14} className="text-indigo-500" />
                      </div>
                      Subir PDF
                      <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer animate-press">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer animate-press">
                  <Check size={16} /> {editingEvent ? 'Guardar Cambios' : 'Crear Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

      {isAttendanceModalOpen && selectedAttendanceEvent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="p-[1.5px] bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 rounded-[26px] max-w-md w-full shadow-2xl shadow-indigo-950/10 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-[25px] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-650 via-violet-600 to-emerald-650 p-5 text-white flex justify-between items-center relative overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                <div className="flex items-center gap-2 relative z-10">
                  <Users size={18} />
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider">Asistencia de Grupo</h3>
                    <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-widest mt-0.5">GP: {groupName || 'Cargando...'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAttendanceModalOpen(false)} 
                  className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer relative z-10"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                  {selectedAttendanceEvent.category}
                </span>
                <h2 className="text-base font-black text-[#1e1b4b] dark:text-white mt-1 leading-tight">
                  {selectedAttendanceEvent.title}
                </h2>
              </div>

              {!canManageAttendance && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                  <p className="font-bold leading-normal">
                    Vista de Lectura: Solo el Líder, Colíder o Secretario pueden registrar y modificar la lista de participantes.
                  </p>
                </div>
              )}

              {attendanceLoading ? (
                <div className="py-8 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">
                  Cargando integrantes del GP...
                </div>
              ) : groupMembers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Integrantes vinculados ({checkedMemberIds.length} confirmados):
                  </p>
                  {groupMembers.map((member) => {
                    const isChecked = checkedMemberIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleMember(member.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        } ${canManageAttendance ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.01]' : 'cursor-default'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isChecked ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-400'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs truncate">{member.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {member.roleInGP || 'Integrante'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center shrink-0">
                          {canManageAttendance ? (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by div onClick
                              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer accent-emerald-500"
                            />
                          ) : (
                            isChecked ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">
                                ✓
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center text-[10px] font-black">
                                -
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider italic">
                  No hay integrantes vinculados a tu grupo pequeño.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAttendanceModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer animate-press"
                >
                  Cerrar
                </button>
                {canManageAttendance && groupMembers.length > 0 && (
                  <button 
                    type="button" 
                    onClick={saveAttendance}
                    disabled={savingAttendance}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-violet-650 to-emerald-650 text-white rounded-xl font-black uppercase tracking-wider shadow-md shadow-indigo-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50 animate-press"
                  >
                    {savingAttendance ? 'Guardando...' : 'Guardar Asistencia'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
};