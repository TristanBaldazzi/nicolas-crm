import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
};

// Products
export const productsApi = {
  getAll: (params?: any) =>
    api.get('/products', { params }),
  getBySlug: (slug: string) =>
    api.get(`/products/${slug}`),
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

export default api;

