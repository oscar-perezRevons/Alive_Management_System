import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import logoImage from '../assets/logo.png';
import backgroundImage from '../assets/background.png';
import background2Image from '../assets/background2.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await login(finalEmail, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Verifica tus credenciales.');
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
      <div className="animate-fade-in-up p-[1.5px] rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/25 to-pink-500/30 hover:from-indigo-500/50 hover:via-purple-500/40 hover:to-pink-500/50 transition-all duration-500 shadow-[0_0_50px_rgba(99,102,241,0.15)] hover:shadow-[0_0_60px_rgba(99,102,241,0.25)] max-w-md w-full relative z-20">
        
        {/* Main Glassmorphic Card Content */}
        <div className="bg-slate-950/75 backdrop-blur-2xl rounded-[1.95rem] p-8 sm:p-10 space-y-8">
          
          {/* Header & Logo with dynamic floating effect */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] mx-auto flex items-center justify-center p-3 shadow-inner backdrop-blur-md animate-float-logo shadow-indigo-500/10 hover:shadow-indigo-500/25 transition duration-300">
              <img src={logoImage} alt="Alive Shield" className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
                ALIVE Maranata
              </h2>
              <p className="text-[10px] font-bold text-indigo-400/90 uppercase tracking-[0.2em] mt-1">
                Ingresa tus credenciales para acceder
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-350 text-xs font-semibold animate-fadeIn shadow-[0_0_15px_rgba(244,63,94,0.05)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-450" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-slate-350">
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
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-28 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-650" 
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

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest pl-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-450 transition-colors duration-200" size={16} />
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-slate-950/45 hover:bg-slate-950/65 border border-white/10 pl-12 pr-4 py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-indigo-500/80 focus:bg-slate-950/80 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-600" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white font-black uppercase rounded-xl shadow-lg shadow-indigo-650/20 hover:shadow-indigo-500/40 text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] hover:scale-[1.015]"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 font-medium">
              ¿No tienes una cuenta aún?{' '}
              <Link to="/register" className="text-indigo-450 font-bold hover:text-indigo-350 transition hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};