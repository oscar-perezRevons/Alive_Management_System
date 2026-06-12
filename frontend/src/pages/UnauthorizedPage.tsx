import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertCircle className="mx-auto text-red-600 mb-4" size={64} />
        <h1 className="text-3xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};