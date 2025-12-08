// Configuration de l'API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper pour construire l'URL complète d'une image
export const getImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

// Helper pour générer un lien avec référent utilisateur
export const getLinkWithRef = (path: string, userId: string | null | undefined): string => {
  if (!userId) return path;
  
  // Si le path contient déjà des paramètres de requête
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}ref=${userId}`;
};


