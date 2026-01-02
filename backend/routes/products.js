import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Promotion from '../models/Promotion.js';
import Brand from '../models/Brand.js';
import ProductSpec from '../models/ProductSpec.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuration Multer pour les fichiers Excel
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/excel-imports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const excelUpload = multer({
  storage: excelStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.mimetype === 'application/vnd.ms-excel' ||
                     file.mimetype === 'text/csv' ||
                     file.mimetype === 'application/csv';

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) ou CSV sont autorisés'));
    }
  }
});

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
      order = 'desc',
      includeInactive = false // Pour les admins
    } = req.query;

    // Si includeInactive est true (pour les admins), ne pas filtrer par isActive
    const query = includeInactive === 'true' ? {} : { isActive: true };

    if (subCategory) {
      // Si une sous-catégorie est spécifiée, filtrer uniquement par celle-ci
      query.category = subCategory;
    } else if (category) {
      // Si c'est une catégorie parente, inclure aussi les sous-catégories
      const categoryDoc = await Category.findById(category);
      if (categoryDoc && !categoryDoc.parentCategory) {
        // C'est une catégorie parente, récupérer toutes ses sous-catégories
        const subCategories = await Category.find({ 
          parentCategory: category,
          isActive: true 
        }).select('_id');
        const subCategoryIds = subCategories.map(sub => sub._id);
        // Inclure la catégorie parente et toutes ses sous-catégories
        query.category = { $in: [category, ...subCategoryIds] };
      } else {
        // C'est une sous-catégorie, filtrer uniquement par celle-ci
        query.category = category;
      }
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

// Récupérer toutes les spécifications uniques et leurs valeurs possibles
router.get('/specifications/unique', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('specifications');
    
    // Collecter toutes les spécifications uniques et leurs valeurs
    const specsMap = new Map();
    
    products.forEach(product => {
      if (product.specifications && product.specifications instanceof Map) {
        product.specifications.forEach((value, key) => {
          if (value !== null && value !== undefined && value !== '') {
            if (!specsMap.has(key)) {
              specsMap.set(key, new Set());
            }
            // Ajouter la valeur (convertir en string pour les comparaisons)
            const valueStr = String(value);
            specsMap.get(key).add(valueStr);
          }
        });
      } else if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (!specsMap.has(key)) {
              specsMap.set(key, new Set());
            }
            const valueStr = String(value);
            specsMap.get(key).add(valueStr);
          }
        });
      }
    });
    
    // Convertir en format JSON
    const result = {};
    specsMap.forEach((values, key) => {
      const valuesArray = Array.from(values).sort();
      // Détecter le type (number, boolean, text)
      const firstValue = valuesArray[0];
      let type = 'text';
      if (!isNaN(Number(firstValue)) && firstValue !== '') {
        type = 'number';
      } else if (firstValue === 'true' || firstValue === 'false') {
        type = 'boolean';
      }
      
      result[key] = {
        type,
        values: valuesArray
      };
    });
    
    res.json(result);
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

