#!/bin/bash

# 🏛️ Script de Inicio del Búnker de Datos BitForward
# Inicia automáticamente el servidor con verificaciones de seguridad

echo "🏛️  INICIANDO BÚNKER DE DATOS PERSISTENTE"
echo "========================================"
echo ""

# Verificar Node.js
echo "🔍 Verificando prerrequisitos..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "💡 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible"
    exit 1
fi

echo "✅ npm $(npm --version) detectado"
echo ""

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del búnker..."
    npm install
    echo ""
fi

# Verificar/crear base de datos
if [ ! -f "server/database/bitforward.sqlite3" ]; then
    echo "🏗️  Construyendo el búnker de datos..."
    npm run db:setup
    echo ""
fi

# Verificar integridad del búnker
echo "🔍 Verificando integridad del búnker..."
npm run db:verify
echo ""

# Iniciar servidor
echo "🚀 Iniciando servidor BitForward..."
echo "📍 URL: http://localhost:3000"
echo "💡 Presiona Ctrl+C para detener el servidor"
echo ""

npm run server:dev
