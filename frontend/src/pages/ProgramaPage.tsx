import React, { useEffect, useState, useCallback } from 'react';
import { programService } from '../services/api';
import { 
  Calendar, Clock, Pencil, Trash2,
  X, FileText, Download, ListCollapse, 
  Plus, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import logoImage from '../assets/logo.png'; 
import bannerImage from '../assets/banner-default.png'; 

const DEFAULT_PROGRAM_POINTS = [
  "Espacio de cantos",
  "Cántico inicial",
  "Oración inicial",
  "Matinal",
  "Concurso",
  "Conociendo amigos (opcional)",
  "Notijoven",
  "Canto",
  "Testimonio",
  "Gotitas de salud",
  "Espacio especial",
  "Recojo de ofrendas",
  "Tema central",
  "Cántico final",
  "Oración final"
];

export const ProgramaPage: React.FC = () => {
  // Simulación del rol del usuario. Cambiar a tu estado global de autenticación real si aplica
  const [currentUserRole] = useState<'ADMIN' | 'USER'>('ADMIN');

  const [events, setEvents] = useState<any[]>([]);
  const [programPoints] = useState<string[]>(DEFAULT_PROGRAM_POINTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); 
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [form, setForm] = useState({ timeSlot: '', title: '', description: '', responsible: '', order: '0' });
  const [showCustomTitleInput, setShowCustomTitleInput] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  const showAlert = useCallback((type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  }, []);

  const loadScheduleData = useCallback(async () => {
    try {
      const res = await programService.getFullSchedule();
      setEvents(res.data.events || []);
    } catch (err) {
      showAlert('error', 'Error de Red', 'No se pudo sincronizar el itinerario general sabático.');
    }
  }, [showAlert]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const convertAssetToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        resolve('');
      };
    });
  };

  const generatePDFReport = async () => {
    if (events.length === 0) return;
    const doc = new jsPDF('p', 'mm', 'a4');

    const logoBase64 = await convertAssetToBase64(logoImage);
    const bannerBase64 = await convertAssetToBase64(bannerImage);

    if (bannerBase64) {
      doc.addImage(bannerBase64, 'PNG', 0, 0, 210, 42);
    } else {
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 42, 'F');
    }

    doc.setFillColor(71, 85, 105); 
    doc.rect(0, 42, 210, 1, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 12, 10, 22, 22);
    }

    doc.setTextColor(255, 255, 255); 
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PROGRAMA GENERAL DEL CULTO', 38, 18);
    doc.text('DE MARANATA ADORACIÓN', 38, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('1. PROGRAMA GENERAL', 105, 54, { align: 'center' });

    const tableRows = events.map((e) => [
      e.timeSlot,
      `${e.title.toUpperCase()}\n${e.description ? e.description : ''}`,
      (e.responsible || '-').toUpperCase()
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['HORA', 'ACTIVIDAD', 'RESPONSABLE']], 
      body: tableRows,
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        fontSize: 11,
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: { 
        fontSize: 10, 
        textColor: [30, 41, 59], 
        font: 'Helvetica', 
        valign: 'middle',
        lineColor: [203, 213, 225], 
        lineWidth: 0.4
      },
      styles: { 
        overflow: 'linebreak', 
        cellPadding: 5.5,
        fillColor: [255, 255, 255] 
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249] 
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', cellWidth: 32, fontSize: 12.5, textColor: [15, 23, 42] },
        1: { halign: 'center', cellWidth: 98, fontStyle: 'bold' }, 
        2: { fontStyle: 'bold', halign: 'center', cellWidth: 50 } 
      },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    const totalPages = doc.getNumberOfPages();
    if (logoBase64) {
      doc.setPage(totalPages);
      doc.addImage(logoBase64, 'PNG', 175, 262, 18, 18);
    }

    doc.save(`Programa_General_Maranata_${new Date().toISOString().split('T')[0]}.pdf`);
    showAlert('success', 'Reporte PDF Exportado', 'Se ha guardado el informe con la tabla estilizada a color.');
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setForm({ timeSlot: '', title: programPoints[0] || '', description: '', responsible: '-', order: (events.length + 1).toString() });
    setShowCustomTitleInput(false);
    setCustomTitle('');
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    const isCustom = !programPoints.includes(event.title);
    setForm({ timeSlot: event.timeSlot, title: isCustom ? 'CUSTOM' : event.title, description: event.description || '', responsible: event.responsible, order: event.order.toString() });
    setShowCustomTitleInput(isCustom);
    setCustomTitle(isCustom ? event.title : '');
    setIsModalOpen(true);
  };

  const handleTitleDropdownChange = (value: string) => {
    if (value === 'CUSTOM') {
      setShowCustomTitleInput(true);
      setForm({ ...form, title: 'CUSTOM' });
    } else {
      setShowCustomTitleInput(false);
      setForm({ ...form, title: value });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = showCustomTitleInput ? customTitle.trim() : form.title;
    if (!form.timeSlot || !finalTitle) return;

    try {
      const submissionData = { ...form, title: finalTitle, order: parseInt(form.order) };
      if (editingEvent) {
        await programService.updateEvent(editingEvent.id, submissionData);
      } else {
        await programService.createEvent(submissionData);
      }
      setIsModalOpen(false);
      loadScheduleData();
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo guardar la información del programa.');
    }
  };

  const handleDeleteEvent = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteEvent = async () => {
    if (deleteConfirmId !== null) {
      await programService.deleteEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      loadScheduleData();
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f0f2fc] p-4 min-h-screen transition-colors duration-300">
      
      {/* ═══════ HEADER CON GRADIENTE ANIMADO ═══════ */}
      <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-lg transition-all duration-300 z-20 overflow-hidden">
        {/* Barra de gradiente animada superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        
        <div className="flex items-center gap-3 w-full pt-1">
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Calendar size={26} className="stroke-[2.5] text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">📅 Programa General</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sistema Oficial de Programación</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-[11px] font-black uppercase tracking-wider text-indigo-600">
          <Calendar size={13} className="animate-pulse" />
          Programa Sabático
        </div>
      </div>

      {/* SECCIÓN ACCIONES RÁPIDAS */}
      <div className="bg-white p-5 rounded-3xl border-l-4 border-l-indigo-500 border border-slate-200/60 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group transition-all duration-300">
        <div className="absolute right-0 top-0 opacity-5 rotate-12 pointer-events-none transition-transform group-hover:scale-110">
          <Calendar size={120} className="text-indigo-500" />
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"><ListCollapse size={24} /></div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Programa Oficial Sabático</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Estructura vigente y panel interactivo del itinerario de la iglesia.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsPreviewModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-[11px] font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 uppercase tracking-wider flex items-center justify-center gap-1.5 relative z-10 active:scale-95"
        >
          <Eye size={14} className="stroke-[3]" /> Ver Programa Oficial (Vista Previa) →
        </button>
      </div>

      {/* PANEL TABLA GENERAL EN ANCHO COMPLETO */}
      <div className="bg-white dark:bg-slate-900/50 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
        <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-950/50 dark:to-indigo-950/10 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md shadow-indigo-500/20"><FileText size={14} /></div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Puntos de Actividades Registrados</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Gestión continua de eventos e himnos dominicales/sabáticos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentUserRole === 'ADMIN' && (
              <button onClick={openCreateModal} className="text-[10px] font-black uppercase text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 py-2 px-4 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-violet-500/20 hover:scale-[1.02]"><Plus size={13} className="stroke-[3]" /> Agregar Punto</button>
            )}
            <button onClick={generatePDFReport} className="text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"><Download size={13} className="stroke-[3]" /> Exportar Reporte</button>
          </div>
        </div>

        <div className="overflow-x-auto text-xs font-bold scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50/50 to-indigo-50/20 dark:from-slate-950/20 dark:to-indigo-950/5 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-wider">
                <th className="p-4 text-center w-12 pl-6">#</th>
                <th className="p-4 w-32">Horario</th>
                <th className="p-4">Punto del Programa</th>
                <th className="p-4">Responsable</th>
                {currentUserRole === 'ADMIN' && <th className="p-4 text-center w-24 pr-6">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/10 text-xs">
              {events.map((event, index) => (
                <tr key={event.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                  <td className="p-4 pl-6 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30">{index + 1}</span>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-2.5 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-500/30 px-4 py-2 rounded-2xl shadow-md">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 animate-pulse shadow-sm" />
                      <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 font-black text-xl md:text-2xl tracking-tighter">{event.timeSlot}</span>
                    </div>
                  </td>
                  <td className="p-4 font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-sm">
                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">{event.title}</div>
                    {event.description && <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold normal-case block mt-1">{event.description}</span>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase border border-emerald-100 dark:border-emerald-500/20">{event.responsible || '-'}</span>
                  </td>
                  {currentUserRole === 'ADMIN' && (
                    <td className="p-4 pr-6 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openEditModal(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-xl transition-all hover:scale-105 hover:shadow-sm" title="Editar"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-all hover:scale-105 hover:shadow-sm" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 MODAL DE VISTA PREVIA DEL PROGRAMA PARCIAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 mx-4 flex flex-col max-h-[85vh] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500" />
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg shadow-indigo-500/20"><ListCollapse size={20} /></div>
                <div>
                  <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 uppercase tracking-tight">Vista Previa Parcial</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Estado actual de la programación oficial sabática</p>
                </div>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase">No hay puntos registrados en el programa parcial todavía.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-md">
                      <th className="p-4 text-center w-12 rounded-tl-xl pl-6">#</th>
                      <th className="p-4 w-32">Horario</th>
                      <th className="p-4">Actividad / Punto</th>
                      <th className="p-4 rounded-tr-xl pr-6">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50">
                    {events.map((event, index) => (
                      <tr key={event.id} className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/30'} ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                        <td className="p-4 pl-6 text-center font-mono text-slate-400 dark:text-slate-500 font-black">{index + 1}</td>
                        <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-2.5 text-lg"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm animate-pulse" /> {event.timeSlot}</td>
                        <td className="p-4 font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                          <div>{event.title}</div>
                          {event.description && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium normal-case block mt-0.5">{event.description}</span>}
                        </td>
                        <td className="p-4 pr-6 text-slate-500 dark:text-slate-400 font-bold uppercase">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{event.responsible || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">Cerrar Vista Previa</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN BLOQUE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 space-y-4 mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 uppercase flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Configurar Bloque</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horario</label>
                  <input type="time" required value={form.timeSlot} onChange={(e) => setForm({...form, timeSlot: e.target.value})} className="w-full p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl font-black text-lg text-indigo-700 dark:text-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Orden</label>
                  <input type="number" required placeholder="Ej: 1" value={form.order} onChange={(e) => setForm({...form, order: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Punto del Programa</label>
                <select value={form.title} onChange={(e) => handleTitleDropdownChange(e.target.value)} className="w-full p-3 bg-indigo-50/50 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-700/50 rounded-xl font-black text-indigo-800 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%234f46e5%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_0.8rem_center] bg-no-repeat cursor-pointer">
                  {programPoints.map((point) => (<option key={point} value={point} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2">{point}</option>))}
                  <option value="CUSTOM" className="text-indigo-600 font-black bg-indigo-50 dark:bg-indigo-900/30 py-2">+ Otro (Agregar nuevo punto...)</option>
                </select>
              </div>

              {showCustomTitleInput && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500 uppercase">Nuevo Punto *</label>
                  <input type="text" required={showCustomTitleInput} placeholder="Ej: Alabanza" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900/50 border-2 border-indigo-200 dark:border-indigo-500/50 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all shadow-inner" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción de la actividad</label>
                <textarea rows={2} placeholder="Ej: Himno congregacional..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all shadow-inner" />
              </div>

              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Responsable Asignado</label><input type="text" required placeholder="Responsable..." value={form.responsible} onChange={(e) => setForm({...form, responsible: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner" /></div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-black text-slate-600 dark:text-slate-300 transition-all active:scale-95">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white rounded-xl font-black shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-all hover:scale-105 active:scale-95">Guardar Bloque</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK POPUP */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4 mx-4">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">✓</div>
            <div className="space-y-1"><h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{alertConfig.title}</h4><p className="text-xs text-slate-500 font-semibold">{alertConfig.message}</p></div>
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className="w-full py-2.5 bg-[#3730a3] text-white font-black text-xs rounded-xl">Entendido</button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE POPUP */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-2xl shadow-rose-500/20 text-center space-y-5 mx-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-500/20 text-rose-500">
              <Trash2 size={32} className="stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase">¿Eliminar Bloque?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Estás a punto de remover permanentemente este punto del programa oficial sabático. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmDeleteEvent} className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-colors">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};