// Récupérer un produit par ID (pour admin)
router.get('/id/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('brand', 'name');

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const productObj = product.toObject();
    
    // Convertir les specifications Map en objet pour la réponse JSON
    if (productObj.specifications instanceof Map) {
      productObj.specifications = Object.fromEntries(productObj.specifications);
    }

    res.json(productObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un produit par slug
router.get('/:slug', async (req, res) => {
  try {
    // Si c'est un ObjectId valide, essayer de trouver par ID d'abord (pour compatibilité)
    if (mongoose.Types.ObjectId.isValid(req.params.slug)) {
      const productById = await Product.findById(req.params.slug)
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('brand', 'name');
      
      if (productById) {
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

        const pricing = await applyPromotions(productById, userId);
        const productObj = productById.toObject();
        
        // Convertir les specifications Map en objet pour la réponse JSON
        if (productObj.specifications instanceof Map) {
          productObj.specifications = Object.fromEntries(productObj.specifications);
        }

        res.json({
          ...productObj,
          pricing
        });
        return;
      }
    }

    // Sinon, chercher par slug
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

    // Validation des champs requis avec messages d'erreur clairs
    if (!name || (typeof name === 'string' && name.trim() === '')) {
      return res.status(400).json({ error: 'Le nom du produit est obligatoire' });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'Le prix du produit est obligatoire' });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
    }

    if (!category || (typeof category === 'string' && category.trim() === '')) {
      return res.status(400).json({ error: 'La catégorie est obligatoire. Veuillez sélectionner une catégorie.' });
    }

    // Vérifier que la catégorie est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: 'La catégorie sélectionnée n\'est pas valide. Veuillez sélectionner une catégorie dans la liste.' });
    }

    // Vérifier que la catégorie existe
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ error: 'La catégorie sélectionnée n\'existe pas. Veuillez sélectionner une catégorie valide.' });
    }

    // Vérifier la sous-catégorie si fournie
    if (subCategory && subCategory !== null && subCategory !== '') {
      if (!mongoose.Types.ObjectId.isValid(subCategory)) {
        return res.status(400).json({ error: 'La sous-catégorie sélectionnée n\'est pas valide. Veuillez sélectionner une sous-catégorie dans la liste.' });
      }
      const subCategoryDoc = await Category.findById(subCategory);
      if (!subCategoryDoc) {
        return res.status(400).json({ error: 'La sous-catégorie sélectionnée n\'existe pas. Veuillez sélectionner une sous-catégorie valide.' });
      }
    }

    // Vérifier la marque si fournie
    if (brand && brand !== null && brand !== '') {
      if (!mongoose.Types.ObjectId.isValid(brand)) {
        return res.status(400).json({ error: 'La marque sélectionnée n\'est pas valide. Veuillez sélectionner une marque dans la liste.' });
      }
      const brandDoc = await Brand.findById(brand);
      if (!brandDoc) {
        return res.status(400).json({ error: 'La marque sélectionnée n\'existe pas. Veuillez sélectionner une marque valide.' });
      }
    }

    // Générer le slug de base
    const baseSlug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Générer un slug unique (vérifie les doublons)
    const slug = await generateUniqueSlug(baseSlug);

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
    console.error('Erreur lors de la création du produit:', error);
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Erreur de validation',
        details: errors.length === 1 ? errors[0] : errors.join(', ')
      });
    }
    
    // Gérer les erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce produit existe déjà (nom ou code barre dupliqué)' });
    }
    
    // Gérer les erreurs de cast ObjectId
    if (error.name === 'CastError') {
      const field = error.path || 'champ';
      return res.status(400).json({ 
        error: `La valeur fournie pour "${field}" n'est pas valide. Veuillez sélectionner une option dans la liste.`
      });
    }
    
    // Erreur générique avec message plus clair
    const errorMessage = error.message || 'Une erreur est survenue lors de la création du produit';
    res.status(400).json({ error: errorMessage });
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
      const baseSlug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Générer un slug unique (mais exclure le produit actuel de la vérification)
      let slug = baseSlug;
      let counter = 1;
      let existingProduct = await Product.findOne({ slug, _id: { $ne: product._id } });
      
      while (existingProduct) {
        slug = `${baseSlug}-${counter}`;
        existingProduct = await Product.findOne({ slug, _id: { $ne: product._id } });
        counter++;
        if (counter > 1000) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      
      product.slug = slug;
    }

    // Validation des champs requis
    if (name !== undefined) {
      if (!name || (typeof name === 'string' && name.trim() === '')) {
        return res.status(400).json({ error: 'Le nom du produit est obligatoire' });
      }
      product.name = name;
    }

    if (price !== undefined) {
      if (price === null || price === '') {
        return res.status(400).json({ error: 'Le prix du produit est obligatoire' });
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
      }
      product.price = priceNum;
    }

    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (sku !== undefined) product.sku = sku;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    
    if (brand !== undefined) {
      if (brand && brand !== null && brand !== '') {
        if (!mongoose.Types.ObjectId.isValid(brand)) {
          return res.status(400).json({ error: 'La marque sélectionnée n\'est pas valide. Veuillez sélectionner une marque dans la liste.' });
        }
        const brandDoc = await Brand.findById(brand);
        if (!brandDoc) {
          return res.status(400).json({ error: 'La marque sélectionnée n\'existe pas. Veuillez sélectionner une marque valide.' });
        }
        product.brand = brand;
      } else {
        product.brand = null;
      }
    }

    if (category !== undefined) {
      if (!category || (typeof category === 'string' && category.trim() === '')) {
        return res.status(400).json({ error: 'La catégorie est obligatoire. Veuillez sélectionner une catégorie.' });
      }
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ error: 'La catégorie sélectionnée n\'est pas valide. Veuillez sélectionner une catégorie dans la liste.' });
      }
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ error: 'La catégorie sélectionnée n\'existe pas. Veuillez sélectionner une catégorie valide.' });
      }
      product.category = category;
    }

    if (subCategory !== undefined) {
      if (subCategory && subCategory !== null && subCategory !== '') {
        if (!mongoose.Types.ObjectId.isValid(subCategory)) {
          return res.status(400).json({ error: 'La sous-catégorie sélectionnée n\'est pas valide. Veuillez sélectionner une sous-catégorie dans la liste.' });
        }
        const subCategoryDoc = await Category.findById(subCategory);
        if (!subCategoryDoc) {
          return res.status(400).json({ error: 'La sous-catégorie sélectionnée n\'existe pas. Veuillez sélectionner une sous-catégorie valide.' });
        }
        product.subCategory = subCategory;
      } else {
        product.subCategory = null;
      }
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
    console.error('Erreur lors de la modification du produit:', error);
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Erreur de validation',
        details: errors.length === 1 ? errors[0] : errors.join(', ')
      });
    }
    
    // Gérer les erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce produit existe déjà (nom ou code barre dupliqué)' });
    }
    
    // Gérer les erreurs de cast ObjectId
    if (error.name === 'CastError') {
      const field = error.path || 'champ';
      return res.status(400).json({ 
        error: `La valeur fournie pour "${field}" n'est pas valide. Veuillez sélectionner une option dans la liste.`
      });
    }
    
    // Erreur générique avec message plus clair
    const errorMessage = error.message || 'Une erreur est survenue lors de la modification du produit';
    res.status(400).json({ error: errorMessage });
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

