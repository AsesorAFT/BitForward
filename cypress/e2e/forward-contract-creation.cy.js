describe('Forward Contract Creation Flow', () => {
  beforeEach(() => {
    // Reset database y conectar wallet antes de cada test
    cy.loginWithWallet();
    cy.navigateTo('contracts');
  });

  it('debería crear un contrato forward exitosamente', () => {
    // Mock de respuesta API
    cy.mockApiResponse('contracts', {
      id: '123',
      asset: 'BTC',
      amount: 1.5,
      price: 50000,
      status: 'active'
    }, 201);

    // Crear contrato
    cy.createForwardContract({
      asset: 'BTC',
      amount: '1.5',
      price: '50000'
    });

    // Verificar notificación de éxito
    cy.verifyNotification('Contrato creado exitosamente', 'success');

    // Verificar que aparece en la tabla
    cy.verifyContractInTable('123');

    // Verificar detalles del contrato
    cy.get('[data-cy=contract-row-123]').within(() => {
      cy.contains('BTC').should('be.visible');
      cy.contains('1.5').should('be.visible');
      cy.contains('50,000').should('be.visible');
      cy.get('[data-cy=status-badge]').should('contain', 'Activo');
    });
  });

  it('debería validar campos requeridos', () => {
    cy.get('[data-cy=create-contract-btn]').click();
    cy.get('[data-cy=submit-contract-btn]').click();

    // Verificar mensajes de error
    cy.get('[data-cy=asset-error]').should('contain', 'El activo es requerido');
    cy.get('[data-cy=amount-error]').should('contain', 'El monto es requerido');
    cy.get('[data-cy=price-error]').should('contain', 'El precio es requerido');
  });

  it('debería rechazar montos inválidos', () => {
    cy.get('[data-cy=create-contract-btn]').click();
    cy.get('[data-cy=amount-input]').type('-1');
    cy.get('[data-cy=amount-error]').should('contain', 'El monto debe ser positivo');

    cy.get('[data-cy=amount-input]').clear().type('0');
    cy.get('[data-cy=amount-error]').should('contain', 'El monto debe ser mayor a 0');
  });

  it('debería calcular colateral correctamente', () => {
    cy.get('[data-cy=create-contract-btn]').click();
    
    cy.get('[data-cy=price-input]').type('50000');
    cy.get('[data-cy=collateral-display]').should('contain', '5,000'); // 10% de 50,000

    cy.get('[data-cy=price-input]').clear().type('100000');
    cy.get('[data-cy=collateral-display]').should('contain', '10,000'); // 10% de 100,000
  });

  it('debería manejar errores de red correctamente', () => {
    cy.mockApiResponse('contracts', { error: 'Network error' }, 500);

    cy.createForwardContract({
      asset: 'BTC',
      amount: '1.5',
      price: '50000'
    });

    cy.verifyNotification('Error al crear contrato', 'error');
  });

  it('debería permitir cancelar la creación', () => {
    cy.get('[data-cy=create-contract-btn]').click();
    cy.get('[data-cy=cancel-btn]').click();

    // Verificar que el modal se cerró
    cy.get('[data-cy=contract-modal]').should('not.exist');
  });
});
