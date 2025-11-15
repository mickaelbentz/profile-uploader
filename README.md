# Batch Profile Uploader

Un outil web simple et intuitif pour importer en masse des contacts dans Batch à partir d'un fichier CSV, sans utiliser Postman.

## ⚠️ AVERTISSEMENT SÉCURITÉ

**⚠️ Cette application doit être utilisée UNIQUEMENT en local (localhost).**

**Ne jamais déployer cette application sur un serveur public ou GitHub Pages** car elle nécessite l'utilisation de votre REST API Key Batch qui doit rester strictement confidentielle.

Les clés API Batch donnent accès à l'intégralité de vos données - leur exposition publique représenterait un risque de sécurité majeur.

## Pourquoi cet outil ?

Les équipes non techniques chez Batch ont souvent besoin d'importer des listes de contacts après des jeux concours ou événements. Cet outil permet de:

- ✅ Importer des contacts depuis un simple fichier CSV
- ✅ Détecter automatiquement si un contact existe déjà en base
- ✅ Créer de nouveaux profils ou mettre à jour les existants
- ✅ Valider les champs avant l'importation
- ✅ Obtenir un rapport détaillé (créés, mis à jour, erreurs)

**Pas besoin de Postman ou de connaissances techniques!**

## Fonctionnalités

### 🔄 Synchronisation intelligente

L'application utilise une **stratégie en 2 étapes**:

1. **Chargement des profils existants** via l'API Export de Batch
   - Crée une correspondance `email → custom_id` en mémoire
   - Polling automatique avec loader animé
   - Une seule requête pour tous les profils

2. **Import du CSV** avec détection automatique
   - **Profil existant** → Mise à jour avec le `custom_id` existant
   - **Nouveau profil** → Création avec `custom_id = SHA-256(email)`

### 📋 Validation des champs

- Détection automatique des **attributs natifs Batch** (`$email_address`, `$language`, etc.)
- Validation du format des **attributs custom** (lettres, chiffres, underscore, max 30 caractères)
- Alertes pour les champs non conformes
- Visualisation claire du mapping avant import

### ⚙️ Options de mise à jour

Deux stratégies disponibles:

- **Fusionner** : Ajoute les nouveaux attributs sans écraser les valeurs existantes
- **Écraser** : Remplace complètement les attributs des profils existants

### 📊 Rapport détaillé

Après chaque import:
- Nombre de profils **créés**
- Nombre de profils **mis à jour**
- Nombre d'**erreurs**
- Liste détaillée avec email et statut pour chaque ligne

### 🚀 Performance

- Traitement par **batches de 200 profils** (limite API Batch)
- Respect automatique des **rate limits**
- Pause entre les batches pour éviter les erreurs 429
- Gestion des erreurs partielles

## Comment utiliser

### Étape 1: Configuration API

1. Obtenez vos credentials Batch:
   - **API Key (REST API Key)** : Dans Settings → API Keys
   - **Project ID** : Dans Settings → General

2. Saisissez-les dans l'interface

3. Cliquez sur **"Charger les profils existants"**
   - L'outil va exporter tous vos profils
   - Un loader indique la progression
   - Une fois terminé, vous verrez le nombre de profils chargés

### Étape 2: Upload du CSV

1. Préparez votre fichier CSV avec:
   - Une colonne **email** (obligatoire)
   - Des colonnes pour les attributs (firstname, lastname, etc.)

2. Glissez-déposez ou uploadez votre fichier

3. Cliquez sur **"Analyser le fichier"**

### Étape 3: Validation

1. Vérifiez que tous les champs sont reconnus:
   - 🔵 **Attribut natif Batch** : Reconnu par l'API
   - ✅ **Format valide** : Attribut custom conforme
   - ⚠️ **À vérifier** : Format potentiellement problématique

2. Choisissez votre stratégie:
   - ☑️ Fusionner les attributs (recommandé)
   - ☐ Écraser tous les attributs

3. Cliquez sur **"Lancer l'importation"**

### Étape 4: Rapport

Consultez les résultats détaillés:
- Cartes récapitulatives (créés/mis à jour/erreurs)
- Liste complète avec statut pour chaque email

## Format du fichier CSV

### Exemple minimal

```csv
email,firstname,lastname
john.doe@example.com,John,Doe
jane.smith@example.com,Jane,Smith
```

### Exemple complet avec attributs natifs et custom

```csv
email,firstname,lastname,$language,$region,points,is_premium
john.doe@example.com,John,Doe,fr,FR,150,true
jane.smith@example.com,Jane,Smith,en,US,230,false
pierre.martin@example.com,Pierre,Martin,fr,FR,180,true
```

### Règles importantes

✅ **Obligatoire** : Une colonne `email` (ou `$email_address`)

✅ **Attributs natifs Batch** (préfixés par `$`) :
- `$email_address`
- `$email_marketing` (subscribed/unsubscribed)
- `$phone_number`
- `$sms_marketing`
- `$language` (code ISO)
- `$region` (code pays)
- `$timezone`

✅ **Attributs custom** :
- Lettres, chiffres et underscore uniquement
- Maximum 30 caractères
- Types supportés : string, number, boolean

❌ **Non supporté** :
- Espaces dans les noms d'attributs
- Caractères spéciaux (sauf underscore)

## API Batch utilisées

