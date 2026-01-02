// Configuration de l'API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper pour obtenir l'URL du backend (avec détection automatique en production)
const getBackendUrl = () => {
  // Priorité 1: Variable d'environnement explicite
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  
  // Priorité 2: Si on est côté client, détecter depuis l'URL actuelle
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Si on est sur le domaine de production, utiliser le même domaine
    if (origin.includes('rcm.baldazzi.fr') || origin.includes('localhost')) {
      return origin;
    }
  }
  
  // Fallback: valeur par défaut
  return BACKEND_URL;
};

// Helper pour construire l'URL complète d'une image
export const getImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (imagePath.startsWith('http')) return imagePath;
  
  const backendUrl = getBackendUrl();
  return `${backendUrl}${imagePath}`;
};

// Helper pour générer un lien avec référent utilisateur
export const getLinkWithRef = (path: string, userId: string | null | undefined): string => {
  if (!userId) return path;
  
  // Si le path contient déjà des paramètres de requête
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}ref=${userId}`;
};


