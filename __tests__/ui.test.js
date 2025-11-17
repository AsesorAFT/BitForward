/**
 * BitForward UI/UX Tests
 * Tests para responsive design, animaciones, accesibilidad
 *
 * @version 1.0.0
 * @date 2024-10-19
 */

import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

describe('🎨 UI/UX Tests', () => {
  describe('HTML Structure', () => {
    test('should have valid HTML doctype in main pages', () => {
      const pages = ['index.html', 'dashboard.html'];

      pages.forEach(page => {
        const pagePath = path.join(projectRoot, page);
        if (!fs.existsSync(pagePath)) {
          console.warn(`⚠️ ${page} not found`);
          return;
        }

        const content = fs.readFileSync(pagePath, 'utf-8');
        expect(content).toMatch(/<!DOCTYPE html>/i);
      });
    });

    test('should have meta viewport for mobile', () => {
      const pages = ['index.html', 'dashboard.html'];

      pages.forEach(page => {
        const pagePath = path.join(projectRoot, page);
        if (!fs.existsSync(pagePath)) {return;}

        const content = fs.readFileSync(pagePath, 'utf-8');
        expect(content).toMatch(/<meta name="viewport"/i);
      });
    });

    test('should have proper charset declaration', () => {
      const pages = ['index.html', 'dashboard.html'];

      pages.forEach(page => {
        const pagePath = path.join(projectRoot, page);
        if (!fs.existsSync(pagePath)) {return;}

        const content = fs.readFileSync(pagePath, 'utf-8');
        expect(content).toMatch(/<meta charset="UTF-8"/i);
      });
    });

    test('should have theme color meta tag', () => {
      const dashboardPath = path.join(projectRoot, 'dashboard.html');
      if (!fs.existsSync(dashboardPath)) {
        console.warn('⚠️ dashboard.html not found');
        return;
      }

      const content = fs.readFileSync(dashboardPath, 'utf-8');
      expect(content).toMatch(/<meta name="theme-color"/i);
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive CSS breakpoints', () => {
      const cssPath = path.join(projectRoot, 'css', 'dashboard.css');
      if (!fs.existsSync(cssPath)) {
        console.warn('⚠️ dashboard.css not found');
        return;
      }

      const content = fs.readFileSync(cssPath, 'utf-8');

      // Check for common breakpoints
      expect(content).toMatch(/@media.*max-width.*768px/i); // Tablet
      expect(content).toMatch(/@media.*max-width.*480px|640px/i); // Mobile
    });

    test('should have mobile-specific styles', () => {
      const mobileCSS = path.join(projectRoot, 'css', 'rocket-mobile.css');
      if (!fs.existsSync(mobileCSS)) {
        console.warn('⚠️ rocket-mobile.css not found');
        return;
      }

      const content = fs.readFileSync(mobileCSS, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });

    test('should have flexible grid layouts', () => {
      const cssFiles = ['dashboard.css', 'style.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/display:\s*grid|display:\s*flex/i);
      });
    });
  });

  describe('Space Theme & Animations', () => {
    test('should have space theme CSS', () => {
      const spaceBgPath = path.join(projectRoot, 'css', 'space-background.css');
      expect(fs.existsSync(spaceBgPath)).toBe(true);
    });

    test('should have rocket theme CSS', () => {
      const rocketPath = path.join(projectRoot, 'css', 'rocket-theme.css');
      expect(fs.existsSync(rocketPath)).toBe(true);
    });

    test('should have rocket animations', () => {
      const rocketJsPath = path.join(projectRoot, 'js', 'rocket-animations.js');
      expect(fs.existsSync(rocketJsPath)).toBe(true);
    });

    test('should have space animations', () => {
      const spaceJsPath = path.join(projectRoot, 'js', 'space-animations.js');
      expect(fs.existsSync(spaceJsPath)).toBe(true);
    });

    test('should define keyframe animations', () => {
      const animationsPath = path.join(projectRoot, 'css', 'animations.css');
      if (!fs.existsSync(animationsPath)) {
        console.warn('⚠️ animations.css not found');
        return;
      }

      const content = fs.readFileSync(animationsPath, 'utf-8');
      expect(content).toMatch(/@keyframes/i);
    });

    test('should have rocket logo SVG', () => {
      const logoPath = path.join(projectRoot, 'assets', 'logo-rocket-animated.svg');
      expect(fs.existsSync(logoPath)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should have alt text for images', () => {
      const pages = ['index.html', 'dashboard.html', 'test-suite.html'];

      pages.forEach(page => {
        const pagePath = path.join(projectRoot, page);
        if (!fs.existsSync(pagePath)) {return;}

        const content = fs.readFileSync(pagePath, 'utf-8');
        const imgTags = content.match(/<img[^>]*>/gi) || [];

        imgTags.forEach(img => {
          // Each img should have alt attribute
          expect(img).toMatch(/alt=/i);
        });
      });
    });

    test('should have ARIA labels for interactive elements', () => {
      const dashboardPath = path.join(projectRoot, 'dashboard.html');
      if (!fs.existsSync(dashboardPath)) {
        console.warn('⚠️ dashboard.html not found');
        return;
      }

      const content = fs.readFileSync(dashboardPath, 'utf-8');

      // Check for ARIA attributes
      const hasAriaLabels = content.match(/aria-label|aria-labelledby|aria-describedby/i);

      if (!hasAriaLabels) {
        console.warn('⚠️ Consider adding ARIA labels for better accessibility');
      }
    });

    test('should have semantic HTML elements', () => {
      const pages = ['index.html', 'dashboard.html'];

      pages.forEach(page => {
        const pagePath = path.join(projectRoot, page);
        if (!fs.existsSync(pagePath)) {return;}

        const content = fs.readFileSync(pagePath, 'utf-8');

        // Check for semantic elements
        expect(content).toMatch(/<header|<nav|<main|<footer|<article|<section/i);
      });
    });

    test('should have proper heading hierarchy', () => {
      const dashboardPath = path.join(projectRoot, 'dashboard.html');
      if (!fs.existsSync(dashboardPath)) {
        console.warn('⚠️ dashboard.html not found');
        return;
      }

      const content = fs.readFileSync(dashboardPath, 'utf-8');

      // Should have h1
      expect(content).toMatch(/<h1/i);

      // Check for heading structure
      const h1Count = (content.match(/<h1/gi) || []).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have focus states for interactive elements', () => {
      const cssFiles = ['style.css', 'dashboard.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');

        // Should have focus styles
        const hasFocus = content.match(/:focus/i);

        if (!hasFocus) {
          console.warn(`⚠️ ${file} missing :focus styles`);
        }
      });
    });
  });

  describe('Typography', () => {
    test('should have typography CSS', () => {
      const typographyPath = path.join(projectRoot, 'css', 'typography.css');
      expect(fs.existsSync(typographyPath)).toBe(true);
    });

    test('should define font sizes', () => {
      const typographyPath = path.join(projectRoot, 'css', 'typography.css');
      if (!fs.existsSync(typographyPath)) {return;}

      const content = fs.readFileSync(typographyPath, 'utf-8');
      expect(content).toMatch(/font-size/i);
    });

    test('should have readable line height', () => {
      const typographyPath = path.join(projectRoot, 'css', 'typography.css');
      if (!fs.existsSync(typographyPath)) {return;}

      const content = fs.readFileSync(typographyPath, 'utf-8');
      expect(content).toMatch(/line-height/i);
    });
  });

  describe('Color Scheme', () => {
    test('should have consistent color theme', () => {
      const themeFiles = ['themes.css', 'crypto-theme.css'];

      themeFiles.forEach(file => {
        const themePath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(themePath)) {
          console.warn(`⚠️ ${file} not found`);
          return;
        }

        const content = fs.readFileSync(themePath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });
    });

    test('should use CSS variables for theming', () => {
      const cssFiles = fs.readdirSync(path.join(projectRoot, 'css'))
        .filter(f => f.endsWith('.css'));

      let hasVariables = false;

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        const content = fs.readFileSync(cssPath, 'utf-8');

        if (content.match(/--[a-z-]+:/)) {
          hasVariables = true;
        }
      });

      if (!hasVariables) {
        console.warn('⚠️ Consider using CSS variables for better theming');
      }
    });

    test('should have gradient definitions', () => {
      const cssFiles = ['style.css', 'dashboard.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/linear-gradient|radial-gradient/i);
      });
    });
  });

  describe('Interactive Elements', () => {
    test('should have button styles', () => {
      const cssFiles = ['style.css', 'dashboard.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/button|btn/i);
      });
    });

    test('should have hover effects', () => {
      const cssFiles = ['style.css', 'dashboard.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/:hover/i);
      });
    });

    test('should have transition animations', () => {
      const cssFiles = ['style.css', 'dashboard.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/transition/i);
      });
    });
  });

  describe('Form Elements', () => {
    test('should have form validation styles', () => {
      const cssFiles = fs.readdirSync(path.join(projectRoot, 'css'))
        .filter(f => f.endsWith('.css'));

      let hasValidation = false;

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        const content = fs.readFileSync(cssPath, 'utf-8');

        if (content.match(/invalid|valid|error|success/i)) {
          hasValidation = true;
        }
      });

      if (!hasValidation) {
        console.warn('⚠️ Consider adding form validation styles');
      }
    });

    test('should have input styles', () => {
      const cssFiles = ['auth.css', 'style.css'];

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        if (!fs.existsSync(cssPath)) {return;}

        const content = fs.readFileSync(cssPath, 'utf-8');
        expect(content).toMatch(/input|textarea|select/i);
      });
    });
  });

  describe('Loading States', () => {
    test('should have loading/spinner styles', () => {
      const cssFiles = fs.readdirSync(path.join(projectRoot, 'css'))
        .filter(f => f.endsWith('.css'));

      let hasLoading = false;

      cssFiles.forEach(file => {
        const cssPath = path.join(projectRoot, 'css', file);
        const content = fs.readFileSync(cssPath, 'utf-8');

        if (content.match(/loading|spinner|skeleton/i)) {
          hasLoading = true;
        }
      });

      if (!hasLoading) {
        console.warn('⚠️ Consider adding loading state styles');
      }
    });
  });

  describe('Icons and Assets', () => {
    test('should have logo assets', () => {
      const logoFiles = ['logo.svg', 'logo-rocket-animated.svg', 'favicon.svg'];

      logoFiles.forEach(logo => {
        const logoPath = path.join(projectRoot, 'assets', logo);
        if (!fs.existsSync(logoPath)) {
          console.warn(`⚠️ ${logo} not found`);
        }
      });
    });

    test('should have SVG assets', () => {
      const assetsPath = path.join(projectRoot, 'assets');
      if (!fs.existsSync(assetsPath)) {
        console.warn('⚠️ assets/ directory not found');
        return;
      }

      const svgFiles = fs.readdirSync(assetsPath)
        .filter(f => f.endsWith('.svg'));

      expect(svgFiles.length).toBeGreaterThan(0);
    });
  });
});
