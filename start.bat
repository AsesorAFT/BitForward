@echo off
echo 🚀 Iniciando BitForward Enterprise Platform v2.0
echo ==============================================

:: Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org
    pause
    exit /b 1
)

:: Verificar que npm esté instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no está instalado. Por favor instálalo junto con Node.js
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo ✅ npm encontrado

:: Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias del proyecto...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencias ya instaladas
)

echo.
echo 🔧 Configuración del servidor:
echo    • Puerto API: 3000
echo    • Frontend: http://localhost:3000
echo    • Autenticación: BiT-ID Portal
echo    • Base de datos: Simulada en memoria
echo.

:: Iniciar el servidor
echo 🚀 Iniciando servidor BitForward...
echo    Presiona Ctrl+C para detener el servidor
echo.

node server/server.js

pause
