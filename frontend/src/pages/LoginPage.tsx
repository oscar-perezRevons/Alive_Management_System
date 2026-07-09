import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import logoImage from '../assets/logo.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0033cc] via-[#002699] to-[#1e3a8a] flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-inner">
            <img src={logoImage} alt="Alive Shield" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1e3a8a] tracking-tight">ALIVE Maranata</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingresa tus credenciales para acceder</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-bold animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-600">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="email" required placeholder="admin@alive.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-xl shadow-lg shadow-blue-600/20 text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400">
            ¿No tienes una cuenta aún?{' '}
            <Link to="/register" className="text-blue-600 font-black hover:underline">Regístrate aquí</Link>
          </p>
        </div>

      </div>
    </div>
  );
};