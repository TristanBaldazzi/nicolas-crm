import express from 'express';
import CustomQuoteRequest from '../models/CustomQuoteRequest.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Settings from '../models/Settings.js';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = express.Router();

// Fonction pour analyser la demande avec l'IA et créer un panier (en arrière-plan)
async function analyzeRequestAndCreateCart(quoteRequest) {
  try {
    // Récupérer les settings pour vérifier le mode IA
    const settings = await Settings.getSettings();
    
    // Si le mode est 'none', ne rien faire
    if (settings.customQuotesAIMode === 'none') {
      console.log('Mode IA désactivé pour les demandes personnalisées');
      return;
    }

    // Vérifier si OpenAI est configuré
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key non configurée, skip de l\'analyse IA');
      return;
    }

    // Si l'utilisateur n'est pas connecté, on ne crée pas de panier (sauf en mode manual où on peut stocker les suggestions)
    if (!quoteRequest.user && settings.customQuotesAIMode === 'auto') {
      console.log('Utilisateur non connecté, pas de panier créé');
      return;
    }

    // Récupérer tous les produits actifs (limiter à 150 pour éviter un prompt trop long)
    const products = await Product.find({ isActive: { $ne: false } })
      .select('name description shortDescription category brand specifications price slug')
      .populate('category', 'name')
      .populate('brand', 'name')
      .limit(150); // Limiter pour éviter un prompt trop long

    // Récupérer les catégories et marques pour le contexte
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).select('name'),
      Brand.find().select('name')
    ]);

    // Préparer la liste des produits pour l'IA (format compact)
    const productsList = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: (p.description || p.shortDescription || '').substring(0, 200), // Limiter la description
      category: p.category?.name || '',
      brand: p.brand?.name || '',
      price: p.price
    }));

    // Initialiser OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Créer le prompt pour OpenAI (format compact)
    const prompt = `Analyse cette demande client et suggère 3-10 produits pertinents.

Demande: "${quoteRequest.message.substring(0, 1000)}"

Produits disponibles:
${JSON.stringify(productsList)}

Retourne UNIQUEMENT du JSON:
{
  "suggestedProducts": [{"productId": "id", "quantity": 1, "reason": "raison"}],
  "summary": "résumé"
}

Suggère 3-10 produits correspondant à la demande. Quantité généralement 1, plus si mentionné.`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en analyse de demandes clients et suggestion de produits. Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans code blocks, sans explications. Réponds toujours avec un objet JSON valide.'
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
    let aiResponse;
    try {
      const content = completion.choices[0].message.content;
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erreur parsing OpenAI response pour demande personnalisée:', parseError);
      return;
    }

    // Vérifier que nous avons des suggestions
    if (!aiResponse.suggestedProducts || !Array.isArray(aiResponse.suggestedProducts) || aiResponse.suggestedProducts.length === 0) {
      console.log('Aucun produit suggéré par l\'IA');
      return;
    }

    // Vérifier que les produits suggérés existent et préparer les suggestions
    const suggestions = [];
    const cartItems = [];
    
    for (const suggestion of aiResponse.suggestedProducts) {
      const product = products.find(p => p._id.toString() === suggestion.productId);
      if (product) {
        suggestions.push({
          product: product._id,
          quantity: suggestion.quantity || 1,
          reason: suggestion.reason || ''
        });
        cartItems.push({
          product: product._id,
          quantity: suggestion.quantity || 1,
          price: product.price
        });
      }
    }

    // Si aucun produit valide n'a été trouvé, ne rien faire
    if (suggestions.length === 0) {
      console.log('Aucun produit valide trouvé dans les suggestions de l\'IA');
      return;
    }

    // Mode 'manual' : stocker les suggestions dans la demande
    if (settings.customQuotesAIMode === 'manual') {
      quoteRequest.aiSuggestions = {
        suggestedProducts: suggestions,
        summary: aiResponse.summary || '',
        analyzedAt: new Date()
      };
      await quoteRequest.save();
      console.log(`Suggestions IA stockées pour la demande ${quoteRequest._id} (mode manual)`);
      return;
    }

    // Mode 'auto' : créer le panier automatiquement (uniquement si utilisateur connecté)
    if (settings.customQuotesAIMode === 'auto' && quoteRequest.user) {

      // Créer le panier avec statut "traité" (pas "en_cours")
      const cart = new Cart({
        user: quoteRequest.user,
        items: cartItems,
        status: 'traité', // Statut "traité" directement
        notes: `Panier créé automatiquement à partir de la demande d'offre personnalisée du ${new Date(quoteRequest.createdAt).toLocaleDateString('fr-FR')}.\n\nRésumé IA: ${aiResponse.summary || 'Aucun résumé disponible'}`
      });

      await cart.save();
      
      // Lier le panier à la demande
      quoteRequest.autoCreatedCart = cart._id;
      await quoteRequest.save();
      
      console.log(`Panier créé automatiquement pour la demande ${quoteRequest._id} avec ${cartItems.length} produits`);
    }
  } catch (error) {
    // Ne pas faire échouer la création de la demande si l'analyse IA échoue
    console.error('Erreur lors de l\'analyse IA et création du panier:', error);
  }
}

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

    // Analyser la demande avec l'IA et créer un panier en arrière-plan (sans bloquer la réponse)
    // On ne fait pas await pour ne pas ralentir la réponse à l'utilisateur
    analyzeRequestAndCreateCart(quoteRequest).catch(err => {
      console.error('Erreur dans l\'analyse IA en arrière-plan:', err);
    });

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
      .populate('autoCreatedCart')
      .sort({ createdAt: -1 });

    // Populate manuel des produits dans les suggestions IA
    for (const request of quoteRequests) {
      if (request.aiSuggestions && request.aiSuggestions.suggestedProducts) {
        await request.populate({
          path: 'aiSuggestions.suggestedProducts.product',
          select: 'name slug price images brand category'
        });
      }
    }

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
      .populate('autoCreatedCart')
      .sort({ createdAt: -1 });

    // Populate manuel des produits dans les suggestions IA
    for (const request of quoteRequests) {
      if (request.aiSuggestions && request.aiSuggestions.suggestedProducts) {
        await request.populate({
          path: 'aiSuggestions.suggestedProducts.product',
          select: 'name slug price images brand category'
        });
      }
    }

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

