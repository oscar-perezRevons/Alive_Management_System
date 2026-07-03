import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authExtensions } from '../services/api';
import { User, Mail, Lock, Calendar, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0033cc] via-[#002699] to-[#1e3a8a] flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 transform transition-all duration-300">
        
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-inner">
            <img src="/assets/logo.png" alt="Alive" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1e3a8a] tracking-tight">Registro de Miembro</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Únete al Sistema de Gestión ALIVE</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs font-bold">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-black text-sm">¡Alta completada!</p>
              <p className="text-slate-500 mt-0.5 font-medium">Redireccionando al panel de login institucional...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs font-bold text-slate-600">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="text" required placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="email" required placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha de Nacimiento</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition bg-white" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="password" required placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition" />
            </div>
          </div>

          <button type="submit" disabled={loading || success} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-xl shadow-lg shadow-blue-600/20 text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Completar Registro'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="text-blue-600 font-black hover:underline">Inicia Sesión</Link>
          </p>
        </div>

      </div>
    </div>
  );
};