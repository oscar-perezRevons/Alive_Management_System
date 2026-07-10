import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authExtensions } from '../services/api';
import { User, Mail, Lock, Calendar, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import logoImage from '../assets/logo.png';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authExtensions.register({ name, email, password, birthDate });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar tu alta de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060814] via-[#0b0e24] to-[#1e1b4b] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative z-10">
        
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-inner backdrop-blur-md">
            <img src={logoImage} alt="Alive" className="max-w-full max-h-full object-contain filter drop-shadow-md" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Registro de Miembro</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Únete al Sistema de Gestión ALIVE</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-350 text-xs font-semibold animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-450" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-2.5 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-450" />
            <div>
              <p className="font-bold text-sm text-emerald-300">¡Alta completada!</p>
              <p className="text-slate-400 mt-0.5 font-medium">Redireccionando al panel de login institucional...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold text-slate-350">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                required 
                placeholder="Juan Pérez" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition placeholder:text-slate-500" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="email" 
                required 
                placeholder="ejemplo@correo.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition placeholder:text-slate-500" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Fecha de Nacimiento</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="date" 
                required 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition placeholder:text-slate-500" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || success} 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase rounded-xl shadow-lg shadow-indigo-600/20 text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 active:scale-98"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Completar Registro'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-xs text-slate-450 font-medium">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline">Inicia Sesión</Link>
          </p>
        </div>

      </div>
    </div>
  );
};