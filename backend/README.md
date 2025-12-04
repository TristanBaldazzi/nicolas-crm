# Backend RCMPLAY-REPARATION

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du dossier `backend/` avec :

```
MONGODB_URI=mongodb://localhost:27017/rcmplay
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email configuration (optionnel pour email marketing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Vérifier le token

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:slug` - Détails d'un produit
- `POST /api/products` - Créer un produit (admin)
- `PUT /api/products/:id` - Modifier un produit (admin)
- `DELETE /api/products/:id` - Supprimer un produit (admin)

### Catégories
- `GET /api/categories` - Liste des catégories
- `GET /api/categories/:slug` - Détails d'une catégorie
- `POST /api/categories` - Créer une catégorie (admin)
- `PUT /api/categories/:id` - Modifier une catégorie (admin)
- `DELETE /api/categories/:id` - Supprimer une catégorie (admin)

### Clients
- `GET /api/clients` - Liste des clients (admin)
- `POST /api/clients` - Créer un client (admin)
- `POST /api/clients/import` - Importer des clients depuis CSV (admin)

### Email Marketing
- `GET /api/email` - Liste des campagnes (admin)
- `POST /api/email` - Créer une campagne (admin)
- `POST /api/email/:id/send` - Envoyer une campagne (admin)

### Upload
- `POST /api/upload/image` - Upload une image (admin)
- `POST /api/upload/images` - Upload plusieurs images (max 50) (admin)




