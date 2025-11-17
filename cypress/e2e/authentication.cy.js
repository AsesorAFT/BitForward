describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debería conectar wallet exitosamente', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb27';
    
    cy.connectWallet(testAddress);
    cy.get('[data-cy=connect-wallet-btn]').click();

    // Verificar que el botón cambió a mostrar la dirección
    cy.get('[data-cy=wallet-address]')
      .should('be.visible')
      .and('contain', testAddress.slice(0, 6));

    // Verificar que el menú de usuario está disponible
    cy.get('[data-cy=user-menu]').should('be.visible');
  });

  it('debería desconectar wallet correctamente', () => {
    cy.loginWithWallet();
    
    cy.get('[data-cy=user-menu]').click();
    cy.get('[data-cy=disconnect-btn]').click();

    // Verificar que volvió al estado inicial
    cy.get('[data-cy=connect-wallet-btn]').should('be.visible');
    cy.get('[data-cy=wallet-address]').should('not.exist');
  });

  it('debería manejar rechazo de firma', () => {
    cy.window().then((win) => {
      win.ethereum = {
        isMetaMask: true,
        request: () => Promise.reject(new Error('User rejected signature'))
      };
    });

    cy.get('[data-cy=connect-wallet-btn]').click();
    cy.verifyNotification('Firma rechazada por el usuario', 'error');
  });

  it('debería detectar ausencia de wallet', () => {
    cy.window().then((win) => {
      delete win.ethereum;
    });

    cy.get('[data-cy=connect-wallet-btn]').click();
    cy.verifyNotification('No se detectó MetaMask', 'error');
  });

  it('debería persistir sesión después de reload', () => {
    cy.loginWithWallet();
    cy.reload();

    // Verificar que sigue conectado
    cy.get('[data-cy=wallet-address]').should('be.visible');
  });
});
