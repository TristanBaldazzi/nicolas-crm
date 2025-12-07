import express from 'express';
import ProductAnalytics from '../models/ProductAnalytics.js';
import Product from '../models/Product.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Générer ou récupérer un sessionId
const getSessionId = (req) => {
  if (!req.cookies.sessionId) {
    const sessionId = uuidv4();
    req.sessionId = sessionId;
    return sessionId;
  }
  return req.cookies.sessionId;
};

// Déterminer le type d'appareil à partir du userAgent
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'Inconnu';
  
  const ua = userAgent.toLowerCase();
  
  // iPhone
  if (ua.includes('iphone')) return 'iPhone';
  
  // iPad
  if (ua.includes('ipad')) return 'iPad';
  
  // Android
  if (ua.includes('android')) {
    // Tablettes Android
    if (ua.includes('tablet') || ua.includes('mobile') === false) {
      return 'Tablette Android';
    }
    return 'Android';
  }
  
  // Tablettes (autres)
  if (ua.includes('tablet') || ua.includes('playbook') || ua.includes('kindle')) {
    return 'Tablette';
  }
  
  // Mobile (autres)
  if (ua.includes('mobile') || ua.includes('blackberry') || ua.includes('windows phone')) {
    return 'Mobile';
  }
  
  // Desktop par défaut
  return 'Ordinateur';
};

// Déterminer la source du trafic
const getTrafficSource = (req) => {
  const referrer = req.headers.referer || req.body.referrer || '';
  const url = new URL(req.body.currentUrl || referrer || 'http://localhost');
  
  // Si pas de referrer, c'est direct
  if (!referrer) return 'direct';
  
  // Si le referrer vient du même domaine
  if (referrer.includes(process.env.FRONTEND_URL?.replace('http://', '').replace('https://', '') || 'localhost:3000')) {
    const pathname = url.pathname;
    if (pathname.includes('/catalogue') || pathname.includes('/recherche')) return 'catalog';
    if (pathname.includes('/categorie')) return 'category';
    if (pathname.includes('/marque') || pathname.includes('?brand=')) return 'brand';
    if (pathname.includes('/recherche-avancee')) return 'search';
    return 'other';
  }
  
  // Referrer externe
  return 'external';
};

