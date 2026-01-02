import express from 'express';
import ProductSpec from '../models/ProductSpec.js';
import Product from '../models/Product.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les caractéristiques
router.get('/', async (req, res) => {
  try {
    const specs = await ProductSpec.find().sort({ order: 1, name: 1 });
    res.json(specs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une caractéristique (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, type = 'text', order = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la caractéristique est requis' });
    }

    const spec = new ProductSpec({
      name: name.trim(),
      type: type || 'text',
      order: order || 0
    });

    await spec.save();
    res.status(201).json(spec);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette caractéristique existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une caractéristique (admin) - supprime aussi de tous les produits
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const spec = await ProductSpec.findById(req.params.id);
    if (!spec) {
      return res.status(404).json({ error: 'Caractéristique non trouvée' });
    }

    // Supprimer cette caractéristique de tous les produits
    await Product.updateMany(
      {},
      { $unset: { [`specifications.${spec.name}`]: '' } }
    );

    // Supprimer la caractéristique
    await spec.deleteOne();

    res.json({ message: 'Caractéristique supprimée de tous les produits' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier l'ordre d'une caractéristique (admin)
router.put('/:id/order', authenticate, requireAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    const spec = await ProductSpec.findByIdAndUpdate(
      req.params.id,
      { order: order || 0 },
      { new: true }
    );

    if (!spec) {
      return res.status(404).json({ error: 'Caractéristique non trouvée' });
    }

    res.json(spec);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;











