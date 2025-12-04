import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max par fichier
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers images (JPEG, PNG, WebP) sont autorisés'));
    }
  }
});

// Upload et compression d'une image
router.post('/image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const originalPath = req.file.path;
    const filename = path.parse(req.file.filename).name;
    const compressedPath = path.join(uploadsDir, `${filename}-compressed.jpg`);

    // Compression avec Sharp
    await sharp(originalPath)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(compressedPath);

    // Supprimer l'original
    fs.unlinkSync(originalPath);

    // URL de l'image compressée
    const imageUrl = `/uploads/${path.basename(compressedPath)}`;

    res.json({
      url: imageUrl,
      filename: path.basename(compressedPath),
      size: fs.statSync(compressedPath).size
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple d'images (max 50)
router.post('/images', authenticate, requireAdmin, upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const originalPath = file.path;
        const filename = path.parse(file.filename).name;
        const compressedPath = path.join(uploadsDir, `${filename}-compressed.jpg`);

        // Compression
        await sharp(originalPath)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toFile(compressedPath);

        // Supprimer l'original
        fs.unlinkSync(originalPath);

        const imageUrl = `/uploads/${path.basename(compressedPath)}`;
        results.push({
          url: imageUrl,
          filename: path.basename(compressedPath),
          size: fs.statSync(compressedPath).size
        });
      } catch (error) {
        errors.push({ filename: file.originalname, error: error.message });
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      uploaded: results.length,
      errors: errors.length,
      images: results,
      errorDetails: errors
    });
  } catch (error) {
    // Nettoyer les fichiers en cas d'erreur
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

// Supprimer une image
router.delete('/image/:filename', authenticate, requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image supprimée' });
    } else {
      res.status(404).json({ error: 'Image non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




