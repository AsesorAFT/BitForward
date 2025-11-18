// ***********************************************
// Custom commands for BitForward E2E tests
// ***********************************************

import { ethers } from 'ethers';

// Comando para conectar wallet (mock)
Cypress.Commands.add('connectWallet', address => {
  cy.window().then(win => {
    // Mock de MetaMask
    win.ethereum = {
      isMetaMask: true,
      selectedAddress: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27',
      request: ({ method, params }) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27']);
        }
        if (method === 'eth_accounts') {
          return Promise.resolve([address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27']);
        }
        if (method === 'personal_sign') {
          // Mock signature
          return Promise.resolve('0x' + '0'.repeat(130));
        }
        return Promise.resolve(null);
      },
      on: () => {},
      removeListener: () => {},
    };
  });
});

// Comando para login con wallet
Cypress.Commands.add('loginWithWallet', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27';

  cy.connectWallet(testAddress);
  cy.visit('/');
  cy.get('[data-cy=connect-wallet-btn]').click();
  cy.get('[data-cy=wallet-address]').should('contain', testAddress.slice(0, 6));
});

// Comando para crear un contrato forward
Cypress.Commands.add('createForwardContract', contractData => {
  const defaultData = {
    asset: 'BTC',
    amount: '1.5',
    price: '50000',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...contractData,
  };

  cy.get('[data-cy=create-contract-btn]').click();
  cy.get('[data-cy=asset-select]').select(defaultData.asset);
  cy.get('[data-cy=amount-input]').clear().type(defaultData.amount);
  cy.get('[data-cy=price-input]').clear().type(defaultData.price);
  cy.get('[data-cy=expiration-input]').type(defaultData.expirationDate);
  cy.get('[data-cy=submit-contract-btn]').click();
});

// Comando para verificar notificación
Cypress.Commands.add('verifyNotification', (message, type = 'success') => {
  cy.get(`[data-cy=notification-${type}]`).should('be.visible').and('contain', message);
});

// Comando para interceptar llamadas API
Cypress.Commands.add('mockApiResponse', (endpoint, response, statusCode = 200) => {
  cy.intercept('**/api/' + endpoint, {
    statusCode,
    body: response,
  }).as(endpoint.replace('/', '_'));
});

// Comando para esperar carga de la página
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loader]').should('not.exist');
  cy.get('[data-cy=page-content]').should('be.visible');
});

// Comando para verificar balance
Cypress.Commands.add('verifyBalance', expectedBalance => {
  cy.get('[data-cy=wallet-balance]').should('be.visible').and('contain', expectedBalance);
});

// Comando para navegar por el menú
Cypress.Commands.add('navigateTo', section => {
  cy.get(`[data-cy=nav-${section}]`).click();
  cy.url().should('include', `/${section}`);
});

// Comando para verificar tabla de contratos
Cypress.Commands.add('verifyContractInTable', contractId => {
  cy.get('[data-cy=contracts-table]')
    .find(`[data-cy=contract-row-${contractId}]`)
    .should('exist')
    .and('be.visible');
});
