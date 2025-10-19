#!/usr/bin/env node

/**
 * BitForward JavaScript Minification Script
 * Minifica todos los archivos JS del proyecto usando Terser
 * 
 * @version 1.0.0
 * @date 2024-10-19
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import { gzipSizeSync } from 'gzip-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JS_DIR = path.join(__dirname, '../js');
const DIST_DIR = path.join(__dirname, '../dist/js');

// Crear directorio dist si no existe
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('⚡ Minificando archivos JavaScript...\n');

// Leer todos los archivos JS
const jsFiles = fs.readdirSync(JS_DIR).filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));

const stats = {
    totalOriginal: 0,
    totalMinified: 0,
    totalGzipped: 0,
    files: []
};

async function minifyFile(file) {
    const inputPath = path.join(JS_DIR, file);
    const outputPath = path.join(DIST_DIR, file.replace('.js', '.min.js'));
    
    try {
        // Leer archivo original
        const source = fs.readFileSync(inputPath, 'utf8');
        const originalSize = Buffer.byteLength(source, 'utf8');
        
        // Minificar
        const result = await minify(source, {
            compress: {
                dead_code: true,
                drop_console: false, // Mantener console para debug
                drop_debugger: true,
                keep_classnames: true,
                keep_fnames: true
            },
            mangle: {
                keep_classnames: true,
                keep_fnames: true
            },
            format: {
                comments: false
            }
        });
        
        if (result.error) {
            throw result.error;
        }
        
        const minified = result.code;
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const gzippedSize = gzipSizeSync(minified);
        
        // Guardar archivo minificado
        fs.writeFileSync(outputPath, minified, 'utf8');
        
        // Estadísticas
        const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
        const gzipReduction = ((1 - gzippedSize / originalSize) * 100).toFixed(2);
        
        stats.totalOriginal += originalSize;
        stats.totalMinified += minifiedSize;
        stats.totalGzipped += gzippedSize;
        
        stats.files.push({
            name: file,
            originalSize,
            minifiedSize,
            gzippedSize,
            reduction,
            gzipReduction
        });
        
        console.log(`✅ ${file}`);
        console.log(`   Original:  ${formatBytes(originalSize)}`);
        console.log(`   Minified:  ${formatBytes(minifiedSize)} (-${reduction}%)`);
        console.log(`   Gzipped:   ${formatBytes(gzippedSize)} (-${gzipReduction}%)`);
        console.log('');
        
    } catch (error) {
        console.error(`❌ Error minificando ${file}:`);
        console.error(`   ${error.message}`);
        console.log('');
    }
}

async function minifyAll() {
    for (const file of jsFiles) {
        await minifyFile(file);
    }
    
    // Resumen final
    console.log('📊 Resumen de Minificación JavaScript:\n');
    console.log(`Archivos procesados: ${jsFiles.length}`);
    console.log(`Tamaño original:     ${formatBytes(stats.totalOriginal)}`);
    console.log(`Tamaño minificado:   ${formatBytes(stats.totalMinified)}`);
    console.log(`Tamaño gzipped:      ${formatBytes(stats.totalGzipped)}`);
    
    const totalReduction = ((1 - stats.totalMinified / stats.totalOriginal) * 100).toFixed(2);
    const totalGzipReduction = ((1 - stats.totalGzipped / stats.totalOriginal) * 100).toFixed(2);
    
    console.log(`\nReducción total:     ${totalReduction}%`);
    console.log(`Reducción gzip:      ${totalGzipReduction}%`);
    console.log(`Ahorro:              ${formatBytes(stats.totalOriginal - stats.totalMinified)}`);
    
    // Crear archivo de reporte
    const report = {
        timestamp: new Date().toISOString(),
        totalFiles: jsFiles.length,
        stats,
        summary: {
            originalSize: stats.totalOriginal,
            minifiedSize: stats.totalMinified,
            gzippedSize: stats.totalGzipped,
            reduction: totalReduction + '%',
            gzipReduction: totalGzipReduction + '%'
        }
    };
    
    fs.writeFileSync(
        path.join(DIST_DIR, '_minify-report.json'),
        JSON.stringify(report, null, 2),
        'utf8'
    );
    
    console.log(`\n✅ Reporte guardado en: dist/js/_minify-report.json`);
}

/**
 * Formatear bytes a formato legible
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Ejecutar minificación
minifyAll().catch(error => {
    console.error('❌ Error en minificación:', error);
    process.exit(1);
});
