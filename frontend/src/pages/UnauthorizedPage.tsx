import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      <div className="text-center max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50 animate-fadeIn">
        
        <div className="p-4 bg-rose-50 border border-rose-100 inline-block rounded-2xl text-rose-600 mb-5 shadow-inner">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-800 tracking-tight mb-2">
          Acceso Restringido
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Tu cuenta actual no posee las credenciales jerárquicas o los privilegios necesarios para visualizar el contenido de esta sección.
        </p>
        
        <button
          onClick={() => {
            console.log('Redirigiendo al usuario a una zona segura (Dashboard)...');
            navigate('/dashboard', { replace: true });
          }}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/10 transition duration-200 active:scale-[0.98] text-sm tracking-wide"
        >
          <ArrowLeft size={16} />
          Volver al Inicio Seguro
        </button>
      </div>
    </div>
  );
};