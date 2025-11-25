import express from 'express';
import Client from '../models/Client.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import csv from 'csv-parser';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuration Multer pour CSV
const upload = multer({
  dest: path.join(__dirname, '../temp'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV sont autorisés'));
    }
  }
});

// Récupérer tous les clients (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Client.countDocuments(query);

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un client par ID
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un client
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce code client existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Modifier un client
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un client
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json({ message: 'Client supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Importer des clients depuis CSV
router.post('/import', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier CSV requis' });
    }

    const results = [];
    const errors = [];

    const stream = fs.createReadStream(req.file.path)
      .pipe(csv({
        separator: ';',
        skipEmptyLines: true,
        headers: [
          'code',
          'civility',
          'name',
          'address1',
          'postalCode',
          'city',
          'department',
          'countryCode',
          'website',
          'mobile',
          'email',
          'vatNumber'
        ]
      }));

    for await (const row of stream) {
      try {
        // Nettoyer les données
        const clientData = {
          code: row.code?.trim(),
          civility: row.civility?.trim(),
          name: row.name?.trim(),
          address1: row.address1?.trim(),
          postalCode: row.postalCode?.trim(),
          city: row.city?.trim(),
          department: row.department?.trim(),
          countryCode: row.countryCode?.trim() || 'LU',
          website: row.website?.trim(),
          mobile: row.mobile?.trim(),
          email: row.email?.trim().toLowerCase(),
          vatNumber: row.vatNumber?.trim()
        };

        if (!clientData.code || !clientData.name) {
          errors.push({ row, error: 'Code ou nom manquant' });
          continue;
        }

        // Vérifier si le client existe déjà
        const existing = await Client.findOne({ code: clientData.code });
        if (existing) {
          // Mettre à jour
          Object.assign(existing, clientData);
          await existing.save();
          results.push({ action: 'updated', client: existing });
        } else {
          // Créer
          const client = new Client(clientData);
          await client.save();
          results.push({ action: 'created', client });
        }
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      imported: results.length,
      errors: errors.length,
      details: {
        results,
        errors: errors.slice(0, 10) // Limiter les erreurs affichées
      }
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;

