import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  company?: {
    _id: string;
    name: string;
    code?: string;
  } | null;
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
    // Le token est maintenant dans un cookie HTTP-only, on ne le stocke plus dans le state
    set({ user, token: 'cookie', isLoading: false });
  },
  logout: async () => {
    try {
      // Appeler l'API pour supprimer le cookie
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    set({ user: null, token: null, isLoading: false });
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
        // Le token est dans un cookie HTTP-only, on récupère directement les infos utilisateur
        const res = await authApi.me();
        // La réponse peut être { user: {...} } ou { user: null }
        const user = res.data.user || res.data;
        
        // Ne mettre à jour que si les valeurs ont changé pour éviter les boucles infinies
        const currentState = get();
        if (user && currentState.user?.id !== user.id) {
          set({ user, token: 'cookie', isLoading: false });
        } else if (!user && (currentState.user !== null || currentState.token !== null)) {
          set({ user: null, token: null, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (e: any) {
        // Erreur réseau ou autre - logger seulement les erreurs non-réseau
        if (e.code !== 'ERR_NETWORK') {
          console.error('Error loading user:', e);
        }
        
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

