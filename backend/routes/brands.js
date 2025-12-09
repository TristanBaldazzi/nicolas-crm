import express from 'express';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les marques
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find().sort({ order: 1, name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une marque (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, order = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la marque est requis' });
    }

    const brand = new Brand({
      name: name.trim(),
      order: order || 0
    });

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette marque existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une marque (admin) - met à jour les produits pour utiliser "Autre"
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Trouver la marque "Autre" par défaut
    const defaultBrand = await Brand.findOne({ name: 'Autre' });
    
    // Mettre à jour tous les produits qui utilisent cette marque
    if (defaultBrand) {
      await Product.updateMany(
        { brand: brand._id },
        { brand: defaultBrand._id }
      );
    } else {
      // Si pas de marque "Autre", mettre à null
      await Product.updateMany(
        { brand: brand._id },
        { brand: null }
      );
    }

    // Supprimer la marque
    await brand.deleteOne();

    res.json({ message: 'Marque supprimée, produits mis à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier l'ordre d'une marque (admin)
router.put('/:id/order', authenticate, requireAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { order: order || 0 },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    res.json(brand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;




