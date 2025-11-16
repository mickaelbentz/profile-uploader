// Variables globales
let apiKey = '';
let projectId = '';
let existingProfiles = new Map(); // Map: email -> custom_id
let csvData = [];
let csvHeaders = [];
let currentFileName = '';
let currentImportId = '';

// Éléments DOM
const apiKeyInput = document.getElementById('api-key');
const projectIdInput = document.getElementById('project-id');
const loadProfilesBtn = document.getElementById('load-profiles-btn');
const exportLoader = document.getElementById('export-loader');
const exportStatus = document.getElementById('export-status');
const loaderMessage = document.getElementById('loader-message');
const debugLogs = document.getElementById('debug-logs');
const debugContent = document.getElementById('debug-content');

const stepUpload = document.getElementById('step-upload');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const parseBtn = document.getElementById('parse-btn');

const stepValidation = document.getElementById('step-validation');
const fieldsValidation = document.getElementById('fields-validation');
const startImportBtn = document.getElementById('start-import-btn');
const updateStrategyMerge = document.getElementById('update-strategy-merge');
const updateStrategyOverwrite = document.getElementById('update-strategy-overwrite');

const stepReport = document.getElementById('step-report');
const reportCards = document.getElementById('report-cards');
const reportDetails = document.getElementById('report-details');
const resetBtn = document.getElementById('reset-btn');
const exportImportedBtn = document.getElementById('export-imported-btn');
const exportInfo = document.getElementById('export-info');
const exportProfilesLoader = document.getElementById('export-profiles-loader');
const exportProfilesMessage = document.getElementById('export-profiles-message');
const exportDebugLogs = document.getElementById('export-debug-logs');
const exportDebugContent = document.getElementById('export-debug-content');

// Fonction pour afficher les logs de debug
function showDebugLog(logData) {
    console.log('=== AFFICHAGE DU DEBUG LOG ===');
    console.log('debugLogs element:', debugLogs);
    console.log('debugContent element:', debugContent);
    console.log('logData:', logData);

    if (debugLogs && debugContent) {
        debugLogs.classList.remove('hidden');
        debugContent.textContent = JSON.stringify(logData, null, 2);
        console.log('Debug log affiché avec succès');
    } else {
        console.error('Éléments de debug manquants!');
        alert('DEBUG: ' + JSON.stringify(logData, null, 2));
    }
}

// === ÉTAPE 1: CHARGER LES PROFILS EXISTANTS ===

loadProfilesBtn.addEventListener('click', async () => {
    apiKey = apiKeyInput.value.trim();
    projectId = projectIdInput.value.trim();

    if (!apiKey || !projectId) {
        showStatus('error', 'Veuillez remplir l\'API Key et le Project ID');
        return;
    }

    // Cacher le debug précédent
    debugLogs.classList.add('hidden');

    try {
        exportLoader.classList.remove('hidden');
        exportStatus.classList.add('hidden');
        loaderMessage.textContent = 'Demande d\'export en cours...';

        // Lancer l'export
        const exportId = await requestProfilesExport();

        loaderMessage.textContent = `Export lancé (ID: ${exportId}). En attente...`;

        // Polling pour vérifier le statut
        const exportData = await pollExportStatus(exportId);

        loaderMessage.textContent = 'Téléchargement et traitement des données...';

        // Télécharger et parser les données
        await downloadAndProcessExport(exportData);

        exportLoader.classList.add('hidden');
        debugLogs.classList.add('hidden'); // Masquer le debug en cas de succès
        showStatus('success', `✓ ${existingProfiles.size} profils chargés avec succès!`);

        // Activer l'étape 2
        stepUpload.classList.remove('disabled');

    } catch (error) {
        exportLoader.classList.add('hidden');
        console.error('Détails de l\'erreur:', error);
        showStatus('error', `Erreur: ${error.message}`);

        // Afficher les détails complets visibles dans l'interface
        showDebugLog({
            errorMessage: error.message,
            errorStack: error.stack,
            apiKeyPresent: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0,
            apiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : 'vide',
            apiKeyFormat: apiKey ? (apiKey.startsWith('rest_') ? 'REST API Key (correct)' : 'Format inattendu - doit commencer par "rest_"') : 'vide',
            projectId: projectId,
            projectIdFormat: projectId ? (projectId.startsWith('project_') ? 'Correct' : 'Format inattendu - doit commencer par "project_"') : 'vide',
            timestamp: new Date().toISOString(),
            requestDetails: {
                url: 'https://api.batch.com/2.8/profiles/export',
                method: 'POST',
                headers: {
                    'Authorization': apiKey ? `Bearer ${apiKey.substring(0, 15)}...` : 'vide',
                    'X-Batch-Project': projectId
                }
            }
        });
    }
});

