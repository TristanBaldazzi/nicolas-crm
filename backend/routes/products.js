import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Promotion from '../models/Promotion.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Fonction helper pour calculer le prix avec promotion
async function applyPromotions(product, userId = null) {
  if (!userId) {
    return {
      originalPrice: product.price,
      discountedPrice: product.price,
      discountPercentage: 0,
      promotion: null
    };
  }

  try {
    // Récupérer l'utilisateur avec son entreprise
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).populate('company');
    
    if (!user || !user.company) {
      return {
        originalPrice: product.price,
        discountedPrice: product.price,
        discountPercentage: 0,
        promotion: null
      };
    }

    // Récupérer les promotions actives pour cette entreprise
    const now = new Date();
    const promotions = await Promotion.find({
      company: user.company._id,
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ discountPercentage: -1 }); // Prendre la promotion avec le plus grand pourcentage

    // Trouver la promotion applicable
    let applicablePromotion = null;
    const categoryId = product.category?._id || product.category;
    const subCategoryId = product.subCategory?._id || product.subCategory;
    
    for (const promotion of promotions) {
      if (promotion.appliesToProduct(product._id, categoryId, subCategoryId)) {
        applicablePromotion = promotion;
        break;
      }
    }

    if (!applicablePromotion) {
      return {
        originalPrice: product.price,
        discountedPrice: product.price,
        discountPercentage: 0,
        promotion: null
      };
    }

    // Calculer le prix réduit
    const discountAmount = (product.price * applicablePromotion.discountPercentage) / 100;
    const discountedPrice = product.price - discountAmount;

    return {
      originalPrice: product.price,
      discountedPrice: Math.max(0, discountedPrice), // S'assurer que le prix n'est pas négatif
      discountPercentage: applicablePromotion.discountPercentage,
      promotion: {
        id: applicablePromotion._id,
        name: applicablePromotion.name
      }
    };
  } catch (error) {
    console.error('Error applying promotions:', error);
    return {
      originalPrice: product.price,
      discountedPrice: product.price,
      discountPercentage: 0,
      promotion: null
    };
  }
}