// Génération IA de produit (admin)
router.post('/generate-ai', authenticate, requireAdmin, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'La description du produit est requise' });
    }

    // Vérifier si OpenAI est configuré
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key non configurée' });
    }

    // Récupérer les catégories, marques et specs existantes
    const [categories, brands, specs] = await Promise.all([
      Category.find({ isActive: true }).select('name slug parentCategory'),
      Brand.find().select('name'),
      ProductSpec.find().select('name type')
    ]);

    // Organiser les catégories principales et sous-catégories
    const mainCategories = categories.filter(c => c.isMainCategory || !c.parentCategory).map(c => c.name);
    const subCategories = categories.filter(c => !c.isMainCategory && c.parentCategory).map(c => c.name);
    const brandNames = brands.map(b => b.name);
    const specNames = specs.map(s => s.name);

    // Initialiser OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Créer le prompt pour OpenAI
    const prompt = `Tu es un assistant expert en création de fiches produits e-commerce. 

À partir de la description suivante, génère une fiche produit complète au format JSON strict (pas de markdown, juste du JSON valide).

Description du produit:
${description}

Catégories principales disponibles: ${mainCategories.join(', ') || 'Aucune'}
Sous-catégories disponibles: ${subCategories.join(', ') || 'Aucune'}
Marques disponibles: ${brandNames.join(', ') || 'Aucune'}
Caractéristiques disponibles: ${specNames.join(', ') || 'Aucune'}

IMPORTANT:
- Si une catégorie ou marque mentionnée dans la description correspond exactement (ou très proche) à une catégorie/marque disponible, utilise-la. Sinon, laisse le champ vide (null).
- Remplis UNIQUEMENT les caractéristiques qui sont dans la liste des caractéristiques disponibles.
- Pour les caractéristiques de type "number", retourne un nombre (pas de texte).
- Pour les caractéristiques de type "boolean", retourne true ou false.
- Si une information n'est pas disponible dans la description, laisse le champ vide (null ou chaîne vide).

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (sans markdown, sans code blocks):
{
  "name": "Nom du produit",
  "shortDescription": "Description courte (max 200 caractères)",
  "description": "Description complète et détaillée",
  "price": nombre ou null,
  "compareAtPrice": nombre ou null,
  "sku": "référence produit" ou null,
  "brand": "nom de la marque exacte si trouvée dans la liste" ou null,
  "category": "nom de la catégorie principale exacte si trouvée" ou null,
  "subCategory": "nom de la sous-catégorie exacte si trouvée" ou null,
  "stock": nombre ou null,
  "isInStock": true ou false,
  "isFeatured": false,
  "isBestSeller": false,
  "specifications": {
    "nom_caracteristique": "valeur" ou nombre ou boolean selon le type
  }
}`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en création de fiches produits e-commerce. Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans code blocks, sans explications. Réponds toujours avec un objet JSON valide.'
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
      // Nettoyer le contenu si nécessaire (enlever les markdown code blocks)
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erreur parsing OpenAI response:', parseError);
      return res.status(500).json({ error: 'Erreur lors de la génération des données' });
    }

    // Matcher la catégorie et marque avec les IDs
    let categoryId = null;
    let subCategoryId = null;
    let brandId = null;

    if (generatedData.category) {
      const matchedCategory = categories.find(
        c => c.name.toLowerCase() === generatedData.category.toLowerCase() && (c.isMainCategory || !c.parentCategory)
      );
      if (matchedCategory) {
        categoryId = matchedCategory._id.toString();
      }
    }

    if (generatedData.subCategory) {
      const matchedSubCategory = categories.find(
        c => c.name.toLowerCase() === generatedData.subCategory.toLowerCase() && !c.isMainCategory && c.parentCategory
      );
      if (matchedSubCategory) {
        subCategoryId = matchedSubCategory._id.toString();
      }
    }

    if (generatedData.brand) {
      const matchedBrand = brands.find(
        b => b.name.toLowerCase() === generatedData.brand.toLowerCase()
      );
      if (matchedBrand) {
        brandId = matchedBrand._id.toString();
      }
    }

    // Nettoyer les spécifications (ne garder que celles qui existent)
    const cleanedSpecs = {};
    if (generatedData.specifications && typeof generatedData.specifications === 'object') {
      specs.forEach(spec => {
        const specName = spec.name;
        if (generatedData.specifications[specName] !== undefined && 
            generatedData.specifications[specName] !== null && 
            generatedData.specifications[specName] !== '') {
          // Convertir selon le type
          if (spec.type === 'number') {
            const numValue = parseFloat(generatedData.specifications[specName]);
            if (!isNaN(numValue)) {
              cleanedSpecs[specName] = numValue;
            }
          } else if (spec.type === 'boolean') {
            cleanedSpecs[specName] = Boolean(generatedData.specifications[specName]);
          } else {
            cleanedSpecs[specName] = String(generatedData.specifications[specName]);
          }
        }
      });
    }

    // Retourner les données formatées
    const result = {
      name: generatedData.name || '',
      shortDescription: generatedData.shortDescription || '',
      description: generatedData.description || '',
      price: generatedData.price || '',
      compareAtPrice: generatedData.compareAtPrice || '',
      sku: generatedData.sku || '',
      brand: brandId || '',
      category: categoryId || '',
      subCategory: subCategoryId || '',
      stock: generatedData.stock || '',
      isInStock: generatedData.isInStock !== undefined ? generatedData.isInStock : true,
      isFeatured: generatedData.isFeatured || false,
      isBestSeller: generatedData.isBestSeller || false,
      specifications: cleanedSpecs
    };

    res.json(result);
  } catch (error) {
    console.error('Erreur génération IA:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération IA' });
  }
});

