# MarketVibe - Marketplace Nouvelle Génération

MarketVibe est une marketplace moderne, sécurisée et entièrement personnalisable grâce à l'IA.

## 🚀 Déploiement Gratuit sur GitHub Pages

Pour déployer ce site gratuitement sur **GitHub Pages** (adresse en `.github.io`), suivez ces étapes :

### 1. Exportation vers GitHub
1.  Dans l'éditeur **AI Studio Build**, cliquez sur l'icône **Settings** (engrenage).
2.  Sélectionnez **"Export to GitHub"**.
3.  Connectez votre compte et créez un nouveau dépôt (ex: `marketvibe`).

### 2. Activation de GitHub Pages
Une fois le code sur GitHub :
1.  Allez dans les **Settings** de votre dépôt GitHub.
2.  Section **Pages** (dans le menu de gauche).
3.  Sous **Build and deployment**, assurez-vous que **Source** est sur "Deploy from a branch".
4.  Choisissez la branche `main` (ou `master`) et le dossier `/ (root)`.
5.  Cliquez sur **Save**. Votre site sera bientôt en ligne à l'adresse : `https://votre-pseudo.github.io/votre-depot/`.

### 3. Configuration Firebase (Crucial)
Pour que l'authentification et la base de données fonctionnent sur votre nouvelle adresse :
1.  Allez sur la [Console Firebase](https://console.firebase.google.com/).
2.  Sélectionnez votre projet.
3.  Allez dans **Authentication** > **Settings** > **Authorized domains**.
4.  Ajoutez votre adresse GitHub Pages (ex: `votre-pseudo.github.io`) à la liste des domaines autorisés.

## 🛠️ Technologies
- React 18 + Vite
- Tailwind CSS
- Firebase (Auth & Firestore)
- Google Gemini AI (AI Architect)
- Framer Motion (Animations)