// Enregistrer un événement de tracking
router.post('/track', optionalAuthenticate, async (req, res) => {
  try {
    const { productId, eventType, referrer, currentUrl, metadata } = req.body;

    if (!productId || !eventType) {
      return res.status(400).json({ error: 'productId et eventType sont requis' });
    }

    // Vérifier si l'utilisateur a donné son consentement
    // Si l'utilisateur est connecté et a explicitement refusé le tracking, on ne track pas
    // Sinon, on track (utilisateur non connecté, consentement donné, ou pas encore décidé)
    if (req.user && req.user.trackingConsent === false) {
      console.log('[Analytics] Tracking refusé pour utilisateur:', req.user.id);
      return res.status(200).json({ message: 'Tracking refusé par l\'utilisateur' });
    }

    console.log('[Analytics] Tracking autorisé:', {
      userId: req.user?.id || 'anonyme',
      consent: req.user?.trackingConsent,
      productId,
      eventType
    });

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const sessionId = getSessionId(req);
    const source = getTrafficSource(req);

    const analytics = new ProductAnalytics({
      product: productId,
      eventType,
      userId: req.user?.id || null,
      sessionId,
      referrer: referrer || req.headers.referer || null,
      source,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || null,
      metadata: metadata || {}
    });

    await analytics.save();

    // Définir le cookie sessionId si pas déjà défini
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 an
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les statistiques d'un produit (admin seulement)
router.get('/product/:productId', optionalAuthenticate, async (req, res) => {
  try {
    // Vérifier que c'est un admin
    if (!req.user || req.user.role !== 'admin') {
      console.log('[Analytics] Accès refusé - pas admin:', req.user?.role);
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('[Analytics] Récupération stats pour produit:', productId, 'Dates:', { startDate, endDate });

    // Construire le filtre de date
    const dateFilter = { product: productId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    console.log('[Analytics] Filtre de recherche:', JSON.stringify(dateFilter, null, 2));

    // Récupérer tous les événements pour ce produit
    const events = await ProductAnalytics.find(dateFilter).sort({ createdAt: -1 });
    
    console.log('[Analytics] Événements trouvés:', events.length);

    // Statistiques globales
    const stats = {
      totalViews: events.filter(e => e.eventType === 'view').length,
      totalCartAdds: events.filter(e => e.eventType === 'cart_add').length,
      totalCartRemoves: events.filter(e => e.eventType === 'cart_remove').length,
      totalPurchases: events.filter(e => e.eventType === 'purchase').length,
      totalFavorites: events.filter(e => e.eventType === 'favorite_add').length,
      conversionRate: 0,
      cartAbandonmentRate: 0,
      favoriteRate: 0
    };

    // Calculer les taux
    if (stats.totalViews > 0) {
      stats.conversionRate = ((stats.totalPurchases / stats.totalViews) * 100).toFixed(2);
      stats.cartAbandonmentRate = ((stats.totalCartAdds / stats.totalViews) * 100).toFixed(2);
      stats.favoriteRate = ((stats.totalFavorites / stats.totalViews) * 100).toFixed(2);
    }

    // Statistiques par source de trafic
    const trafficSources = {};
    events.forEach(event => {
      if (!trafficSources[event.source]) {
        trafficSources[event.source] = {
          views: 0,
          cartAdds: 0,
          purchases: 0,
          favorites: 0
        };
      }
      if (event.eventType === 'view') trafficSources[event.source].views++;
      if (event.eventType === 'cart_add') trafficSources[event.source].cartAdds++;
      if (event.eventType === 'purchase') trafficSources[event.source].purchases++;
      if (event.eventType === 'favorite_add') trafficSources[event.source].favorites++;
    });

    // Statistiques par jour (pour les graphiques)
    const dailyStats = {};
    events.forEach(event => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          views: 0,
          cartAdds: 0,
          purchases: 0,
          favorites: 0
        };
      }
      if (event.eventType === 'view') dailyStats[date].views++;
      if (event.eventType === 'cart_add') dailyStats[date].cartAdds++;
      if (event.eventType === 'purchase') dailyStats[date].purchases++;
      if (event.eventType === 'favorite_add') dailyStats[date].favorites++;
    });

    // Convertir en tableau trié par date
    const dailyStatsArray = Object.entries(dailyStats)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Statistiques par referrer (pages d'origine)
    const referrers = {};
    events.forEach(event => {
      if (event.referrer) {
        // Nettoyer le referrer pour ne garder que le chemin
        let referrerPath = event.referrer;
        try {
          const referrerUrl = new URL(event.referrer);
          referrerPath = referrerUrl.pathname + referrerUrl.search;
        } catch (e) {
          // Si ce n'est pas une URL valide, garder tel quel
        }
        
        // Regrouper tous les referrers de /admin sous "Admin"
        const normalizedPath = referrerPath.startsWith('/admin') ? '/admin' : referrerPath;
        
        if (!referrers[normalizedPath]) {
          referrers[normalizedPath] = {
            referrer: normalizedPath,
            count: 0,
            views: 0,
            cartAdds: 0,
            purchases: 0,
            favorites: 0
          };
        }
        referrers[normalizedPath].count++;
        if (event.eventType === 'view') referrers[normalizedPath].views++;
        if (event.eventType === 'cart_add') referrers[normalizedPath].cartAdds++;
        if (event.eventType === 'purchase') referrers[normalizedPath].purchases++;
        if (event.eventType === 'favorite_add') referrers[normalizedPath].favorites++;
      }
    });

    // Convertir en tableau et trier par nombre de vues décroissant
    const topReferrers = Object.values(referrers)
      .sort((a, b) => b.views - a.views)
      .slice(0, 20); // Top 20

    // Statistiques par type d'appareil
    const deviceStats = {};
    events.forEach(event => {
      const deviceType = getDeviceType(event.userAgent);
      
      if (!deviceStats[deviceType]) {
        deviceStats[deviceType] = {
          deviceType,
          count: 0,
          views: 0,
          cartAdds: 0,
          purchases: 0,
          favorites: 0
        };
      }
      deviceStats[deviceType].count++;
      if (event.eventType === 'view') deviceStats[deviceType].views++;
      if (event.eventType === 'cart_add') deviceStats[deviceType].cartAdds++;
      if (event.eventType === 'purchase') deviceStats[deviceType].purchases++;
      if (event.eventType === 'favorite_add') deviceStats[deviceType].favorites++;
    });

    // Convertir en tableau et trier par nombre de vues décroissant
    const deviceStatsArray = Object.values(deviceStats)
      .sort((a, b) => b.views - a.views);

    const response = {
      stats,
      trafficSources,
      dailyStats: dailyStatsArray,
      topReferrers,
      deviceStats: deviceStatsArray,
      totalEvents: events.length
    };

    console.log('[Analytics] Réponse envoyée:', {
      totalEvents: events.length,
      stats: {
        views: stats.totalViews,
        cartAdds: stats.totalCartAdds,
        purchases: stats.totalPurchases,
        favorites: stats.totalFavorites
      },
      dailyStatsCount: dailyStatsArray.length,
      trafficSourcesCount: Object.keys(trafficSources).length
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les statistiques de tous les produits (admin seulement)
router.get('/products', optionalAuthenticate, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { startDate, endDate, limit = 50 } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Agrégation pour obtenir les stats par produit
    const productStats = await ProductAnalytics.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$product',
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
          cartAdds: { $sum: { $cond: [{ $eq: ['$eventType', 'cart_add'] }, 1, 0] } },
          purchases: { $sum: { $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0] } },
          favorites: { $sum: { $cond: [{ $eq: ['$eventType', 'favorite_add'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$views', 0] },
              { $multiply: [{ $divide: ['$purchases', '$views'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Populate les produits
    const productIds = productStats.map(stat => stat._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images price');

    const productsMap = {};
    products.forEach(product => {
      productsMap[product._id.toString()] = product;
    });

    const result = productStats.map(stat => ({
      product: productsMap[stat._id.toString()],
      stats: {
        views: stat.views,
        cartAdds: stat.cartAdds,
        purchases: stat.purchases,
        favorites: stat.favorites,
        conversionRate: stat.conversionRate.toFixed(2)
      }
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching products analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

