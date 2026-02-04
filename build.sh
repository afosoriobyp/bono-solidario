#!/usr/bin/env bash
# build.sh - Script de inicialización para Render

set -o errexit  # Detiene el script si hay errores

echo "🔧 Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️  Ejecutando migraciones de base de datos..."
flask db upgrade heads

echo "👤 Creando usuario admin si no existe..."
python create_admin_user.py

echo "✅ Build completado exitosamente"