async function requestProfilesExport() {
    const response = await fetch('https://api.batch.com/2.8/profiles/export', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Batch-Project': projectId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            export_type: 'ATTRIBUTES',
            attributes: ['$email_address'],
            identifiers: ['custom_id']
        })
    });

    if (!response.ok) {
        let errorDetails = `HTTP ${response.status} ${response.statusText}`;
        let errorBody = null;

        try {
            errorBody = await response.json();
            errorDetails += ` - ${JSON.stringify(errorBody)}`;
        } catch (e) {
            // La réponse n'est pas du JSON valide
            errorDetails += ' - Impossible de parser la réponse';
        }

        throw new Error(errorBody?.message || errorDetails);
    }

    const data = await response.json();
    return data.id;
}

async function pollExportStatus(exportId, maxAttempts = 360) {
    for (let i = 0; i < maxAttempts; i++) {
        await sleep(5000); // Attendre 5 secondes entre chaque vérification

        const response = await fetch(`https://api.batch.com/2.8/exports/view?id=${exportId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Batch-Project': projectId
            }
        });

        if (!response.ok) {
            let errorDetails = `HTTP ${response.status}`;
            try {
                const errorBody = await response.json();
                errorDetails += ` - ${JSON.stringify(errorBody)}`;
            } catch (e) {
                errorDetails += ` - ${response.statusText}`;
            }
            throw new Error(`Erreur lors de la vérification du statut d'export: ${errorDetails}`);
        }

        const data = await response.json();

        console.log(`[Polling tentative ${i + 1}] Statut reçu:`, data.status, 'Données complètes:', data);

        if (data.status === 'done' || data.status === 'SUCCESS') {
            return data;
        } else if (data.status === 'failed' || data.status === 'ERROR') {
            throw new Error(`L'export a échoué: ${JSON.stringify(data)}`);
        }

        // Calcul du temps écoulé
        const elapsedMinutes = Math.floor((i + 1) * 5 / 60);
        const elapsedSeconds = ((i + 1) * 5) % 60;
        const timeString = elapsedMinutes > 0
            ? `${elapsedMinutes} min ${elapsedSeconds} sec`
            : `${elapsedSeconds} sec`;

        loaderMessage.textContent = `Export en cours... Temps écoulé: ${timeString} (sur grosses bases, cela peut prendre jusqu'à 30 min)`;
    }

    throw new Error('Timeout: l\'export a pris plus de 30 minutes. Votre base est peut-être trop volumineuse.');
}

