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

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('¿Deseas remover este punto del programa oficial sabático?')) {
      await programService.deleteEvent(id);
      loadScheduleData();
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 bg-[#f4f6fc] p-4 min-h-screen">
      
      {/* PANEL DE CONTROL VISTA WEB */}
      <div className="flex items-center gap-3 px-1">
        <div className="text-[#3730a3] bg-white p-2.5 rounded-2xl shadow-xs"><Calendar size={26} className="stroke-[2.5]" /></div>
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Programa General</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sistema Oficial de Programación</p>
        </div>
      </div>

      {/* SECCIÓN ACCIONES RÁPIDAS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-[#3730a3] rounded-full flex items-center justify-center shrink-0"><ListCollapse size={24} /></div>
          <div>
            <h3 className="text-sm font-black text-[#1e1b4b]">Programa Oficial Sabático</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Estructura vigente y panel interactivo del itinerario de la iglesia.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsPreviewModalOpen(true)}
          className="w-full sm:w-auto bg-[#3730a3] hover:bg-indigo-700 text-white text-xs font-black py-2.5 px-5 rounded-xl transition shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          <Eye size={13} /> Ver Programa Oficial (Vista Previa) →
        </button>
      </div>

      {/* PANEL TABLA GENERAL EN ANCHO COMPLETO */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-5">
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-indigo-600" />
            <div>
              <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider">Puntos de Actividades Registrados</h3>
              <p className="text-[10px] text-slate-400 font-bold">Gestión continua de eventos e himnos dominicales/sabáticos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentUserRole === 'ADMIN' && (
              <button onClick={openCreateModal} className="text-xs font-black bg-indigo-50 text-[#3730a3] py-2.5 px-4 rounded-xl border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100 transition-all"><Plus size={13} /> Agregar Punto</button>
            )}
            <button onClick={generatePDFReport} className="text-xs font-black bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"><Download size={13} /> Exportar Reporte</button>
          </div>
        </div>

        <div className="overflow-x-auto text-xs font-bold">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-4 text-center w-12">#</th>
                <th className="p-4 w-28">Horario</th>
                <th className="p-4">Punto del Programa</th>
                <th className="p-4">Responsable</th>
                {currentUserRole === 'ADMIN' && <th className="p-4 text-center w-24">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white text-xs">
              {events.map((event, index) => (
                <tr key={event.id} className={`hover:bg-slate-50/40 transition-all ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                  <td className="p-4 text-center font-mono text-slate-400 font-black">{index + 1}</td>
                  <td className="p-4 font-mono text-[#3730a3] font-black flex items-center gap-1"><Clock size={12} className="text-slate-300" /> {event.timeSlot}</td>
                  <td className="p-4 font-black text-slate-800 uppercase tracking-tight text-xs">
                    <div>{event.title}</div>
                    {event.description && <span className="text-[10px] text-slate-400 font-medium normal-case block mt-0.5">{event.description}</span>}
                  </td>
                  <td className="p-4 text-slate-500 font-bold text-xs uppercase">{event.responsible || '-'}</td>
                  {currentUserRole === 'ADMIN' && (
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEditModal(event)} className="p-1.5 text-slate-500 hover:bg-slate-50 border border-slate-100 rounded-lg"><Pencil size={11} /></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-lg"><Trash2 size={11} /></button>
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
          <div className="bg-white w-full max-w-2xl p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-4 mx-4 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-[#3730a3] rounded-xl"><ListCollapse size={18} /></div>
                <div>
                  <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-tight">Vista Previa Parcial</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Estado actual de la programación oficial sabática</p>
                </div>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl bg-slate-50/50">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase">No hay puntos registrados en el programa parcial todavía.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1e1b4b] text-white text-[10px] uppercase tracking-wider sticky top-0 z-10">
                      <th className="p-3 text-center w-12 rounded-tl-xl">#</th>
                      <th className="p-3 w-28">Horario</th>
                      <th className="p-3">Actividad / Punto</th>
                      <th className="p-3 rounded-tr-xl">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 bg-white">
                    {events.map((event, index) => (
                      <tr key={event.id} className={`border-b border-slate-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'} ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                        <td className="p-3 text-center font-mono text-slate-400 font-black">{index + 1}</td>
                        <td className="p-3 font-mono text-[#3730a3] font-black">{event.timeSlot}</td>
                        <td className="p-3 font-black text-slate-800 uppercase tracking-tight">
                          <div>{event.title}</div>
                          {event.description && <span className="text-[10px] text-slate-400 font-medium normal-case block mt-0.5">{event.description}</span>}
                        </td>
                        <td className="p-3 text-slate-500 font-bold uppercase">{event.responsible || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="px-5 py-2.5 bg-[#1e1b4b] hover:bg-indigo-900 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all">Cerrar Vista Previa</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN BLOQUE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-[#1e1b4b] uppercase flex items-center gap-1.5"><Clock size={14} /> Configurar Bloque</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Horario</label>
                  <input type="text" required placeholder="Ej: 16:30" value={form.timeSlot} onChange={(e) => setForm({...form, timeSlot: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Orden</label>
                  <input type="number" required placeholder="Ej: 1" value={form.order} onChange={(e) => setForm({...form, order: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Punto del Programa</label>
                <select value={form.title} onChange={(e) => handleTitleDropdownChange(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none">
                  {programPoints.map((point) => (<option key={point} value={point}>{point}</option>))}
                  <option value="CUSTOM" className="text-indigo-600 font-black">+ Otro (Agregar nuevo punto...)</option>
                </select>
              </div>

              {showCustomTitleInput && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-black text-indigo-600 uppercase">Nuevo Punto *</label>
                  <input type="text" required={showCustomTitleInput} placeholder="Ej: Alabanza" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full p-2.5 bg-white border-2 border-indigo-200 rounded-xl font-bold text-slate-800 focus:outline-none" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descripción de la actividad</label>
                <textarea rows={2} placeholder="Ej: Himno congregacional..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none resize-none" />
              </div>

              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Responsable Asignado</label><input type="text" required placeholder="Responsable..." value={form.responsible} onChange={(e) => setForm({...form, responsible: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none" /></div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-600">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#3730a3] text-white rounded-xl font-black shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK POPUP */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl text-center space-y-4 mx-4">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">✓</div>
            <div className="space-y-1"><h4 className="text-sm font-black text-slate-800 uppercase">{alertConfig.title}</h4><p className="text-xs text-slate-500 font-semibold">{alertConfig.message}</p></div>
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className="w-full py-2.5 bg-[#3730a3] text-white font-black text-xs rounded-xl">Entendido</button>
          </div>
        </div>
      )}

    </div>
  );
};