// Récupérer tous les produits (public avec filtres)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      subCategory,
      brand,
      featured,
      search,
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }
    if (subCategory) {
      query.subCategory = subCategory;
    }
    if (brand) {
      query.brand = brand;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name')
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    // Appliquer les promotions si l'utilisateur est connecté
    let userId = null;
    try {
      const { authenticate } = await import('../middleware/auth.js');
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (e) {
      // Pas d'utilisateur connecté ou token invalide
    }

    const productsWithPromotions = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        
        // Convertir les specifications Map en objet pour la réponse JSON
        if (productObj.specifications && productObj.specifications instanceof Map) {
          const specsObj = {};
          productObj.specifications.forEach((value, key) => {
            specsObj[key] = value;
          });
          productObj.specifications = specsObj;
        }
        
        const pricing = await applyPromotions(product, userId);
        return {
          ...productObj,
          price: pricing.discountedPrice,
          originalPrice: pricing.originalPrice,
          discountPercentage: pricing.discountPercentage,
          promotion: pricing.promotion
        };
      })
    );

    res.json({
      products: productsWithPromotions,
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

// Récupérer les produits recommandés pour un produit
router.get('/recommended/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    
    const product = await Product.findById(req.params.id)
      .populate('category', '_id')
      .populate('subCategory', '_id')
      .populate('brand', '_id');

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const limit = 8; // Nombre de produits recommandés à retourner
    const recommended = [];

    // 1. D'abord les produits de la même sous-catégorie
    if (product.subCategory) {
      const subCategoryProducts = await Product.find({
        _id: { $ne: product._id },
        subCategory: product.subCategory._id,
        isActive: true
      })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name')
        .limit(limit)
        .sort({ createdAt: -1 });

      recommended.push(...subCategoryProducts);
    }

    // 2. Si pas assez, ajouter les produits de la même catégorie
    if (recommended.length < limit && product.category) {
      const categoryProducts = await Product.find({
        _id: { $ne: product._id },
        category: product.category._id,
        isActive: true,
        ...(product.subCategory ? { subCategory: { $ne: product.subCategory._id } } : {})
      })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name')
        .limit(limit - recommended.length)
        .sort({ createdAt: -1 });

      recommended.push(...categoryProducts);
    }

    // 3. Si pas assez, ajouter les produits de la même marque
    if (recommended.length < limit && product.brand) {
      const existingIds = recommended.map(p => p._id.toString());
      existingIds.push(product._id.toString());

      const brandProducts = await Product.find({
        _id: { $nin: existingIds },
        brand: product.brand?._id || product.brand,
        isActive: true
      })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name')
        .limit(limit - recommended.length)
        .sort({ createdAt: -1 });

      recommended.push(...brandProducts);
    }

    // 4. Si pas assez, ajouter des produits aléatoires
    if (recommended.length < limit) {
      const existingIds = recommended.map(p => p._id.toString());
      existingIds.push(product._id.toString());

      const randomProducts = await Product.find({
        _id: { $nin: existingIds },
        isActive: true
      })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name')
        .limit(limit - recommended.length)
        .sort({ createdAt: -1 });

      recommended.push(...randomProducts);
    }

    // Limiter à exactement 'limit' produits
    res.json({ products: recommended.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un produit par slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name');

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Appliquer les promotions si l'utilisateur est connecté
    let userId = null;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    } catch (e) {
      // Pas d'utilisateur connecté ou token invalide
    }

    const pricing = await applyPromotions(product, userId);
    const productObj = product.toObject();
    
    // Convertir les specifications Map en objet pour la réponse JSON
    if (productObj.specifications && productObj.specifications instanceof Map) {
      const specsObj = {};
      productObj.specifications.forEach((value, key) => {
        specsObj[key] = value;
      });
      productObj.specifications = specsObj;
    }
    
    const productWithPromotion = {
      ...productObj,
      price: pricing.discountedPrice,
      originalPrice: pricing.originalPrice,
      discountPercentage: pricing.discountPercentage,
      promotion: pricing.promotion
    };

    res.json(productWithPromotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un produit (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      sku,
      price,
      compareAtPrice,
      brand,
      category,
      subCategory,
      images,
      stock,
      isInStock,
      isFeatured,
      metaTitle,
      metaDescription,
      tags,
      specifications
    } = req.body;

    // Vérifier que la catégorie existe
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ error: 'Catégorie non trouvée' });
    }

    // Vérifier la sous-catégorie si fournie
    if (subCategory) {
      const subCategoryDoc = await Category.findById(subCategory);
      if (!subCategoryDoc) {
        return res.status(400).json({ error: 'Sous-catégorie non trouvée' });
      }
    }

    // Générer le slug
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Limiter les images à 50
    const productImages = (images || []).slice(0, 50).map((img, index) => ({
      ...img,
      order: img.order || index,
      isPrimary: index === 0 && !img.isPrimary ? true : img.isPrimary || false
    }));

    // Nettoyer les specifications (enlever les valeurs vides)
    const cleanedSpecs = {};
    if (specifications && typeof specifications === 'object') {
      for (const [key, value] of Object.entries(specifications)) {
        if (value !== null && value !== undefined && value !== '') {
          cleanedSpecs[key] = value;
        }
      }
    }

    const product = new Product({
      name,
      slug,
      description,
      shortDescription,
      sku,
      price,
      compareAtPrice,
      brand: brand || null,
      category,
      subCategory: subCategory || null,
      images: productImages,
      stock: stock || 0,
      isInStock: isInStock !== undefined ? isInStock : (stock > 0),
      isFeatured: isFeatured || false,
      metaTitle,
      metaDescription,
      tags: tags || [],
      specifications: cleanedSpecs
    });

    await product.save();
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');
    
    // Convertir les specifications Map en objet pour la réponse JSON
    const productObj = populatedProduct.toObject();
    if (productObj.specifications && productObj.specifications instanceof Map) {
      const specsObj = {};
      productObj.specifications.forEach((value, key) => {
        specsObj[key] = value;
      });
      productObj.specifications = specsObj;
    }

    res.status(201).json(productObj);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce produit existe déjà (slug ou SKU dupliqué)' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Modifier un produit (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const {
      name,
      description,
      shortDescription,
      sku,
      price,
      compareAtPrice,
      brand,
      category,
      subCategory,
      images,
      stock,
      isInStock,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
      tags,
      specifications
    } = req.body;

    // Mettre à jour le slug si le nom change
    if (name && name !== product.name) {
      product.slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (sku !== undefined) product.sku = sku;
    if (price !== undefined) product.price = price;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    if (brand !== undefined) product.brand = brand || null;
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Catégorie non trouvée' });
      }
      product.category = category;
    }
    if (subCategory !== undefined) {
      if (subCategory) {
        const subCategoryDoc = await Category.findById(subCategory);
        if (!subCategoryDoc) {
          return res.status(400).json({ error: 'Sous-catégorie non trouvée' });
        }
      }
      product.subCategory = subCategory;
    }
    if (images !== undefined) {
      product.images = images.slice(0, 50);
    }
    if (stock !== undefined) {
      product.stock = stock;
      if (isInStock === undefined) {
        product.isInStock = stock > 0;
      }
    }
    if (isInStock !== undefined) product.isInStock = isInStock;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;
    if (tags !== undefined) product.tags = tags;
    if (specifications !== undefined) {
      // Nettoyer les specifications (enlever les valeurs vides)
      const cleanedSpecs = {};
      if (specifications && typeof specifications === 'object') {
        for (const [key, value] of Object.entries(specifications)) {
          if (value !== null && value !== undefined && value !== '') {
            cleanedSpecs[key] = value;
          }
        }
      }
      // Mettre à jour les specifications (MongoDB Map)
      product.specifications = cleanedSpecs;
    }

    await product.save();
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name');
    
    // Convertir les specifications Map en objet pour la réponse JSON
    const productObj = populatedProduct.toObject();
    if (productObj.specifications && productObj.specifications instanceof Map) {
      const specsObj = {};
      productObj.specifications.forEach((value, key) => {
        specsObj[key] = value;
      });
      productObj.specifications = specsObj;
    }

    res.json(productObj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un produit (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    await product.deleteOne();
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;