// Recherche IA - Analyse une requête en langage naturel et retourne les filtres appropriés
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'La requête de recherche est requise' });
    }

    if (query.length > 80) {
      return res.status(400).json({ error: 'La requête ne peut pas dépasser 80 caractères' });
    }

    // Vérifier si OpenAI est configuré
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key non configurée' });
    }

    // Récupérer toutes les données disponibles pour le contexte
    const [categories, brands, specs, products] = await Promise.all([
      Category.find({ isActive: true }).select('name _id slug parentCategory'),
      Brand.find().select('name _id'),
      ProductSpec.find().select('name type'),
      Product.find({ isActive: { $ne: false } }).select('name specifications brand category').limit(100)
    ]);

    // Organiser les données
    const mainCategories = categories.filter(c => c.isMainCategory || !c.parentCategory).map(c => ({ name: c.name, id: c._id.toString() }));
    const subCategories = categories.filter(c => !c.isMainCategory && c.parentCategory).map(c => ({ name: c.name, id: c._id.toString() }));
    const brandList = brands.map(b => ({ name: b.name, id: b._id.toString() }));
    const specList = specs.map(s => ({ name: s.name, type: s.type }));

    // Récupérer toutes les valeurs possibles pour chaque spécification
    const specValues = {};
    products.forEach(product => {
      if (product.specifications) {
        Object.entries(product.specifications).forEach(([key, value]) => {
          if (!specValues[key]) {
            specValues[key] = [];
          }
          const strValue = String(value);
          if (!specValues[key].includes(strValue)) {
            specValues[key].push(strValue);
          }
        });
      }
    });

    // Initialiser OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Créer le prompt pour OpenAI
    const prompt = `Tu es un assistant expert en recherche de produits e-commerce. 

À partir de la requête de recherche suivante en langage naturel, analyse-la et retourne les filtres appropriés à appliquer pour trouver les produits correspondants.

Requête de recherche: "${query}"

Données disponibles:
- Catégories principales: ${mainCategories.map(c => c.name).join(', ') || 'Aucune'}
- Sous-catégories: ${subCategories.map(c => c.name).join(', ') || 'Aucune'}
- Marques: ${brandList.map(b => b.name).join(', ') || 'Aucune'}
- Spécifications disponibles: ${specList.map(s => s.name).join(', ') || 'Aucune'}

IMPORTANT:
- Si une catégorie, marque ou spécification mentionnée dans la requête correspond exactement (ou très proche) à une option disponible, utilise-la.
- Pour les spécifications, utilise les valeurs exactes disponibles.
- Si la requête mentionne un type de produit, une caractéristique, un usage, etc., essaie de trouver la catégorie ou spécification correspondante.
- Pour le champ "search", extrais les mots-clés importants de la requête (nom de produit, modèle, etc.).
- Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (sans markdown, sans code blocks):

{
  "search": "mots-clés extraits de la requête" ou "",
  "category": "ID de la catégorie si trouvée" ou "",
  "brand": "ID de la marque si trouvée" ou "",
  "specifications": {
    "nom_specification": "valeur exacte" ou nombre ou boolean
  }
}

Exemples:
- Requête: "monobrosse pour sols durs" → { "search": "monobrosse sols durs", "category": "", "brand": "", "specifications": {} }
- Requête: "aspirateur Electrolux avec sac" → { "search": "aspirateur", "category": "", "brand": "ID_ELECTROLUX", "specifications": { "Type de sac": "avec sac" } }
- Requête: "machine de plus de 1000W" → { "search": "", "category": "", "brand": "", "specifications": { "Puissance": ">1000" } }`;

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en recherche de produits e-commerce. Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans code blocks, sans explications. Réponds toujours avec un objet JSON valide.'
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
    let aiFilters;
    try {
      const content = completion.choices[0].message.content;
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiFilters = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erreur parsing OpenAI response:', parseError);
      return res.status(500).json({ error: 'Erreur lors de l\'analyse de la requête' });
    }

    // Mapper les noms aux IDs
    const result = {
      search: aiFilters.search || '',
      category: '',
      brand: '',
      specifications: {}
    };

    // Trouver l'ID de la catégorie
    if (aiFilters.category) {
      const foundCategory = [...mainCategories, ...subCategories].find(c => 
        c.id === aiFilters.category || c.name.toLowerCase() === aiFilters.category.toLowerCase()
      );
      if (foundCategory) {
        result.category = foundCategory.id;
      }
    }

    // Trouver l'ID de la marque
    if (aiFilters.brand) {
      const foundBrand = brandList.find(b => 
        b.id === aiFilters.brand || b.name.toLowerCase() === aiFilters.brand.toLowerCase()
      );
      if (foundBrand) {
        result.brand = foundBrand.id;
      }
    }

    // Mapper les spécifications
    if (aiFilters.specifications && typeof aiFilters.specifications === 'object') {
      Object.entries(aiFilters.specifications).forEach(([specName, specValue]) => {
        // Trouver la spécification correspondante
        const foundSpec = specList.find(s => s.name.toLowerCase() === specName.toLowerCase());
        if (foundSpec) {
          // Vérifier si la valeur existe dans les valeurs possibles
          const possibleValues = specValues[foundSpec.name] || [];
          const matchingValue = possibleValues.find(v => 
            String(v).toLowerCase() === String(specValue).toLowerCase()
          );
          if (matchingValue !== undefined) {
            result.specifications[foundSpec.name] = matchingValue;
          } else if (foundSpec.type === 'number' && !isNaN(Number(specValue))) {
            result.specifications[foundSpec.name] = Number(specValue);
          } else if (foundSpec.type === 'boolean') {
            result.specifications[foundSpec.name] = specValue === true || specValue === 'true';
          } else {
            result.specifications[foundSpec.name] = String(specValue);
          }
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur recherche IA:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la recherche IA' });
  }
});

// Helper pour télécharger une image depuis une URL
async function downloadImageFromUrl(imageUrl, uploadsDir) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(imageUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
      const filepath = path.join(uploadsDir, filename);
      const file = fs.createWriteStream(filepath);

      protocol.get(imageUrl, (response) => {
        // Vérifier que c'est bien une image
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          file.close();
          fs.unlinkSync(filepath);
          reject(new Error('URL ne pointe pas vers une image valide'));
          return;
        }

        response.pipe(file);

        file.on('finish', async () => {
          file.close();
          try {
            // Compresser l'image avec Sharp
            const compressedFilename = path.parse(filename).name + '-compressed.jpg';
            const compressedPath = path.join(uploadsDir, compressedFilename);

            await sharp(filepath)
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
            fs.unlinkSync(filepath);

            resolve({
              url: `/uploads/${compressedFilename}`,
              filename: compressedFilename
            });
          } catch (error) {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
            reject(error);
          }
        });
      }).on('error', (err) => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Helper pour extraire les images intégrées d'un fichier Excel
async function extractEmbeddedImages(excelFilePath, uploadsDir) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    
    const imagesByRow = {}; // { rowIndex: [images] }
    
    // Parcourir toutes les feuilles
    workbook.eachSheet((worksheet) => {
      const images = worksheet.getImages();
      
      images.forEach((image) => {
        try {
          const imageId = image.imageId;
          const imageData = workbook.model.media.find((m) => m.index === imageId);
          
          if (imageData && imageData.buffer) {
            // Calculer la ligne approximative (les images sont positionnées par coordonnées)
            // On utilise la position top de l'image pour déterminer la ligne
            const imageTop = image.range.tl ? image.range.tl.row : 0;
            const rowIndex = imageTop; // Ligne 0-based
            
            if (!imagesByRow[rowIndex]) {
              imagesByRow[rowIndex] = [];
            }
            
            imagesByRow[rowIndex].push({
              buffer: imageData.buffer,
              extension: imageData.extension || 'png',
              name: imageData.name || `image_${imageId}`
            });
          }
        } catch (error) {
          console.error('Erreur extraction image:', error);
        }
      });
    });
    
    return imagesByRow;
  } catch (error) {
    console.error('Erreur extraction images Excel:', error);
    return {};
  }
}

