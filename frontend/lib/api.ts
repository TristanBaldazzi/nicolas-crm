import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour envoyer les cookies
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne rediriger vers login que si on n'est pas déjà sur la page de login
    // et que ce n'est pas une requête vers /auth/me (qui peut échouer normalement si non connecté)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRequest = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login');
      
      // Ne rediriger que si on n'est pas déjà sur login et que ce n'est pas une requête d'auth
      if (!currentPath.includes('/login') && !isAuthRequest) {
        window.location.href = '/login';
      }
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
  logout: () =>
    api.post('/auth/logout'),
  me: () =>
    api.get('/auth/me'),
  updateProfile: (data: { firstName: string; lastName: string }) =>
    api.put('/auth/profile', data),
  updateTrackingConsent: (consent: boolean) =>
    api.put('/auth/tracking-consent', { consent }),
  getUsers: (params?: any) =>
    api.get('/auth/users', { params }),
  getUserById: (id: string) =>
    api.get(`/auth/users/${id}`),
  getUserStats: (params?: any) =>
    api.get('/auth/users/stats', { params }),
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
  getById: (id: string) =>
    api.get(`/products/${id}`), // La route backend gère maintenant les IDs dans /:slug
  getRecommended: (id: string) =>
    api.get(`/products/recommended/${id}`),
  getUniqueSpecifications: () =>
    api.get('/products/specifications/unique'),
  create: (data: any) =>
    api.post('/products', data),
  update: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) =>
    api.delete(`/products/${id}`),
  generateAI: (description: string) =>
    api.post('/products/generate-ai', { description }),
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
  countPending: () =>
    api.get('/carts/count-pending'),
  create: (data: any) =>
    api.post('/carts', data),
  getMy: () =>
    api.get('/carts/my'),
  getMyOrders: () =>
    api.get('/carts/my-orders'),
  sync: (data: any) =>
    api.post('/carts/sync', data),
  getAll: (params?: any) =>
    api.get('/carts', { params }),
  getById: (id: string) =>
    api.get(`/carts/${id}`),
  getUserCarts: (userId: string) =>
    api.get(`/carts/user/${userId}`),
  getUserActiveCart: (userId: string) =>
    api.get(`/carts/user/${userId}/active`),
  createForUser: (userId: string, data: any) =>
    api.post(`/carts/user/${userId}`, data),
  getCompanyOrders: (companyId: string) =>
    api.get(`/carts/company/${companyId}`),
  getStats: (params?: any) =>
    api.get('/carts/stats', { params }),
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
  generateAI: (description: string, existingData?: any) =>
    api.post('/companies/generate-ai', { description, existingData }),
};

// Promotions
export const promotionsApi = {
  getAll: (params?: any) =>
    api.get('/promotions', { params }),
  getMy: () =>
    api.get('/promotions/my'),
  getById: (id: string, params?: any) =>
    api.get(`/promotions/${id}`, { params }),
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

// Product Specs
export const productSpecsApi = {
  getAll: () =>
    api.get('/product-specs'),
  create: (data: any) =>
    api.post('/product-specs', data),
  delete: (id: string) =>
    api.delete(`/product-specs/${id}`),
  updateOrder: (id: string, order: number) =>
    api.put(`/product-specs/${id}/order`, { order }),
};

// Brands
export const brandsApi = {
  getAll: () =>
    api.get('/brands'),
  create: (data: any) =>
    api.post('/brands', data),
  delete: (id: string) =>
    api.delete(`/brands/${id}`),
  updateOrder: (id: string, order: number) =>
    api.put(`/brands/${id}/order`, { order }),
};

// Contact
export const contactApi = {
  submit: (data: FormData) =>
    api.post('/contact', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getAll: () =>
    api.get('/contact'),
  getById: (id: string) =>
    api.get(`/contact/${id}`),
  markAsRead: (id: string) =>
    api.put(`/contact/${id}/traite`),
};

// Analytics
export const analyticsApi = {
  track: (data: {
    productId: string;
    eventType: 'view' | 'cart_add' | 'cart_remove' | 'purchase' | 'favorite_add' | 'favorite_remove';
    referrer?: string;
    currentUrl?: string;
    metadata?: any;
  }) => api.post('/analytics/track', data),
  getProductStats: (productId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/analytics/product/${productId}`, { params }),
  getAllProductsStats: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get('/analytics/products', { params }),
};

export default api;