// Marquer une demande comme non traitée (admin)
router.put('/:id/non-traite', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await CustomQuoteRequest.findById(req.params.id);
    
    if (!quoteRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    quoteRequest.isRead = false;
    await quoteRequest.save();

    res.json({
      success: true,
      quoteRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un panier à partir des suggestions IA (admin, mode 'manual')
router.post('/:id/create-cart', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await CustomQuoteRequest.findById(req.params.id)
      .populate('aiSuggestions.suggestedProducts.product');

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (!quoteRequest.user) {
      return res.status(400).json({ error: 'Cette demande n\'est pas associée à un utilisateur connecté' });
    }

    if (!quoteRequest.aiSuggestions || !quoteRequest.aiSuggestions.suggestedProducts || quoteRequest.aiSuggestions.suggestedProducts.length === 0) {
      return res.status(400).json({ error: 'Aucune suggestion IA disponible pour cette demande' });
    }

    // Créer les items du panier avec les prix actuels
    const cartItems = [];
    for (const suggestion of quoteRequest.aiSuggestions.suggestedProducts) {
      if (suggestion.product) {
        const product = await Product.findById(suggestion.product._id);
        if (product) {
          cartItems.push({
            product: product._id,
            quantity: suggestion.quantity || 1,
            price: product.price
          });
        }
      }
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Aucun produit valide trouvé dans les suggestions' });
    }

    // Créer le panier avec statut "traité"
    const cart = new Cart({
      user: quoteRequest.user,
      items: cartItems,
      status: 'traité',
      notes: `Panier créé manuellement à partir de la demande d'offre personnalisée du ${new Date(quoteRequest.createdAt).toLocaleDateString('fr-FR')}.\n\nRésumé IA: ${quoteRequest.aiSuggestions.summary || 'Aucun résumé disponible'}`
    });

    await cart.save();

    // Lier le panier à la demande et marquer comme traitée
    quoteRequest.autoCreatedCart = cart._id;
    quoteRequest.isRead = true; // Marquer la demande comme traitée
    await quoteRequest.save();

    await cart.populate('items.product', 'name slug price images brand');
    await cart.populate('user', 'firstName lastName email');

    res.json({
      success: true,
      cart,
      quoteRequest,
      message: 'Panier créé avec succès et demande marquée comme traitée'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une demande par ID (admin)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const quoteRequest = await CustomQuoteRequest.findById(req.params.id)
      .populate('user', 'firstName lastName email company')
      .populate('autoCreatedCart');

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Populate manuel des produits dans les suggestions IA
    if (quoteRequest.aiSuggestions && quoteRequest.aiSuggestions.suggestedProducts) {
      await quoteRequest.populate({
        path: 'aiSuggestions.suggestedProducts.product',
        select: 'name slug price images brand category'
      });
    }

    res.json(quoteRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;