// Helper pour sauvegarder une image depuis un buffer
async function saveImageFromBuffer(imageBuffer, extension, uploadsDir) {
  const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + extension;
  const filepath = path.join(uploadsDir, filename);
  
  // Sauvegarder temporairement
  fs.writeFileSync(filepath, imageBuffer);
  
  try {
    // Compresser avec Sharp
    const compressedFilename = path.parse(filename).name + '-compressed.jpg';
    const compressedPath = path.join(uploadsDir, compressedFilename);

    await sharp(filepath)
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
    fs.unlinkSync(filepath);

    return {
      url: `/uploads/${compressedFilename}`,
      filename: compressedFilename
    };
  } catch (error) {
    // Si erreur, supprimer le fichier temporaire
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw error;
  }
}

// Helper pour traiter les URLs d'images (séparées par virgules ou points-virgules)
async function processImageUrls(imageUrlsString, uploadsDir) {
  if (!imageUrlsString || !imageUrlsString.trim()) {
    return [];
  }

  // Séparer les URLs (virgule, point-virgule, ou espace)
  const urls = imageUrlsString
    .split(/[,;\s]+/)
    .map(url => url.trim())
    .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));

  if (urls.length === 0) {
    return [];
  }

  const images = [];
  const errors = [];

  // Télécharger chaque image (limite de 50 images par produit)
  for (let i = 0; i < Math.min(urls.length, 50); i++) {
    try {
      const image = await downloadImageFromUrl(urls[i], uploadsDir);
      images.push({
        url: image.url,
        alt: '',
        order: i,
        isPrimary: i === 0
      });
    } catch (error) {
      errors.push({ url: urls[i], error: error.message });
    }
  }

  return { images, errors };
}

