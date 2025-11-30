import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
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

    // Chercher un panier en statut "en_cours" ou "demande" pour cet utilisateur
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      status: { $in: ['en_cours', 'demande'] }
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

// Récupérer mon panier actif (client)
router.get('/my', authenticate, async (req, res) => {
  try {
    // Récupérer le panier en cours ou en demande
    const cart = await Cart.findOne({ 
      user: req.user.id, 
      status: { $in: ['en_cours', 'demande'] }
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

// Synchroniser le panier (créer ou mettre à jour le panier actif)
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { items, notes } = req.body;
    
    // Si pas d'items, supprimer le panier actif s'il existe
    if (!items || !Array.isArray(items) || items.length === 0) {
      const existingCart = await Cart.findOne({ 
        user: req.user.id, 
        status: { $in: ['en_cours', 'demande'] }
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

    // Chercher un panier en statut "en_cours" ou "demande" pour cet utilisateur
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      status: { $in: ['en_cours', 'demande'] }
    });

    if (cart) {
      // Mettre à jour le panier existant
      cart.items = cartItems;
      cart.notes = notes || cart.notes;
      // Si le panier était en "demande", on le remet en "en_cours" car il est modifié
      if (cart.status === 'demande') {
        cart.status = 'en_cours';
      }
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

    if (!['en_cours', 'demande', 'traité', 'fini', 'annulé'].includes(status)) {
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

