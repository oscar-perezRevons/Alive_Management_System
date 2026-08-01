import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Lock, Mail, AlertCircle, RefreshCw, Eye, EyeOff, ArrowLeft, Home, Sparkles } from 'lucide-react';
import logoImage from '../assets/logo.png';
import backgroundImage from '../assets/background.png';
import background2Image from '../assets/background2.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  }, [backgroundImages.length]);

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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans select-none relative overflow-x-hidden bg-[#040508]">
      
      {/* Floating Top-Left Back Button */}
      <Link
        to="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#090b14]/90 hover:bg-[#0f1222] border border-white/15 hover:border-amber-400/50 text-slate-200 hover:text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
        title="Regresar a la Página de Inicio"
      >
        <ArrowLeft size={16} className="text-amber-400 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden xs:inline">Volver a Inicio</span>
      </Link>

      {/* Dynamic keyframe animation styles */}
      <style>{`
        @keyframes slowBg {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.08) translate(1%, -1%); }
          100% { transform: scale(1.03) translate(-1%, 1%); }
        }
        @keyframes floatLogo {
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
          animation: floatLogo 5s ease-in-out infinite;
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
            bgIndex === idx ? 'opacity-30 scale-100 z-10' : 'opacity-0 scale-105 z-0'
          } animate-slow-bg`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      
      {/* Obsidian Dark Gradient overlay for optimal readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040508]/90 via-[#070912]/80 to-[#040508]/95 pointer-events-none z-10" />

      {/* Decorative Gold Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none animate-pulse z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-yellow-500/10 blur-[130px] pointer-events-none animate-pulse z-10" style={{ animationDelay: '2.5s' }}></div>

      {/* Outer border-gradient wrapper with luxury Gold Maranata Glow */}
      <div className="animate-fade-in-up p-[1.5px] rounded-[2.2rem] bg-gradient-to-br from-amber-400/40 via-yellow-400/20 to-amber-500/40 hover:from-amber-400/60 hover:via-yellow-300/40 hover:to-amber-500/60 transition-all duration-500 shadow-[0_0_50px_rgba(234,179,8,0.2)] hover:shadow-[0_0_70px_rgba(234,179,8,0.35)] max-w-md w-full relative z-20 my-auto">
        
        {/* Main Glassmorphic Card Content */}
        <div className="bg-[#08090f]/90 backdrop-blur-2xl rounded-[2.15rem] p-6 sm:p-10 space-y-6 sm:space-y-8 border border-white/10">
          
          {/* Header & Shield Logo */}
          <div className="text-center space-y-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-amber-400/20 border border-white/15 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-sm"
              title="Volver a la Página Principal"
            >
              <Home size={13} className="text-amber-400" /> Volver a Inicio
            </Link>
            
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border border-amber-400/30 rounded-[2rem] mx-auto flex items-center justify-center p-3 shadow-[0_0_30px_rgba(234,179,8,0.25)] backdrop-blur-md animate-float-logo transition duration-300 group">
              <Link to="/" className="w-full h-full flex items-center justify-center">
                <img src={logoImage} alt="Alive Shield" className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-display">
                ALIVE <span className="text-amber-400">MARANATA</span>
              </h2>
              <p className="text-[8.5px] sm:text-[9.5px] font-extrabold text-amber-400/90 uppercase tracking-[0.12em] leading-tight max-w-[260px] mx-auto">
                IGLESIA ADVENTISTA DEL SÉPTIMO DÍA 21 DE SEPTIEMBRE - EMANUEL
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 text-rose-300 text-xs font-semibold animate-fadeIn shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-[9.5px] font-extrabold uppercase text-slate-300 tracking-widest pl-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-amber-400 transition-colors duration-200" size={16} />
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
                  className={`w-full bg-[#0c0e18]/80 hover:bg-[#111424]/90 border border-white/15 pl-12 ${showEmailSuggestion ? "pr-24 sm:pr-28" : "pr-4"} py-3.5 sm:py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-[#0c0e18] focus:ring-4 focus:ring-amber-400/15 transition-all duration-300 placeholder:text-slate-500`} 
                />
                {showEmailSuggestion && (
                  <button
                    type="button"
                    onClick={() => setEmail((prev) => prev + '@gmail.com')}
                    className="absolute right-3 top-[10px] sm:top-[12px] px-2.5 py-1.5 text-[9px] font-black bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 border border-amber-400/40 rounded-lg transition duration-200 cursor-pointer backdrop-blur-sm z-20"
                  >
                    @gmail.com
                  </button>
                )}
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-[9.5px] font-extrabold uppercase text-slate-300 tracking-widest pl-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-amber-400 transition-colors duration-200" size={16} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-[#0c0e18]/80 hover:bg-[#111424]/90 border border-white/15 pl-12 pr-12 py-3.5 sm:py-4 rounded-xl font-medium text-sm text-white focus:outline-none focus:border-amber-400 focus:bg-[#0c0e18] focus:ring-4 focus:ring-amber-400/15 transition-all duration-300 placeholder:text-slate-500" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black uppercase rounded-xl shadow-[0_6px_25px_rgba(234,179,8,0.4)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.6)] text-xs tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] hover:scale-[1.015] border border-yellow-200/80"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400 font-semibold">
              ¿No tienes una cuenta aún?{' '}
              <Link to="/register" className="text-amber-400 font-bold hover:text-amber-300 transition hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};