// Helper pour générer un slug unique
async function generateUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  // Vérifier si le slug existe déjà
  let existingProduct = await Product.findOne({ slug });
  
  // Si le slug existe, ajouter un numéro incrémental
  while (existingProduct) {
    slug = `${baseSlug}-${counter}`;
    existingProduct = await Product.findOne({ slug });
    counter++;
    
    // Sécurité : éviter une boucle infinie (max 1000 tentatives)
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

// Helper pour détecter automatiquement le mapping des colonnes
function detectColumnMapping(headers, categories, brands) {
  const mapping = {};
  const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());
  
  // Mapping intelligent par défaut
  const fieldPatterns = {
    name: ['nom', 'name', 'produit', 'product', 'titre', 'title', 'libellé', 'libelle'],
    description: ['description', 'desc', 'détail', 'detail', 'texte', 'text'],
    shortDescription: ['description courte', 'short description', 'résumé', 'resume', 'synopsis'],
    sku: ['sku', 'code', 'référence', 'reference', 'ref', 'code barre', 'codebarre', 'ean'],
    price: ['prix', 'price', 'tarif', 'tariff', 'coût', 'cost'],
    compareAtPrice: ['prix comparé', 'compare price', 'ancien prix', 'old price', 'prix avant', 'prix barré'],
    brand: ['marque', 'brand', 'fabricant', 'manufacturer', 'maker'],
    category: ['catégorie', 'category', 'cat', 'type', 'famille'],
    subCategory: ['sous-catégorie', 'subcategory', 'sous categorie', 'sous-categorie', 'sous cat'],
    stock: ['stock', 'quantité', 'quantity', 'qty', 'disponible', 'available'],
    isInStock: ['en stock', 'in stock', 'disponible', 'available', 'stock'],
    isFeatured: ['vedette', 'featured', 'mise en avant', 'highlighted', 'promo'],
    isBestSeller: ['best seller', 'bestseller', 'meilleure vente', 'top'],
  };

  // Trouver le meilleur match pour chaque champ
  Object.keys(fieldPatterns).forEach(field => {
    const patterns = fieldPatterns[field];
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (patterns.some(pattern => header.includes(pattern) || pattern.includes(header))) {
        mapping[headers[i]] = field;
        break;
      }
    }
  });

  // Détecter les spécifications (colonnes non mappées)
  const mappedHeaders = Object.keys(mapping);
  headers.forEach(header => {
    if (!mappedHeaders.includes(header) && header && String(header).trim()) {
      // C'est probablement une spécification
      mapping[header] = `spec:${header}`;
    }
  });

  return mapping;
}

