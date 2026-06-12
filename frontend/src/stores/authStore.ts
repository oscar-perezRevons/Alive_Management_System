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

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token: string, user: User) => {
    console.log('💾 Guardando sesión:', {
      token: token.substring(0, 20) + '...',
      user: user.email,
      role: user.role,
    });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    console.log('🚪 Cerrando sesión');
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
        console.log('📂 Sesión cargada desde storage:', {
          token: token.substring(0, 20) + '...',
          user: user.email,
          role: user.role,
        });
        set({ token, user, isAuthenticated: true });
      } else {
        console.log('❌ No hay sesión guardada');
      }
    } catch (error) {
      console.error('❌ Error cargando sesión:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));