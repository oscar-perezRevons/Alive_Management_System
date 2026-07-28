import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Calendar, Upload, Download, Trash2, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface MatinalCategory {
  id: number;
  category: string;
  range: string;
  currentTheme: string;
  pdfUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

export function MatinalesPage() {
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [matinales, setMatinales] = useState<MatinalCategory[]>([
    { id: 1, category: 'Niños', range: '6 a 10 años', currentTheme: 'Historias del Antiguo Testamento' },
    { id: 2, category: 'Adolescentes', range: '11 a 16 años', currentTheme: 'Decisiones y Valores Cristianos' },
    { id: 3, category: 'Jóvenes', range: '17 a 30 años', currentTheme: 'Fidelidad en Tiempos Modernos' },
    { id: 4, category: 'Mujeres', range: '20 a 35 años', currentTheme: 'Mujeres de Fe y Oración' },
    { id: 5, category: 'Adultos', range: '30 años en adelante', currentTheme: 'Estudio de las Profecías' }
  ]);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMatinales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/matinales?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && Array.isArray(response.data.matinales)) {
        setMatinales(response.data.matinales);
      }
    } catch (err: any) {
      console.error('Error al cargar matinales:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, token]);

  useEffect(() => {
    if (token) {
      fetchMatinales();
    }
  }, [fetchMatinales, token]);

  const handleFileUpload = async (id: number, file: File) => {
    setUploadingId(id);
    setMessage(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('date', selectedDate);

    try {
      const response = await axios.post(`${API_URL}/matinales/${id}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Material subido correctamente.' });
        fetchMatinales();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al subir el material devocional.'
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteFile = async (id: number, fileUrl?: string) => {
    if (!window.confirm('¿Deseas eliminar este material devocional?')) return;
    setUploadingId(id);
    setMessage(null);

    try {
      const response = await axios.delete(
        `${API_URL}/matinales/${id}/pdf?date=${selectedDate}&fileUrl=${encodeURIComponent(fileUrl || '')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Material eliminado con éxito.' });
        fetchMatinales();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al eliminar el material.'
      });
    } finally {
      setUploadingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'niños':
        return 'from-amber-500 to-orange-600 text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'adolescentes':
        return 'from-teal-500 to-emerald-600 text-teal-500 bg-teal-500/10 border-teal-500/30';
      case 'jóvenes':
        return 'from-indigo-500 to-purple-600 text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
      case 'mujeres':
        return 'from-pink-500 to-rose-600 text-pink-500 bg-pink-500/10 border-pink-500/30';
      case 'adultos':
        return 'from-blue-500 to-cyan-600 text-blue-500 bg-blue-500/10 border-blue-500/30';
      default:
        return 'from-violet-500 to-purple-600 text-violet-500 bg-violet-500/10 border-violet-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" /> Lecturas y Guias Devocionales
            </div>
            <h1 className="text-3xl font-black tracking-tight">Matinales y Devocionales</h1>
            <p className="text-sm text-indigo-200/80 max-w-xl">
              Recursos espirituales semanales organizados por grupos de edad para fortalecer la fe en la comunidad.
            </p>
          </div>

          {/* Date Picker */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shadow-inner space-y-2">
            <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Fecha del Sábado:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900/80 text-white border border-indigo-400/40 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Matinales Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matinales.map((item) => {
            const badgeClass = getCategoryColor(item.category);

            return (
              <div
                key={item.id}
                className="group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {item.range}
                    </span>
                  </div>

                  {/* Title & Theme */}
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" /> Matinal {item.category}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tema: </span>
                      {item.currentTheme}
                    </p>
                  </div>
                </div>

                {/* PDF & Download Actions */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                  {item.pdfUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {item.fileName || 'Material Devocional PDF'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`${API_URL.replace('/api', '')}/uploads/matinales/${item.pdfUrl.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(item.id, item.pdfUrl || undefined)}
                            disabled={uploadingId === item.id}
                            className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow transition-colors"
                            title="Eliminar PDF"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-400">
                      Sin material subido para esta fecha
                    </div>
                  )}

                  {/* Admin Upload Button */}
                  {isAdmin && (
                    <label className="block">
                      <div className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-400/50 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                        {uploadingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {item.pdfUrl ? 'Reemplazar Material' : 'Subir Material (PDF/Imagen)'}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(item.id, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
