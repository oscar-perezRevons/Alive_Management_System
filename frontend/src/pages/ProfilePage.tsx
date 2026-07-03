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
    <div className="space-y-6 bg-[#f4f6fc] min-h-screen text-slate-800 p-4 sm:p-6 font-sans antialiased select-none relative max-w-7xl mx-auto">
      
      {loading && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-50 rounded-3xl animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-100">
            <RefreshCw className="animate-spin text-[#0033cc]" size={28} />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Guardando cambios en servidor...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-[#0033cc] p-3 text-white rounded-2xl shadow-md transition-transform duration-300 hover:scale-105">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1e3a8a] tracking-tight">Mi Perfil</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Gestiona tus datos de acceso, roles institucionales y visualización</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-[#0033cc] to-[#1e3a8a] shadow-inner"></div>
          
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
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-3xs transition hover:bg-slate-100/70">
              <Shield className="text-[#0033cc] mb-1.5" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rol Sistema</span>
              <span className="text-sm font-black text-slate-800 mt-1 uppercase">{user?.role}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-3xs transition hover:bg-slate-100/70">
              <Heart className="text-rose-500 fill-rose-500/10 mb-1.5" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asignación</span>
              <span className="text-sm font-black text-slate-800 mt-1 uppercase truncate max-w-full">{user?.groupRole || 'MIEMBRO'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-left shadow-3xs">
            <div className="p-2.5 bg-white rounded-xl text-[#0033cc] shadow-2xs border border-blue-150">
              <Award size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">Rango del Proyecto</h4>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5 leading-tight">Miembro activo del ecosistema Alive Maranata 2026.</p>
            </div>
          </div>

          {!avatarUrl && (
            <div className="space-y-3 border-t border-slate-100 pt-5 text-left animate-fadeIn">
              <h4 className="text-xs font-black text-[#1e3a8a] uppercase tracking-wider px-1">Fondo de Avatar Personalizado</h4>
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

        <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3.5 flex items-center gap-2">
            <Settings2 className="text-[#0033cc]" size={18} />
            <h2 className="font-black text-sm text-[#1e3a8a] uppercase tracking-wider">Configuración de la Cuenta</h2>
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
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition duration-150 shadow-2xs"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Fecha de Nacimiento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition duration-150 shadow-2xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico Oficial</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-slate-100 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 cursor-not-allowed shadow-2xs select-all"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center justify-between gap-3.5 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Trophy size={18} />
            </div>
            <p className="text-xs font-black text-slate-700">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification({ isOpen: false, message: '' })} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-0.5 hover:bg-slate-50 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
};