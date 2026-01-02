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
    fileSize: 50 * 1024 * 1024, // 50MB max par fichier (augmenté pour gérer les grandes images)
    files: 50, // Max 50 fichiers
    fieldSize: 50 * 1024 * 1024, // 50MB pour les champs
    fields: 50 // Max 50 champs
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

// Middleware pour ajouter les headers CORS sur les routes d'upload
const corsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://rcm.baldazzi.fr',
    'http://rcm.baldazzi.fr',
    'http://localhost:3000'
  ].filter(Boolean);
  
  // Utiliser setHeader pour forcer l'envoi des headers
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

// Middleware pour gérer les erreurs de taille de fichier
const handleUploadError = (err, req, res, next) => {
  // Ajouter les headers CORS même en cas d'erreur
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://rcm.baldazzi.fr',
    'http://rcm.baldazzi.fr',
    'http://localhost:3000'
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Fichier trop volumineux. Taille maximale : 20MB' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        error: 'Trop de fichiers. Maximum : 50 fichiers' 
      });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Upload et compression d'une image
router.post('/image', corsHeaders, authenticate, requireAdmin, upload.single('image'), handleUploadError, async (req, res) => {
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
router.post('/images', corsHeaders, authenticate, requireAdmin, upload.array('images', 50), handleUploadError, async (req, res) => {
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
router.delete('/image/:filename', corsHeaders, authenticate, requireAdmin, async (req, res) => {
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




