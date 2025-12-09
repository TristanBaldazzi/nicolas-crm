import express from 'express';
import CustomQuoteRequest from '../models/CustomQuoteRequest.js';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Soumettre une demande d'offre personnalisée
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Si l'utilisateur est connecté, utiliser ses informations
    let finalFirstName, finalLastName, finalEmail, finalPhone, userId;
    
    if (req.user) {
      // Utilisateur connecté : utiliser les infos du compte
      finalFirstName = req.user.firstName;
      finalLastName = req.user.lastName;
      finalEmail = req.user.email;
      finalPhone = phone || undefined;
      userId = req.user.id;
    } else {
      // Utilisateur non connecté : valider les champs requis
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'Le prénom, nom et email sont requis' });
      }
      finalFirstName = firstName;
      finalLastName = lastName;
      finalEmail = email;
      finalPhone = phone || undefined;
      userId = null;
    }

    // Validation du message (toujours requis)
    if (!message) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    if (message.length > 3500) {
      return res.status(400).json({ error: 'Le message ne peut pas dépasser 3500 caractères' });
    }

    // Créer la demande
    const quoteRequest = new CustomQuoteRequest({
      firstName: finalFirstName,
      lastName: finalLastName,
      email: finalEmail,
      phone: finalPhone,
      user: userId,
      message
    });

    await quoteRequest.save();

    res.status(201).json({
      success: true,
      message: 'Votre demande a été envoyée avec succès',
      quoteRequest: {
        id: quoteRequest._id,
        firstName: quoteRequest.firstName,
        lastName: quoteRequest.lastName,
        email: quoteRequest.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compter les demandes non traitées (admin)
router.get('/count-pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const count = await CustomQuoteRequest.countDocuments({ isRead: false });
    res.json({ count });
  } catch (error) {
    console.error('Error counting pending quote requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer toutes les demandes (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequests = await CustomQuoteRequest.find()
      .populate('user', 'firstName lastName email _id')
      .sort({ createdAt: -1 });

    res.json(quoteRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les demandes d'un utilisateur spécifique (admin)
router.get('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const quoteRequests = await CustomQuoteRequest.find({ user: userId })
      .populate('user', 'firstName lastName email _id')
      .sort({ createdAt: -1 });

    res.json(quoteRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer une demande comme traitée (admin)
router.put('/:id/traite', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await CustomQuoteRequest.findById(req.params.id);
    
    if (!quoteRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    quoteRequest.isRead = true;
    await quoteRequest.save();

    res.json({
      success: true,
      quoteRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une demande par ID (admin)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await CustomQuoteRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email company');

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    res.json(quoteRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