L'application utilise ces endpoints de l'API Batch:

### 1. Export des profils
```
POST https://api.batch.com/2.7/profiles/export
GET https://api.batch.com/2.7/profiles/export/{exportId}
```
**Limite** : 5 requêtes par heure (12 minutes entre chaque)

### 2. Mise à jour des profils
```
POST https://api.batch.com/2.7/profiles/update
```
**Limite** : 200 profils par requête, 300 updates/seconde, burst 1000

### Authentification

```
Authorization: Bearer YOUR_API_KEY
X-Batch-Project: YOUR_PROJECT_ID
```

## Sécurité

- ✅ **API Key saisie à chaque session** : Aucun stockage local
- ✅ **100% côté client** : Aucune donnée envoyée à un serveur tiers
- ✅ **Hash SHA-256** : Custom IDs sécurisés pour les nouveaux profils
- ✅ **HTTPS** : Toutes les communications avec l'API Batch sont chiffrées

## Gestion des erreurs

### Erreurs communes

**"Repository not found" / 401 Unauthorized**
→ Vérifiez votre API Key et Project ID

**"Too many requests" / 429**
→ L'application pause automatiquement entre les batches

**"Malformed parameter" / 400**
→ Vérifiez le format de vos attributs (pas d'espaces, max 30 caractères)

**Export timeout**
→ Si vous avez énormément de profils, l'export peut prendre du temps. Attendez ou réessayez.

### Erreurs partielles

L'API Batch peut retourner un succès partiel (code 202) avec des erreurs sur certains profils. L'application affiche clairement:
- Quels profils ont été traités avec succès
- Quels profils ont échoué et pourquoi

## Technologies

- **HTML5** - Structure sémantique
- **CSS3** - Design Batch.com (Inter font, #0968AC)
- **JavaScript Vanilla** - Logique côté client
- **Web Crypto API** - Hash SHA-256 pour les custom IDs
- **Batch Profiles API** - Export et mise à jour

## Limites et contraintes

- **Maximum 10 000 profils** par fichier CSV (recommandé pour éviter les timeouts)
- **Export initial** peut prendre plusieurs minutes si vous avez beaucoup de profils
- **Rate limits Batch** : L'application respecte automatiquement les limites
- **Taille fichier** : Pas de limite technique mais privilégiez < 5 MB pour de meilleures performances

## 🚀 Installation et utilisation en LOCAL

### Méthode 1: Serveur HTTP avec Python (Recommandé)

```bash
git clone https://github.com/mickaelbentz/batch-profile-uploader.git
cd batch-profile-uploader

# Lancer un serveur HTTP local
python3 -m http.server 8080

# Ouvrir dans le navigateur
# http://localhost:8080
```

### Méthode 2: Node.js

```bash
# Avec npx (pas besoin d'installer)
npx http-server -p 8080

# Ou installer globalement
npm install -g http-server
http-server -p 8080
```

### Méthode 3: Fichier direct (peut avoir des limitations CORS)

```bash
open index.html  # macOS
# ou
start index.html # Windows
```

**Note**: Certains navigateurs bloquent les requêtes API depuis `file://`. Privilégiez un serveur HTTP local.

## Roadmap

Améliorations futures possibles:

- [ ] Support des fichiers Excel (.xlsx)
- [ ] Preview des 10 premières lignes avant import
- [ ] Export du rapport en CSV
- [ ] Support du mapping de colonnes personnalisé
- [ ] Mode "dry-run" pour tester sans modifier la base
- [ ] Support des événements custom en plus des attributs

## FAQ

### Puis-je utiliser cet outil en production?

Oui! L'outil utilise les API officielles de Batch et respecte toutes les limites. Assurez-vous simplement d'avoir les bons droits API.

### Que se passe-t-il si j'importe deux fois le même fichier?

Les profils seront mis à jour avec les mêmes valeurs. Si vous avez choisi "Fusionner", rien ne sera écrasé. Si vous avez choisi "Écraser", les attributs seront remplacés.

### Comment sont générés les custom_id pour les nouveaux profils?

L'application utilise un hash SHA-256 de l'email en minuscules. C'est déterministe: le même email générera toujours le même custom_id.

### Puis-je modifier le custom_id d'un profil existant?

Non, le custom_id est immuable dans Batch. L'outil détecte automatiquement les profils existants et utilise leur custom_id.

### L'outil fonctionne-t-il hors ligne?

Partiellement. L'interface fonctionne hors ligne, mais vous avez besoin d'une connexion pour communiquer avec l'API Batch (export et import).

### Mes données sont-elles sécurisées?

Oui! Tout se passe dans votre navigateur. Aucune donnée n'est envoyée à un serveur tiers. Seules les requêtes vers l'API Batch (en HTTPS) sont effectuées.

## Support

Pour toute question sur l'API Batch, consultez:
- 📚 [Documentation Batch Profiles API](https://doc.batch.com/developer/api/cep/profiles)
- 💬 Support Batch : support@batch.com

Pour les bugs ou demandes de fonctionnalités sur cet outil:
- 🐛 [Créer une issue](https://github.com/mickaelbentz/batch-profile-uploader/issues)

## Licence

MIT

## Auteur

Mickaël Bentz

---

**Note** : Cet outil n'est pas officiellement supporté par Batch. C'est un projet communautaire qui utilise les API publiques de Batch.
