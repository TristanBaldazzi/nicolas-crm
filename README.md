# RCMPLAY-REPARATION - Site E-commerce

Site e-commerce pour RCMPLAY-REPARATION, société de vente de produits au Luxembourg.

## 🚀 Fonctionnalités

- **Présence numérique** - Site web professionnel
- **Catalogue produits** - Affichage par catégories et sous-catégories
- **Marques** - Mise en avant des marques (Nematic, Prinus, Bosch, Electro Lux)
- **Authentification** - Connexion/Inscription
- **Back office** - Gestion complète des produits, catégories, clients
- **Email marketing** - Campagnes email
- **Gestion images** - Upload et compression automatique (max 50 images par produit)

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Express.js + MongoDB + Mongoose
- **Authentification**: JWT
- **Upload**: Multer avec compression d'images

## 📦 Installation

```bash
# Installation de toutes les dépendances
npm run install:all

# Développement (lance frontend + backend)
npm run dev

# Ou séparément
npm run dev:backend
npm run dev:frontend
```

## 🔧 Configuration

1. Créer un fichier `.env` dans `backend/` :
```
MONGODB_URI=mongodb://localhost:27017/rcmplay
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

2. Créer un fichier `.env.local` dans `frontend/` :
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📁 Structure

```
├── frontend/          # Next.js 14 + TypeScript
├── backend/           # Express.js API
└── package.json       # Workspace root
```

## 🎯 Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (upload)
- Sharp (compression images)

