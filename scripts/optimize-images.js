#!/usr/bin/env node

/**
 * BitForward Image Optimization Script
 * Optimiza SVG, PNG, JPEG para reducir tamaño sin perder calidad
 * 
 * @version 1.0.0
 * @date 2024-10-19
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios
const ASSETS_DIR = path.join(__dirname, '../assets');
const OUTPUT_DIR = path.join(__dirname, '../dist/assets');

// Estadísticas
const stats = {
    processed: 0,
    errors: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    files: []
};

/**
 * Crear directorio si no existe
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Formatear bytes a legible
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Optimizar SVG
 * Limpia atributos innecesarios, redondea números, minifica
 */
function optimizeSVG(content) {
    try {
        // Remover comentarios XML
        content = content.replace(/<!--[\s\S]*?-->/g, '');
        
        // Remover metadata innecesaria
        content = content.replace(/<metadata>[\s\S]*?<\/metadata>/gi, '');
        content = content.replace(/<title>[\s\S]*?<\/title>/gi, '');
        content = content.replace(/<desc>[\s\S]*?<\/desc>/gi, '');
        
        // Remover atributos de editor
        content = content.replace(/\s*(inkscape|sodipodi|adobe|sketch):[^=]*="[^"]*"/gi, '');
        
        // Redondear números a 2 decimales
        content = content.replace(/(\d+\.\d{3,})/g, (match) => {
            return parseFloat(match).toFixed(2);
        });
        
        // Minificar (remover espacios extra)
        content = content.replace(/>\s+</g, '><');
        content = content.replace(/\s{2,}/g, ' ');
        
        // Remover espacios antes de cierre de tags
        content = content.replace(/\s+>/g, '>');
        
        return content.trim();
        
    } catch (error) {
        console.error('Error optimizando SVG:', error.message);
        return content;
    }
}

/**
 * Procesar un archivo SVG
 */
async function processSVG(filePath) {
    try {
        const fileName = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(content, 'utf-8');
        
        // Optimizar
        const optimized = optimizeSVG(content);
        const optimizedSize = Buffer.byteLength(optimized, 'utf-8');
        
        // Guardar
        const outputPath = path.join(OUTPUT_DIR, fileName);
        fs.writeFileSync(outputPath, optimized, 'utf-8');
        
        // Estadísticas
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        stats.files.push({
            file: fileName,
            originalSize: formatBytes(originalSize),
            optimizedSize: formatBytes(optimizedSize),
            reduction: `${reduction}%`,
            savings: formatBytes(originalSize - optimizedSize)
        });
        
        stats.totalOriginalSize += originalSize;
        stats.totalOptimizedSize += optimizedSize;
        stats.processed++;
        
        console.log(`✅ ${fileName}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${reduction}% reducción)`);
        
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        stats.errors++;
    }
}

/**
 * Escanear y procesar todos los archivos
 */
async function processAllImages() {
    console.log('🖼️  Iniciando optimización de imágenes...\n');
    
    // Crear directorio de salida
    ensureDir(OUTPUT_DIR);
    
    // Verificar si existe el directorio de assets
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error('❌ Directorio assets/ no encontrado');
        process.exit(1);
    }
    
    // Leer archivos
    const files = fs.readdirSync(ASSETS_DIR);
    
    // Filtrar SVG
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    
    if (svgFiles.length === 0) {
        console.log('⚠️  No se encontraron archivos SVG para optimizar');
        return;
    }
    
    console.log(`📦 Encontrados ${svgFiles.length} archivos SVG\n`);
    
    // Procesar cada archivo
    for (const file of svgFiles) {
        const filePath = path.join(ASSETS_DIR, file);
        await processSVG(filePath);
    }
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE OPTIMIZACIÓN');
    console.log('='.repeat(60));
    console.log(`Archivos procesados: ${stats.processed}`);
    console.log(`Errores: ${stats.errors}`);
    console.log(`Tamaño original: ${formatBytes(stats.totalOriginalSize)}`);
    console.log(`Tamaño optimizado: ${formatBytes(stats.totalOptimizedSize)}`);
    
    const totalReduction = ((stats.totalOriginalSize - stats.totalOptimizedSize) / stats.totalOriginalSize * 100).toFixed(2);
    const totalSavings = stats.totalOriginalSize - stats.totalOptimizedSize;
    
    console.log(`Reducción total: ${totalReduction}%`);
    console.log(`Ahorro total: ${formatBytes(totalSavings)}`);
    console.log('='.repeat(60));
    
    // Guardar reporte JSON
    const reportPath = path.join(OUTPUT_DIR, 'optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            processed: stats.processed,
            errors: stats.errors,
            originalSize: formatBytes(stats.totalOriginalSize),
            optimizedSize: formatBytes(stats.totalOptimizedSize),
            reduction: `${totalReduction}%`,
            savings: formatBytes(totalSavings)
        },
        files: stats.files
    }, null, 2));
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

// Ejecutar
processAllImages().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
