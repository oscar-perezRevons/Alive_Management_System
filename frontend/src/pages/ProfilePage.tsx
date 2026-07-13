import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usersService, authService } from '../services/api';
import { 
  User, Mail, Calendar, Shield, Save, Camera, 
  CheckCircle2, AlertCircle, RefreshCw, Award, Heart,
  Settings2, Trophy, X
} from 'lucide-react';

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
    <div className="space-y-6 bg-[#f0f2fc] min-h-screen text-slate-800 p-4 sm:p-6 font-sans antialiased select-none relative max-w-7xl mx-auto">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      
      {loading && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-slate-100">
            <RefreshCw className="animate-spin text-violet-600" size={28} />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Guardando cambios...</p>
          </div>
        </div>
      )}

      {/* HEADER PREMIUM */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 pt-7">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-violet-500/30">
                <User size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">Mi Perfil</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Configuración de cuenta y datos institucionales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100 text-[11px] font-black uppercase tracking-wider text-violet-600">
            <Settings2 size={13} className="animate-pulse" />
            Panel Personal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-md hover:shadow-xl transition-all duration-300 p-6 text-center space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-inner"></div>
          
          <div className="relative pt-8 z-10">
            <div className={`w-32 h-32 ${avatarUrl ? '' : selectedBg} mx-auto rounded-3xl flex items-center justify-center text-4xl font-black uppercase shadow-xl border-4 border-white overflow-hidden transition-all duration-300 transform group-hover:scale-105`}>
              {avatarUrl ? (
                <img src={`http://localhost:5000${avatarUrl}`} alt="Avatar de perfil" className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0) : user?.name?.charAt(0) || 'A'
              )}
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1/2 translate-x-16 bg-slate-900 text-white p-2.5 rounded-xl shadow-md border border-white/20 hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
              title="Cambiar foto de perfil"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize truncate">{name || user?.name}</h3>
            <p className="text-xs font-bold text-slate-400 font-mono truncate">{email || user?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex flex-col items-center justify-center transition hover:bg-indigo-100/70 hover:shadow-md">
              <Shield className="text-indigo-600 mb-1.5" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rol Sistema</span>
              <span className="text-sm font-black text-indigo-700 mt-1 uppercase">{user?.role}</span>
            </div>
            <div className="bg-fuchsia-50 border border-fuchsia-100 p-3.5 rounded-2xl flex flex-col items-center justify-center transition hover:bg-fuchsia-100/70 hover:shadow-md">
              <Heart className="text-fuchsia-500 fill-fuchsia-500/10 mb-1.5" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asignación</span>
              <span className="text-sm font-black text-fuchsia-700 mt-1 uppercase truncate max-w-full">{user?.groupRole || 'MIEMBRO'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm">
            <div className="p-2.5 bg-white rounded-xl text-violet-600 shadow-sm border border-violet-100">
              <Award size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-violet-900 uppercase tracking-wide">Rango del Proyecto</h4>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-tight">Miembro activo del ecosistema Alive Maranata 2026.</p>
            </div>
          </div>

          {!avatarUrl && (
            <div className="space-y-3 border-t border-slate-100 pt-5 text-left animate-fadeIn">
              <h4 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 uppercase tracking-wider px-1">Fondo de Avatar Personalizado</h4>
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
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      selectedBg === preset.id 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-100 font-black' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

        <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200/60 shadow-md hover:shadow-xl transition-all duration-300 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3.5 flex items-center gap-2">
            <div className="p-1.5 bg-violet-50 rounded-lg border border-violet-100">
              <Settings2 className="text-violet-600" size={16} />
            </div>
            <h2 className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 uppercase tracking-wider">Configuración de la Cuenta</h2>
          </div>

          {fetching ? (
            <div className="space-y-5 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-14 bg-slate-100 rounded-xl"></div>
                <div className="h-14 bg-slate-100 rounded-xl"></div>
              </div>
              <div className="h-14 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-12 bg-slate-200 rounded-xl w-32 ml-auto"></div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-2.5 text-rose-700 text-sm font-bold animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-sm font-bold shadow-2xs animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-black text-base">¡Cambios guardados con éxito!</p>
                    <p className="text-slate-500 mt-0.5 font-medium">Los datos relacionales de tu perfil se han sincronizado de forma segura.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs font-bold text-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-violet-400" size={16} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/20 transition duration-150 shadow-inner"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Fecha de Nacimiento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 text-violet-400" size={16} />
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/20 transition duration-150 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Correo Electrónico Oficial</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-100 border-2 border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 cursor-not-allowed shadow-inner select-all"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
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
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-violet-100 p-4 flex items-center justify-between gap-3.5 animate-slideUp overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
              <Trophy size={18} />
            </div>
            <p className="text-xs font-black text-slate-700">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification({ isOpen: false, message: '' })} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
};