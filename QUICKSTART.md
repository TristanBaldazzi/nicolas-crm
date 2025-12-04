# Guide de démarrage rapide - RCMPLAY-REPARATION

## 🚀 Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm run install:all
```

### 2. Configuration MongoDB

Assurez-vous que MongoDB est installé et démarré :

```bash
# macOS (avec Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Démarrer MongoDB depuis les services Windows
```

### 3. Configuration Backend

Créez un fichier `backend/.env` :

```env
MONGODB_URI=mongodb://localhost:27017/rcmplay
JWT_SECRET=changez-ce-secret-en-production
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Configuration Frontend

Créez un fichier `frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Créer un utilisateur admin

```bash
cd backend
npm run init-admin
# Ou avec des paramètres personnalisés :
npm run init-admin admin@rcmplay.lu motdepasse Prénom Nom
```

### 6. Démarrer l'application

```bash
# À la racine du projet (lance frontend + backend)
npm run dev

# Ou séparément :
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 📝 Utilisation

### Accès

- **Site public** : http://localhost:3000
- **Back office** : http://localhost:3000/admin
- **API** : http://localhost:5000/api

### Connexion admin

Utilisez les identifiants créés avec `init-admin` pour vous connecter.

### Import de clients CSV

1. Allez dans **Admin > Clients**
2. Cliquez sur **"Importer CSV"**
3. Sélectionnez votre fichier CSV

**Format CSV attendu** (séparateur `;`) :
```
Code (tiers);Civilité;Nom;Adresse 1;Code postal;Ville;Département;Code Pays;Site Web;Téléphone portable;E-mail;Numéro de TVA intracommunautaire
CL01601;SARL;MOIZYK;50 route de borny;57070;METZ;MOSELLE;FR;;;sylvain.omthionville@icloud.com;FR63493573265
```

### Ajouter un produit

1. Allez dans **Admin > Produits**
2. Cliquez sur **"+ Nouveau produit"**
3. Remplissez les informations
4. Uploadez jusqu'à 50 images (compression automatique)
5. Sélectionnez une catégorie (ou créez-en une dans **Admin > Catégories**)

### Email Marketing

1. Allez dans **Admin > Email Marketing**
2. Créez une nouvelle campagne
3. Rédigez votre email HTML (utilisez `{name}` pour le nom du client)
4. Sélectionnez les destinataires
5. Cliquez sur **"Envoyer"**

## 🎨 Marques supportées

- Nematic
- Prinus
- Bosch
- Electro Lux
- Autre

## 📦 Structure des dossiers

```
├── backend/          # API Express.js
│   ├── models/      # Modèles MongoDB
│   ├── routes/      # Routes API
│   ├── middleware/  # Middleware (auth, etc.)
│   └── uploads/     # Images uploadées
├── frontend/        # Next.js 14
│   ├── app/         # Pages (App Router)
│   ├── components/  # Composants React
│   └── lib/         # Utilitaires (API, store)
└── package.json     # Workspace root
```

## 🔧 Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Créer un admin
cd backend && npm run init-admin

# Backend seul
cd backend && npm run dev

# Frontend seul
cd frontend && npm run dev
```

## ⚠️ Notes importantes

- Les images sont automatiquement compressées lors de l'upload
- Maximum 50 images par produit
- Les catégories peuvent avoir des sous-catégories
- L'import CSV met à jour les clients existants (basé sur le code)
- Les campagnes email sont envoyées en arrière-plan

## 🐛 Dépannage

### MongoDB ne démarre pas
- Vérifiez que MongoDB est installé
- Vérifiez les permissions du dossier de données MongoDB

### Erreur de connexion API
- Vérifiez que le backend est démarré (port 5000)
- Vérifiez la variable `NEXT_PUBLIC_API_URL` dans `frontend/.env.local`

### Erreur d'authentification
- Vérifiez que `JWT_SECRET` est défini dans `backend/.env`
- Recréez un admin avec `npm run init-admin`