async function downloadAndProcessExport(exportData) {
    console.log('Export data reçue:', exportData);

    // L'export peut contenir plusieurs fichiers
    if (!exportData.files || exportData.files.length === 0) {
        throw new Error('Aucun fichier d\'export disponible');
    }

    console.log(`Traitement de ${exportData.files.length} fichier(s) d'export`);

    for (const file of exportData.files) {
        const response = await fetch(file.url);
        const text = await response.text();

        // Parser le JSON line by line (NDJSON)
        const lines = text.trim().split('\n');

        for (const line of lines) {
            try {
                const profile = JSON.parse(line);

                // Extraire email et custom_id
                const email = profile.attributes?.$email_address;
                const customId = profile.identifiers?.custom_id;

                if (email && customId) {
                    existingProfiles.set(email.toLowerCase(), customId);
                }
            } catch (e) {
                // Ignorer les lignes invalides
                console.warn('Ligne JSON invalide:', line);
            }
        }
    }

    console.log(`✓ ${existingProfiles.size} profils chargés dans la Map`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showStatus(type, message) {
    exportStatus.className = `status-message ${type}`;
    exportStatus.textContent = message;
    exportStatus.classList.remove('hidden');
}

// === ÉTAPE 2: UPLOAD ET PARSING CSV ===

browseBtn.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0968AC';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#E7F1FC';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#E7F1FC';

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        handleFileSelect(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
    // Reset pour permettre de sélectionner le même fichier à nouveau
    e.target.value = '';
});

function handleFileSelect(file) {
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;

    uploadArea.classList.add('hidden');
    fileInfo.classList.remove('hidden');

    // Stocker le fichier pour parsing
    window.selectedFile = file;

    // Stocker le nom du fichier et générer l'import_id
    currentFileName = file.name;
    // Retirer l'extension .csv et remplacer caractères non valides
    const cleanFileName = file.name.replace(/\.csv$/i, '').replace(/[^a-z0-9_]/gi, '_');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    currentImportId = `${cleanFileName}_${dateStr}`;

    console.log('Import ID généré:', currentImportId);
}

function resetFileUpload() {
    fileInfo.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    fileInput.value = '';
    window.selectedFile = null;
}

parseBtn.addEventListener('click', () => {
    if (!window.selectedFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const text = e.target.result;
        parseCSV(text);
    };

    reader.readAsText(window.selectedFile);
});

function parseCSV(text) {
    const lines = text.trim().split('\n');

    if (lines.length < 2) {
        alert('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
        resetFileUpload();
        return;
    }

    // Parser les en-têtes
    csvHeaders = parseCSVLine(lines[0]);

    // Vérifier que l'email est présent
    const emailIndex = csvHeaders.findIndex(h =>
        h.toLowerCase() === 'email' ||
        h.toLowerCase() === '$email_address' ||
        h.toLowerCase() === 'e-mail'
    );

    if (emailIndex === -1) {
        alert('Le fichier CSV doit contenir une colonne "email" ou "$email_address"');
        resetFileUpload();
        return;
    }

    // Parser les données
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === csvHeaders.length) {
            const row = {};
            csvHeaders.forEach((header, index) => {
                row[header] = values[index];
            });
            csvData.push(row);
        }
    }

    // Afficher la validation
    stepValidation.classList.remove('disabled');
    displayFieldsValidation();
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// === ÉTAPE 3: VALIDATION DES CHAMPS ===

function displayFieldsValidation() {
    const nativeAttributes = [
        '$email_address', '$email_marketing', '$phone_number',
        '$sms_marketing', '$language', '$region', '$timezone'
    ];

    let html = '<h3 style="margin-bottom: 16px; color: #0968AC;">Champs détectés dans le CSV:</h3>';

    csvHeaders.forEach(header => {
        const headerLower = header.toLowerCase();
        let status = 'warning';
        let statusText = 'Attribut custom';

        if (headerLower === 'email' || headerLower === '$email_address' || headerLower === 'e-mail') {
            status = 'email';
            statusText = 'Email (identifiant)';
        } else if (nativeAttributes.some(attr => attr.toLowerCase() === headerLower)) {
            status = 'valid';
            statusText = 'Attribut natif Batch';
        } else if (/^[a-zA-Z0-9_]{1,30}$/.test(header)) {
            status = 'valid';
            statusText = 'Format valide';
        } else {
            status = 'warning';
            statusText = 'Format non valide - à vérifier';
        }

        html += `
            <div class="field-item">
                <span class="field-name">${header}</span>
                <span class="field-status ${status}">${statusText}</span>
            </div>
        `;
    });

    html += `<p style="margin-top: 16px; color: #444649; font-size: 14px;">
        <strong>${csvData.length}</strong> lignes détectées dans le fichier.
    </p>`;

    fieldsValidation.innerHTML = html;
}

// Gestion des checkboxes (exclusives)
updateStrategyMerge.addEventListener('change', () => {
    if (updateStrategyMerge.checked) {
        updateStrategyOverwrite.checked = false;
    }
});

updateStrategyOverwrite.addEventListener('change', () => {
    if (updateStrategyOverwrite.checked) {
        updateStrategyMerge.checked = false;
    }
});

// === ÉTAPE 4: IMPORTATION ===

startImportBtn.addEventListener('click', async () => {
    if (!updateStrategyMerge.checked && !updateStrategyOverwrite.checked) {
        alert('Veuillez choisir une stratégie de mise à jour');
        return;
    }

    const overwrite = updateStrategyOverwrite.checked;

    startImportBtn.disabled = true;
    startImportBtn.textContent = 'Importation en cours...';

    await performImport(overwrite);

    startImportBtn.disabled = false;
    startImportBtn.textContent = 'Lancer l\'importation';

    stepReport.classList.remove('disabled');
});

async function performImport(overwrite) {
    const results = {
        success: 0,
        errors: 0,
        details: []
    };

    // Préparer les batches de 200 profils max
    const batchSize = 200;
    const batches = [];

    for (let i = 0; i < csvData.length; i += batchSize) {
        batches.push(csvData.slice(i, i + batchSize));
    }

    // Traiter chaque batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const profiles = [];

        for (const row of batch) {
            const profile = await prepareProfile(row, overwrite);
            if (profile) {
                profiles.push(profile);
            }
        }

        if (profiles.length > 0) {
            try {
                const response = await sendBatchUpdate(profiles);

                // Analyser la réponse
                profiles.forEach((profile, index) => {
                    const email = profile.email; // On a stocké l'email temporairement
                    results.success++;
                    results.details.push({
                        email,
                        status: 'success',
                        message: 'Traité avec succès'
                    });
                });

                // Gérer les erreurs partielles
                if (response.errors) {
                    response.errors.forEach(error => {
                        results.errors++;
                        const email = profiles[error.bulk_index]?.email || 'inconnu';
                        results.details.push({
                            email,
                            status: 'error',
                            message: error.reason
                        });
                    });
                }

            } catch (error) {
                profiles.forEach(profile => {
                    results.errors++;
                    results.details.push({
                        email: profile.email,
                        status: 'error',
                        message: error.message
                    });
                });
            }
        }

        // Pause entre les batches pour respecter le rate limit
        if (batchIndex < batches.length - 1) {
            await sleep(1000);
        }
    }

    displayResults(results);
}

