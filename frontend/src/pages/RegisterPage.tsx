import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authExtensions } from '../services/api';
import { User, Mail, Lock, Calendar, AlertCircle, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import logoImage from '../assets/logo.png';
import backgroundImage from '../assets/background.png';
import background2Image from '../assets/background2.jpg';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Background images carousel state
  const [bgIndex, setBgIndex] = useState(0);
  const backgroundImages = [backgroundImage, background2Image];

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const showEmailSuggestion = email && !email.includes('@');

  // Custom Datepicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear() - 18); // default to 18 years ago

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Populate years: 1940 to current year
  const currentYearNum = new Date().getFullYear();
  const YEARS: number[] = [];
  for (let y = currentYearNum; y >= 1940; y--) {
    YEARS.push(y);
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const selectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setBirthDate(`${viewYear}-${formattedMonth}-${formattedDay}`);
    setShowDatePicker(false);
  };

  const formatDateToSpanish = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day} / ${month} / ${year}`;
  };

  const renderCalendarDays = () => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const formattedMonth = String(viewMonth + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const dayStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
      const isSelected = birthDate === dayStr;
      
      days.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => selectDay(day)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition cursor-pointer ${
            isSelected 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
              : 'hover:bg-white/10 text-slate-350 hover:text-white'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Automatically append @gmail.com if no domain was entered
    let finalEmail = email;
    if (email && !email.includes('@')) {
      finalEmail = email + '@gmail.com';
      setEmail(finalEmail);
    }

    try {
      await authExtensions.register({ name, email: finalEmail, password, birthDate });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar tu alta de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans select-none relative overflow-hidden bg-slate-950">
      {/* Dynamic styles block for professional animations */}
      <style>{`
        @keyframes slowBg {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.08) translate(1%, -1%); }
          100% { transform: scale(1.03) translate(-1%, 1%); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slow-bg {
          animation: slowBg 30s infinite alternate ease-in-out;
        }
        .animate-float-logo {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Background Image Carousel Layer with slow breathing movement */}
      {backgroundImages.map((img, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out pointer-events-none ${
            bgIndex === idx ? 'opacity-40 scale-100 z-10' : 'opacity-0 scale-105 z-0'
          } animate-slow-bg`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      
      {/* Dark overlay for solid text contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050714]/90 via-[#0a0d24]/75 to-[#16133a]/80 pointer-events-none z-10" />

      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none animate-pulse z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/15 blur-[120px] pointer-events-none animate-pulse z-10" style={{ animationDelay: '2s' }}></div>

      {/* Outer border-gradient wrapper for premium glow */}
      <div className="animate-fade-in-up p-[1.5px] rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/25 to-pink-500/30 hover:from-indigo-500/50 hover:via-purple-500/40 hover:to-pink-500/50 transition-all duration-500 shadow-[0_0_50px_rgba(99,102,241,0.15)] hover:shadow-[0_0_60px_rgba(99,102,241,0.25)] max-w-md w-full relative z-20 my-8">
        
        {/* Main Glassmorphic Card Content */}
        <div className="bg-slate-950/75 backdrop-blur-2xl rounded-[1.95rem] p-8 sm:p-10 space-y-8">
          
          {/* Header & Logo with dynamic floating effect */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] mx-auto flex items-center justify-center p-3 shadow-inner backdrop-blur-md animate-float-logo shadow-indigo-500/10 hover:shadow-indigo-500/25 transition duration-300">
              <img src={logoImage} alt="Alive Shield" className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
                Registro de Miembro
              </h2>
              <p className="text-[10px] font-bold text-indigo-400/90 uppercase tracking-[0.2em] mt-1">
                Únete al Sistema de Gestión ALIVE
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-355 text-xs font-semibold animate-fadeIn shadow-[0_0_15px_rgba(244,63,94,0.05)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-450" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-450" />
              <div>
                <p className="font-black text-sm text-emerald-300 uppercase tracking-wider">¡Alta completada!</p>
                <p className="text-slate-400 mt-1 font-medium leading-relaxed">Redireccionando al panel de login institucional...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5 text-xs font-semibold text-slate-350">
            {/* Full Name field */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest pl-1">Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-450 transition-colors duration-200" size={16} />
                <input 
                  type="text" 
                  required 
                  placeholder="Juan Pérez" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-4 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-600" 
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest pl-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-450 transition-colors duration-200" size={16} />
                <input 
                  type="email" 
                  required 
                  placeholder="usuario@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onBlur={() => {
                    if (email && !email.includes('@')) {
                      setEmail((prev) => prev + '@gmail.com');
                    }
                  }}
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-28 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-655" 
                />
                {showEmailSuggestion && (
                  <button
                    type="button"
                    onClick={() => setEmail((prev) => prev + '@gmail.com')}
                    className="absolute right-3 top-[12px] px-2.5 py-1.5 text-[9px] font-black bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 rounded-lg transition duration-200 cursor-pointer backdrop-blur-sm z-20"
                  >
                    @gmail.com
                  </button>
                )}
              </div>
            </div>

            {/* BirthDate field */}
            <div className="space-y-2 relative">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest pl-1">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none z-10" size={16} />
                <input 
                  type="text" 
                  readOnly 
                  required 
                  placeholder="DD / MM / AAAA" 
                  value={birthDate ? formatDateToSpanish(birthDate) : ''} 
                  onClick={() => setShowDatePicker(true)}
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-4 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 cursor-pointer text-left" 
                />
              </div>

              {showDatePicker && (
                <>
                  {/* Click-away overlay to catch external clicks */}
                  <div className="fixed inset-0 z-30" onClick={() => setShowDatePicker(false)} />
                  
                  {/* Glassmorphic Dropdown Datepicker */}
                  <div className="absolute left-0 right-0 mt-2 p-4 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-[1.5rem] shadow-2xl z-40 text-white select-none animate-fadeIn">
                    
                    {/* Header: Month and Year controls */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
                      <button 
                        type="button" 
                        onClick={handlePrevMonth} 
                        className="p-1 hover:bg-white/10 rounded-lg transition text-indigo-300 hover:text-white cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <div className="flex gap-2">
                        {/* Month Dropdown */}
                        <select 
                          value={viewMonth} 
                          onChange={(e) => setViewMonth(parseInt(e.target.value))}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {MONTH_NAMES.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                          ))}
                        </select>
                        
                        {/* Year Dropdown */}
                        <select 
                          value={viewYear} 
                          onChange={(e) => setViewYear(parseInt(e.target.value))}
                          className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={handleNextMonth} 
                        className="p-1 hover:bg-white/10 rounded-lg transition text-indigo-300 hover:text-white cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    
                    {/* Week days labels */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>
                    
                    {/* Grid of days */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendarDays()}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setBirthDate('');
                          setShowDatePicker(false);
                        }}
                        className="text-[10px] font-black text-rose-400 hover:text-rose-350 cursor-pointer uppercase tracking-wider"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-350 cursor-pointer uppercase tracking-wider"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest pl-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-450 transition-colors duration-200" size={16} />
                <input 
                  type="password" 
                  required 
                  placeholder="Mínimo 6 caracteres" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-4 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-600" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || success} 
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white font-black uppercase rounded-xl shadow-lg shadow-indigo-650/20 hover:shadow-indigo-500/40 text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] hover:scale-[1.015]"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Completar Registro'}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 font-medium">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link to="/login" className="text-indigo-450 font-bold hover:text-indigo-350 transition hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};