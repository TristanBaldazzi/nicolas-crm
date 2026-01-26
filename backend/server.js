import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import clientRoutes from './routes/clients.js';
import emailRoutes from './routes/email.js';
import uploadRoutes from './routes/upload.js';
import cartRoutes from './routes/carts.js';
import companyRoutes from './routes/companies.js';
import promotionRoutes from './routes/promotions.js';
import settingsRoutes from './routes/settings.js';
import productSpecRoutes from './routes/productSpecs.js';
import brandRoutes from './routes/brands.js';
import contactRoutes from './routes/contact.js';
import customQuotesRoutes from './routes/customQuotes.js';
import analyticsRoutes from './routes/analytics.js';
import clientFilesRoutes from './routes/clientFiles.js';
import productFilesRoutes from './routes/productFiles.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy pour obtenir la vraie IP
app.set('trust proxy', true);

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Configuration CORS avec support de plusieurs origines
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://rcm.baldazzi.fr',
  'http://rcm.baldazzi.fr',
  'http://localhost:3000',
  'http://dev.rcmplay-reparation.lu',
  'https://dev.rcmplay-reparation.lu',
  'http://rcmplay-reparation.lu',
  'https://rcmplay-reparation.lu'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Autoriser toutes les origines en développement, ajuster en production si nécessaire
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limite chaque IP à 100 requêtes par windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Utiliser l'IP depuis req.ip (qui fonctionne avec trust proxy)
    // ou depuis x-forwarded-for si disponible
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || 'unknown';
  },
  // Désactiver la validation trust proxy car on gère manuellement l'IP
  validate: {
    trustProxy: false
  }
});
app.use('/api/', limiter);

// Cookie parser
app.use(cookieParser());

// Middleware pour ajouter CORS avant le body parser (pour gérer les erreurs 413)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://rcm.baldazzi.fr',
    'http://rcm.baldazzi.fr',
    'http://localhost:3000',
    'http://dev.rcmplay-reparation.lu',
    'https://dev.rcmplay-reparation.lu',
    'http://rcmplay-reparation.lu',
    'https://rcmplay-reparation.lu'
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
});

// Middleware pour intercepter les erreurs 413 avant le body parser
app.use((req, res, next) => {
  // Sauvegarder la fonction send originale
  const originalSend = res.send;
  
  // Intercepter les réponses d'erreur
  res.send = function(body) {
    // Si c'est une erreur 413, ajouter les headers CORS
    if (res.statusCode === 413) {
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://rcm.baldazzi.fr',
        'http://rcm.baldazzi.fr',
        'http://localhost:3000',
        'http://dev.rcmplay-reparation.lu',
        'https://dev.rcmplay-reparation.lu',
        'http://rcmplay-reparation.lu',
        'https://rcmplay-reparation.lu'
      ].filter(Boolean);
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (allowedOrigins.length > 0) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Body parser avec limites augmentées pour les uploads
// Intercepter les erreurs 413 du body parser
const jsonParser = express.json({ limit: '100mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '100mb' });

app.use((req, res, next) => {
  jsonParser(req, res, (err) => {
    if (err && (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large')) {
      // Ajouter les headers CORS avant de renvoyer l'erreur
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://rcm.baldazzi.fr',
        'http://rcm.baldazzi.fr',
        'http://localhost:3000',
        'http://dev.rcmplay-reparation.lu',
        'https://dev.rcmplay-reparation.lu',
        'http://rcmplay-reparation.lu',
        'https://rcmplay-reparation.lu'
      ].filter(Boolean);
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (allowedOrigins.length > 0) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return res.status(413).json({ 
        error: 'Fichier ou payload trop volumineux. Taille maximale : 100MB' 
      });
    }
    if (err) return next(err);
    urlencodedParser(req, res, (err2) => {
      if (err2 && (err2.status === 413 || err2.statusCode === 413 || err2.type === 'entity.too.large')) {
        // Ajouter les headers CORS avant de renvoyer l'erreur
        const origin = req.headers.origin;
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'https://rcm.baldazzi.fr',
          'http://rcm.baldazzi.fr',
          'http://localhost:3000',
          'http://dev.rcmplay-reparation.lu',
          'https://dev.rcmplay-reparation.lu',
          'http://rcmplay-reparation.lu',
          'https://rcmplay-reparation.lu'
        ].filter(Boolean);
        
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (allowedOrigins.length > 0) {
          res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return res.status(413).json({ 
          error: 'Fichier ou payload trop volumineux. Taille maximale : 100MB' 
        });
      }
      if (err2) return next(err2);
      next();
    });
  });
});

// Servir les fichiers statiques (images uploadées) avec headers CORS
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Servir les fichiers de contact
app.use('/uploads/contact', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads/contact')));

// Servir les fichiers clients
app.use('/uploads/client-files', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads/client-files')));

// Servir les fichiers produits
app.use('/uploads/product-files', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads/product-files')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/product-specs', productSpecRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/custom-quotes', customQuotesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/client-files', clientFilesRoutes);
app.use('/api/product-files', productFilesRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RCMPLAY-REPARATION API is running' });
});

// Middleware de gestion d'erreurs global avec CORS
app.use((err, req, res, next) => {
  // Ajouter les headers CORS même en cas d'erreur
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://rcm.baldazzi.fr',
    'http://rcm.baldazzi.fr',
    'http://localhost:3000',
    'http://dev.rcmplay-reparation.lu',
    'https://dev.rcmplay-reparation.lu',
    'http://rcmplay-reparation.lu',
    'https://rcmplay-reparation.lu'
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Gérer les erreurs de taille (413)
  if (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'Fichier ou payload trop volumineux. Taille maximale : 100MB' 
    });
  }
  
  // Autres erreurs
  console.error('Error:', err);
  res.status(err.status || err.statusCode || 500).json({ 
    error: err.message || 'Erreur serveur' 
  });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rcmplay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

export default app;



