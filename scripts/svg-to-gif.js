#!/usr/bin/env node

/**
 * Script para crear una página HTML que muestre el logo animado
 * y proporcionar instrucciones para convertirlo a GIF
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.join(__dirname, '../assets/logo-rocket-animated.svg');
const OUTPUT_HTML = path.join(__dirname, '../logo-preview.html');

console.log('🚀 Creando vista previa del logo animado...');

// Leer el SVG
const svgContent = fs.readFileSync(SVG_PATH, 'utf-8');

// Crear página HTML para visualizar
const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BitForward - Logo Animado</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .container {
            text-align: center;
            max-width: 800px;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3B82F6, #06B6D4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .logo-wrapper {
            margin: 3rem 0;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .logo-display {
            width: 400px;
            height: 400px;
            margin: 0 auto;
        }
        
        .size-variants {
            display: flex;
            gap: 2rem;
            justify-content: center;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
        
        .size-variant {
            text-align: center;
        }
        
        .size-variant svg {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 1rem;
        }
        
        .size-label {
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #94A3B8;
        }
        
        .info-box {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 10px;
            padding: 1.5rem;
            margin-top: 2rem;
            text-align: left;
        }
        
        .info-box h2 {
            color: #3B82F6;
            margin-bottom: 1rem;
            font-size: 1.3rem;
        }
        
        .info-box p {
            line-height: 1.6;
            color: #CBD5E1;
            margin-bottom: 0.5rem;
        }
        
        .info-box code {
            background: rgba(0, 0, 0, 0.3);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
            color: #06B6D4;
        }
        
        .btn {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.8rem 1.5rem;
            background: linear-gradient(135deg, #3B82F6, #06B6D4);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 BitForward - Logo Animado</h1>
        
        <div class="logo-wrapper">
            <div class="logo-display">
                ${svgContent}
            </div>
        </div>
        
        <div class="size-variants">
            <div class="size-variant">
                <div style="width: 200px; height: 200px;">
                    ${svgContent}
                </div>
                <div class="size-label">200x200px</div>
            </div>
            <div class="size-variant">
                <div style="width: 100px; height: 100px;">
                    ${svgContent}
                </div>
                <div class="size-label">100x100px</div>
            </div>
            <div class="size-variant">
                <div style="width: 50px; height: 50px;">
                    ${svgContent}
                </div>
                <div class="size-label">50x50px</div>
            </div>
        </div>
        
        <div class="info-box">
            <h2>📝 Información del Logo</h2>
            <p><strong>Formato:</strong> SVG Animado (Scalable Vector Graphics)</p>
            <p><strong>Ubicación:</strong> <code>assets/logo-rocket-animated.svg</code></p>
            <p><strong>Características:</strong></p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li>🎨 Cohete espacial con animaciones de fuego y estrellas</li>
                <li>✨ Efectos de brillo y movimiento</li>
                <li>🔄 Animación en loop infinito</li>
                <li>📱 Responsive y escalable</li>
            </ul>
        </div>
        
        <div class="info-box">
            <h2>💾 Convertir a GIF</h2>
            <p>Para convertir este logo SVG animado a formato GIF, puedes usar:</p>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li><strong>Método 1:</strong> Herramientas online como <a href="https://svgtogif.com" target="_blank" style="color: #06B6D4;">svgtogif.com</a></li>
                <li><strong>Método 2:</strong> Grabar la pantalla y convertir el video a GIF</li>
                <li><strong>Método 3:</strong> Usar <code>ffmpeg</code> para capturar frames</li>
            </ul>
            <a href="https://svgtogif.com" target="_blank" class="btn">🔗 Ir a SVG to GIF Converter</a>
        </div>
    </div>
    
    <script>
        console.log('🚀 BitForward Logo Preview loaded');
    </script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, htmlContent);

console.log(`✅ Vista previa creada en: ${OUTPUT_HTML}`);
console.log('\n� Para ver el logo:');
console.log('   1. Abre el archivo en tu navegador');
console.log(`   2. O ejecuta: open ${OUTPUT_HTML}`);
console.log('\n💾 Para crear el GIF:');
console.log('   - Visita: https://svgtogif.com');
console.log('   - O usa screenshot + herramientas de grabación de pantalla');
