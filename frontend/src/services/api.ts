import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Sesión expirada o token inválido - Forzando logout reactivo');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
};

export const usersService = {
  getAll: () => apiClient.get('/users'),
  getById: (id: number) => apiClient.get(`/users/${id}`),
  update: (id: number, data: { name?: string; role?: string; isActive?: boolean }) => 
    apiClient.put(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

export const groupsService = {
  getAll: () => apiClient.get('/groups'),
  getLeaderboard: () => apiClient.get('/groups/leaderboard'),
  getDetails: (id: number) => apiClient.get(`/groups/${id}/details`),
  getById: (id: number) => apiClient.get(`/groups/${id}`),
  create: (name: string, description?: string, motto?: string, leaderName?: string, subLeaderName?: string) =>
    apiClient.post('/groups', { name, description, motto, leaderName, subLeaderName }),
  update: (id: number, data: any) => apiClient.put(`/groups/${id}`, data),
  delete: (id: number) => apiClient.delete(`/groups/${id}`),
  addMember: (groupId: number, userId: number) =>
    apiClient.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId: number, userId: number) =>
    apiClient.delete(`/groups/${groupId}/members/${userId}`),
};

export const activitiesService = {
  getAll: () => apiClient.get('/activities'),
  getByGroup: (groupId: number) => apiClient.get(`/activities/group/${groupId}`),
  create: (name: string, description: string, points: number, groupSmallId: number, pointCategoryId: number) =>
    apiClient.post('/activities', { name, description, points, groupSmallId, pointCategoryId }),
  addScore: (userId: number, activityId: number, groupId: number, points: number) =>
    apiClient.post('/activities/scores', { userId, activityId, groupId, points }),
};

export default apiClient;