import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token: string, user: User) => {
    console.log('Guardando sesión activa:', {
      token: token.substring(0, 20) + '...',
      user: user.email,
      role: user.role,
    });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    console.log('Cerrando sesión y limpiando almacenamiento...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('Sesión restaurada desde almacenamiento:', {
          token: token.substring(0, 20) + '...',
          user: user.email,
          role: user.role,
        });
        set({ token, user, isAuthenticated: true });
      } else {
        console.log('No se encontró ninguna sesión previa guardada');
      }
    } catch (error) {
      console.error('Error crítico al cargar sesión desde storage:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));