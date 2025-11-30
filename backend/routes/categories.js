import express from 'express';
import Category from '../models/Category.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les catégories (publiques)
router.get('/', async (req, res) => {
  try {
    const { parentOnly } = req.query;
    const query = { isActive: true };
    
    if (parentOnly === 'true') {
      query.parentCategory = null;
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ order: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une catégorie par ID (admin)
router.get('/id/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug');

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une catégorie par slug
router.get('/:slug', async (req, res) => {
  try {
    // Vérifier si c'est un ObjectId (24 caractères hexadécimaux)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.slug);
    
    if (isObjectId) {
      // Si c'est un ID, chercher par ID
      const category = await Category.findById(req.params.slug)
        .populate('parentCategory', 'name slug');
      
      if (!category) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }
      
      return res.json(category);
    }
    
    // Sinon, chercher par slug
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('parentCategory', 'name slug');

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les sous-catégories d'une catégorie
router.get('/:slug/subcategories', async (req, res) => {
  try {
    const parent = await Category.findOne({ slug: req.params.slug });
    if (!parent) {
      return res.status(404).json({ error: 'Catégorie parente non trouvée' });
    }

    const subcategories = await Category.find({
      parentCategory: parent._id,
      isActive: true
    }).sort({ order: 1, name: 1 });

    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une catégorie (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image, parentCategory, order } = req.body;
    
    // Générer le slug depuis le nom
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = new Category({
      name,
      slug,
      description,
      image,
      parentCategory: parentCategory || null,
      isMainCategory: !parentCategory,
      order: order || 0
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Modifier une catégorie (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, image, parentCategory, order, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    // Mettre à jour le slug si le nom change
    if (name && name !== category.name) {
      category.slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory || null;
      category.isMainCategory = !parentCategory;
    }
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une catégorie (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    // Vérifier s'il y a des sous-catégories
    const subcategories = await Category.countDocuments({ parentCategory: category._id });
    if (subcategories > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer une catégorie avec des sous-catégories' });
    }

    await category.deleteOne();
    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;



