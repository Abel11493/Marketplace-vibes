# MarketVibe - Marketplace Nouvelle Génération

MarketVibe est une marketplace moderne, sécurisée et entièrement personnalisable grâce à l'IA.

## 🚀 Déploiement sur GitHub & Domaine Personnalisé

Pour déployer ce site sur **marketplacevibes.com**, suivez ces étapes :

### 1. Exportation vers GitHub
1.  Dans l'éditeur **AI Studio Build**, cliquez sur l'icône **Settings** (engrenage).
2.  Sélectionnez **"Export to GitHub"**.
3.  Connectez votre compte et créez un nouveau dépôt.

### 2. Configuration du Domaine (marketplacevibes.com)
Une fois le code sur GitHub, si vous utilisez **GitHub Pages** :
1.  Allez dans les **Settings** de votre dépôt GitHub.
2.  Section **Pages**.
3.  Sous **Custom domain**, entrez `marketplacevibes.com`.
4.  Configurez vos enregistrements DNS (A, AAAA ou CNAME) chez votre fournisseur de domaine pour pointer vers les serveurs de GitHub.

### 3. Configuration Firebase (Crucial)
Pour que l'authentification et la base de données fonctionnent sur votre nouveau domaine :
1.  Allez sur la [Console Firebase](https://console.firebase.google.com/).
2.  Sélectionnez votre projet.
3.  Allez dans **Authentication** > **Settings** > **Authorized domains**.
4.  Ajoutez `marketplacevibes.com` à la liste des domaines autorisés.

## 🛠️ Technologies
- React 18 + Vite
- Tailwind CSS
- Firebase (Auth & Firestore)
- Google Gemini AI (AI Architect)
- Framer Motion (Animations)
