# 🚀 Guide de démarrage rapide

## Pour les utilisateurs non techniques

Ce guide explique comment installer et utiliser Batch Profile Uploader en 5 minutes, sans connaissances techniques.

---

## 📥 Étape 1 : Télécharger l'application

### Option A : Télécharger le ZIP (le plus simple)

1. Va sur : **https://github.com/mickaelbentz/batch-profile-uploader**
2. Clique sur le bouton vert **"Code"**
3. Clique sur **"Download ZIP"**
4. Décompresse le fichier ZIP sur ton ordinateur

### Option B : Cloner avec Git (si tu as Git installé)

```bash
git clone https://github.com/mickaelbentz/batch-profile-uploader.git
cd batch-profile-uploader
```

---

## 💻 Étape 2 : Installer Python (si ce n'est pas déjà fait)

**Vérifier si Python est installé :**

- **Mac/Linux** : Ouvre un terminal et tape `python3 --version`
- **Windows** : Ouvre cmd et tape `python --version`

**Si Python n'est pas installé :**

1. Va sur : **https://www.python.org/downloads/**
2. Télécharge la dernière version de Python
3. **IMPORTANT sur Windows** : Pendant l'installation, coche bien **"Add Python to PATH"**
4. Installe normalement

---

## ▶️ Étape 3 : Lancer l'application

### Sur Mac/Linux

1. Double-clique sur le fichier **`start.sh`**
2. Ton navigateur s'ouvrira automatiquement sur `http://localhost:8080`
3. C'est prêt ! 🎉

**Si le double-clic ne marche pas :**
```bash
# Ouvre un terminal dans le dossier, puis :
chmod +x start.sh
./start.sh
```

### Sur Windows

1. Double-clique sur le fichier **`start.bat`**
2. Ton navigateur s'ouvrira automatiquement sur `http://localhost:8080`
3. C'est prêt ! 🎉

**Alternative manuelle (Windows/Mac/Linux) :**
```bash
# Ouvre un terminal/cmd dans le dossier, puis :
python3 -m http.server 8080

# Ensuite ouvre ton navigateur sur :
# http://localhost:8080
```

---

## 🔑 Étape 4 : Utiliser l'application

### Récupérer tes clés API Batch

1. Connecte-toi à ton dashboard Batch
2. Va dans **Settings → API Keys**
3. Copie ta **REST API Key** (commence par `rest_`)
4. Va dans **Settings → General**
5. Copie ton **Project ID** (commence par `project_`)

### Importer tes contacts

1. **Étape 1 - Configuration API**
   - Colle ta REST API Key
   - Colle ton Project ID
   - Clique sur "Charger les profils existants"
   - Attends que l'export se termine (peut prendre quelques minutes)

2. **Étape 2 - Upload du CSV**
   - Glisse-dépose ton fichier CSV ou clique pour le sélectionner
   - Ton CSV doit avoir au minimum une colonne `email`
   - Clique sur "Analyser le fichier"

3. **Étape 3 - Validation**
   - Vérifie que tous les champs sont bien reconnus
   - Choisis ta stratégie :
     - ☑️ **Fusionner** : Ajoute les nouvelles données sans écraser l'existant (recommandé)
     - ☐ **Écraser** : Remplace complètement les profils existants
   - Clique sur "Lancer l'importation"

4. **Étape 4 - Rapport**
   - Consulte le rapport détaillé
   - Vérifie le nombre de profils créés, mis à jour, et les erreurs éventuelles

---

## ⚠️ Sécurité importante

### ❌ NE JAMAIS :
- Déployer cette application sur un serveur public (Netlify, Vercel, GitHub Pages)
- Partager tes clés API avec qui que ce soit
- Laisser l'application ouverte sans surveillance

### ✅ TOUJOURS :
- Utiliser uniquement en **local** (`localhost`)
- Fermer l'application après utilisation
- Garder tes clés API confidentielles

---

## 🛑 Arrêter l'application

Pour arrêter le serveur :
1. Retourne dans le terminal/cmd où le serveur tourne
2. Appuie sur **Ctrl+C**
3. Le serveur s'arrête immédiatement

---

## 🆘 Problèmes courants

### "Python n'est pas reconnu"
→ Python n'est pas installé ou pas dans le PATH. Réinstalle Python et coche "Add Python to PATH"

### "Permission denied" sur Mac/Linux
→ Rends le script exécutable : `chmod +x start.sh`

### "Port 8080 already in use"
→ Le port 8080 est déjà utilisé. Change le port dans le script ou utilise :
```bash
python3 -m http.server 8081
```

### L'export prend trop de temps
→ Normal si tu as beaucoup de profils (> 10 000). L'API Batch peut prendre plusieurs minutes.

### "400 Bad Request" ou "401 Unauthorized"
→ Vérifie que ta REST API Key et ton Project ID sont corrects

---

## 📞 Support

- **Documentation Batch** : https://doc.batch.com
- **Issues GitHub** : https://github.com/mickaelbentz/batch-profile-uploader/issues
- **Support Batch** : support@batch.com

---

## 📝 Format du CSV

Exemple minimal :
```csv
email,firstname,lastname
john@example.com,John,Doe
jane@example.com,Jane,Smith
```

Règles importantes :
- ✅ Obligatoire : colonne `email`
- ✅ Attributs natifs Batch : préfixe avec `$` (ex: `$language`, `$region`)
- ✅ Attributs custom : lettres, chiffres, underscore uniquement, max 30 caractères
- ❌ Pas d'espaces dans les noms de colonnes

---

**Bon import ! 🎉**