// Route pour prévisualiser le fichier Excel et obtenir les colonnes
router.post('/import/preview', authenticate, requireAdmin, excelUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Lire le fichier Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON (première ligne = headers)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (data.length === 0) {
      // Supprimer le fichier
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Le fichier Excel est vide' });
    }

    // La première ligne contient les en-têtes (on l'ignore pour les données)
    const headers = data[0].map(h => String(h || '').trim()).filter(h => h);
    const previewRows = data.slice(1, 6); // Aperçu des 5 premières lignes de données

    // Vérifier s'il y a des images intégrées dans le fichier
    let hasEmbeddedImages = false;
    let embeddedImagesCount = 0;
    try {
      const embeddedImages = await extractEmbeddedImages(req.file.path, uploadsDir);
      embeddedImagesCount = Object.keys(embeddedImages).reduce((sum, key) => sum + embeddedImages[key].length, 0);
      hasEmbeddedImages = embeddedImagesCount > 0;
    } catch (error) {
      console.error('Erreur lors de la détection des images intégrées:', error);
    }

    // Récupérer les catégories et marques pour le mapping intelligent
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).select('name'),
      Brand.find().select('name')
    ]);

    // Détecter automatiquement le mapping
    const autoMapping = detectColumnMapping(headers, categories, brands);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    res.json({
      headers,
      preview: previewRows,
      autoMapping,
      totalRows: data.length - 1, // Exclure la ligne d'en-tête
      hasEmbeddedImages,
      embeddedImagesCount
    });
  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Erreur lors de la lecture du fichier Excel' });
  }
});

