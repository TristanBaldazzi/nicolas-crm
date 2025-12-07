'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from './api';
import { useAuthStore } from './store';

export const useProductTracking = (productId: string | null, eventType: 'view' | 'cart_add' | 'cart_remove' | 'purchase' | 'favorite_add' | 'favorite_remove') => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    console.log('[Tracking] Hook appelé:', { productId, eventType, hasUser: !!user, userConsent: user?.trackingConsent });
    
    if (!productId) {
      console.log('[Tracking] Pas de productId, arrêt');
      return;
    }

    // Vérifier le consentement de tracking
    // Si l'utilisateur est connecté et a explicitement refusé, on ne track pas
    // Sinon, on track (utilisateur non connecté, consentement donné, ou pas encore décidé)
    if (user && user.trackingConsent === false) {
      console.log('[Tracking] Refusé par l\'utilisateur');
      return;
    }
    
    console.log('[Tracking] Consentement OK, continuation...');

    // Pour les événements 'view', on track seulement une fois par session
    if (eventType === 'view') {
      const trackingKey = `tracked_${productId}_${pathname}`;
      const alreadyTracked = sessionStorage.getItem(trackingKey);
      console.log('[Tracking] Vérification sessionStorage:', { trackingKey, alreadyTracked });
      if (alreadyTracked) {
        console.log('[Tracking] Déjà tracké dans cette session, arrêt');
        return; // Déjà tracké dans cette session
      }
      sessionStorage.setItem(trackingKey, 'true');
      console.log('[Tracking] Clé sessionStorage définie');
    }

    console.log('[Tracking] Appel de trackEvent()...');
    const trackEvent = async () => {
      try {
        console.log('[Tracking] Envoi événement:', { productId, eventType, user: user?.id, consent: user?.trackingConsent });
        const response = await analyticsApi.track({
          productId,
          eventType,
          referrer: document.referrer || undefined,
          currentUrl: window.location.href,
        });
        console.log('[Tracking] Événement enregistré avec succès:', response.data);
      } catch (error: any) {
        // Afficher l'erreur pour le débogage
        console.error('[Tracking] Erreur complète:', error);
        console.error('[Tracking] Erreur response:', error.response?.data);
        console.error('[Tracking] Erreur message:', error.message);
        console.error('[Tracking] Erreur stack:', error.stack);
      }
    };

    trackEvent();
  }, [productId, eventType, pathname, user]);
};

