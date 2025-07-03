# 📈 TontineApp

Application complète de gestion de tontines avec :

- Création et gestion de tontines
- Paiements par cycle avec rappels automatiques
- Tirages réguliers avec désignation d’un gagnant
- Notifications email et SMS

## 🚀 Prérequis

- Node.js >= 14
- MariaDB ou MySQL
- Compte Gmail (pour les emails)
- (Optionnel) Service SMS (module `sendSMS`)

## 🛠 Installation backend

1. Cloner le projet :

   ```bash
   git clone https://github.com/votre-repo/tontine-app.git
   cd tontine-app/backend

   ```

2. Installer les dépendances :
   npm install

3. Configurer la base de données :
   1. Créer une base de données MariaDB :
      CREATE DATABASE tontine_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   2. Configurer config/config.json :
      {
      "development": {
      "username": "root",
      "password": "",
      "database": "tontine_app",
      "host": "127.0.0.1",
      "dialect": "mariadb"
      }
      }
4. Lancer les migrations :
   npx sequelize-cli db:migrate
5. Créer un fichier .env :
   EMAIL_USER=ton.email@gmail.com
   EMAIL_PASS=motdepasse-application
   (⚠️ Utilise un mot de passe d’application Gmail)
6. Lancer le serveur :
   node app.js
   Par défaut accessible sur : http://localhost:3000

## ⚙️ Lancer les tâches automatiques

Ouvre deux autres terminaux :
Rappel des paiements (tous les matins) :

    node rappelPaiements.js

Tirages automatiques :

    node tirageAutomatique.js

## 💻 Lancer le frontend

1. Ouvre un deuxième terminal :
   cd ../frontend
2. Tu peux lancer un serveur statique :
   npx serve .
   (Ou simplement ouvrir les fichiers HTML dans ton navigateur.)

## 📬 Configurer l’envoi d’emails

- Crée un mot de passe d’application Gmail :
  https://support.google.com/mail/answer/185833
- Mets-le dans .env et vérifie bien config/mailer.js.

## 📱 Configurer l’envoi de SMS

Si tu as une API SMS :

- Modifie config/sendSMS.js
- Exemple simplifié :
  module.exports = async function sendSMS(to, message) {
  console.log(`SMS à ${to}: ${message}`);
  };

## 🔑 Authentification

- Lors de la connexion, un JWT est généré.

- Il est stocké dans localStorage.

- Chaque requête fetch inclut :
  Authorization: Bearer <token>

## 🧪 Pour tester

- Crée un compte via register.html

- Connecte-toi avec login.html

- Crée une tontine

- Rejoins avec un autre compte

- Effectue un paiement

- Lance manuellement un tirage depuis le dashboard

## 🎯 Production

- Héberge le backend (Heroku, DigitalOcean, etc.)

- Héberge le frontend (Netlify, Vercel, etc.)

- Modifie les URLs API dans les fichiers JS frontend

- Active HTTPS et sécurise les tokens

---

## 🚀 Utilisation locale étape par étape

1. **Lance MariaDB.**
2. **Terminal #1**

   ```bash
   cd backend
   node app.js
   ```

3. **Terminal #2**
   node rappelPaiements.js
4. **Terminal #3**
   node tirageAutomatique.js
5. **Terminal #4**
   cd frontend
   npx serve .
6. Navigue sur http://localhost:5000 (ou ouvre frontend/index.html)
