import express from 'express';
import Promotion from '../models/Promotion.js';
import Company from '../models/Company.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les promotions (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { companyId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (companyId) {
      query.company = companyId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const promotions = await Promotion.find(query)
      .populate('company', 'name code')
      .populate('productIds', 'name slug')
      .populate('categoryIds', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Promotion.countDocuments(query);

    res.json({
      promotions,
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

// Récupérer les promotions actives pour une entreprise (utilisateur connecté)
router.get('/my', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user.company) {
      return res.json({ promotions: [] });
    }

    const now = new Date();
    const promotions = await Promotion.find({
      company: user.company,
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    })
      .populate('company', 'name')
      .sort({ createdAt: -1 });

    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une promotion par ID
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('company', 'name code')
      .populate('productIds', 'name slug')
      .populate('categoryIds', 'name slug');
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une promotion
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Vérifier que l'entreprise existe
    if (req.body.company) {
      const company = await Company.findById(req.body.company);
      if (!company) {
        return res.status(404).json({ error: 'Entreprise non trouvée' });
      }
    }

    const promotion = new Promotion(req.body);
    await promotion.save();
    await promotion.populate('company', 'name code');
    res.status(201).json(promotion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Modifier une promotion
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Vérifier que l'entreprise existe si elle est modifiée
    if (req.body.company) {
      const company = await Company.findById(req.body.company);
      if (!company) {
        return res.status(404).json({ error: 'Entreprise non trouvée' });
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('company', 'name code');
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }
    res.json(promotion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une promotion
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }
    res.json({ message: 'Promotion supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


