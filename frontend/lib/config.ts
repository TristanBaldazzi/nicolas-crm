// Configuration de l'API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Helper pour construire l'URL complète d'une image
export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};


