import React, { useEffect, useState, useCallback } from 'react';
import { programService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Calendar, Clock, Pencil, Trash2,
  X, FileText, Download, ListCollapse, 
  Plus, Eye, FileUp, Sparkles, 
  Check, ExternalLink, Loader2
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
  const { user } = useAuthStore();
  const currentUserRole = user?.role || 'USER';

  const [events, setEvents] = useState<any[]>([]);
  const [programPoints] = useState<string[]>(DEFAULT_PROGRAM_POINTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); 
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [guideUrl, setGuideUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfPreviewEvents, setPdfPreviewEvents] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [clearExistingBeforeSync, setClearExistingBeforeSync] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  const loadGuideUrl = useCallback(async () => {
    try {
      const res = await programService.getGuideUrl();
      setGuideUrl(res.data.pdfUrl);
    } catch (err) {
      console.error('Error fetching guide PDF:', err);
    }
  }, []);

  useEffect(() => {
    loadScheduleData();
    loadGuideUrl();
  }, [loadScheduleData, loadGuideUrl]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showAlert('error', 'Formato Inválido', 'El archivo seleccionado debe ser un documento PDF.');
      return;
    }
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      setUploading(true);
      const res = await programService.uploadGuidePdf(formData);
      setGuideUrl(res.data.pdfUrl);
      if (res.data.parsedEvents && res.data.parsedEvents.length > 0) {
        setPdfPreviewEvents(res.data.parsedEvents);
        showAlert('success', 'PDF Escaneado con Éxito', `Se detectaron e importaron temporalmente ${res.data.parsedEvents.length} actividades del PDF guía. Revisa el panel de previsualización para realizar cambios.`);
      } else {
        showAlert('success', 'Archivo Subido', 'El programa guía oficial (PDF) ha sido cargado con éxito, pero no se detectó ninguna línea de itinerario compatible (formato: HH:MM - Actividad).');
      }
    } catch (err: any) {
      showAlert('error', 'Error al Subir', err.response?.data?.message || 'No se pudo procesar la subida.');
    } finally {
      setUploading(false);
    }
  };

  const handlePdfDelete = async () => {
    try {
      await programService.deleteGuidePdf();
      setGuideUrl(null);
      setPdfPreviewEvents([]);
      showAlert('success', 'PDF Removido', 'El programa guía ha sido eliminado de forma permanente.');
    } catch (err) {
      showAlert('error', 'Error al Eliminar', 'No se pudo eliminar el archivo PDF guía.');
    }
  };

  const downloadTemplatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Encabezado
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, 210, 32, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PLANTILLA OFICIAL DE PROGRAMACIÓN SABÁTICA', 105, 13, { align: 'center' });
    doc.setFontSize(9);
    doc.text('SISTEMA DE GESTIÓN ALIVE MARANATA - SCANNER COMPATIBLE', 105, 21, { align: 'center' });
    
    // Instrucciones
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('INSTRUCCIONES DE USO DEL SCANNER AUTOMÁTICO:', 15, 45);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    const instructions = [
      '• El lector busca líneas del itinerario basándose en el formato de hora (HH:MM) al inicio de la línea.',
      '• Formatear cada actividad respetando el separador "-" (ejemplo: 09:15 - Alabanzas).',
      '• Especificar el Responsable entre paréntesis y con el prefijo "Responsable:". Ejemplo: (Responsable: Juan Pérez)',
      '• Especificar la Descripción entre corchetes y con el prefijo "Descripción:". Ejemplo: [Descripción: Cantos alegres]',
      '• Puedes copiar el siguiente ejemplo en Word, modificar las horas y textos, exportarlo como PDF y subirlo.'
    ];
    
    let y = 52;
    instructions.forEach(line => {
      doc.text(line, 15, y);
      y += 6;
    });
    
    // Contenedor formato
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y + 2, 180, 22, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.text('FORMATO REQUERIDO:', 20, y + 9);
    doc.setFont('Courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229);
    doc.text('HH:MM - [Título Actividad] (Responsable: [Nombre]) [Descripción: [Detalle]]', 20, y + 15);
    
    // Ejemplo
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EJEMPLO DE PROGRAMA EN VIVO COMPATIBLE (COPIAR Y EDITAR):', 15, y + 36);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    const examples = [
      '09:00 - Espacio de cantos (Responsable: Ministerio de Música) [Descripción: Cantos alegres de bienvenida]',
      '09:15 - Cántico inicial (Responsable: Andreina) [Descripción: Himno congregacional oficial]',
      '09:20 - Oración inicial (Responsable: Anciano de Turno) [Descripción: Oración de consagración]',
      '09:25 - Matinal (Responsable: Secretario GP) [Descripción: Lectura diaria del devocional]',
      '10:00 - Tema central (Responsable: Predicador Asignado) [Descripción: Reflexión y sermón del día]',
      '10:45 - Cántico final (Responsable: Congregación) [Descripción: Alabanza de cierre]',
      '10:50 - Oración final (Responsable: Predicador Asignado) [Descripción: Bendición final y salida]'
    ];
    
    y = y + 43;
    examples.forEach(line => {
      doc.text(line, 15, y);
      y += 6;
    });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nota: Puedes pegar este ejemplo en Word u otro editor, personalizar las líneas, guardarlo como PDF y subirlo.', 15, y + 10);
    
    doc.save('Plantilla_Formatos_Programa_Alive.pdf');
    showAlert('success', 'Plantilla Descargada', 'Se ha guardado la plantilla PDF compatible con el scanner en tus descargas.');
  };

  const handlePreviewEventChange = (index: number, field: string, value: string) => {
    const updated = [...pdfPreviewEvents];
    updated[index] = { ...updated[index], [field]: value };
    setPdfPreviewEvents(updated);
  };

  const removePreviewEvent = (index: number) => {
    const updated = pdfPreviewEvents.filter((_, i) => i !== index);
    setPdfPreviewEvents(updated);
  };

  const handleSyncPreviewToLive = async () => {
    try {
      setSyncing(true);
      
      // 1. Limpiar eventos existentes si la opción está activa
      if (clearExistingBeforeSync) {
        for (const ev of events) {
          await programService.deleteEvent(ev.id);
        }
      }

      // 2. Insertar todos los eventos de la previsualización
      for (let i = 0; i < pdfPreviewEvents.length; i++) {
        const previewEv = pdfPreviewEvents[i];
        await programService.createEvent({
          timeSlot: previewEv.timeSlot,
          title: previewEv.title,
          description: previewEv.description,
          responsible: previewEv.responsible,
          order: i + 1
        });
      }

      // 3. Limpiar estado de previsualización y recargar
      setPdfPreviewEvents([]);
      loadScheduleData();
      showAlert('success', 'Programa Sincronizado', 'Se han inyectado todas las actividades del PDF en el programa oficial sabático.');
    } catch (err) {
      showAlert('error', 'Error al Sincronizar', 'No se pudieron inyectar todos los puntos al programa en vivo.');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAllEventsClick = () => {
    if (events.length === 0) {
      showAlert('error', 'Sin Actividades', 'No hay ninguna actividad registrada para limpiar.');
      return;
    }
    setShowClearConfirm(true);
  };

  const confirmClearAllEvents = async () => {
    try {
      setClearing(true);
      for (const ev of events) {
        await programService.deleteEvent(ev.id);
      }
      setShowClearConfirm(false);
      loadScheduleData();
      showAlert('success', 'Programa Vaciado', 'Se ha limpiado por completo el itinerario sabático.');
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo vaciar el programa.');
    } finally {
      setClearing(false);
    }
  };

  const SUGGESTED_GUIDE_POINTS = [
    { timeSlot: "16:00", title: "Espacio de cantos", description: "Himnos y cantos congregacionales", responsible: "Ministerio de Música" },
    { timeSlot: "16:15", title: "Cántico inicial", description: "Himno de apertura sabático", responsible: "Directiva Sabática" },
    { timeSlot: "16:20", title: "Oración inicial", description: "Consagración de la congregación", responsible: "Anciano de Turno" },
    { timeSlot: "16:25", title: "Matinal", description: "Lectura devocional del día", responsible: "Secretario GP" },
    { timeSlot: "16:40", title: "Notijoven", description: "Informativo y anuncios semanales", responsible: "Ministerio Joven" },
    { timeSlot: "17:00", title: "Tema central", description: "Reflexión espiritual y sermón", responsible: "Predicador Asignado" },
    { timeSlot: "17:45", title: "Cántico final", description: "Alabanza de clausura", responsible: "Congregación" },
    { timeSlot: "17:50", title: "Oración final", description: "Bendición final y despedida", responsible: "Predicador Asignado" }
  ];

  const importSuggestedPoint = async (point: typeof SUGGESTED_GUIDE_POINTS[0]) => {
    try {
      const nextOrder = events.length + 1;
      await programService.createEvent({
        timeSlot: point.timeSlot,
        title: point.title,
        description: point.description,
        responsible: point.responsible,
        order: nextOrder
      });
      loadScheduleData();
      showAlert('success', 'Punto Importado', `"${point.title}" se agregó al programa.`);
    } catch (err) {
      showAlert('error', 'Error de Conexión', 'No se pudo importar la actividad.');
    }
  };

  const importAllSuggestedPoints = async () => {
    try {
      let importedCount = 0;
      for (let i = 0; i < SUGGESTED_GUIDE_POINTS.length; i++) {
        const point = SUGGESTED_GUIDE_POINTS[i];
        const exists = events.some(e => e.title.toUpperCase() === point.title.toUpperCase());
        if (!exists) {
          await programService.createEvent({
            timeSlot: point.timeSlot,
            title: point.title,
            description: point.description,
            responsible: point.responsible,
            order: events.length + i + 1
          });
          importedCount++;
        }
      }
      loadScheduleData();
      if (importedCount > 0) {
        showAlert('success', 'Importación Masiva', 'Se ha rellenado el itinerario con los puntos recomendados de la guía.');
      } else {
        showAlert('success', 'Sin Cambios', 'Todos los puntos sugeridos ya existen en el programa actual.');
      }
    } catch (err) {
      showAlert('error', 'Error al Auto-rellenar', 'Ocurrió un error al importar los puntos.');
    }
  };

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
    <div className="space-y-4 sm:space-y-6 font-sans text-slate-800 dark:text-slate-100 bg-[#f0f2fc] dark:bg-slate-950 px-2 sm:px-6 py-4 min-h-screen transition-colors duration-300 w-full select-none pb-12">
      
      {/* ═══════ HEADER CON GRADIENTE ANIMADO ═══════ */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg transition-all duration-300 z-20 overflow-hidden">
        {/* Barra de gradiente animada superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        
        <div className="flex items-center gap-3 min-w-0 pt-1">
          <div className="relative shrink-0">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Calendar size={22} className="stroke-[2.5] text-white sm:w-6 sm:h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 dark:from-indigo-400 to-violet-700 dark:to-violet-400 truncate">📅 Programa General</h1>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">Sistema Oficial de Programación</p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/60 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 shrink-0">
          <Calendar size={13} className="animate-pulse" />
          Programa Sabático
        </div>
      </div>

      {/* SECCIÓN ACCIONES RÁPIDAS */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-l-4 border-l-indigo-500 border border-slate-200/60 dark:border-slate-800 shadow-md hover:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group transition-all duration-300">
        <div className="absolute right-0 top-0 opacity-5 rotate-12 pointer-events-none transition-transform group-hover:scale-110">
          <Calendar size={120} className="text-indigo-500" />
        </div>
        <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-400 to-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"><ListCollapse size={22} className="sm:w-6 sm:h-6" /></div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Programa Oficial Sabático</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Estructura vigente y panel interactivo del itinerario de la iglesia.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsPreviewModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-[10px] sm:text-[11px] font-black py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 uppercase tracking-wider flex items-center justify-center gap-1.5 relative z-10 active:scale-95 cursor-pointer shrink-0"
        >
          <Eye size={14} className="stroke-[3]" /> Ver Programa Oficial (Vista Previa) →
        </button>
      </div>

      {/* ═══════ PANEL DE PREVISUALIZACIÓN DEL PDF DETECTADO ═══════ */}
      {pdfPreviewEvents.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50/60 via-indigo-50/20 to-slate-50/60 dark:from-slate-900/60 dark:via-slate-900/20 dark:to-slate-950/60 rounded-3xl shadow-xl border-2 border-indigo-400 dark:border-indigo-500/50 overflow-hidden relative p-6 space-y-4 animate-fadeIn z-30">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white rounded-xl shadow-lg shadow-indigo-500/20"><Sparkles size={20} className="animate-spin animate-duration-1000" /></div>
              <div>
                <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 uppercase tracking-tight">Previsualización del Itinerario PDF Detectado</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Edita o depura las actividades extraídas de la guía antes de publicarlas en vivo.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <label className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 cursor-pointer shadow-sm transition-all hover:bg-indigo-100/40 dark:hover:bg-indigo-900/30 select-none">
                <input 
                  type="checkbox" 
                  checked={clearExistingBeforeSync} 
                  onChange={(e) => setClearExistingBeforeSync(e.target.checked)} 
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                />
                Limpiar programa en vivo antes de cargar
              </label>
              <button 
                type="button"
                onClick={() => setPdfPreviewEvents([])} 
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-[10px] font-black uppercase transition-all duration-200 active:scale-95 hover:scale-[1.02] shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <X size={12} className="stroke-[3]" /> Descartar
              </button>
              <button 
                onClick={handleSyncPreviewToLive} 
                disabled={syncing}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
              >
                {syncing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check size={12} className="stroke-[3]" /> Publicar en Vivo
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-indigo-100 dark:border-slate-800 rounded-2xl shadow-3xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/40 dark:bg-slate-950 border-b border-indigo-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-wider">
                  <th className="p-3 text-center w-12 pl-4">#</th>
                  <th className="p-3 w-28">Horario</th>
                  <th className="p-3 w-64">Título de la Actividad</th>
                  <th className="p-3 w-72">Responsable</th>
                  <th className="p-3">Descripción / Notas</th>
                  <th className="p-3 text-center w-16 pr-4">Borrar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700">
                {pdfPreviewEvents.map((event, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                    <td className="p-3 text-center pl-4 text-slate-400 font-mono text-sm">{index + 1}</td>
                    <td className="p-3">
                      <input 
                        type="time" 
                        value={event.timeSlot} 
                        onChange={(e) => handlePreviewEventChange(index, 'timeSlot', e.target.value)} 
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-indigo-700 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={event.title} 
                        onChange={(e) => handlePreviewEventChange(index, 'title', e.target.value)} 
                        placeholder="Ej: Cántico Inicial"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner uppercase"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={event.responsible} 
                        onChange={(e) => handlePreviewEventChange(index, 'responsible', e.target.value)} 
                        placeholder="Ej: Ministerio de Música"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner uppercase"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        value={event.description} 
                        onChange={(e) => handlePreviewEventChange(index, 'description', e.target.value)} 
                        placeholder="Ej: Himno congregacional"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                      />
                    </td>
                    <td className="p-3 text-center pr-4">
                      <button 
                        type="button"
                        onClick={() => removePreviewEvent(index)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:text-rose-400 dark:hover:text-rose-300 rounded-xl transition-all cursor-pointer hover:scale-110 shadow-3xs"
                        title="Remover Fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ SECCIÓN CENTRAL DE TRABAJO E ITINERARIOS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        
        {/* PANEL TABLA GENERAL EN ANCHO 2/3 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white shadow-md shadow-indigo-500/20 shrink-0"><FileText size={14} /></div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Puntos de Actividades Registrados</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Gestión continua de eventos e himnos dominicales/sabáticos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
              {currentUserRole === 'ADMIN' && (
                <>
                  <button onClick={openCreateModal} className="flex-1 sm:flex-none justify-center text-[10px] font-black uppercase text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-2.5 px-3.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-indigo-500/20 hover:scale-[1.02] cursor-pointer"><Plus size={13} className="stroke-[3]" /> Agregar Punto</button>
                  <button onClick={handleClearAllEventsClick} className="flex-1 sm:flex-none justify-center text-[10px] font-black uppercase text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 py-2.5 px-3.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-rose-500/20 hover:scale-[1.02] cursor-pointer"><Trash2 size={13} /> Limpiar Programa</button>
                </>
              )}
              <button onClick={generatePDFReport} className="w-full sm:w-auto justify-center text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"><Download size={13} className="stroke-[3]" /> Exportar Reporte</button>
            </div>
          </div>

          <div className="overflow-x-auto text-xs font-bold scrollbar-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-300 text-[10px] uppercase font-black tracking-wider">
                  <th className="p-4 text-center w-12 pl-6">#</th>
                  <th className="p-4 w-32">Horario</th>
                  <th className="p-4">Punto del Programa</th>
                  <th className="p-4">Responsable</th>
                  {currentUserRole === 'ADMIN' && <th className="p-4 text-center w-24 pr-6">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 text-xs">
                {events.map((event, index) => (
                  <tr key={event.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                    <td className="p-4 pl-6 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30">{index + 1}</span>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 px-3 py-1.5 rounded-xl shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                        <span className="font-mono text-indigo-700 dark:text-indigo-300 font-extrabold text-sm md:text-base tracking-tight">{event.timeSlot}</span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                      <div className="text-slate-900 dark:text-white font-extrabold">{event.title}</div>
                      {event.description && <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold normal-case block mt-0.5">{event.description}</span>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] uppercase border border-indigo-100 dark:border-indigo-800/60 tracking-wider">{event.responsible || '-'}</span>
                    </td>
                    {currentUserRole === 'ADMIN' && (
                      <td className="p-4 pr-6 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => openEditModal(event)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/40 rounded-xl transition-all hover:scale-110 shadow-3xs cursor-pointer" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 rounded-xl transition-all hover:scale-110 shadow-3xs cursor-pointer" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA LATERAL (PROGRAMA GUÍA Y ASISTENTE) EN ANCHO 1/3 */}
        <div className="space-y-6">
          {/* TARJETA PROGRAMA GUÍA PDF */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden relative p-5 space-y-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl shrink-0"><FileText size={18} /></div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Programa Guía Oficial</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Guía en formato PDF</p>
                </div>
              </div>
              {currentUserRole === 'ADMIN' && (
                <button 
                  onClick={downloadTemplatePDF}
                  className="text-[9px] font-black uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 py-1.5 px-3 rounded-lg shrink-0 transition duration-200 active:scale-95 flex items-center gap-1 shadow-3xs cursor-pointer"
                  title="Descargar Plantilla de Formato PDF"
                >
                  <Download size={10} /> Plantilla
                </button>
              )}
            </div>

            {/* ESTADO CARGA DEL PDF */}
            {guideUrl ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-3 shadow-3xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-650 dark:text-red-400 rounded-xl shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">Itinerario_Guia_Sabatico.pdf</h4>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Documento Activo</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a 
                    href={guideUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center" 
                    title="Ver / Descargar PDF"
                  >
                    <ExternalLink size={13} />
                  </a>
                  {currentUserRole === 'ADMIN' && (
                    <button 
                      onClick={handlePdfDelete}
                      className="p-2 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-200/60 dark:border-slate-800 cursor-pointer"
                      title="Eliminar PDF"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                {currentUserRole === 'ADMIN' ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500/50 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer group transition-all duration-300 hover:bg-indigo-50/5">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handlePdfUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="text-indigo-600 animate-spin" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider animate-pulse">Subiendo archivo PDF...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileUp size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:scale-110 transition duration-300" />
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Subir PDF Guía</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Sólo formato PDF (Máx. 5MB)</span>
                      </div>
                    )}
                  </label>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 italic text-[11px] font-bold uppercase tracking-wider">
                    No hay programa guía cargado por la administración todavía.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ASISTENTE DE PLANIFICACIÓN INTELIGENTE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden relative p-5 space-y-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 animate-pulse"><Sparkles size={18} /></div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">Asistente de Guía</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">Inserción rápida basada en el PDF guía</p>
                </div>
              </div>
              {guideUrl && events.length === 0 && (
                <button 
                  onClick={importAllSuggestedPoints}
                  className="text-[9px] font-black uppercase bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-1.5 px-3 rounded-lg shrink-0 transition duration-200 active:scale-95 hover:scale-102 flex items-center gap-1 shadow-xs shadow-indigo-500/20 cursor-pointer"
                >
                  <Sparkles size={10} className="animate-spin" /> Auto-Rellenar
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-none">
              {SUGGESTED_GUIDE_POINTS.map((point) => {
                const isAdded = events.some(e => e.title.toUpperCase() === point.title.toUpperCase());
                return (
                  <div 
                    key={point.title}
                    className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                      isAdded 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40' 
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-md shrink-0">{point.timeSlot}</span>
                        <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">{point.title}</h5>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold truncate">{point.description}</p>
                      <p className="text-[8px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Por: {point.responsible}</p>
                    </div>

                    <div className="shrink-0">
                      {isAdded ? (
                        <span className="inline-flex items-center justify-center p-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-[9px] uppercase tracking-wider gap-0.5"><Check size={11} className="stroke-[3]" /></span>
                      ) : (
                         <button
                           onClick={() => importSuggestedPoint(point)}
                           disabled={!guideUrl}
                           className={`p-1.5 rounded-xl border text-[9px] font-black transition-all ${
                             guideUrl 
                               ? 'border-indigo-100 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:scale-105 active:scale-95' 
                               : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                           }`}
                           title={guideUrl ? "Importar Punto" : "Requiere cargar el PDF guía primero"}
                         >
                           + Importar
                         </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!guideUrl && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 rounded-2xl text-[9px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                ⚠️ Sube el PDF guía para activar la importación rápida
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔍 MODAL DE VISTA PREVIA DEL PROGRAMA PARCIAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 sm:space-y-5 my-auto flex flex-col max-h-[85vh] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500" />
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 shrink-0"><ListCollapse size={18} className="sm:w-5 sm:h-5" /></div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 uppercase tracking-tight">Vista Previa Parcial</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold">Estado actual de la programación oficial sabática</p>
                </div>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 scrollbar-none">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase">No hay puntos registrados en el programa parcial todavía.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-md">
                      <th className="p-3 sm:p-4 text-center w-12 rounded-tl-xl pl-4 sm:pl-6">#</th>
                      <th className="p-3 sm:p-4 w-28 sm:w-32">Horario</th>
                      <th className="p-3 sm:p-4">Actividad / Punto</th>
                      <th className="p-3 sm:p-4 rounded-tr-xl pr-4 sm:pr-6">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50">
                    {events.map((event, index) => (
                      <tr key={event.id} className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-800/30'} ${!event.isActive ? 'opacity-40 line-through' : ''}`}>
                        <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-center font-mono text-slate-400 dark:text-slate-500 font-black">{index + 1}</td>
                        <td className="p-3 sm:p-4 font-mono text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-2 text-base sm:text-lg"><span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm animate-pulse shrink-0" /> {event.timeSlot}</td>
                        <td className="p-3 sm:p-4 font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                          <div>{event.title}</div>
                          {event.description && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium normal-case block mt-0.5">{event.description}</span>}
                        </td>
                        <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-slate-500 dark:text-slate-400 font-bold uppercase">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{event.responsible || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-slate-900/20 transition-all active:scale-95 cursor-pointer">Cerrar Vista Previa</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN BLOQUE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 uppercase flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Configurar Bloque</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-slate-600 overflow-y-auto pr-1">
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
      {alertConfig.isOpen && (() => {
        const isDeleteAction = 
          alertConfig.title.toLowerCase().includes('vaciado') || 
          alertConfig.title.toLowerCase().includes('eliminado') || 
          alertConfig.title.toLowerCase().includes('removido');
          
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-5 mx-4 relative overflow-hidden">
              {/* Top decorative gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                isDeleteAction
                  ? 'from-rose-400 to-red-500'
                  : alertConfig.type === 'success' 
                    ? 'from-emerald-400 to-teal-500' 
                    : 'from-rose-400 to-red-500'
              }`} />
              
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-105 duration-300 ${
                isDeleteAction
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20 text-white animate-bounce'
                  : alertConfig.type === 'success' 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20 text-white' 
                    : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20 text-white'
              }`}>
                {isDeleteAction ? (
                  <Trash2 size={26} className="stroke-[1.5]" />
                ) : alertConfig.type === 'success' ? (
                  <Check size={28} className="stroke-[3]" />
                ) : (
                  <X size={28} className="stroke-[3]" />
                )}
              </div>

              {/* Typography */}
              <div className="space-y-2">
                <h4 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-tight">
                  {alertConfig.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {alertConfig.message}
                </p>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
                  className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-md uppercase tracking-wider transition-all duration-200 active:scale-95 hover:scale-102 cursor-pointer ${
                    isDeleteAction
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/10 hover:shadow-rose-500/20'
                      : alertConfig.type === 'success'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/10 hover:shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/10 hover:shadow-rose-500/20'
                  }`}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
      {/* CONFIRM CLEAR ALL POPUP */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-2xl shadow-rose-500/20 text-center space-y-5 mx-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-500/20 text-rose-500 animate-bounce">
              <Trash2 size={32} className="stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase">¿Vaciar Todo el Programa?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Estás a punto de borrar permanentemente todas las actividades registradas para este sábado. Esta acción NO se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowClearConfirm(false)} disabled={clearing} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl transition-colors cursor-pointer">Cancelar</button>
              <button type="button" onClick={confirmClearAllEvents} disabled={clearing} className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer">
                {clearing ? 'Limpiando...' : 'Sí, Vaciar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};