async function prepareProfile(row, overwrite) {
    // Trouver l'email
    const emailHeader = csvHeaders.find(h =>
        h.toLowerCase() === 'email' ||
        h.toLowerCase() === '$email_address' ||
        h.toLowerCase() === 'e-mail'
    );

    if (!emailHeader) return null;

    const email = row[emailHeader]?.trim();
    if (!email) return null;

    // Déterminer le custom_id
    let customId;
    const emailLower = email.toLowerCase();

    if (existingProfiles.has(emailLower)) {
        // Profil existant
        customId = existingProfiles.get(emailLower);
    } else {
        // Nouveau profil: hash de l'email
        customId = await hashEmail(email);
    }

    // Construire les attributs
    const attributes = {
        $email_address: email
    };

    csvHeaders.forEach(header => {
        if (header !== emailHeader && row[header]) {
            // Déterminer le type d'attribut
            const value = row[header].trim();

            // Si c'est un nombre
            if (!isNaN(value) && value !== '') {
                attributes[header] = parseFloat(value);
            } else {
                attributes[header] = value;
            }
        }
    });

    // Ajouter l'import_id pour pouvoir exporter ces profils plus tard
    attributes.import_id = currentImportId;

    return {
        email, // Pour le rapport
        identifiers: {
            custom_id: customId
        },
        attributes: overwrite ? attributes : { ...attributes } // Merge géré par l'API
    };
}

