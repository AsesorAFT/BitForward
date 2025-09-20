#!/bin/bash

echo "🚀 Iniciando BitForward Enterprise Platform v2.0"
echo "=============================================="

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instálalo junto con Node.js"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo "✅ npm encontrado: $(npm --version)"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del proyecto..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
else
    echo "✅ Dependencias ya instaladas"
fi

echo ""
echo "🔧 Configuración del servidor:"
echo "   • Puerto API: 3000"
echo "   • Frontend: http://localhost:3000"
echo "   • Autenticación: BiT-ID Portal"
echo "   • Base de datos: Simulada en memoria"
echo ""

# Iniciar el servidor
echo "🚀 Iniciando servidor BitForward..."
echo "   Presiona Ctrl+C para detener el servidor"
echo ""

node server/server.js
