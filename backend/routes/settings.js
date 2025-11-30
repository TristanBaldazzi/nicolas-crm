import express from 'express';
import Settings from '../models/Settings.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer les settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les settings (admin uniquement)
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { priceVisibility, allowRegistration } = req.body;
    
    if (priceVisibility && !['all', 'loggedIn', 'hidden'].includes(priceVisibility)) {
      return res.status(400).json({ error: 'Valeur de priceVisibility invalide' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ 
        priceVisibility: priceVisibility || 'all',
        allowRegistration: allowRegistration !== undefined ? allowRegistration : true
      });
    } else {
      if (priceVisibility !== undefined) {
        settings.priceVisibility = priceVisibility;
      }
      if (allowRegistration !== undefined) {
        settings.allowRegistration = allowRegistration;
      }
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

