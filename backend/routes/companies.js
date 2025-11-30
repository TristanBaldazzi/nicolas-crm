import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les entreprises (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    res.json({
      companies,
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

// Récupérer toutes les entreprises (pour sélection)
router.get('/all', authenticate, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .sort({ name: 1 })
      .select('name code');
    res.json({ companies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une entreprise par ID
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les membres d'une entreprise
router.get('/:id/members', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const users = await User.find({ company: req.params.id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ members: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une entreprise
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce code entreprise existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Modifier une entreprise
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une entreprise
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

