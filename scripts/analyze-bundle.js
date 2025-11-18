#!/usr/bin/env node

/**
 * BitForward Bundle Analyzer
 * Analiza el tamaño de todos los recursos y genera reporte
 *
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios a analizar
const DIRS = {
  css: 'css',
  js: 'js',
  assets: 'assets',
  contracts: 'contracts',
};

// Estadísticas globales
const globalStats = {
  totalSize: 0,
  totalGzipSize: 0,
  byType: {},
  byDir: {},
  largestFiles: [],
};

/**
 * Formatear bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtener tamaño gzipped
 */
function getGzipSize(content) {
  return zlib.gzipSync(content).length;
}

/**
 * Analizar un archivo
 */
function analyzeFile(filePath, dir) {
  try {
    const content = fs.readFileSync(filePath);
    const size = content.length;
    const gzipSize = getGzipSize(content);
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);

    // Actualizar estadísticas por tipo
    if (!globalStats.byType[ext]) {
      globalStats.byType[ext] = {
        count: 0,
        size: 0,
        gzipSize: 0,
        files: [],
      };
    }

    globalStats.byType[ext].count++;
    globalStats.byType[ext].size += size;
    globalStats.byType[ext].gzipSize += gzipSize;
    globalStats.byType[ext].files.push(fileName);

    // Actualizar estadísticas por directorio
    if (!globalStats.byDir[dir]) {
      globalStats.byDir[dir] = {
        count: 0,
        size: 0,
        gzipSize: 0,
      };
    }

    globalStats.byDir[dir].count++;
    globalStats.byDir[dir].size += size;
    globalStats.byDir[dir].gzipSize += gzipSize;

    // Actualizar totales
    globalStats.totalSize += size;
    globalStats.totalGzipSize += gzipSize;

    // Agregar a archivos más grandes
    globalStats.largestFiles.push({
      path: filePath.replace(process.cwd(), ''),
      size,
      gzipSize,
      compression: ((1 - gzipSize / size) * 100).toFixed(2) + '%',
    });
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
  }
}

/**
 * Escanear directorio recursivamente
 */
function scanDirectory(dir, dirName) {
  const fullPath = path.join(process.cwd(), dir);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directorio ${dir} no encontrado`);
    return;
  }

  const files = fs.readdirSync(fullPath);

  files.forEach(file => {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursivo en subdirectorios
      scanDirectory(path.join(dir, file), dirName);
    } else {
      // Analizar archivo
      analyzeFile(filePath, dirName);
    }
  });
}

/**
 * Generar reporte
 */
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 BUNDLE ANALYZER - BitForward');
  console.log('='.repeat(70));

  // Resumen general
  console.log('\n📦 RESUMEN GENERAL');
  console.log('-'.repeat(70));
  console.log(`Tamaño total: ${formatBytes(globalStats.totalSize)}`);
  console.log(`Tamaño gzipped: ${formatBytes(globalStats.totalGzipSize)}`);

  const compressionRatio = ((1 - globalStats.totalGzipSize / globalStats.totalSize) * 100).toFixed(
    2
  );
  console.log(`Compresión: ${compressionRatio}%`);

  // Por directorio
  console.log('\n📁 POR DIRECTORIO');
  console.log('-'.repeat(70));
  console.log(
    `${'Directorio'.padEnd(20)} ${'Archivos'.padEnd(12)} ${'Tamaño'.padEnd(15)} ${'Gzipped'.padEnd(15)}`
  );
  console.log('-'.repeat(70));

  Object.entries(globalStats.byDir)
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([dir, stats]) => {
      console.log(
        `${dir.padEnd(20)} ${String(stats.count).padEnd(12)} ${formatBytes(stats.size).padEnd(15)} ${formatBytes(stats.gzipSize).padEnd(15)}`
      );
    });

  // Por tipo de archivo
  console.log('\n📄 POR TIPO DE ARCHIVO');
  console.log('-'.repeat(70));
  console.log(
    `${'Tipo'.padEnd(12)} ${'Archivos'.padEnd(12)} ${'Tamaño'.padEnd(15)} ${'Gzipped'.padEnd(15)}`
  );
  console.log('-'.repeat(70));

  Object.entries(globalStats.byType)
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([ext, stats]) => {
      console.log(
        `${ext.padEnd(12)} ${String(stats.count).padEnd(12)} ${formatBytes(stats.size).padEnd(15)} ${formatBytes(stats.gzipSize).padEnd(15)}`
      );
    });

  // Archivos más grandes (top 10)
  console.log('\n🔝 TOP 10 ARCHIVOS MÁS GRANDES');
  console.log('-'.repeat(70));
  console.log(`${'Archivo'.padEnd(40)} ${'Tamaño'.padEnd(12)} ${'Gzipped'.padEnd(12)}`);
  console.log('-'.repeat(70));

  globalStats.largestFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(file => {
      const fileName = file.path.length > 38 ? '...' + file.path.slice(-35) : file.path;
      console.log(
        `${fileName.padEnd(40)} ${formatBytes(file.size).padEnd(12)} ${formatBytes(file.gzipSize).padEnd(12)}`
      );
    });

  console.log('\n' + '='.repeat(70));

  // Guardar reporte JSON
  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalSize: formatBytes(globalStats.totalSize),
          totalGzipSize: formatBytes(globalStats.totalGzipSize),
          compressionRatio: `${compressionRatio}%`,
          totalSizeBytes: globalStats.totalSize,
          totalGzipSizeBytes: globalStats.totalGzipSize,
        },
        byDirectory: Object.entries(globalStats.byDir).map(([dir, stats]) => ({
          directory: dir,
          fileCount: stats.count,
          size: formatBytes(stats.size),
          gzipSize: formatBytes(stats.gzipSize),
          sizeBytes: stats.size,
          gzipSizeBytes: stats.gzipSize,
        })),
        byType: Object.entries(globalStats.byType).map(([ext, stats]) => ({
          extension: ext,
          fileCount: stats.count,
          size: formatBytes(stats.size),
          gzipSize: formatBytes(stats.gzipSize),
          sizeBytes: stats.size,
          gzipSizeBytes: stats.gzipSize,
          files: stats.files,
        })),
        largestFiles: globalStats.largestFiles.sort((a, b) => b.size - a.size).slice(0, 20),
      },
      null,
      2
    )
  );

  console.log('\n📄 Reporte JSON guardado en: bundle-analysis.json\n');
}

/**
 * Ejecutar análisis
 */
function runAnalysis() {
  console.log('🔍 Analizando bundle de BitForward...\n');

  // Escanear cada directorio
  Object.entries(DIRS).forEach(([key, dir]) => {
    console.log(`Escaneando ${dir}/...`);
    scanDirectory(dir, key);
  });

  // Generar reporte
  generateReport();
}

// Ejecutar
runAnalysis();
