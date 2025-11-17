#!/usr/bin/env node

/**
 * BitForward CSS Minification Script
 * Minifica todos los archivos CSS del proyecto
 *
 * @version 1.0.0
 * @date 2024-10-19
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CleanCSS from 'clean-css';
import { gzipSizeSync } from 'gzip-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_DIR = path.join(__dirname, '../css');
const DIST_DIR = path.join(__dirname, '../dist/css');

// Crear directorio dist si no existe
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('🎨 Minificando archivos CSS...\n');

// Leer todos los archivos CSS
const cssFiles = fs.readdirSync(CSS_DIR).filter(file => file.endsWith('.css'));

const stats = {
  totalOriginal: 0,
  totalMinified: 0,
  totalGzipped: 0,
  files: []
};

cssFiles.forEach(file => {
  const inputPath = path.join(CSS_DIR, file);
  const outputPath = path.join(DIST_DIR, file.replace('.css', '.min.css'));

  // Leer archivo original
  const source = fs.readFileSync(inputPath, 'utf8');
  const originalSize = Buffer.byteLength(source, 'utf8');

  // Minificar
  const result = new CleanCSS({
    level: 2,
    returnPromise: false
  }).minify(source);

  if (result.errors.length > 0) {
    console.error(`❌ Error minificando ${file}:`);
    result.errors.forEach(err => console.error(`   ${err}`));
    return;
  }

  const minified = result.styles;
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
});

// Resumen final
console.log('📊 Resumen de Minificación CSS:\n');
console.log(`Archivos procesados: ${cssFiles.length}`);
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
  totalFiles: cssFiles.length,
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

console.log('\n✅ Reporte guardado en: dist/css/_minify-report.json');

/**
 * Formatear bytes a formato legible
 */
function formatBytes(bytes) {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
