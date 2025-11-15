@echo off
chcp 65001 >nul
cls

echo ======================================
echo   Batch Profile Uploader - Démarrage
echo ======================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Python détecté
    echo.
    echo Démarrage du serveur local...
    echo L'application sera accessible sur : http://localhost:8080
    echo.
    echo ⚠️  IMPORTANT : Cette application doit rester en local uniquement !
    echo     Ne jamais partager vos clés API Batch.
    echo.
    echo Pour arrêter le serveur : Appuyez sur Ctrl+C
    echo.
    echo ======================================
    echo.

    REM Ouvrir le navigateur après 3 secondes
    timeout /t 3 /nobreak >nul
    start http://localhost:8080

    REM Lancer le serveur
    python -m http.server 8080
) else (
    echo ❌ Python n'est pas installé sur votre système.
    echo.
    echo Veuillez installer Python depuis : https://www.python.org/downloads/
    echo.
    echo Lors de l'installation, cochez bien "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
