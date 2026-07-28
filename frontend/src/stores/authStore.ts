import { create } from 'zustand';
import { authService } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  groupRole?: string;
  birthDate?: string | null;
  avatarUrl?: string | null;
  groupSmallId?: number | null;
  groupSmall?: { id: number; name: string } | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean; 
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false, 

  login: async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        set({ 
          token, 
          user: JSON.parse(userStr), 
          isAuthenticated: true 
        });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    } else {
      set({ isAuthenticated: false });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  }
}));