import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { DashboardHomeData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const configService = {
  getBrandAssets: () => apiClient.get('/config/brand-assets'),
  uploadBrandAssets: (formData: FormData) => 
    apiClient.post('/config/upload-brand', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const dashboardService = {
  getHomeData: () => apiClient.get<DashboardHomeData>('/dashboard/home'),
};

export const authService = {
  register: (email: string, password: string, name: string) => apiClient.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
};

export const usersService = {
  getAll: () => apiClient.get('/users'),
  getById: (id: number) => apiClient.get(`/users/${id}`),
  update: (id: number, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

export const groupsService = {
  getAll: () => apiClient.get('/groups'),
  getLeaderboard: () => apiClient.get('/groups/leaderboard'),
  getMyProgress: () => apiClient.get('/groups/my-progress'),
  getById: (id: number) => apiClient.get(`/groups/${id}`), 
  create: (name: string, description?: string, motto?: string, leaderName?: string, subLeaderName?: string) =>
    apiClient.post('/groups', { name, description, motto, leaderName, subLeaderName }),
  update: (id: number, data: any) => apiClient.put(`/groups/${id}`, data),
  delete: (id: number) => apiClient.delete(`/groups/${id}`),
  addMember: (groupId: number, userId: number) => apiClient.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId: number, userId: number) => apiClient.delete(`/groups/${groupId}/members/${userId}`),
};

export const activitiesService = {
  getAll: () => apiClient.get('/activities'),
  getByGroup: (groupId: number) => apiClient.get(`/activities/group/${groupId}`),
  create: (name: string, description: string, points: number, groupSmallId: number, pointCategoryId: number) =>
    apiClient.post('/activities', { name, description, points, groupSmallId, pointCategoryId }),
  addScore: (userId: number, activityId: number, groupId: number, points: number) =>
    apiClient.post('/activities/scores', { userId, activityId, groupId, points }),
};

export const secretariaService = {
  getAllGroups: () => apiClient.get('/secretaria/groups'),
  getGroupPanel: (groupId: number) => apiClient.get(`/secretaria/panel/${groupId}`),
  createGroup: (data: any) => apiClient.post('/secretaria/groups', data),
  updateGroup: (groupId: number, data: any) => apiClient.put(`/secretaria/groups/${groupId}`, data),
  deleteMemberFromGroup: (groupId: number, userId: number) => apiClient.delete(`/secretaria/panel/${groupId}/members/${userId}`),
  getAvailableUsers: () => apiClient.get('/secretaria/users/available'),
  addMemberToGroup: (groupId: number, data: { userId: number; groupRole: string }) => apiClient.post(`/secretaria/panel/${groupId}/members`, data),
  createAndLinkMember: (groupId: number, data: any) => apiClient.post(`/secretaria/panel/${groupId}/members/create-and-link`, data)
};

export const scoreService = {
  getKpis: () => apiClient.get('/puntuaciones/kpis'),
  getCategories: () => apiClient.get('/puntuaciones/categories'),
  getScoresHistory: () => apiClient.get('/puntuaciones/history/scores'),
  getPenaltiesHistory: () => apiClient.get('/puntuaciones/history/penalties'),
  registerScore: (data: any) => apiClient.post('/puntuaciones/register', data),
  registerPenalty: (data: any) => apiClient.post('/puntuaciones/penalty', data),
  createCategory: (data: { name: string }) => apiClient.post('/puntuaciones/categories', data),
  createActivity: (data: any) => apiClient.post('/puntuaciones/activities', data)
};

export const programService = {
  getFullSchedule: () => apiClient.get('/programa'),
  createEvent: (data: any) => apiClient.post('/programa', data),
  updateEvent: (id: number, data: any) => apiClient.put(`/programa/${id}`, data),
  deleteEvent: (id: number) => apiClient.delete(`/programa/${id}`),
};

export const matinalesService = {
  getAll: () => apiClient.get('/matinales'),
  
  updateInfo: (id: number, data: { category: string; range: string; currentTheme: string; responsible: string; nextDate: string }) => {
    const token = localStorage.getItem('token');
    return apiClient.put(`/matinales/${id}`, data, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  },

  uploadPdf: (id: number, formData: FormData) => {
    const token = localStorage.getItem('token');
    return apiClient.post(`/matinales/${id}/upload`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  },

  deletePdf: (id: number) => {
    const token = localStorage.getItem('token');
    return apiClient.delete(`/matinales/${id}/pdf`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  }
};

export default apiClient;