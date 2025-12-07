import express from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = express.Router();

// Récupérer toutes les entreprises (admin)
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
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(query);

    res.json({
      companies,
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

// Récupérer toutes les entreprises (pour sélection)
router.get('/all', authenticate, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .sort({ name: 1 })
      .select('name code');
    res.json({ companies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une entreprise par ID
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les membres d'une entreprise
router.get('/:id/members', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const users = await User.find({ company: req.params.id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ members: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une entreprise
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce code entreprise existe déjà' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Modifier une entreprise
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une entreprise
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    res.json({ message: 'Entreprise supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Génération IA d'entreprise (admin)
router.post('/generate-ai', authenticate, requireAdmin, async (req, res) => {
  try {
    const { description, existingData } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'La description de l\'entreprise est requise' });
    }

    // Vérifier si OpenAI est configuré
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key non configurée' });
    }

    // Initialiser OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Créer le prompt pour OpenAI
    const prompt = `Tu es un assistant expert en création de fiches entreprises. 

À partir de la description suivante, génère une fiche entreprise complète au format JSON strict (pas de markdown, juste du JSON valide).

Description de l'entreprise:
${description}

IMPORTANT:
- Si une information n'est pas disponible dans la description, laisse le champ vide (null ou chaîne vide).
- Pour le pays, utilise le code pays ISO (ex: LU, FR, BE, etc.). Par défaut, utilise "LU" si non spécifié.
- Pour isActive, retourne true par défaut.

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (sans markdown, sans code blocks):
{
  "name": "Nom de l'entreprise" ou null,
  "code": "Code entreprise" ou null,
  "address": "Adresse complète" ou null,
  "city": "Ville" ou null,
  "postalCode": "Code postal" ou null,
  "country": "Code pays ISO" ou "LU",
  "phone": "Numéro de téléphone" ou null,
  "email": "Email" ou null,
  "vatNumber": "Numéro TVA" ou null,
  "notes": "Notes" ou null,
  "isActive": true
}`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en création de fiches entreprises. Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans code blocks, sans explications. Réponds toujours avec un objet JSON valide.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Parser la réponse
    let generatedData;
    try {
      const content = completion.choices[0].message.content;
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erreur parsing OpenAI response:', parseError);
      return res.status(500).json({ error: 'Erreur lors de la génération des données' });
    }

    // Fusionner avec les données existantes (ne pas remplacer les champs déjà remplis)
    const result = {};
    const fields = ['name', 'code', 'address', 'city', 'postalCode', 'country', 'phone', 'email', 'vatNumber', 'notes', 'isActive'];
    
    fields.forEach(field => {
      // Si le champ existe déjà et n'est pas vide, le garder
      if (existingData && existingData[field] !== undefined && existingData[field] !== null && existingData[field] !== '') {
        result[field] = existingData[field];
      } else if (generatedData[field] !== undefined && generatedData[field] !== null && generatedData[field] !== '') {
        // Sinon, utiliser la valeur générée si elle existe
        result[field] = generatedData[field];
      } else {
        // Sinon, valeur par défaut
        if (field === 'country') {
          result[field] = 'LU';
        } else if (field === 'isActive') {
          result[field] = true;
        } else {
          result[field] = '';
        }
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur génération IA:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération IA' });
  }
});

export default router;

