import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { setAuth, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Usuario ya autenticado detectado. Redirigiendo al dashboard.');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim();

    try {
      console.log('Intentando conectar con el servidor de autenticación...');
      const response = await authService.login(cleanEmail, password);
      const { token, user } = response.data;
      
      console.log('Login exitoso para el usuario:', user.email);
      
      setAuth(token, user);
      
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error capturado en el flujo de login:', err);
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error en las credenciales proporcionadas. Intente de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 font-sans p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100 transition-all duration-300 hover:shadow-indigo-500/10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tight">
            ALIVE Maranata
          </h1>
          <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
              placeholder="admin@alive.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:opacity-95 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm tracking-wide"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <span className="inline-block px-3 py-1 bg-gray-100 text-[11px] font-bold text-gray-500 rounded-full font-mono">
            Demo: admin@alive.com / Admin123!
          </span>
        </div>
      </div>
    </div>
  );
};