#!/bin/bash

echo "======================================"
echo "  Batch Profile Uploader - Démarrage"
echo "======================================"
echo ""

# Vérifier si Python 3 est installé
if command -v python3 &> /dev/null; then
    echo "✓ Python 3 détecté"
    echo ""
    echo "Démarrage du serveur local..."
    echo "L'application sera accessible sur : http://localhost:8080"
    echo ""
    echo "⚠️  IMPORTANT : Cette application doit rester en local uniquement !"
    echo "    Ne jamais partager vos clés API Batch."
    echo ""
    echo "Pour arrêter le serveur : Appuyez sur Ctrl+C"
    echo ""
    echo "======================================"
    echo ""

    # Ouvrir le navigateur après 2 secondes
    (sleep 2 && open http://localhost:8080) &

    # Lancer le serveur
    python3 -m http.server 8080

elif command -v python &> /dev/null; then
    echo "✓ Python détecté"
    echo ""
    echo "Démarrage du serveur local..."
    echo "L'application sera accessible sur : http://localhost:8080"
    echo ""
    echo "⚠️  IMPORTANT : Cette application doit rester en local uniquement !"
    echo "    Ne jamais partager vos clés API Batch."
    echo ""
    echo "Pour arrêter le serveur : Appuyez sur Ctrl+C"
    echo ""
    echo "======================================"
    echo ""

    # Ouvrir le navigateur après 2 secondes
    (sleep 2 && open http://localhost:8080) &

    # Lancer le serveur
    python -m http.server 8080

else
    echo "❌ Python n'est pas installé sur votre système."
    echo ""
    echo "Veuillez installer Python 3 depuis : https://www.python.org/downloads/"
    echo "Ou utilisez le script start.bat si vous êtes sur Windows."
    echo ""
    read -p "Appuyez sur Entrée pour fermer..."
    exit 1
fi