// Route pour importer les produits avec le mapping
router.post('/import', authenticate, requireAdmin, excelUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { columnMapping } = req.body;
    if (!columnMapping) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Le mapping des colonnes est requis' });
    }

    const mapping = JSON.parse(columnMapping);

    // Lire le fichier Excel avec XLSX pour les données
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON (ignorer la première ligne)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (data.length <= 1) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Le fichier Excel ne contient pas de données' });
    }

    const headers = data[0].map(h => String(h || '').trim());
    const rows = data.slice(1); // Ignorer la première ligne

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extraire les images intégrées du fichier Excel
    const embeddedImages = await extractEmbeddedImages(req.file.path, uploadsDir);

    // Récupérer les catégories et marques pour les résolutions
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).select('name _id'),
      Brand.find().select('name _id')
    ]);

    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c._id.toString()]));
    const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b._id.toString()]));

    const results = {
      success: [],
      errors: []
    };

    // Traiter chaque ligne
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(cell => !cell || String(cell).trim() === '')) {
        continue; // Ignorer les lignes vides
      }

      try {
        const productData = {};

        // Mapper chaque colonne selon le mapping fourni
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
          const header = headers[colIndex];
          const field = mapping[header];
          if (!field || !row[colIndex]) continue;

          const value = String(row[colIndex]).trim();
          if (!value) continue;

          if (field === 'name') {
            productData.name = value;
          } else if (field === 'description') {
            productData.description = value;
          } else if (field === 'shortDescription') {
            productData.shortDescription = value;
          } else if (field === 'sku') {
            productData.sku = value;
          } else if (field === 'price') {
            const price = parseFloat(value.replace(',', '.').replace(/\s/g, ''));
            if (!isNaN(price)) productData.price = price;
          } else if (field === 'compareAtPrice') {
            const price = parseFloat(value.replace(',', '.').replace(/\s/g, ''));
            if (!isNaN(price)) productData.compareAtPrice = price;
          } else if (field === 'brand') {
            const brandLower = value.toLowerCase();
            const brandId = brandMap.get(brandLower);
            if (brandId) {
              productData.brand = brandId;
            } else {
              // Créer la marque si elle n'existe pas
              const newBrand = new Brand({ name: value });
              await newBrand.save();
              brandMap.set(brandLower, newBrand._id.toString());
              productData.brand = newBrand._id.toString();
            }
          } else if (field === 'category') {
            const catLower = value.toLowerCase();
            const catId = categoryMap.get(catLower);
            if (catId) {
              productData.category = catId;
            }
          } else if (field === 'subCategory') {
            const subCatLower = value.toLowerCase();
            const subCatId = categoryMap.get(subCatLower);
            if (subCatId) {
              productData.subCategory = subCatId;
            }
          } else if (field === 'stock') {
            const stock = parseInt(value);
            if (!isNaN(stock)) {
              productData.stock = stock;
              productData.isInStock = stock > 0;
            }
          } else if (field === 'isInStock') {
            const lowerValue = value.toLowerCase();
            productData.isInStock = lowerValue === 'oui' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1' || lowerValue === 'en stock';
          } else if (field === 'isFeatured') {
            const lowerValue = value.toLowerCase();
            productData.isFeatured = lowerValue === 'oui' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1';
          } else if (field === 'isBestSeller') {
            const lowerValue = value.toLowerCase();
            productData.isBestSeller = lowerValue === 'oui' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1';
          } else if (field === 'images') {
            // Traiter les URLs d'images
            try {
              const imageResult = await processImageUrls(value, uploadsDir);
              if (imageResult.images.length > 0) {
                if (!productData.images) {
                  productData.images = [];
                }
                productData.images = [...productData.images, ...imageResult.images];
                // Limiter à 50 images au total
                productData.images = productData.images.slice(0, 50);
              }
              if (imageResult.errors.length > 0) {
                // Ajouter les erreurs d'images aux erreurs du produit
                if (!productData._imageErrors) {
                  productData._imageErrors = [];
                }
                productData._imageErrors.push(...imageResult.errors);
              }
            } catch (error) {
              // Erreur lors du traitement des images, mais continuer quand même
              if (!productData._imageErrors) {
                productData._imageErrors = [];
              }
              productData._imageErrors.push({ url: value, error: error.message });
            }
          } else if (field.startsWith('spec:')) {
            // Spécification
            const specName = field.replace('spec:', '');
            if (!productData.specifications) {
              productData.specifications = {};
            }
            // Essayer de convertir en nombre si possible
            const numValue = parseFloat(value.replace(',', '.'));
            if (!isNaN(numValue) && isFinite(numValue)) {
              productData.specifications[specName] = numValue;
            } else {
              productData.specifications[specName] = value;
            }
          }
        }

        // Vérifier les champs requis
        if (!productData.name) {
          results.errors.push({ row: i + 2, error: 'Le nom du produit est requis' });
          continue;
        }
        if (!productData.price) {
          results.errors.push({ row: i + 2, error: 'Le prix est requis' });
          continue;
        }
        if (!productData.category) {
          results.errors.push({ row: i + 2, error: 'La catégorie est requise' });
          continue;
        }

        // Générer le slug de base
        const baseSlug = productData.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Générer un slug unique (vérifie les doublons)
        productData.slug = await generateUniqueSlug(baseSlug);

        // Valeurs par défaut
        if (!productData.stock) productData.stock = 0;
        if (productData.isInStock === undefined) productData.isInStock = true; // Par défaut, les produits importés sont en stock
        if (!productData.images) productData.images = [];
        if (!productData.specifications) productData.specifications = {};
        productData.isImported = true; // Marquer comme importé

        // Traiter les images intégrées dans le fichier Excel (ligne i correspond à la ligne i+1 dans Excel, car on ignore la première ligne)
        const excelRowIndex = i + 1; // +1 car on a ignoré la ligne d'en-tête
        if (embeddedImages[excelRowIndex] && embeddedImages[excelRowIndex].length > 0) {
          const rowImages = embeddedImages[excelRowIndex];
          const currentImageCount = productData.images.length;
          
          for (let imgIdx = 0; imgIdx < Math.min(rowImages.length, 50 - currentImageCount); imgIdx++) {
            try {
              const imageInfo = await saveImageFromBuffer(
                rowImages[imgIdx].buffer,
                rowImages[imgIdx].extension || 'png',
                uploadsDir
              );
              
              productData.images.push({
                url: imageInfo.url,
                alt: '',
                order: currentImageCount + imgIdx,
                isPrimary: currentImageCount === 0 && imgIdx === 0
              });
            } catch (error) {
              if (!productData._imageErrors) {
                productData._imageErrors = [];
              }
              productData._imageErrors.push({ 
                source: 'image intégrée', 
                error: error.message 
              });
            }
          }
        }

        // Gérer les erreurs d'images (avertissements, pas bloquants)
        const imageErrors = productData._imageErrors || [];
        delete productData._imageErrors;

        // Créer le produit
        const product = new Product(productData);
        await product.save();
        
        const successInfo = { row: i + 2, name: productData.name };
        if (imageErrors.length > 0) {
          successInfo.imageWarnings = imageErrors;
        }
        results.success.push(successInfo);
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    // Supprimer le fichier
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      imported: results.success.length,
      errors: results.errors.length,
      details: {
        success: results.success,
        errors: results.errors
      }
    });
  } catch (error) {
    // Supprimer le fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Erreur lors de l\'import' });
  }
});

export default router;