async function hashEmail(email) {
    const msgBuffer = new TextEncoder().encode(email.toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function sendBatchUpdate(profiles) {
    // Enlever la propriété email temporaire avant d'envoyer
    const cleanProfiles = profiles.map(({ email, ...profile }) => profile);

    const response = await fetch('https://api.batch.com/2.8/profiles/update', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Batch-Project': projectId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanProfiles)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'envoi du batch');
    }

    return await response.json();
}

function displayResults(results) {
    // Cartes de résumé
    reportCards.innerHTML = `
        <div class="report-card success">
            <div class="report-card-value">${results.success}</div>
            <div class="report-card-label">Profils traités avec succès</div>
        </div>
        <div class="report-card error">
            <div class="report-card-value">${results.errors}</div>
            <div class="report-card-label">Erreurs</div>
        </div>
        <div class="report-card">
            <div class="report-card-value">${results.success + results.errors}</div>
            <div class="report-card-label">Total</div>
        </div>
    `;

    // Détails
    let detailsHTML = '<h3 style="margin-bottom: 16px; color: #0968AC;">Détails de l\'importation:</h3>';

    results.details.forEach(detail => {
        detailsHTML += `
            <div class="report-item ${detail.status}">
                <div class="report-item-email">${detail.email}</div>
                <div class="report-item-message">${detail.message}</div>
            </div>
        `;
    });

    reportDetails.innerHTML = detailsHTML;

    // Afficher l'importID pour l'export
    exportInfo.textContent = `ImportID: ${currentImportId}`;
}

// Reset
resetBtn.addEventListener('click', () => {
    location.reload();
});

// === EXPORT DES PROFILS IMPORTÉS ===

exportImportedBtn.addEventListener('click', async () => {
    if (!currentImportId) {
        alert('Aucun import en cours');
        return;
    }

    exportImportedBtn.disabled = true;
    exportProfilesLoader.classList.remove('hidden');
    exportDebugLogs.classList.add('hidden');
    exportDebugContent.textContent = '';
    exportProfilesMessage.textContent = 'Demande d\'export en cours...';

    try {
        // Étape 1: Créer un export complet
        exportProfilesMessage.textContent = 'Création de l\'export...';
        const exportId = await requestProfilesExport();

        exportProfilesMessage.textContent = 'Export en cours, polling du statut...';
        const exportData = await pollExportStatus(exportId);

        exportProfilesMessage.textContent = 'Téléchargement et filtrage des données...';
        const result = await downloadAndFilterExport(exportData, currentImportId);

        // Afficher les logs de debug
        exportDebugLogs.classList.remove('hidden');
        exportDebugContent.textContent = result.logs.join('\n');

        exportProfilesMessage.textContent = 'Conversion en CSV...';
        const csvContent = convertToCSV(result.profiles);

        // Télécharger le fichier CSV
        downloadCSV(csvContent, `export_${currentImportId}.csv`);

        exportProfilesLoader.classList.add('hidden');
        exportInfo.textContent = `✓ ${result.profiles.length} profils exportés ! ImportID: ${currentImportId}`;

    } catch (error) {
        exportProfilesLoader.classList.add('hidden');
        exportInfo.textContent = `❌ Erreur lors de l'export: ${error.message}`;
        console.error('Erreur export:', error);
    } finally {
        exportImportedBtn.disabled = false;
    }
});

async function downloadAndFilterExport(exportData, targetImportId) {
    if (!exportData.files || exportData.files.length === 0) {
        throw new Error('Aucun fichier d\'export disponible');
    }

    const filteredProfiles = [];
    const logs = [];
    let totalProfiles = 0;
    let profilesWithImportId = 0;

    logs.push(`🔍 Recherche de profils avec import_id = "${targetImportId}"`);
    logs.push('');

    for (const file of exportData.files) {
        const response = await fetch(file.url);
        const text = await response.text();

        // Parser le NDJSON ligne par ligne
        const lines = text.trim().split('\n');

        for (const line of lines) {
            try {
                const profile = JSON.parse(line);
                totalProfiles++;

                // Log pour debug : afficher l'import_id de chaque profil
                if (profile.attributes?.import_id) {
                    profilesWithImportId++;
                    const email = profile.attributes?.$email_address || 'no email';
                    logs.push(`  Profil #${totalProfiles} (${email}): import_id = "${profile.attributes.import_id}"`);

                    // Filtrer sur l'import_id
                    if (profile.attributes.import_id === targetImportId) {
                        logs.push(`    ✓ MATCH TROUVÉ !`);
                        filteredProfiles.push(profile);
                    }
                }
            } catch (e) {
                logs.push(`  ⚠️ Ligne JSON invalide`);
            }
        }
    }

    logs.push('');
    logs.push(`📊 Total profils exportés: ${totalProfiles}`);
    logs.push(`📊 Profils avec import_id: ${profilesWithImportId}`);
    logs.push(`✅ ${filteredProfiles.length} profils filtrés avec import_id = "${targetImportId}"`);

    console.log(logs.join('\n'));

    return {
        profiles: filteredProfiles,
        logs: logs
    };
}

function convertToCSV(profiles) {
    if (profiles.length === 0) {
        return 'Aucun profil trouvé avec cet importID';
    }

    // Collecter tous les attributs possibles
    const allAttributes = new Set();
    profiles.forEach(profile => {
        if (profile.attributes) {
            Object.keys(profile.attributes).forEach(key => allAttributes.add(key));
        }
    });

    // Créer l'en-tête CSV : custom_id + tous les attributs
    const headers = ['custom_id', ...Array.from(allAttributes).sort()];
    let csv = headers.join(',') + '\n';

    // Ajouter chaque profil
    profiles.forEach(profile => {
        const row = [];

        // custom_id
        row.push(profile.identifiers?.custom_id || '');

        // Attributs
        Array.from(allAttributes).sort().forEach(attr => {
            const value = profile.attributes?.[attr];
            // Échapper les valeurs contenant des virgules ou guillemets
            if (value !== undefined && value !== null) {
                const strValue = String(value);
                if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                    row.push(`"${strValue.replace(/"/g, '""')}"`);
                } else {
                    row.push(strValue);
                }
            } else {
                row.push('');
            }
        });

        csv += row.join(',') + '\n';
    });

    return csv;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✓ Fichier CSV téléchargé: ${filename}`);
}
