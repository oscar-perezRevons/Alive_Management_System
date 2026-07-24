import React, { useEffect, useState, useCallback } from 'react';
import { matinalesService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  BookOpen, Upload, Download, Users, Shield, 
  SlidersHorizontal, Trash2, X, Check, CheckCircle2, AlertCircle, HelpCircle,
  Calendar, Eye, FileText
} from 'lucide-react';

import ninosImg from '../assets/matinal_niños.jpg';
import adolescentesImg from '../assets/matinal_adolescentes.jpg';
import jovenesImg from '../assets/matinal_jovenes.jpg';
import mujeresImg from '../assets/matinal_mujeres.jpg';
import adultosImg from '../assets/matinal_adultos.jpg';

export const MatinalesPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserRole = user?.role || 'USER';

  const getCategoryImage = (id: number) => {
    switch (id) {
      case 1: return ninosImg;
      case 2: return adolescentesImg;
      case 3: return jovenesImg;
      case 4: return mujeresImg;
      case 5: return adultosImg;
      default: return ninosImg;
    }
  };

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
    fileUrl?: string;
  }>({
    isOpen: false,
    matinalId: null,
    fileUrl: undefined
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

  // Calculate upcoming Saturday YYYY-MM-DD
  const getUpcomingSaturdayStr = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = 6 - day; 
    const upcoming = new Date(today);
    upcoming.setDate(today.getDate() + diff);
    
    const yyyy = upcoming.getFullYear();
    const mm = String(upcoming.getMonth() + 1).padStart(2, '0');
    const dd = String(upcoming.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getUpcomingSaturdayStr());
  const [saturdaysList, setSaturdaysList] = useState<any[]>([]);

  // Custom datepicker dropdown state
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ url: string; type: 'pdf' | 'image'; name: string } | null>(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const getDaysForCalendar = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Generate Saturdays list for navigation (2 weeks back to 4 weeks ahead, removing June 27)
  useEffect(() => {
    const list = [];
    const today = new Date();
    const day = today.getDay();
    const diff = 6 - day;
    const thisSaturday = new Date(today);
    thisSaturday.setDate(today.getDate() + diff);
    
    const monthsEs = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    for (let i = -2; i <= 4; i++) {
      const temp = new Date(thisSaturday);
      temp.setDate(thisSaturday.getDate() + (i * 7));
      const yyyy = temp.getFullYear();
      const mm = String(temp.getMonth() + 1).padStart(2, '0');
      const dd = String(temp.getDate()).padStart(2, '0');
      
      list.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: temp.getDate(),
        monthStr: monthsEs[temp.getMonth()],
        formatted: temp.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        isTodayWeek: i === 0
      });
    }
    setSaturdaysList(list);
  }, []);

  const triggerNotification = useCallback((title: string, message: string, type: 'success' | 'error') => {
    setNotification({ isOpen: true, title, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isOpen: false }));
    }, 4000);
  }, []);

  const fetchMatinales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await matinalesService.getAll(selectedDate);
      setMatinales(res.data.matinales || []);
    } catch (err) {
      triggerNotification('Error de Sincronización', 'No se pudieron recuperar las categorías devocionales.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, triggerNotification]);

  useEffect(() => { 
    fetchMatinales(); 
  }, [fetchMatinales]);

  const handleDateSelect = (dateStr: string) => {
    if (!dateStr) return;
    const dateObj = new Date(dateStr + 'T12:00:00'); // Noon avoids timezone shifts
    const day = dateObj.getDay();
    const diff = 6 - day;
    const snappedDate = new Date(dateObj);
    snappedDate.setDate(dateObj.getDate() + diff);
    
    const yyyy = snappedDate.getFullYear();
    const mm = String(snappedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(snappedDate.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

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
      await matinalesService.updateInfo(selectedMatinal.id, formFields, selectedDate);
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
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif'
    ];
    if (!allowedTypes.includes(file.type)) {
      triggerNotification('Archivo Inválido', 'Introduce únicamente documentos PDF o imágenes (PNG, JPG, JPEG, WEBP, GIF).', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      setActionLoading(`upload-${id}`);
      await matinalesService.uploadPdf(id, formData, selectedDate);
      triggerNotification('Material Vinculado', 'El folleto devocional fue registrado para este sábado.', 'success');
      fetchMatinales();
    } catch (err) {
      triggerNotification('Fallo de Carga', 'El servidor rechazó el procesamiento del archivo.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const requestDeletePdf = (id: number, fileUrl?: string) => {
    setDeleteConfirm({ isOpen: true, matinalId: id, fileUrl });
  };

  const confirmDeletePdf = async () => {
    const id = deleteConfirm.matinalId;
    const fileUrl = deleteConfirm.fileUrl;
    if (!id) return;

    try {
      setActionLoading(`delete-${id}`);
      setDeleteConfirm({ isOpen: false, matinalId: null, fileUrl: undefined });
      await matinalesService.deletePdf(id, selectedDate, fileUrl);
      triggerNotification('Archivo Removido', 'El material de lectura ha sido desvinculado con éxito.', 'success');
      fetchMatinales();
    } catch (err) {
      triggerNotification('Error de Eliminación', 'No se pudo completar la remoción del documento.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      window.open(url, '_blank');
    }
  };

  const getCardTheme = (index: number) => {
    const themes = [
      {
        border: 'border-l-[6px] border-l-indigo-600 dark:border-l-indigo-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
        badge: 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20',
        responsibleBadge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60',
        nextDateBadge: 'bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30',
        btnPrimary: 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-700 hover:from-indigo-600 hover:via-indigo-700 hover:to-violet-800 text-white shadow-md shadow-indigo-500/20',
        btnSecondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-200 dark:border-indigo-700/60',
        accentText: 'text-indigo-600 dark:text-indigo-300',
        devocionalBlockBg: 'from-indigo-50/80 to-indigo-100/20 dark:from-indigo-950/50 dark:to-indigo-900/30',
        devocionalBlockBorder: 'border-indigo-100/85 dark:border-indigo-900/50 border-l-indigo-500 dark:border-l-indigo-500',
        devocionalBlockAccentLine: 'border-indigo-400 dark:border-indigo-500',
        hoverBorder: 'hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5',
        pdfGradient: 'from-indigo-500/10 via-indigo-500/5 to-slate-50/10 dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-slate-900/10',
        imageBorder: 'border-2 border-indigo-500/40 dark:border-indigo-500/40 shadow-sm'
      },
      {
        border: 'border-l-[6px] border-l-emerald-600 dark:border-l-emerald-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
        badge: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
        responsibleBadge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60',
        nextDateBadge: 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30',
        btnPrimary: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-500/20',
        btnSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 dark:text-emerald-200 dark:border-emerald-700/60',
        accentText: 'text-emerald-600 dark:text-emerald-300',
        devocionalBlockBg: 'from-emerald-50/80 to-emerald-100/20 dark:from-emerald-950/50 dark:to-emerald-900/30',
        devocionalBlockBorder: 'border-emerald-100/85 dark:border-emerald-900/50 border-l-emerald-500 dark:border-l-emerald-500',
        devocionalBlockAccentLine: 'border-emerald-400 dark:border-emerald-500',
        hoverBorder: 'hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5',
        pdfGradient: 'from-emerald-500/10 via-emerald-500/5 to-slate-50/10 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-slate-900/10',
        imageBorder: 'border-2 border-emerald-500/40 dark:border-emerald-500/40 shadow-sm'
      },
      {
        border: 'border-l-[6px] border-l-fuchsia-600 dark:border-l-fuchsia-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20',
        badge: 'bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-500/20',
        responsibleBadge: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-100 dark:border-fuchsia-800/60',
        nextDateBadge: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-100/50 dark:border-fuchsia-900/30',
        btnPrimary: 'bg-gradient-to-r from-fuchsia-500 via-fuchsia-600 to-pink-700 hover:from-fuchsia-600 hover:via-fuchsia-700 hover:to-pink-800 text-white shadow-md shadow-fuchsia-500/20',
        btnSecondary: 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-900/40 dark:hover:bg-fuchsia-800/60 dark:text-fuchsia-200 dark:border-fuchsia-700/60',
        accentText: 'text-fuchsia-600 dark:text-fuchsia-300',
        devocionalBlockBg: 'from-fuchsia-50/80 to-fuchsia-100/20 dark:from-fuchsia-950/50 dark:to-fuchsia-900/30',
        devocionalBlockBorder: 'border-fuchsia-100/85 dark:border-fuchsia-900/50 border-l-fuchsia-500 dark:border-l-fuchsia-500',
        devocionalBlockAccentLine: 'border-fuchsia-400 dark:border-fuchsia-500',
        hoverBorder: 'hover:border-fuchsia-500/50 hover:shadow-xl hover:shadow-fuchsia-500/5',
        pdfGradient: 'from-fuchsia-500/10 via-fuchsia-500/5 to-slate-50/10 dark:from-fuchsia-950/40 dark:via-fuchsia-950/20 dark:to-slate-900/10',
        imageBorder: 'border-2 border-fuchsia-500/40 dark:border-fuchsia-500/40 shadow-sm'
      },
      {
        border: 'border-l-[6px] border-l-rose-600 dark:border-l-rose-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-rose-600 text-white shadow-md shadow-rose-600/20',
        badge: 'bg-rose-600 text-white shadow-sm shadow-rose-500/20',
        responsibleBadge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/60',
        nextDateBadge: 'bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30',
        btnPrimary: 'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-700 hover:from-rose-600 hover:via-rose-700 hover:to-pink-800 text-white shadow-md shadow-rose-500/20',
        btnSecondary: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-800/60 dark:text-rose-200 dark:border-rose-700/60',
        accentText: 'text-rose-600 dark:text-rose-300',
        devocionalBlockBg: 'from-rose-50/80 to-rose-100/20 dark:from-rose-950/50 dark:to-rose-900/30',
        devocionalBlockBorder: 'border-rose-100/85 dark:border-rose-900/50 border-l-rose-500 dark:border-l-rose-500',
        devocionalBlockAccentLine: 'border-rose-400 dark:border-rose-500',
        hoverBorder: 'hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-500/5',
        pdfGradient: 'from-rose-500/10 via-rose-500/5 to-slate-50/10 dark:from-rose-950/40 dark:via-rose-950/20 dark:to-slate-900/10',
        imageBorder: 'border-2 border-rose-500/40 dark:border-rose-500/40 shadow-sm'
      },
      {
        border: 'border-l-[6px] border-l-amber-600 dark:border-l-amber-500 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80',
        avatar: 'bg-amber-600 text-white shadow-md shadow-amber-600/20',
        badge: 'bg-amber-600 text-white shadow-sm shadow-amber-500/20',
        responsibleBadge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/60',
        nextDateBadge: 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30',
        btnPrimary: 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 text-white shadow-md shadow-amber-500/20',
        btnSecondary: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 dark:text-amber-200 dark:border-amber-700/60',
        accentText: 'text-amber-600 dark:text-amber-300',
        devocionalBlockBg: 'from-amber-50/80 to-amber-100/20 dark:from-amber-950/50 dark:to-amber-900/30',
        devocionalBlockBorder: 'border-amber-100/85 dark:border-amber-900/50 border-l-amber-500 dark:border-l-amber-500',
        devocionalBlockAccentLine: 'border-amber-400 dark:border-amber-500',
        hoverBorder: 'hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5',
        pdfGradient: 'from-amber-500/10 via-amber-500/5 to-slate-50/10 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-slate-900/10',
        imageBorder: 'border-2 border-amber-500/40 dark:border-amber-500/40 shadow-sm'
      }
    ];
    return themes[index % themes.length];
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 bg-[#f0f2fc] dark:bg-slate-950 p-4 sm:p-6 min-h-screen relative selection:bg-fuchsia-500 selection:text-white transition-colors duration-300 w-full">
      
      {/* HEADER PREMIUM */}
      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg z-20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        
        <div className="flex items-center gap-3.5 pt-1">
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-fuchsia-500/25">
              <BookOpen size={28} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 dark:from-indigo-400 to-fuchsia-600 dark:to-fuchsia-400">
              Matinales por Edades
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Distribución Devocional de Aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/60 shadow-sm text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
          <Shield size={14} className={currentUserRole === 'ADMIN' ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-400'} />
          Módulo: <span className={currentUserRole === 'ADMIN' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}>{currentUserRole}</span>
        </div>
      </div>

      {/* SECTOR DE FECHAS SÁBADO (CALENDARIO DE SÁBADOS) */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-l-[6px] border-l-indigo-600 border-t border-r border-b border-slate-200/60 dark:border-slate-800/80 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              Calendario Devocional Activo
            </h3>
            <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">📅</span> Sábado: {
                (() => {
                  const match = saturdaysList.find(s => s.dateStr === selectedDate);
                  if (match) return match.formatted;
                  
                  const dateParts = selectedDate.split('-');
                  if (dateParts.length === 3) {
                    const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
                    return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                  }
                  return selectedDate;
                })()
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-100/60 dark:bg-slate-800/80 border border-slate-200/85 dark:border-slate-700/80 p-2.5 rounded-2xl shadow-inner w-full lg:w-auto relative">
            <div className="flex items-center gap-2 sm:pl-2 shrink-0">
              <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">Búsqueda Rápida:</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-800 dark:text-slate-100 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-400 transition-all cursor-pointer min-w-[130px]"
              >
                <span>
                  {(() => {
                    const parts = selectedDate.split('-');
                    if (parts.length === 3) {
                      const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                      const monthIdx = Number(parts[1]) - 1;
                      return `${parts[2]} ${monthsShort[monthIdx]} ${parts[0]}`;
                    }
                    return selectedDate;
                  })()}
                </span>
                <span className="text-[8px] text-slate-400 dark:text-slate-400">▼</span>
              </button>
              
              {showCalendarDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* CALENDAR HEADER */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <button 
                      onClick={() => {
                        const newMonth = new Date(currentCalendarMonth);
                        newMonth.setMonth(currentCalendarMonth.getMonth() - 1);
                        setCurrentCalendarMonth(newMonth);
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-650 dark:text-slate-350 cursor-pointer transition-colors text-xs font-black"
                    >
                      ◀
                    </button>
                    <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white tracking-wider">
                      {currentCalendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => {
                        const newMonth = new Date(currentCalendarMonth);
                        newMonth.setMonth(currentCalendarMonth.getMonth() + 1);
                        setCurrentCalendarMonth(newMonth);
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-650 dark:text-slate-350 cursor-pointer transition-colors text-xs font-black"
                    >
                      ▶
                    </button>
                  </div>
                  
                  {/* CALENDAR WEEKDAYS HEADERS */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[9px] font-black uppercase tracking-wider ${
                          idx === 6 
                            ? 'text-indigo-600 dark:text-indigo-400 font-black' 
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  
                  {/* CALENDAR DAYS GRID */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysForCalendar(currentCalendarMonth).map((day, idx) => {
                      if (!day) return <div key={`spacer-${idx}`} className="w-8 h-8" />;
                      
                      const dayNum = day.getDate();
                      const yyyy = day.getFullYear();
                      const mm = String(day.getMonth() + 1).padStart(2, '0');
                      const dd = String(day.getDate()).padStart(2, '0');
                      const curDateStr = `${yyyy}-${mm}-${dd}`;
                      
                      // Check if selected date snaps to this day (i.e. is selectedDate)
                      const isSelected = curDateStr === selectedDate;
                      const isToday = new Date().toDateString() === day.toDateString();
                      const isSaturday = day.getDay() === 6;
                      
                      return (
                        <button
                          key={curDateStr}
                          onClick={() => {
                            handleDateSelect(curDateStr);
                            setShowCalendarDropdown(false);
                          }}
                          className={`w-8 h-8 text-[11px] font-black rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                            isSelected 
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-extrabold shadow-sm scale-105'
                              : isSaturday
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/70'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {dayNum}
                          {isToday && !isSelected && (
                            <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HORIZONTAL SÁBADOS TIMELINE SEGMENTED CONTROL */}
        <div className="flex md:grid md:grid-cols-7 gap-1.5 bg-slate-100/70 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {saturdaysList.map((sat) => {
            const isActive = sat.dateStr === selectedDate;
            return (
              <button
                key={sat.dateStr}
                onClick={() => setSelectedDate(sat.dateStr)}
                className={`flex-1 min-w-[76px] md:min-w-0 py-2.5 px-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-white/60 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/60 shadow-sm'
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span className={`text-base font-black tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{sat.dayNum}</span>
                  <span className={`text-[9px] font-black uppercase ${isActive ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-300'}`}>{sat.monthStr}</span>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-400'}`}>Sábado</span>
                {sat.isTodayWeek && (
                  <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-md mt-1 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                  }`}>Actual</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando registros devocionales...</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matinales.map((mat, idx) => {
            const theme = getCardTheme(idx);

            return (
              <div 
                key={mat.id} 
                className={`bg-white dark:bg-slate-900 rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden ${theme.border}`}
              >
                <div className="relative h-44 w-full overflow-hidden shrink-0">
                  <img 
                    src={getCategoryImage(mat.id)} 
                    alt={mat.category} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Dark transparent gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
                  
                  {/* Overlaid Title & Badge - avatar placed on LEFT next to text for maximum safety against overlap */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-10">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-xs shrink-0 ${theme.avatar}`}>
                      <Users size={16} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className={`inline-block text-[9px] ${theme.badge} shadow-sm px-2 py-0.5 rounded-md font-black tracking-wide uppercase`}>
                        {mat.range}
                      </span>
                      <h3 className="text-base font-black text-white uppercase tracking-tight drop-shadow-md truncate mt-0.5">{mat.category}</h3>
                    </div>
                  </div>

                  {currentUserRole === 'ADMIN' && (
                    <button
                      onClick={() => openEditModal(mat)}
                      className="absolute top-4 right-4 z-30 p-2 bg-white/20 hover:bg-white/35 text-white rounded-xl backdrop-blur-xs border border-white/25 transition-all duration-200 shadow-sm hover:scale-110 cursor-pointer"
                      title="Configurar Tarjeta"
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  )}
                </div>

                {/* CARD BODY CONTENT */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4 relative z-10">
                  <div className="space-y-3.5">
                    {/* TEMA ACTIVO DE LECTURA */}
                    <div className={`bg-gradient-to-r ${theme.devocionalBlockBg} border ${theme.devocionalBlockBorder} rounded-2xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
                      <div className={`flex items-center gap-1.5 ${theme.accentText}`}>
                        <BookOpen size={11} className="shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                        <p className="text-[9px] font-black uppercase tracking-widest">Nombre Devocional Matutino</p>
                      </div>
                      <p className={`text-xs font-black text-slate-850 dark:text-slate-100 mt-1.5 relative z-10 leading-normal pl-3 border-l-2 ${theme.devocionalBlockAccentLine} uppercase tracking-tight`}>
                        {mat.currentTheme || 'Lectura Semanal Regular'}
                      </p>
                    </div>

                    {/* DYNAMIC DOCUMENT VISUALIZER AREA */}
                    {mat.files && mat.files.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {mat.files.map((file: any) => {
                          const isFileImage = file.fileType === 'image' || !file.fileUrl.toLowerCase().endsWith('.pdf');
                          return (
                            <div 
                              key={file.fileUrl} 
                              className={`relative group/file rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 ${theme.hoverBorder} transition-all duration-300 flex flex-col gap-3.5`}
                            >
                              {/* The Live Visual Preview - Top Area (Full Width with soft gradient backdrop for PDF alignment) */}
                              <div 
                                onClick={() => setViewingFile({
                                  url: `http://localhost:5000${file.fileUrl}`,
                                  type: isFileImage ? 'image' : 'pdf',
                                  name: file.fileName || 'Archivo Devocional'
                                })}
                                className={`w-full h-56 rounded-2xl ${theme.imageBorder} overflow-hidden bg-gradient-to-br ${
                                  isFileImage ? 'from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900' : theme.pdfGradient
                                } flex items-center justify-center cursor-pointer group/thumb transition-all duration-300 relative`}
                              >
                                {isFileImage ? (
                                  <img 
                                    src={`http://localhost:5000${file.fileUrl}`} 
                                    alt={file.fileName || 'Miniatura'} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                                  />
                                ) : (
                                  /* Beautiful Floating Portrait Document mockup to hide Chrome grey browser viewer boundaries */
                                  <div className="w-[65%] h-[90%] rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-md bg-white overflow-hidden relative flex items-center justify-center transition-all duration-300 group-hover/thumb:scale-[1.03] group-hover/thumb:shadow-lg">
                                    <iframe 
                                      src={`http://localhost:5000${file.fileUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`} 
                                      className="w-[140%] h-[140%] border-none absolute origin-top-left scale-[0.71] pointer-events-none select-none"
                                      title="Miniatura PDF"
                                    />
                                    <div className="absolute inset-0 bg-transparent z-10" />
                                  </div>
                                )}
                                
                                {/* Floating Type Tag (Top-Left) with Category-themed Glow */}
                                <span className={`absolute top-3 left-3 backdrop-blur-md text-white text-[7px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs tracking-wider z-20 ${
                                  isFileImage 
                                    ? 'bg-blue-600/90 dark:bg-blue-500/90 shadow-lg shadow-blue-500/20' 
                                    : 'bg-red-600/90 dark:bg-red-500/90 shadow-lg shadow-red-500/20'
                                }`}>
                                  {isFileImage ? 'Imagen' : 'PDF'}
                                </span>

                                {/* Hover Maximize Icon Overlay */}
                                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xs opacity-0 group-hover/thumb:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white transform scale-90 group-hover/thumb:scale-100 transition-all duration-300 shadow-lg">
                                    <Eye size={18} />
                                  </div>
                                </div>
                              </div>

                              {/* Card Details & Actions - Bottom Area */}
                              <div className="flex flex-col gap-3 min-w-0">
                                <div className="min-w-0 px-0.5">
                                  <p className="text-[10px] font-black text-slate-850 dark:text-slate-200 truncate uppercase tracking-tight leading-normal">
                                    {file.fileName || 'Archivo Devocional'}
                                  </p>
                                  <p className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                                    isFileImage ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'
                                  }`}>
                                    {isFileImage ? 'Imagen Oficial' : 'Documento PDF'}
                                  </p>
                                </div>

                                {/* Action Buttons Container */}
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    onClick={() => setViewingFile({
                                      url: `http://localhost:5000${file.fileUrl}`,
                                      type: isFileImage ? 'image' : 'pdf',
                                      name: file.fileName || 'Archivo Devocional'
                                    })}
                                    className={`flex-1 h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 text-white ${theme.btnPrimary} hover:scale-[1.03] cursor-pointer shadow-md hover:shadow-lg group/btn`}
                                    title="Ver Archivo"
                                  >
                                    <Eye size={14} className="shrink-0 transition-transform duration-200 group-hover/btn:rotate-6 group-hover/btn:scale-110" /> Ver Archivo
                                  </button>

                                  {currentUserRole === 'ADMIN' && (
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={(e) => { e.stopPropagation(); requestDeletePdf(mat.id, file.fileUrl); }}
                                      className="h-11 w-11 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-red-500/15 hover:scale-[1.03] hover:shadow-lg hover:shadow-red-500/10 shrink-0 group/trash"
                                      title="Remover Archivo"
                                    >
                                      <Trash2 size={15} className="shrink-0 transition-transform duration-200 group-hover/trash:scale-110 group-hover/trash:-rotate-6" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Warning / Empty State message if document is missing */
                      <div className="mt-1 p-4 bg-gradient-to-r from-rose-50/80 via-orange-50/50 to-amber-50/30 dark:from-rose-950/10 dark:via-orange-950/5 dark:to-amber-950/5 border border-dashed border-rose-200/70 dark:border-rose-900/40 rounded-2xl flex items-start gap-3.5 shadow-3xs transition-all duration-300 hover:shadow-2xs">
                        <div className="p-3 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-2xl shadow-md shadow-orange-500/20 shrink-0 mt-0.5 animate-pulse">
                          <AlertCircle size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                            Material no disponible
                          </p>
                          <p className="text-[10px] text-orange-750 dark:text-orange-400 font-extrabold uppercase tracking-wider mt-1 leading-normal">
                            No se subieron los documentos para este sábado.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BUTTONS FOOTER WITH FIXED HEIGHTS AND CENTERED POSITION */}
                  {currentUserRole === 'ADMIN' && (
                    <div className="flex flex-col items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full">
                      {(!mat.files || mat.files.length < 2) ? (
                        <label className={`h-10 w-full inline-flex items-center justify-center gap-1.5 px-4.5 rounded-2xl cursor-pointer text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-3xs border ${theme.btnSecondary} ${actionLoading ? 'opacity-50 pointer-events-none' : ''} hover:scale-[1.01] shrink-0`}>
                          <Upload size={13} /> {actionLoading === `upload-${mat.id}` ? 'Subiendo...' : 'Cargar Archivo'}
                          <input type="file" accept="application/pdf, image/*" className="hidden" onChange={(e) => handleFileUpload(mat.id, e)} />
                        </label>
                      ) : (
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 py-2.5 px-4 rounded-xl border border-slate-200/50 dark:border-slate-800 w-full text-center">
                          Límite de 2 archivos alcanzado para esta categoría
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                ¿Estás completamente seguro de que deseas purgar el archivo activo de esta matinal para el sábado seleccionado?
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, matinalId: null })}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePdf}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-95 cursor-pointer"
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-start gap-3.5 animate-slideUp">
          <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">{notification.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden transform transition-all duration-300">
            
            {/* RICH DARK INDIGO GRADIENT ACCENT HEADER */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 text-indigo-300 shadow-inner">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-white">Configurar Contenido</h3>
                  <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Editar detalles de la categoría</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateInfo} className="p-6 space-y-6">
              {/* EDITABLE FIELDS WITH COLORED LABELS AND PREMIUM BORDERS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Users size={12} className="shrink-0" />
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50/50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="shrink-0" />
                    Rango de Edad
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.range}
                    onChange={(e) => setFormFields({ ...formFields, range: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50/50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} className="shrink-0" />
                  Nombre Devocional Matutino
                </label>
                <input
                  type="text"
                  required
                  value={formFields.currentTheme}
                  onChange={(e) => setFormFields({ ...formFields, currentTheme: e.target.value })}
                  placeholder="Ej: Héroes o Villanos..."
                  className="w-full text-xs font-bold bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 px-4 py-3.5 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                />
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  disabled={actionLoading === 'update'}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-350 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50 transition-all disabled:opacity-50 cursor-pointer shadow-3xs hover:scale-[1.01]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'update'}
                  className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} /> {actionLoading === 'update' ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN DOCUMENT VIEWER MODAL */}
      {viewingFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col overflow-hidden animate-scaleUp">
            
            {/* VIEWER HEADER */}
            <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                  {viewingFile.type === 'image' ? <Eye size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-250">Previsualizar Documento</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mt-0.5 truncate max-w-[200px] sm:max-w-xl">{viewingFile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(viewingFile.url, viewingFile.name)}
                  className="flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  <Download size={12} /> Descargar
                </button>
                <button 
                  onClick={() => setViewingFile(null)} 
                  className="flex items-center justify-center h-9 w-9 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white dark:bg-rose-955/25 dark:hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shadow-sm hover:shadow-md hover:shadow-rose-500/10 border border-rose-100 dark:border-rose-900/30 hover:border-rose-600 dark:hover:border-rose-600 hover:scale-105 group/close shrink-0"
                  title="Cerrar Visor"
                >
                  <X size={15} className="shrink-0 transition-transform duration-200 group-hover/close:rotate-90 group-hover/close:scale-110" />
                </button>
              </div>
            </div>

            {/* VIEWER CONTENT */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative overflow-auto">
              {viewingFile.type === 'image' ? (
                <img 
                  src={viewingFile.url} 
                  alt={viewingFile.name} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/5"
                />
              ) : (
                <iframe 
                  src={`${viewingFile.url}#toolbar=1&navpanes=1`} 
                  className="w-full h-full border-none rounded-xl bg-white" 
                  title="Visor PDF Completo"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};