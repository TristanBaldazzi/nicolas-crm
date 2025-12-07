import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    // Vérifier si les inscriptions sont autorisées
    const settings = await Settings.getSettings();
    if (!settings.allowRegistration) {
      return res.status(403).json({ error: 'Les inscriptions sont actuellement désactivées. Veuillez nous contacter directement par email.' });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer un nouvel utilisateur (seuls les admins peuvent créer des admins)
    const userRole = role === 'admin' && req.user?.role !== 'admin' ? 'user' : (role || 'user');

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: userRole
    });

    await user.save();

    // Générer le token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Envoyer le token dans un cookie HTTP-only
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Envoyer le token dans un cookie HTTP-only
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Déconnexion
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Déconnexion réussie' });
});

// Vérifier le token (optionnel - retourne null si pas connecté)
router.get('/me', optionalAuthenticate, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  
  // Mettre à jour la date de dernière activité
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { lastActivity: new Date() },
    { new: true }
  ).populate('company', 'name code').select('-password');
  
  res.json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      lastActivity: user.lastActivity,
      trackingConsent: user.trackingConsent,
      trackingConsentDate: user.trackingConsentDate
    }
  });
});

// Mettre à jour son propre profil (utilisateur connecté)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Seuls le prénom et le nom peuvent être modifiés par l'utilisateur
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();
    await user.populate('company', 'name code');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour le consentement de tracking
router.put('/tracking-consent', authenticate, async (req, res) => {
  try {
    const { consent } = req.body;
    
    if (typeof consent !== 'boolean') {
      return res.status(400).json({ error: 'Le consentement doit être un booléen' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.trackingConsent = consent;
    user.trackingConsentDate = new Date();

    await user.save();
    await user.populate('company', 'name code');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        trackingConsent: user.trackingConsent,
        trackingConsentDate: user.trackingConsentDate
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer tous les utilisateurs (non-admin) - pour les admins
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer uniquement les utilisateurs non-admin
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ role: { $ne: 'admin' } });

    res.json({
      users,
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

// Statistiques des nouveaux utilisateurs (DOIT être avant /users/:id)
router.get('/users/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
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
    
    // Créer un tableau pour les N derniers jours
    const stats = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setUTCHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      // Compter les utilisateurs non-admin créés ce jour-là
      const count = await User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: {
          $gte: date,
          $lt: nextDate
        }
      });

      stats.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        count
      });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error in user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un utilisateur par ID (admin) - DOIT être après /users/stats
// Récupérer un utilisateur par ID (admin)
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('company', 'name code');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      company: user.company,
      trackingConsent: user.trackingConsent,
      trackingConsentDate: user.trackingConsentDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un utilisateur (admin)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, company } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de modifier un admin en user ou vice versa si ce n'est pas explicitement demandé
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email && email !== user.email) {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      user.email = email.toLowerCase();
    }
    if (role && role !== 'admin') {
      user.role = role;
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (company !== undefined) {
      if (company === null || company === '') {
        user.company = null;
      } else {
        // Vérifier que l'entreprise existe
        const Company = (await import('../models/Company.js')).default;
        const companyDoc = await Company.findById(company);
        if (!companyDoc) {
          return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        user.company = company;
      }
    }

    await user.save();
    await user.populate('company', 'name code');

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      company: user.company
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer les favoris de l'utilisateur
router.get('/favorites', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      match: { isActive: true },
      select: 'name slug price images shortDescription brand isFeatured isBestSeller isInStock',
      populate: {
        path: 'brand',
        select: 'name'
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Filtrer les favoris null (produits supprimés)
    const favorites = user.favorites.filter(fav => fav !== null);
    
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter un produit aux favoris
router.post('/favorites/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que le produit existe
    const Product = (await import('../models/Product.js')).default;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier si le produit est déjà dans les favoris
    if (user.favorites.includes(productId)) {
      return res.status(400).json({ error: 'Produit déjà dans les favoris' });
    }

    // Ajouter le produit aux favoris
    user.favorites.push(productId);
    await user.save();

    res.json({ message: 'Produit ajouté aux favoris', favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un produit des favoris
router.delete('/favorites/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Retirer le produit des favoris
    user.favorites = user.favorites.filter(
      fav => fav.toString() !== productId
    );
    await user.save();

    res.json({ message: 'Produit retiré des favoris', favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;



