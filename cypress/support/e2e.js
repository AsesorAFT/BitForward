// Import commands
import './commands';

// Configuración global
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir que Cypress falle por errores de terceros
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Before each test
beforeEach(() => {
  // Clear localStorage y cookies
  cy.clearLocalStorage();
  cy.clearCookies();

  // Set viewport
  cy.viewport(1280, 720);
});

// After each test
afterEach(() => {
  // Screenshots en caso de fallo
  cy.screenshot({ capture: 'runner', onlyOn: 'failed' });
});
