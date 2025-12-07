import express from 'express';
import Promotion from '../models/Promotion.js';
import Company from '../models/Company.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Récupérer toutes les promotions (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { companyId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (companyId) {
      query.company = companyId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const promotions = await Promotion.find(query)
      .populate('company', 'name code')
      .populate('productIds', 'name slug')
      .populate('categoryIds', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Promotion.countDocuments(query);

    res.json({
      promotions,
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

// Récupérer les promotions actives pour une entreprise (utilisateur connecté)
router.get('/my', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user.company) {
      return res.json({ promotions: [] });
    }

    const now = new Date();
    const promotions = await Promotion.find({
      company: user.company,
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    })
      .populate('company', 'name')
      .sort({ createdAt: -1 });

    res.json({ promotions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une promotion par ID avec historique d'utilisation
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('company', 'name code')
      .populate('productIds', 'name slug')
      .populate('categoryIds', 'name slug');
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }

    const period = req.query.period || '30d'; // 24h, 7d, 30d, 365d
    const now = new Date();
    let startDate = new Date(promotion.startDate);
    
    // Calculer la date de début selon la période
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '365d':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Ne pas aller avant la date de début de la promotion
    if (startDate < promotion.startDate) {
      startDate = new Date(promotion.startDate);
    }

    const isPromotionActive = promotion.isActive && 
      promotion.startDate <= now && 
      (!promotion.endDate || promotion.endDate >= now);

    let usageHistory = [];
    let totalUsage = 0;
    let totalDiscount = 0;
    let chartData = [];

    if (isPromotionActive) {
      // Récupérer tous les paniers de l'entreprise depuis la période sélectionnée
      const carts = await Cart.find({
        status: 'traité',
        createdAt: { $gte: startDate }
      })
        .populate('user', 'firstName lastName email company')
        .populate('items.product', 'name category subCategory')
        .sort({ createdAt: -1 })
        .limit(1000);

      // Initialiser les données du graphique selon la période
      const interval = period === '24h' ? 'hour' : period === '7d' ? 'day' : period === '30d' ? 'day' : 'day';
      const chartDataMap = new Map();

      // Filtrer les paniers qui ont utilisé cette promotion
      for (const cart of carts) {
        if (!cart.user || !cart.user.company) continue;
        
        // Vérifier si le panier appartient à l'entreprise de la promotion
        const cartCompanyId = cart.user.company._id || cart.user.company;
        const promotionCompanyId = promotion.company._id || promotion.company;
        
        if (cartCompanyId.toString() !== promotionCompanyId.toString()) continue;

        // Vérifier si des produits du panier sont éligibles à la promotion
        let cartHasPromotion = false;
        let cartDiscount = 0;

        for (const item of cart.items) {
          if (!item.product) continue;
          
          const productId = item.product._id || item.product;
          const categoryId = item.product.category?._id || item.product.category;
          const subCategoryId = item.product.subCategory?._id || item.product.subCategory;

          // Vérifier si la promotion s'applique à ce produit
          let applies = false;
          if (promotion.appliesToAllProducts) {
            applies = true;
          } else if (promotion.productIds && promotion.productIds.length > 0) {
            applies = promotion.productIds.some(id => id.toString() === productId.toString());
          } else if (promotion.categoryIds && promotion.categoryIds.length > 0) {
            applies = (categoryId && promotion.categoryIds.some(id => id.toString() === categoryId.toString())) ||
                     (subCategoryId && promotion.categoryIds.some(id => id.toString() === subCategoryId.toString()));
          }

          if (applies) {
            cartHasPromotion = true;
            // Le prix dans le panier est déjà le prix réduit
            // On calcule le prix original et la réduction
            // Si le prix réduit = prix original * (1 - discount/100)
            // Alors prix original = prix réduit / (1 - discount/100)
            const originalPrice = item.price / (1 - promotion.discountPercentage / 100);
            const discount = originalPrice - item.price;
            cartDiscount += discount * item.quantity;
          }
        }

        if (cartHasPromotion) {
          totalUsage++;
          totalDiscount += cartDiscount;
          usageHistory.push({
            cartId: cart._id,
            user: {
              firstName: cart.user.firstName,
              lastName: cart.user.lastName,
              email: cart.user.email
            },
            total: cart.total,
            discount: cartDiscount,
            date: cart.createdAt,
            status: cart.status
          });

          // Agrégation pour le graphique
          const cartDate = new Date(cart.createdAt);
          let key;
          
          const pad = (num) => num.toString().padStart(2, '0');
          
          if (period === '24h') {
            // Par heure
            key = `${cartDate.getFullYear()}-${pad(cartDate.getMonth() + 1)}-${pad(cartDate.getDate())}-${pad(cartDate.getHours())}`;
          } else {
            // Par jour
            key = `${cartDate.getFullYear()}-${pad(cartDate.getMonth() + 1)}-${pad(cartDate.getDate())}`;
          }

          if (!chartDataMap.has(key)) {
            chartDataMap.set(key, { date: key, usage: 0, discount: 0 });
          }
          const data = chartDataMap.get(key);
          data.usage += 1;
          data.discount += cartDiscount;
        }
      }

      // Convertir la map en array et trier par date
      chartData = Array.from(chartDataMap.values())
        .map(item => {
          // Formater la date pour l'affichage
          let displayDate;
          if (period === '24h') {
            const [year, month, day, hour] = item.date.split('-');
            displayDate = `${day}/${month} ${hour}h`;
          } else {
            const [year, month, day] = item.date.split('-');
            displayDate = `${day}/${month}`;
          }
          return {
            ...item,
            date: displayDate,
            fullDate: item.date
          };
        })
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

      // Limiter à 50 utilisations récentes
      usageHistory = usageHistory.slice(0, 50);
    }

    res.json({
      ...promotion.toObject(),
      usageHistory,
      stats: {
        totalUsage,
        totalDiscount: Math.round(totalDiscount * 100) / 100
      },
      chartData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une promotion
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Vérifier que l'entreprise existe
    if (req.body.company) {
      const company = await Company.findById(req.body.company);
      if (!company) {
        return res.status(404).json({ error: 'Entreprise non trouvée' });
      }
    }

    const promotion = new Promotion(req.body);
    await promotion.save();
    await promotion.populate('company', 'name code');
    res.status(201).json(promotion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Modifier une promotion
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Vérifier que l'entreprise existe si elle est modifiée
    if (req.body.company) {
      const company = await Company.findById(req.body.company);
      if (!company) {
        return res.status(404).json({ error: 'Entreprise non trouvée' });
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('company', 'name code');
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }
    res.json(promotion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une promotion
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion non trouvée' });
    }
    res.json({ message: 'Promotion supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


