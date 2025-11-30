import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  loadFromStorage: () => Promise<void>;
}

// Flag pour éviter les appels multiples simultanés
let isLoadingFromStorage = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    set({ user, token, isLoading: false });
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  logout: () => {
    set({ user: null, token: null, isLoading: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin';
  },
  loadFromStorage: async () => {
    // Éviter les appels multiples simultanés
    if (isLoadingFromStorage) {
      return;
    }
    
    if (typeof window !== 'undefined') {
      isLoadingFromStorage = true;
      set({ isLoading: true });
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Récupérer les infos utilisateur depuis l'API
            const res = await authApi.me();
            const user = res.data;
            
            // Ne mettre à jour que si les valeurs ont changé pour éviter les boucles infinies
            const currentState = get();
            if (currentState.user?.id !== user.id || currentState.token !== token) {
              set({ user, token, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          } catch (e) {
            // Token invalide ou expiré
            localStorage.removeItem('token');
            const currentState = get();
            if (currentState.user !== null || currentState.token !== null) {
              set({ user: null, token: null, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          }
        } else {
          // Si pas de token dans le storage, s'assurer que le state est null
          const currentState = get();
          if (currentState.user !== null || currentState.token !== null) {
            set({ user: null, token: null, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        }
      } catch (error) {
        // Erreur lors du chargement
        const currentState = get();
        if (currentState.user !== null || currentState.token !== null) {
          set({ user: null, token: null, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } finally {
        isLoadingFromStorage = false;
      }
    } else {
      set({ isLoading: false });
    }
  },
}));

