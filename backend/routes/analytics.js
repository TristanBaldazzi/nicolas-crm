import express from 'express';
import ProductAnalytics from '../models/ProductAnalytics.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
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

// Déterminer la source du trafic et le référent utilisateur
const getTrafficSource = (req) => {
  const referrer = req.headers.referer || req.body.referrer || '';
  const currentUrl = req.body.currentUrl || req.query.currentUrl || '';
  
  // Vérifier d'abord l'URL actuelle pour le paramètre ref
  if (currentUrl) {
    try {
      const currentUrlObj = new URL(currentUrl);
      const refParam = currentUrlObj.searchParams.get('ref');
      if (refParam) {
        return { source: 'user_referral', referrerUserId: refParam };
      }
    } catch (e) {
      // Si l'URL n'est pas valide, continuer
    }
  }
  
  // Vérifier le referrer pour le paramètre ref
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const refParam = referrerUrl.searchParams.get('ref');
      if (refParam) {
        return { source: 'user_referral', referrerUserId: refParam };
      }
    } catch (e) {
      // Si l'URL n'est pas valide, continuer
    }
  }
  
  // Si pas de referrer, c'est direct
  if (!referrer) return { source: 'direct', referrerUserId: null };
  
  // Si le referrer vient du même domaine
  const frontendDomain = process.env.FRONTEND_URL?.replace('http://', '').replace('https://', '') || 'localhost:3000';
  if (referrer.includes(frontendDomain)) {
    try {
      const referrerUrl = new URL(referrer);
      const pathname = referrerUrl.pathname;
      if (pathname.includes('/catalogue') || pathname.includes('/recherche')) return { source: 'catalog', referrerUserId: null };
      if (pathname.includes('/categorie')) return { source: 'category', referrerUserId: null };
      if (pathname.includes('/marque') || pathname.includes('?brand=')) return { source: 'brand', referrerUserId: null };
      if (pathname.includes('/recherche-avancee')) return { source: 'search', referrerUserId: null };
    } catch (e) {
      // Si l'URL n'est pas valide, continuer
    }
    return { source: 'other', referrerUserId: null };
  }
  
  // Referrer externe
  return { source: 'external', referrerUserId: null };
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
    const trafficInfo = getTrafficSource(req);
    const source = trafficInfo.source;
    const referrerUserId = trafficInfo.referrerUserId;

    // Ne pas tracker si c'est la propre personne qui visite (même userId que referrerUserId)
    if (req.user && referrerUserId && req.user.id === referrerUserId) {
      console.log('[Analytics] Visite de sa propre page, tracking ignoré');
      return res.status(200).json({ message: 'Tracking ignoré - visite de sa propre page' });
    }

    const analytics = new ProductAnalytics({
      product: productId,
      eventType,
      userId: req.user?.id || null,
      referrerUserId: referrerUserId || null,
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

    // Récupérer tous les événements pour ce produit avec populate userId et referrerUserId
    const events = await ProductAnalytics.find(dateFilter)
      .populate('userId', 'firstName lastName email')
      .populate('referrerUserId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
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

    // Statistiques par référent utilisateur (user_referral)
    const userReferrers = {};
    events.forEach(event => {
      if (event.referrerUserId && event.source === 'user_referral') {
        // Extraire l'ID correctement (peut être un ObjectId ou un objet peuplé)
        const referrerIdValue = event.referrerUserId;
        const isPopulated = referrerIdValue && typeof referrerIdValue === 'object' && referrerIdValue._id;
        const referrerId = isPopulated ? referrerIdValue._id.toString() : referrerIdValue.toString();
        
        if (!userReferrers[referrerId]) {
          userReferrers[referrerId] = {
            referrerUserId: isPopulated ? referrerIdValue._id : referrerIdValue,
            views: 0,
            cartAdds: 0,
            purchases: 0,
            favorites: 0
          };
        }
        if (event.eventType === 'view') userReferrers[referrerId].views++;
        if (event.eventType === 'cart_add') userReferrers[referrerId].cartAdds++;
        if (event.eventType === 'purchase') userReferrers[referrerId].purchases++;
        if (event.eventType === 'favorite_add') userReferrers[referrerId].favorites++;
      }
    });

    // Populate les informations des utilisateurs référents
    const referrerUserIds = Object.keys(userReferrers).filter(id => id && id.length === 24); // Filtrer les IDs valides (24 caractères)
    const referrerUsers = referrerUserIds.length > 0 
      ? await User.find({ _id: { $in: referrerUserIds } })
          .select('firstName lastName email')
      : [];

    const referrerUsersMap = {};
    referrerUsers.forEach(user => {
      referrerUsersMap[user._id.toString()] = user;
    });

    const userReferrersArray = Object.entries(userReferrers)
      .map(([referrerId, ref]) => {
        const user = referrerUsersMap[referrerId];
        return {
          ...ref,
          referrerUser: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : null
        };
      })
      .sort((a, b) => b.views - a.views);

    // Statistiques par utilisateur avec tous les événements détaillés
    const userStats = {};
    events.forEach(event => {
      // Gérer le cas où userId est peuplé (objet) ou non (ObjectId)
      const userIdValue = event.userId;
      const isPopulated = userIdValue && typeof userIdValue === 'object' && userIdValue._id;
      const userId = userIdValue 
        ? (isPopulated ? userIdValue._id.toString() : userIdValue.toString())
        : 'anonymous';
      
      const userObj = isPopulated ? userIdValue : null;
      const userName = userObj 
        ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.email || 'Utilisateur inconnu'
        : 'Visiteur anonyme';
      const userEmail = userObj ? userObj.email : null;
      
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId === 'anonymous' ? null : (isPopulated ? userIdValue._id : userIdValue),
          userName,
          userEmail,
          events: [],
          views: 0,
          cartAdds: 0,
          purchases: 0,
          favorites: 0,
          cartRemoves: 0,
          favoriteRemoves: 0
        };
      }
      
      // Ajouter l'événement détaillé
      userStats[userId].events.push({
        eventType: event.eventType,
        createdAt: event.createdAt,
        referrer: event.referrer,
        source: event.source,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        metadata: event.metadata,
        sessionId: event.sessionId
      });
      
      // Compter les événements
      if (event.eventType === 'view') userStats[userId].views++;
      if (event.eventType === 'cart_add') userStats[userId].cartAdds++;
      if (event.eventType === 'cart_remove') userStats[userId].cartRemoves++;
      if (event.eventType === 'purchase') userStats[userId].purchases++;
      if (event.eventType === 'favorite_add') userStats[userId].favorites++;
      if (event.eventType === 'favorite_remove') userStats[userId].favoriteRemoves++;
    });

    // Convertir en tableau et trier par nombre total d'événements décroissant
    const userStatsArray = Object.values(userStats)
      .map((user) => ({
        ...user,
        totalEvents: user.events.length,
        events: user.events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Trier les événements par date décroissante
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents);

    const response = {
      stats,
      trafficSources,
      dailyStats: dailyStatsArray,
      topReferrers,
      deviceStats: deviceStatsArray,
      userReferrers: userReferrersArray,
      userStats: userStatsArray,
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

    const { startDate, endDate, limit = 50, sortBy = 'views', period } = req.query;

    // Calculer les dates selon la période
    let dateFilter = {};
    if (period) {
      const now = new Date();
      const start = new Date();
      
      if (period === 'today') {
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt = { $gte: start, $lte: now };
      } else if (period === '7d') {
        start.setDate(start.getDate() - 7);
        dateFilter.createdAt = { $gte: start, $lte: now };
      } else if (period === '30d') {
        start.setDate(start.getDate() - 30);
        dateFilter.createdAt = { $gte: start, $lte: now };
      } else if (period === 'all') {
        // Pas de filtre de date
      }
    } else if (startDate || endDate) {
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

    // Agrégation pour obtenir les stats par produit depuis ProductAnalytics
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
      }
    ]);

    // Récupérer les ventes depuis les commandes traitées
    let cartDateFilter = {};
    if (period) {
      const now = new Date();
      const start = new Date();
      
      if (period === 'today') {
        start.setHours(0, 0, 0, 0);
        cartDateFilter.updatedAt = { $gte: start, $lte: now };
      } else if (period === '7d') {
        start.setDate(start.getDate() - 7);
        cartDateFilter.updatedAt = { $gte: start, $lte: now };
      } else if (period === '30d') {
        start.setDate(start.getDate() - 30);
        cartDateFilter.updatedAt = { $gte: start, $lte: now };
      }
    } else if (startDate || endDate) {
      cartDateFilter.updatedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        cartDateFilter.updatedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        cartDateFilter.updatedAt.$lte = end;
      }
    }

    const salesStats = await Cart.aggregate([
      { 
        $match: { 
          status: 'traité',
          ...cartDateFilter
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          sales: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      }
    ]);

    // Combiner les stats
    const statsMap = {};
    productStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        views: stat.views,
        cartAdds: stat.cartAdds,
        purchases: stat.purchases,
        favorites: stat.favorites,
        conversionRate: stat.conversionRate,
        sales: 0,
        revenue: 0
      };
    });

    salesStats.forEach(stat => {
      const id = stat._id.toString();
      if (!statsMap[id]) {
        statsMap[id] = {
          views: 0,
          cartAdds: 0,
          purchases: 0,
          favorites: 0,
          conversionRate: 0,
          sales: 0,
          revenue: 0
        };
      }
      statsMap[id].sales = stat.sales;
      statsMap[id].revenue = stat.revenue;
    });

    // Convertir en tableau et trier
    const sortField = sortBy === 'sales' ? 'sales' : 
                     sortBy === 'revenue' ? 'revenue' :
                     sortBy === 'cartAdds' ? 'cartAdds' :
                     sortBy === 'purchases' ? 'purchases' :
                     sortBy === 'favorites' ? 'favorites' :
                     sortBy === 'conversionRate' ? 'conversionRate' : 'views';

    const sortedStats = Object.entries(statsMap)
      .map(([productId, stats]) => ({
        _id: productId,
        ...stats
      }))
      .sort((a, b) => {
        // Trier par la métrique choisie (décroissant)
        if (sortField === 'conversionRate') {
          return b.conversionRate - a.conversionRate;
        }
        return (b[sortField] || 0) - (a[sortField] || 0);
      })
      .slice(0, parseInt(limit));

    // Populate les produits
    const productIds = sortedStats.map(stat => stat._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug images price');

    const productsMap = {};
    products.forEach(product => {
      productsMap[product._id.toString()] = product;
    });

    const result = sortedStats.map(stat => ({
      product: productsMap[stat._id] || null,
      stats: {
        views: stat.views,
        cartAdds: stat.cartAdds,
        purchases: stat.purchases,
        favorites: stat.favorites,
        conversionRate: stat.conversionRate.toFixed(2),
        sales: stat.sales,
        revenue: stat.revenue
      }
    })).filter(item => item.product !== null); // Filtrer les produits qui n'existent plus

    res.json(result);
  } catch (error) {
    console.error('Error fetching products analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les statistiques simplifiées pour tous les produits (vues et commandes traitées)
router.get('/products/summary', optionalAuthenticate, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les vues par produit
    const viewsStats = await ProductAnalytics.aggregate([
      {
        $match: { eventType: 'view' }
      },
      {
        $group: {
          _id: '$product',
          views: { $sum: 1 }
        }
      }
    ]);

    // Récupérer les commandes traitées par produit
    const processedOrdersStats = await Cart.aggregate([
      {
        $match: { status: 'traité' }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          orders: { $sum: 1 }
        }
      }
    ]);

    // Créer des maps pour un accès rapide
    const viewsMap = {};
    viewsStats.forEach(stat => {
      viewsMap[stat._id.toString()] = stat.views;
    });

    const ordersMap = {};
    processedOrdersStats.forEach(stat => {
      ordersMap[stat._id.toString()] = stat.orders;
    });

    // Combiner les résultats
    const allProductIds = new Set([
      ...viewsStats.map(s => s._id.toString()),
      ...processedOrdersStats.map(s => s._id.toString())
    ]);

    const result = {};
    allProductIds.forEach(productId => {
      result[productId] = {
        views: viewsMap[productId] || 0,
        processedOrders: ordersMap[productId] || 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching products summary:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

