import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ProductFile from '../models/ProductFile.js';
import Product from '../models/Product.js';
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier product-files s'il n'existe pas
const productFilesDir = path.join(__dirname, '../uploads/product-files');
if (!fs.existsSync(productFilesDir)) {
  fs.mkdirSync(productFilesDir, { recursive: true });
}

// Configuration Multer pour les fichiers produits (tous types de fichiers)
const productFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const productFileUpload = multer({
  storage: productFileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max par fichier
    files: 30 // Max 30 fichiers
  }
});

// Upload de fichiers pour un produit (admin)
router.post('/:productId', authenticate, requireAdmin, productFileUpload.array('files', 30), async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      // Supprimer les fichiers uploadés
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier le nombre total de fichiers (limite de 30)
    const existingFilesCount = await ProductFile.countDocuments({ product: productId });
    if (existingFilesCount + files.length > 30) {
      // Supprimer les fichiers uploadés
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ 
        error: `Limite de 30 fichiers atteinte. Vous avez ${existingFilesCount} fichier(s) existant(s). Vous pouvez ajouter ${30 - existingFilesCount} fichier(s) maximum.` 
      });
    }

    // Vérifier la taille totale
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 500 * 1024 * 1024) { // 500MB max total
      // Supprimer les fichiers
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ error: 'La taille totale des fichiers ne peut pas dépasser 500 Mo' });
    }

    const savedFiles = [];

    for (const file of files) {
      const fileInfo = {
        product: productId,
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/product-files/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: req.user.id
      };

      const productFile = new ProductFile(fileInfo);
      await productFile.save();
      savedFiles.push(productFile);
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

// Récupérer les fichiers d'un produit (admin ou public)
router.get('/:productId', optionalAuthenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const files = await ProductFile.find({ product: productId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un fichier (admin)
router.delete('/:fileId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await ProductFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await ProductFile.findByIdAndDelete(fileId);

    res.json({ 
      success: true,
      message: 'Fichier supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

