import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
  getUsers: (params?: any) =>
    api.get('/auth/users', { params }),
  getUserById: (id: string) =>
    api.get(`/auth/users/${id}`),
  getUserStats: () =>
    api.get('/auth/users/stats'),
  updateUser: (id: string, data: any) =>
    api.put(`/auth/users/${id}`, data),
  getFavorites: () =>
    api.get('/auth/favorites'),
  addFavorite: (productId: string) =>
    api.post(`/auth/favorites/${productId}`),
  removeFavorite: (productId: string) =>
    api.delete(`/auth/favorites/${productId}`),
};

// Products
export const productsApi = {
  getAll: (params?: any) =>
    api.get('/products', { params }),
  getBySlug: (slug: string) =>
    api.get(`/products/${slug}`),
  getRecommended: (id: string) =>
    api.get(`/products/recommended/${id}`),
  create: (data: any) =>
    api.post('/products', data),
  update: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

// Categories
export const categoriesApi = {
  getAll: (params?: any) =>
    api.get('/categories', { params }),
  getBySlug: (slug: string) =>
    api.get(`/categories/${slug}`),
  getSubcategories: (slug: string) =>
    api.get(`/categories/${slug}/subcategories`),
  create: (data: any) =>
    api.post('/categories', data),
  update: (id: string, data: any) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};

// Clients
export const clientsApi = {
  getAll: (params?: any) =>
    api.get('/clients', { params }),
  getById: (id: string) =>
    api.get(`/clients/${id}`),
  create: (data: any) =>
    api.post('/clients', data),
  update: (id: string, data: any) =>
    api.put(`/clients/${id}`, data),
  delete: (id: string) =>
    api.delete(`/clients/${id}`),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/clients/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Email
export const emailApi = {
  getAll: () =>
    api.get('/email'),
  getById: (id: string) =>
    api.get(`/email/${id}`),
  create: (data: any) =>
    api.post('/email', data),
  update: (id: string, data: any) =>
    api.put(`/email/${id}`, data),
  send: (id: string) =>
    api.post(`/email/${id}/send`),
  delete: (id: string) =>
    api.delete(`/email/${id}`),
};

// Upload
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (filename: string) =>
    api.delete(`/upload/image/${filename}`),
};

// Carts
export const cartsApi = {
  create: (data: any) =>
    api.post('/carts', data),
  getMy: () =>
    api.get('/carts/my'),
  getAll: (params?: any) =>
    api.get('/carts', { params }),
  getById: (id: string) =>
    api.get(`/carts/${id}`),
  getUserCarts: (userId: string) =>
    api.get(`/carts/user/${userId}`),
  update: (id: string, data: any) =>
    api.put(`/carts/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/carts/${id}/status`, { status }),
  delete: (id: string) =>
    api.delete(`/carts/${id}`),
};

// Companies
export const companiesApi = {
  getAll: (params?: any) =>
    api.get('/companies', { params }),
  getAllActive: () =>
    api.get('/companies/all'),
  getById: (id: string) =>
    api.get(`/companies/${id}`),
  getMembers: (id: string) =>
    api.get(`/companies/${id}/members`),
  create: (data: any) =>
    api.post('/companies', data),
  update: (id: string, data: any) =>
    api.put(`/companies/${id}`, data),
  delete: (id: string) =>
    api.delete(`/companies/${id}`),
};

// Promotions
export const promotionsApi = {
  getAll: (params?: any) =>
    api.get('/promotions', { params }),
  getMy: () =>
    api.get('/promotions/my'),
  getById: (id: string) =>
    api.get(`/promotions/${id}`),
  create: (data: any) =>
    api.post('/promotions', data),
  update: (id: string, data: any) =>
    api.put(`/promotions/${id}`, data),
  delete: (id: string) =>
    api.delete(`/promotions/${id}`),
};

// Settings
export const settingsApi = {
  get: () =>
    api.get('/settings'),
  update: (data: any) =>
    api.put('/settings', data),
};

export default api;



