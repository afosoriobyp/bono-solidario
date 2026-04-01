#!/usr/bin/env bash
# build.sh - Script de inicialización para Render

set -o errexit  # Detiene el script si hay errores

echo "🔧 Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build completado exitosamente"
