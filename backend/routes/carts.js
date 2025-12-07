import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Créer ou mettre à jour un panier (client)
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, notes } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier doit contenir au moins un produit' });
    }

    // Vérifier que tous les produits existent et récupérer leurs prix
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Un ou plusieurs produits sont introuvables' });
    }

    // Créer les items avec les prix actuels
    const cartItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      return {
        product: item.product,
        quantity: item.quantity,
        price: product.price
      };
    });

    // Chercher un panier en statut "en_cours" pour cet utilisateur (pas les commandes validées en "demande")
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      status: 'en_cours'
    });

    if (cart) {
      // Mettre à jour le panier existant et passer en "demande" (validé)
      cart.items = cartItems;
      cart.notes = notes || cart.notes;
      cart.status = 'demande'; // Validation de la commande
      await cart.save();
    } else {
      // Créer un nouveau panier directement en "demande" (validé)
      cart = new Cart({
        user: req.user.id,
        items: cartItems,
        notes: notes,
        status: 'demande'
      });
      await cart.save();
    }

    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer mon panier actif (client) - seulement les paniers en cours (pas les commandes validées)
router.get('/my', authenticate, async (req, res) => {
  try {
    // Récupérer uniquement le panier en statut "en_cours" (pas les commandes validées en "demande" ou "traité")
    const cart = await Cart.findOne({ 
      user: req.user.id, 
      status: 'en_cours'
    })
    .populate('items.product', 'name slug price images brand')
    .populate('user', 'firstName lastName email');

    if (!cart) {
      return res.json(null);
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer toutes mes commandes (client)
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const carts = await Cart.find({ user: req.user.id })
      .populate('items.product', 'name slug price images brand')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(carts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Synchroniser le panier (créer ou mettre à jour le panier actif)
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { items, notes } = req.body;
    
    // Si pas d'items, supprimer seulement le panier "en_cours" (pas les commandes validées en "demande")
    if (!items || !Array.isArray(items) || items.length === 0) {
      const existingCart = await Cart.findOne({ 
        user: req.user.id, 
        status: 'en_cours' // Ne supprimer que les paniers en cours, pas les commandes validées
      });
      
      if (existingCart) {
        await Cart.findByIdAndDelete(existingCart._id);
      }
      
      return res.json({ message: 'Panier vidé', cart: null });
    }

    // Vérifier que tous les produits existent et récupérer leurs prix
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Un ou plusieurs produits sont introuvables' });
    }

    // Créer les items avec les prix actuels
    const cartItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      return {
        product: item.product,
        quantity: item.quantity,
        price: product.price
      };
    });

    // Chercher un panier en statut "en_cours" pour cet utilisateur (pas les commandes validées)
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      status: 'en_cours'
    });

    if (cart) {
      // Mettre à jour le panier existant
      cart.items = cartItems;
      cart.notes = notes || cart.notes;
      await cart.save();
    } else {
      // Créer un nouveau panier en statut "en_cours"
      cart = new Cart({
        user: req.user.id,
        items: cartItems,
        notes: notes || '',
        status: 'en_cours'
      });
      await cart.save();
    }

    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer tous les paniers (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      // Recherche par utilisateur
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const orConditions = [
        { notes: { $regex: search, $options: 'i' } }
      ];
      
      if (users.length > 0) {
        orConditions.push({ user: { $in: users.map(u => u._id) } });
      }
      
      query.$or = orConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const carts = await Cart.find(query)
      .populate({
        path: 'items.product',
        select: 'name slug price images brand',
        match: { isActive: { $ne: false } }
      })
      .populate({
        path: 'user',
        select: 'firstName lastName email',
        options: { strictPopulate: false }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cart.countDocuments(query);

    res.json({ 
      carts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compter les commandes en statut "demande" (admin)
router.get('/count-pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const count = await Cart.countDocuments({ status: 'demande' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques des paniers (admin) - DOIT être avant /user/:userId
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '7d', status = 'traité' } = req.query;
    
    // Déterminer le nombre de jours selon la période
    let days;
    switch (period) {
      case '7d':
        days = 7;
        break;
      case '14d':
        days = 14;
        break;
      case '30d':
        days = 30;
        break;
      case '365d':
        days = 365;
        break;
      default:
        days = 7;
    }
    
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);
    
    // Construire la query selon le statut
    const query = {
      createdAt: { $gte: startDate },
      status: status
    };
    
    // Récupérer tous les paniers de la période avec le statut sélectionné
    const carts = await Cart.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email company',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .populate('items.product', 'name price');
    
    // Calculs de base
    const totalCarts = carts.length;
    const totalAmount = carts.reduce((sum, cart) => sum + (cart.total || 0), 0);
    const averageCart = totalCarts > 0 ? totalAmount / totalCarts : 0;
    
    // Statistiques par jour
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setUTCHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      
      const dayCarts = carts.filter(cart => {
        const cartDate = new Date(cart.createdAt);
        return cartDate >= date && cartDate < nextDate;
      });
      
      const dayTotal = dayCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);
      const dayCount = dayCarts.length;
      const dayAverage = dayCount > 0 ? dayTotal / dayCount : 0;
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        count: dayCount,
        total: dayTotal,
        average: dayAverage
      });
    }
    
    // Top entreprises
    const companyStats = new Map();
    carts.forEach(cart => {
      if (cart.user && cart.user.company) {
        // Gérer le cas où company est un objet peuplé ou un ObjectId
        let companyId;
        let companyName;
        
        if (typeof cart.user.company === 'object' && cart.user.company !== null) {
          // Company est peuplé
          companyId = cart.user.company._id ? cart.user.company._id.toString() : null;
          companyName = cart.user.company.name || 'Sans entreprise';
        } else {
          // Company est un ObjectId non peuplé (ne devrait pas arriver avec le populate imbriqué, mais on gère le cas)
          companyId = cart.user.company.toString();
          companyName = 'Sans entreprise';
        }
        
        if (companyId) {
          if (!companyStats.has(companyId)) {
            companyStats.set(companyId, {
              id: companyId,
              name: companyName,
              count: 0,
              total: 0
            });
          }
          
          const stat = companyStats.get(companyId);
          stat.count += 1;
          stat.total += cart.total || 0;
        }
      }
    });
    
    const topCompanies = Array.from(companyStats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    // Top clients
    const clientStats = new Map();
    carts.forEach(cart => {
      if (cart.user) {
        const userId = cart.user._id || cart.user;
        const userName = `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() || cart.user.email || 'Client inconnu';
        
        if (!clientStats.has(userId)) {
          clientStats.set(userId, {
            id: userId,
            name: userName,
            email: cart.user.email || '',
            count: 0,
            total: 0
          });
        }
        
        const stat = clientStats.get(userId);
        stat.count += 1;
        stat.total += cart.total || 0;
      }
    });
    
    const topClients = Array.from(clientStats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    res.json({
      period,
      summary: {
        totalCarts,
        totalAmount,
        averageCart
      },
      dailyStats,
      topCompanies,
      topClients
    });
  } catch (error) {
    console.error('Error in cart stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les paniers d'un utilisateur (admin)
router.get('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const carts = await Cart.find({ user: req.params.userId })
      .populate('items.product', 'name slug price images brand')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ carts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vérifier si un utilisateur a un panier en cours (admin)
router.get('/user/:userId/active', authenticate, requireAdmin, async (req, res) => {
  try {
    const activeCart = await Cart.findOne({ 
      user: req.params.userId, 
      status: 'en_cours' 
    })
      .populate('items.product', 'name slug price images brand')
      .populate('user', 'firstName lastName email');

    res.json({ hasActiveCart: !!activeCart, cart: activeCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un panier pour un utilisateur spécifique (admin)
router.post('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { items, notes, replaceActive = false } = req.body;
    const userId = req.params.userId;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier doit contenir au moins un produit' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que tous les produits existent et récupérer leurs prix
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Un ou plusieurs produits sont introuvables' });
    }

    // Créer les items avec les prix actuels
    const cartItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product);
      return {
        product: item.product,
        quantity: item.quantity,
        price: product.price
      };
    });

    // Si replaceActive est true, supprimer le panier en cours
    if (replaceActive) {
      const existingCart = await Cart.findOne({ 
        user: userId, 
        status: 'en_cours' 
      });
      
      if (existingCart) {
        await Cart.findByIdAndDelete(existingCart._id);
      }
    }

    // Créer le nouveau panier (le total sera calculé automatiquement par le modèle)
    const cart = new Cart({
      user: userId,
      items: cartItems,
      notes: notes || '',
      status: 'en_cours'
    });
    await cart.save();

    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les commandes d'une entreprise (admin)
router.get('/company/:companyId', authenticate, requireAdmin, async (req, res) => {
  try {
    // Trouver tous les utilisateurs de cette entreprise
    const users = await User.find({ company: req.params.companyId }).select('_id');
    const userIds = users.map(u => u._id);
    
    // Récupérer toutes les commandes de ces utilisateurs
    const carts = await Cart.find({ user: { $in: userIds } })
      .populate('items.product', 'name slug price images brand')
      .populate('user', 'firstName lastName email company')
      .sort({ createdAt: -1 });

    res.json({ carts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un panier par ID (admin ou propriétaire)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id)
      .populate('items.product', 'name slug price images brand')
      .populate('user', 'firstName lastName email');

    if (!cart) {
      return res.status(404).json({ error: 'Panier non trouvé' });
    }

    // Vérifier que l'utilisateur est admin ou propriétaire du panier
    if (req.user.role !== 'admin' && cart.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier un panier (client - seulement si statut "demande")
router.put('/:id', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);

    if (!cart) {
      return res.status(404).json({ error: 'Panier non trouvé' });
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (req.user.role !== 'admin' && cart.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Si le panier n'est pas en "en_cours" ou "demande", seul l'admin peut le modifier
    if (!['en_cours', 'demande'].includes(cart.status) && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Ce panier ne peut plus être modifié' });
    }

    const { items, notes } = req.body;

    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = items.map(item => item.product);
      const products = await Product.find({ _id: { $in: productIds } });
      
      if (products.length !== productIds.length) {
        return res.status(400).json({ error: 'Un ou plusieurs produits sont introuvables' });
      }

      cart.items = items.map(item => {
        const product = products.find(p => p._id.toString() === item.product);
        return {
          product: item.product,
          quantity: item.quantity,
          price: product.price
        };
      });
    }

    if (notes !== undefined) {
      cart.notes = notes;
    }

    await cart.save();
    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le statut d'un panier (admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['en_cours', 'demande', 'traité', 'annulé'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const cart = await Cart.findById(req.params.id);

    if (!cart) {
      return res.status(404).json({ error: 'Panier non trouvé' });
    }

    cart.status = status;
    await cart.save();
    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un panier (admin ou client si statut "demande")
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);

    if (!cart) {
      return res.status(404).json({ error: 'Panier non trouvé' });
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (req.user.role !== 'admin' && cart.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Si le panier n'est pas en "en_cours" ou "demande", seul l'admin peut le supprimer
    if (!['en_cours', 'demande'].includes(cart.status) && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Ce panier ne peut plus être supprimé' });
    }

    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: 'Panier supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

