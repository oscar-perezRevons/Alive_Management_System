import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token si existe
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token enviado');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor simple para errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔴 Sesión expirada');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
  update: (id: number, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

export const groupsService = {
  getAll: () => apiClient.get('/groups'),
  getById: (id: number) => apiClient.get(`/groups/${id}`),
  create: (name: string, description: string) =>
    apiClient.post('/groups', { name, description }),
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