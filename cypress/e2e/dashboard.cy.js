describe('Dashboard and Metrics', () => {
  beforeEach(() => {
    cy.loginWithWallet();
    cy.navigateTo('dashboard');
  });

  it('debería mostrar métricas principales', () => {
    cy.mockApiResponse('dashboard/stats', {
      totalContracts: 42,
      activeContracts: 15,
      totalVolume: '1250000',
      avgContractValue: '25000',
    });

    cy.waitForPageLoad();

    cy.get('[data-cy=total-contracts]').should('contain', '42');
    cy.get('[data-cy=active-contracts]').should('contain', '15');
    cy.get('[data-cy=total-volume]').should('contain', '1,250,000');
  });

  it('debería filtrar contratos por activo', () => {
    cy.get('[data-cy=asset-filter]').select('BTC');

    cy.get('[data-cy=contracts-table]')
      .find('[data-cy^=contract-row-]')
      .each($row => {
        cy.wrap($row).should('contain', 'BTC');
      });
  });

  it('debería filtrar contratos por estado', () => {
    cy.get('[data-cy=status-filter]').select('active');

    cy.get('[data-cy=contracts-table]')
      .find('[data-cy=status-badge]')
      .each($badge => {
        cy.wrap($badge).should('contain', 'Activo');
      });
  });

  it('debería paginar resultados correctamente', () => {
    cy.get('[data-cy=pagination-next]').click();
    cy.url().should('include', 'page=2');

    cy.get('[data-cy=contracts-table]').should('be.visible');
  });

  it('debería mostrar gráficos de estadísticas', () => {
    cy.get('[data-cy=volume-chart]').should('be.visible');
    cy.get('[data-cy=assets-distribution-chart]').should('be.visible');
  });

  it('debería exportar datos en CSV', () => {
    cy.get('[data-cy=export-csv-btn]').click();

    // Verificar que se descargó el archivo
    cy.readFile('cypress/downloads/contracts.csv').should('exist');
  });
});
