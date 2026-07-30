import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getFullMediaUrl } from '../utils/mediaUtils';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../stores/authStore';
import { usersService, authService } from '../services/api';
import {
  User, Mail, Calendar, Shield, Save, Camera,
  CheckCircle2, AlertCircle, RefreshCw, Award, Heart,
  Settings2, Trophy, X, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

/* ─── CUSTOM SPANISH DATE PICKER COMPONENT ───────── */
const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAY_NAMES_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const parseDate = (valStr: string) => {
    if (!valStr) return new Date();
    const parts = valStr.split('-');
    if (parts.length < 3) return new Date();
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  };

  const currentDate = parseDate(value);
  const [viewYear, setViewYear] = useState(currentDate.getFullYear() || 2003);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth() ?? 4);

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const handleToggle = (openState: boolean) => {
    if (openState && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      let left = rect.left + window.scrollX;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16);
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left
      });
    }
    setIsOpen(openState);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const displayFormatted = value
    ? `${String(currentDate.getDate()).padStart(2, '0')} / ${String(currentDate.getMonth() + 1).padStart(2, '0')} / ${currentDate.getFullYear()}`
    : 'Seleccionar fecha...';

  const years = Array.from({ length: 90 }, (_, i) => 2026 - i);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => handleToggle(!isOpen)}
        className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between outline-none transition focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-violet-500/20 shadow-inner cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar className="text-violet-400 shrink-0" size={16} />
          <span>{displayFormatted}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999999
          }}
          className="w-80 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl p-4 space-y-3 anim-scale ring-4 ring-slate-900/10 dark:ring-black/40 text-slate-800 dark:text-slate-100"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
              >
                {MONTH_NAMES_ES.map((mName, idx) => (
                  <option key={mName} value={idx}>{mName}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 text-center">
            {DAY_NAMES_ES.map(d => (
              <span key={d} className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 py-1">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = value && currentDate.getFullYear() === viewYear && currentDate.getMonth() === viewMonth && currentDate.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black shadow-md shadow-violet-500/30 scale-105'
                      : 'hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-600 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer quick actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-black">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="text-rose-500 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const formatted = today.toISOString().split('T')[0];
                onChange(formatted);
                setIsOpen(false);
              }}
              className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Hoy
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = useCallback((message: string) => {
    setNotification({ isOpen: true, message });
    setTimeout(() => setNotification({ isOpen: false, message: '' }), 3500);
  }, []);

  const presetsAvatars = [
    { id: 'bg-gradient-to-tr from-blue-600 to-indigo-700 text-white', label: 'Azul Vivo' },
    { id: 'bg-gradient-to-tr from-emerald-500 to-teal-700 text-white', label: 'Esmeralda' },
    { id: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white', label: 'Oro Vivo' },
    { id: 'bg-gradient-to-tr from-purple-600 to-indigo-800 text-white', label: 'Púrpura' },
    { id: 'bg-gradient-to-tr from-rose-500 to-pink-700 text-white', label: 'Rosa Real' },
    { id: 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white', label: 'Monocromo' }
  ];

  const [selectedBg, setSelectedBg] = useState('bg-gradient-to-tr from-blue-600 to-indigo-700 text-white');

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      try {
        setFetching(true);
        const res = await authService.getProfile();
        const perfil = res.data?.user || res.data;
        if (perfil) {
          setName(perfil.name || '');
          setEmail(perfil.email || '');
          setAvatarUrl(perfil.avatarUrl || null);
          if (perfil.birthDate) {
            setBirthDate(new Date(perfil.birthDate).toISOString().split('T')[0]);
          }
        }
        const savedBg = localStorage.getItem(`avatar_bg_${user?.id}`);
        if (savedBg) setSelectedBg(savedBg);
      } catch (err) {
        console.error('Error al recuperar datos del perfil relacional.', err);
      } finally {
        setFetching(false);
      }
    };
    if (token) cargarDatosPerfil();
  }, [token, user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      setError(null);
      if (!user?.id) throw new Error('Sesión inválida.');

      const res = await usersService.uploadAvatar(user.id, formData);
      if (res.data?.success) {
        const newAvatarUrl = res.data.avatarUrl;
        setAvatarUrl(newAvatarUrl);

        const updatedUser = { ...user, avatarUrl: newAvatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });

        triggerToast('📸 Imagen de perfil actualizada con éxito.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la subida del archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (!user?.id) throw new Error('Sesión de usuario inválida.');

      await usersService.update(user.id, { name, birthDate: birthDate ? new Date(birthDate).toISOString() : null });

      const updatedUser = { ...user, name, avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      setSuccess(true);
      triggerToast('¡Tus datos se han sincronizado correctamente!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 min-h-screen text-slate-800 dark:text-slate-100 p-2 sm:p-4 lg:p-6 font-sans antialiased select-none relative transition-colors duration-300">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[99999] animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-slate-100 dark:border-slate-800">
            <RefreshCw className="animate-spin text-violet-600 dark:text-violet-400" size={28} />
            <p className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Guardando cambios...</p>
          </div>
        </div>
      )}

      {/* HEADER PREMIUM */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite' }} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4 p-4 sm:p-5 pt-6 sm:pt-7">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-violet-500/30">
                <User size={24} className="text-white sm:w-6 sm:h-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-300 truncate">Mi Perfil</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">Configuración de cuenta y datos institucionales</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 bg-violet-50 dark:bg-violet-950/60 px-3.5 sm:px-4 py-2 rounded-xl border border-violet-100 dark:border-violet-900/60 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-300 shadow-xs w-full sm:w-auto">
            <Settings2 size={13} className="animate-pulse shrink-0" />
            Panel Personal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full">

        {/* LEFT COLUMN: USER AVATAR & INFO */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-6 text-center space-y-5 sm:space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-inner"></div>

          <div className="relative pt-6 sm:pt-8 z-10 inline-block mx-auto">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 ${avatarUrl ? '' : selectedBg} mx-auto rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-black uppercase shadow-xl border-4 border-white dark:border-slate-800 overflow-hidden transition-all duration-300 transform group-hover:scale-105`}>
              {avatarUrl ? (
                <img src={getFullMediaUrl(avatarUrl)} alt="Avatar de perfil" className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0) : user?.name?.charAt(0) || 'A'
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-slate-800 text-white p-2.5 rounded-xl shadow-md border border-white/20 dark:border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 z-20"
              title="Cambiar foto de perfil"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight capitalize truncate">{name || user?.name}</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 font-mono truncate">{email || user?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <div className="bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center justify-center transition hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 hover:shadow-md min-w-0">
              <Shield className="text-indigo-600 dark:text-indigo-400 mb-1 shrink-0" size={18} />
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate max-w-full">Rol Sistema</span>
              <span className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5 uppercase truncate max-w-full">{user?.role}</span>
            </div>
            <div className="bg-fuchsia-50/70 dark:bg-fuchsia-950/50 border border-fuchsia-100 dark:border-fuchsia-900/50 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center justify-center transition hover:bg-fuchsia-100/70 dark:hover:bg-fuchsia-900/60 hover:shadow-md min-w-0">
              <Heart className="text-fuchsia-500 dark:text-fuchsia-400 fill-fuchsia-500/10 mb-1 shrink-0" size={18} />
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate max-w-full">Asignación</span>
              <span className="text-xs sm:text-sm font-black text-fuchsia-700 dark:text-fuchsia-300 mt-0.5 uppercase truncate max-w-full">{user?.groupRole || 'MIEMBRO'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border border-violet-100 dark:border-violet-900/50 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 text-left shadow-sm">
            <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-xl text-violet-600 dark:text-violet-300 shadow-sm border border-violet-100 dark:border-violet-900/50 shrink-0">
              <Award size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-violet-900 dark:text-violet-200 uppercase tracking-wide truncate">Rango del Proyecto</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-tight">Miembro activo del ecosistema Alive Maranata 2026.</p>
            </div>
          </div>

          {!avatarUrl && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5 text-left animate-fadeIn">
              <h4 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-300 uppercase tracking-wider px-1">Fondo de Avatar Personalizado</h4>
              <div className="grid grid-cols-2 gap-2">
                {presetsAvatars.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedBg(preset.id);
                      localStorage.setItem(`avatar_bg_${user?.id}`, preset.id);
                      triggerToast('🎨 Estilo de avatar predeterminado actualizado.');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-2 ${selectedBg === preset.id
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50/70 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 ring-2 ring-violet-200 dark:ring-violet-900/50 font-black'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                      }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-md ${preset.id} shrink-0 border border-black/5 shadow-3xs`}></span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACCOUNT FORM */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 flex items-center gap-2">
            <div className="p-1.5 bg-violet-50 dark:bg-violet-950/60 rounded-lg border border-violet-100 dark:border-violet-900/60">
              <Settings2 className="text-violet-600 dark:text-violet-300" size={16} />
            </div>
            <h2 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-300 uppercase tracking-wider">Configuración de la Cuenta</h2>
          </div>

          {fetching ? (
            <div className="space-y-5 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 ml-auto"></div>
            </div>
          ) : (
            <div className="space-y-5 sm:space-y-6 animate-fadeIn">
              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-sm font-bold animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-sm font-bold shadow-2xs animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-black text-base">¡Cambios guardados con éxito!</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Los datos relacionales de tu perfil se han sincronizado de forma segura.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-violet-400" size={16} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-violet-500/20 transition duration-150 shadow-inner"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">Fecha de Nacimiento</label>
                    <CustomDatePicker value={birthDate} onChange={setBirthDate} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">Correo Electrónico Oficial</label>
                  <div className="relative opacity-70">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 dark:text-slate-400 cursor-not-allowed shadow-inner select-all"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black uppercase rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={16} /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>

      {notification.isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm w-auto z-[99999] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-violet-100 dark:border-violet-900/60 p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-slideUp overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shrink-0">
              <Trophy size={18} />
            </div>
            <p className="text-xs font-black text-slate-700 dark:text-slate-200">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification({ isOpen: false, message: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
};