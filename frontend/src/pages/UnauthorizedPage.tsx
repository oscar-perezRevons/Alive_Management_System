import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4 relative overflow-hidden">
      <div className="text-center max-w-md w-full bg-white rounded-3xl border border-slate-200/60 p-8 shadow-premium animate-fadeIn relative z-10">
        
        <div className="p-4 bg-rose-50 border border-rose-100/80 inline-block rounded-2xl text-rose-600 mb-5 shadow-inner">
          <ShieldAlert size={48} className="animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">
          Acceso Restringido
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-8">
          Tu cuenta actual no posee las credenciales jerárquicas o los privilegios necesarios para visualizar el contenido de esta sección.
        </p>
        
        <button
          onClick={() => {
            console.log('Redirigiendo al usuario a una zona segura (Dashboard)...');
            navigate('/dashboard', { replace: true });
          }}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.98] text-xs uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          Volver al Inicio Seguro
        </button>
      </div>
    </div>
  );
};