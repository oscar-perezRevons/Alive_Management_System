import React, { useState, useEffect } from 'react';
import { configService } from '../services/api';
import { Upload, Image, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const MediaConfigPage: React.FC = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCurrentAssets();
  }, []);

  const fetchCurrentAssets = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await configService.getBrandAssets();
      if (response.data.logoUrl) setLogoPreview(response.data.logoUrl);
      if (response.data.bannerUrl) setBannerPreview(response.data.bannerUrl);
    } catch (err: any) {
      console.error('Error cargando assets de marca:', err);
      setErrorMsg('No se pudo sincronizar el estado actual de los archivos con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); 
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file)); 
    }
  };

  const saveAssetsToBackend = async () => {
    if (!logoFile && !bannerFile) {
      setErrorMsg('Por favor, selecciona al menos un archivo nuevo (Logo o Banner) antes de guardar.');
      return;
    }

    try {
      setIsUploading(true);
      setSuccessMsg('');
      setErrorMsg('');

      const formData = new FormData();
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      console.log('📡 Transmitiendo archivos multimedia binarios a Express...');
      const response = await configService.uploadBrandAssets(formData);
      
      setSuccessMsg(response.data.message || '¡Identidad visual actualizada con éxito!');
      
      setLogoFile(null);
      setBannerFile(null);
      
      await fetchCurrentAssets();
    } catch (err: any) {
      console.error('Error subiendo archivos multimedia:', err);
      setErrorMsg(err.response?.data?.error || 'Error crítico en la red al transferir las imágenes.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">Verificando Identidad de Marca...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg">
            <Image size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestor de Identidad Visual</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Carga y personaliza el logotipo oficial y el banner de la plataforma</p>
          </div>
        </div>
        
        <button
          onClick={saveAssetsToBackend}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 active:scale-95"
        >
          {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          Guardar Cambios
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Shield size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider">Logotipo del Sidebar</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">Sube el escudo o isotipo oficial del proyecto Alive (Formatos aceptados: JPG, PNG, SVG).</p>

          <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-6 text-center transition relative bg-slate-50/50">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            {logoPreview ? (
              <div className="space-y-2">
                <img src={logoPreview} alt="Preview Logo" className="w-24 h-24 object-contain mx-auto bg-blue-700 p-2 rounded-xl shadow-md" />
                <p className="text-[10px] text-blue-600 font-bold bg-blue-50 py-0.5 px-2 rounded-md inline-block">
                  {logoFile ? 'Nueva imagen para subir' : 'Imagen activa en servidor'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={24} className="text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Seleccionar Logotipo</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Image size={16} className="text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider">Fondo del Banner Hero</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">Esta imagen reemplazará el fondo detrás del lema institucional en la página de inicio (Resolución óptima: 1200x300).</p>

          <div className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-6 text-center transition relative bg-slate-50/50 min-h-[168px] flex flex-col justify-center">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleBannerChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            {bannerPreview ? (
              <div className="space-y-3">
                <img src={bannerPreview} alt="Preview Banner" className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
                <p className="text-[10px] text-blue-600 font-bold bg-blue-50 py-0.5 px-2 rounded-md inline-block">
                  {bannerFile ? 'Nuevo banner para subir' : 'Banner activo en servidor'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={24} className="text-gray-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Cargar Imagen Panorámica</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};