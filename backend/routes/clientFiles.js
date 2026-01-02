import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ClientFile from '../models/ClientFile.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier client-files s'il n'existe pas
const clientFilesDir = path.join(__dirname, '../uploads/client-files');
if (!fs.existsSync(clientFilesDir)) {
  fs.mkdirSync(clientFilesDir, { recursive: true });
}

// Configuration Multer pour les fichiers clients (tous types de fichiers)
const clientFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clientFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const clientFileUpload = multer({
  storage: clientFileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max par fichier
    files: 10 // Max 10 fichiers
  }
});

// Upload de fichiers pour un client (admin)
router.post('/:userId', authenticate, requireAdmin, clientFileUpload.array('files', 10), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPublic } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier la taille totale
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      // Supprimer les fichiers
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ error: 'La taille totale des fichiers ne peut pas dépasser 100 Mo' });
    }

    const savedFiles = [];

    for (const file of files) {
      const fileInfo = {
        user: userId,
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/client-files/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        isPublic: isPublic === 'true' || isPublic === true,
        uploadedBy: req.user.id
      };

      const clientFile = new ClientFile(fileInfo);
      await clientFile.save();
      savedFiles.push(clientFile);
    }

    res.status(201).json({
      success: true,
      message: `${savedFiles.length} fichier${savedFiles.length > 1 ? 's' : ''} uploadé${savedFiles.length > 1 ? 's' : ''} avec succès`,
      files: savedFiles
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

// Récupérer les fichiers d'un client (admin)
router.get('/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await ClientFile.find({ user: userId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les fichiers publics d'un client (client lui-même)
router.get('/:userId/public', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur demande ses propres fichiers
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const files = await ClientFile.find({ 
      user: userId,
      isPublic: true
    })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle visibilité d'un fichier (admin)
router.put('/:fileId/visibility', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { isPublic } = req.body;

    const file = await ClientFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    file.isPublic = isPublic === true || isPublic === 'true';
    await file.save();

    res.json({ 
      success: true,
      file 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un fichier (admin)
router.delete('/:fileId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await ClientFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await ClientFile.findByIdAndDelete(fileId);

    res.json({ 
      success: true,
      message: 'Fichier supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;











