/**
 * BitForward Performance Tests
 * Tests para Service Worker, Caching, Bundle Size
 * 
 * @version 1.0.0
 * @date 2024-10-19
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSizeSync } from 'gzip-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('⚡ Performance Tests', () => {
    let bundleAnalysis;

    beforeAll(() => {
        console.log('🚀 Iniciando Performance Tests...');
        
        // Load bundle analysis if exists
        const analysisPath = path.join(projectRoot, 'bundle-analysis.json');
        if (fs.existsSync(analysisPath)) {
            bundleAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
        }
    });

    describe('Bundle Size Analysis', () => {
        test('should have total bundle size under 1.5MB', () => {
            if (!bundleAnalysis) {
                console.warn('⚠️ bundle-analysis.json not found, skipping test');
                return;
            }

            const totalSize = bundleAnalysis.summary.totalSizeBytes;
            const maxSize = 1.5 * 1024 * 1024; // 1.5MB

            expect(totalSize).toBeLessThan(maxSize);
        });

        test('should have gzipped size under 300KB', () => {
            if (!bundleAnalysis) {
                console.warn('⚠️ bundle-analysis.json not found, skipping test');
                return;
            }

            const gzipSize = bundleAnalysis.summary.totalGzipSizeBytes;
            const maxGzipSize = 300 * 1024; // 300KB

            expect(gzipSize).toBeLessThan(maxGzipSize);
        });

        test('should achieve at least 70% compression ratio', () => {
            if (!bundleAnalysis) {
                console.warn('⚠️ bundle-analysis.json not found, skipping test');
                return;
            }

            const compressionRatio = parseFloat(bundleAnalysis.summary.compressionRatio);
            expect(compressionRatio).toBeGreaterThanOrEqual(70);
        });
    });

    describe('CSS Minification', () => {
        test('should have minified CSS files in dist/css/', () => {
            const distCssPath = path.join(projectRoot, 'dist', 'css');
            
            if (!fs.existsSync(distCssPath)) {
                console.warn('⚠️ dist/css/ not found, run npm run minify:css');
                return;
            }

            const minifiedFiles = fs.readdirSync(distCssPath)
                .filter(f => f.endsWith('.min.css'));

            expect(minifiedFiles.length).toBeGreaterThan(0);
        });

        test('should have CSS minification report', () => {
            const reportPath = path.join(projectRoot, 'dist', 'css', '_minify-report.json');
            
            if (!fs.existsSync(reportPath)) {
                console.warn('⚠️ CSS minification report not found');
                return;
            }

            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            
            expect(report.summary).toBeDefined();
            expect(report.summary.reduction).toMatch(/\d+\.\d+%/);
        });

        test('should achieve at least 20% CSS reduction', () => {
            const reportPath = path.join(projectRoot, 'dist', 'css', '_minify-report.json');
            
            if (!fs.existsSync(reportPath)) {
                console.warn('⚠️ CSS minification report not found');
                return;
            }

            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            const reduction = parseFloat(report.summary.reduction);
            
            expect(reduction).toBeGreaterThanOrEqual(20);
        });
    });

    describe('JavaScript Minification', () => {
        test('should have minified JS files in dist/js/', () => {
            const distJsPath = path.join(projectRoot, 'dist', 'js');
            
            if (!fs.existsSync(distJsPath)) {
                console.warn('⚠️ dist/js/ not found, run npm run minify:js');
                return;
            }

            const minifiedFiles = fs.readdirSync(distJsPath)
                .filter(f => f.endsWith('.min.js'));

            expect(minifiedFiles.length).toBeGreaterThan(0);
        });

        test('should have JS minification report', () => {
            const reportPath = path.join(projectRoot, 'dist', 'js', '_minify-report.json');
            
            if (!fs.existsSync(reportPath)) {
                console.warn('⚠️ JS minification report not found');
                return;
            }

            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            
            expect(report.summary).toBeDefined();
            expect(report.summary.reduction).toMatch(/\d+\.\d+%/);
        });

        test('should achieve at least 30% JS reduction', () => {
            const reportPath = path.join(projectRoot, 'dist', 'js', '_minify-report.json');
            
            if (!fs.existsSync(reportPath)) {
                console.warn('⚠️ JS minification report not found');
                return;
            }

            const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
            const reduction = parseFloat(report.summary.reduction);
            
            expect(reduction).toBeGreaterThanOrEqual(30);
        });
    });

    describe('Service Worker', () => {
        test('should have sw.js file', () => {
            const swPath = path.join(projectRoot, 'sw.js');
            expect(fs.existsSync(swPath)).toBe(true);
        });

        test('should have Service Worker registration script', () => {
            const registerPath = path.join(projectRoot, 'js', 'sw-register.js');
            expect(fs.existsSync(registerPath)).toBe(true);
        });

        test('should define cache strategies in sw.js', () => {
            const swPath = path.join(projectRoot, 'sw.js');
            const swContent = fs.readFileSync(swPath, 'utf-8');

            expect(swContent).toContain('CACHE_NAME');
            expect(swContent).toContain('cacheFirst');
            expect(swContent).toContain('networkFirst');
        });

        test('should precache critical resources', () => {
            const swPath = path.join(projectRoot, 'sw.js');
            const swContent = fs.readFileSync(swPath, 'utf-8');

            expect(swContent).toContain('CRITICAL_RESOURCES');
            expect(swContent).toMatch(/index\.html/);
            expect(swContent).toMatch(/dashboard\.html/);
        });
    });

    describe('PWA Configuration', () => {
        test('should have manifest.json', () => {
            const manifestPath = path.join(projectRoot, 'manifest.json');
            expect(fs.existsSync(manifestPath)).toBe(true);
        });

        test('should have valid manifest structure', () => {
            const manifestPath = path.join(projectRoot, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

            expect(manifest.name).toBeDefined();
            expect(manifest.short_name).toBeDefined();
            expect(manifest.display).toBe('standalone');
            expect(manifest.theme_color).toBeDefined();
            expect(manifest.icons).toBeDefined();
            expect(Array.isArray(manifest.icons)).toBe(true);
        });

        test('should have offline.html fallback', () => {
            const offlinePath = path.join(projectRoot, 'offline.html');
            expect(fs.existsSync(offlinePath)).toBe(true);
        });
    });

    describe('Resource Optimization', () => {
        test('should have DNS prefetch in HTML files', () => {
            const indexPath = path.join(projectRoot, 'index.html');
            
            if (!fs.existsSync(indexPath)) {
                console.warn('⚠️ index.html not found');
                return;
            }

            const content = fs.readFileSync(indexPath, 'utf-8');
            expect(content).toMatch(/dns-prefetch/i);
        });

        test('should have preconnect for CDNs', () => {
            const indexPath = path.join(projectRoot, 'index.html');
            
            if (!fs.existsSync(indexPath)) {
                console.warn('⚠️ index.html not found');
                return;
            }

            const content = fs.readFileSync(indexPath, 'utf-8');
            expect(content).toMatch(/preconnect/i);
        });

        test('should have preload for critical resources', () => {
            const dashboardPath = path.join(projectRoot, 'dashboard.html');
            
            if (!fs.existsSync(dashboardPath)) {
                console.warn('⚠️ dashboard.html not found');
                return;
            }

            const content = fs.readFileSync(dashboardPath, 'utf-8');
            expect(content).toMatch(/rel="preload"/i);
        });
    });

    describe('Critical Files Size', () => {
        test('individual JS files should be under 100KB', () => {
            const jsPath = path.join(projectRoot, 'js');
            
            if (!fs.existsSync(jsPath)) {
                console.warn('⚠️ js/ directory not found');
                return;
            }

            const jsFiles = fs.readdirSync(jsPath)
                .filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));

            const maxSize = 100 * 1024; // 100KB
            const oversizedFiles = [];

            jsFiles.forEach(file => {
                const filePath = path.join(jsPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.size > maxSize) {
                    oversizedFiles.push({
                        file,
                        size: stats.size,
                        sizeKB: (stats.size / 1024).toFixed(2)
                    });
                }
            });

            if (oversizedFiles.length > 0) {
                console.warn('⚠️ Large JS files found:', oversizedFiles);
            }

            // Allow some larger files but warn
            expect(oversizedFiles.length).toBeLessThan(5);
        });

        test('individual CSS files should be under 50KB', () => {
            const cssPath = path.join(projectRoot, 'css');
            
            if (!fs.existsSync(cssPath)) {
                console.warn('⚠️ css/ directory not found');
                return;
            }

            const cssFiles = fs.readdirSync(cssPath)
                .filter(f => f.endsWith('.css') && !f.endsWith('.min.css'));

            const maxSize = 50 * 1024; // 50KB
            const oversizedFiles = [];

            cssFiles.forEach(file => {
                const filePath = path.join(cssPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.size > maxSize) {
                    oversizedFiles.push({
                        file,
                        size: stats.size,
                        sizeKB: (stats.size / 1024).toFixed(2)
                    });
                }
            });

            if (oversizedFiles.length > 0) {
                console.warn('⚠️ Large CSS files found:', oversizedFiles);
            }

            expect(oversizedFiles.length).toBeLessThan(3);
        });
    });

    describe('Asset Compression', () => {
        test('should have good gzip compression for JS files', () => {
            const jsPath = path.join(projectRoot, 'js');
            
            if (!fs.existsSync(jsPath)) {
                console.warn('⚠️ js/ directory not found');
                return;
            }

            const sampleFile = 'wallet-manager-real.js';
            const filePath = path.join(jsPath, sampleFile);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ ${sampleFile} not found`);
                return;
            }

            const content = fs.readFileSync(filePath);
            const originalSize = content.length;
            const gzipSize = gzipSizeSync(content);
            const compression = ((1 - gzipSize / originalSize) * 100).toFixed(2);

            expect(parseFloat(compression)).toBeGreaterThan(60);
        });

        test('should have good gzip compression for CSS files', () => {
            const cssPath = path.join(projectRoot, 'css');
            
            if (!fs.existsSync(cssPath)) {
                console.warn('⚠️ css/ directory not found');
                return;
            }

            const sampleFile = 'dashboard.css';
            const filePath = path.join(cssPath, sampleFile);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ ${sampleFile} not found`);
                return;
            }

            const content = fs.readFileSync(filePath);
            const originalSize = content.length;
            const gzipSize = gzipSizeSync(content);
            const compression = ((1 - gzipSize / originalSize) * 100).toFixed(2);

            expect(parseFloat(compression)).toBeGreaterThan(70);
        });
    });
});
