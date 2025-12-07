import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Contact from '../models/Contact.js';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier contact-uploads s'il n'existe pas
const contactUploadsDir = path.join(__dirname, '../uploads/contact');
if (!fs.existsSync(contactUploadsDir)) {
  fs.mkdirSync(contactUploadsDir, { recursive: true });
}

// Configuration Multer pour les fichiers de contact (tous types de fichiers)
const contactStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, contactUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const contactUpload = multer({
  storage: contactStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max par fichier
    files: 10 // Max 10 fichiers
  }
});

// Soumettre un formulaire de contact
router.post('/', optionalAuthenticate, contactUpload.array('files', 10), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Si l'utilisateur est connecté, utiliser ses informations
    let finalFirstName, finalLastName, finalEmail, finalPhone, userId;
    
    if (req.user) {
      // Utilisateur connecté : utiliser les infos du compte
      finalFirstName = req.user.firstName;
      finalLastName = req.user.lastName;
      finalEmail = req.user.email;
      finalPhone = phone || undefined; // Téléphone optionnel même si connecté
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

    if (message.length > 2500) {
      return res.status(400).json({ error: 'Le message ne peut pas dépasser 2500 caractères' });
    }

    // Vérifier la taille totale des fichiers
    const files = req.files || [];
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 100 * 1024 * 1024; // 100MB

    if (totalSize > maxTotalSize) {
      // Supprimer les fichiers uploadés
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ error: 'La taille totale des fichiers ne peut pas dépasser 100 Mo' });
    }

    // Préparer les informations des fichiers
    const fileInfos = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/contact/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Créer le contact
    const contact = new Contact({
      firstName: finalFirstName,
      lastName: finalLastName,
      email: finalEmail,
      phone: finalPhone,
      user: userId,
      message,
      files: fileInfos
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Votre message a été envoyé avec succès',
      contact: {
        id: contact._id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email
      }
    });
  } catch (error) {
    // Supprimer les fichiers en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Récupérer tous les messages de contact (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer un message comme traité (admin)
router.put('/:id/traite', authenticate, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    contact.isRead = true;
    await contact.save();

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un message par ID (admin)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('user', 'firstName lastName email company');

    if (!contact) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

