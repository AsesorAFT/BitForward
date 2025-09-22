// js/app.js - Main application module
// BitForward - Sistema modernizado de contratos forward descentralizados

/**
 * Main Application Class
 * Handles all the application logic and user interactions
 */
class BitForwardApp {
    constructor() {
        this.contracts = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    init() {
        if (this.isInitialized) return;
        
        console.log("¡Interfaz de BitForward cargada y lista!");
        
        // Load mock contract data
        this.loadMockData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup form validation
        this.setupFormValidation();
        
        // Display initial data
        this.displayContracts();
        
        // Show welcome notification
        this.showWelcomeNotification();
        
        this.isInitialized = true;
    }

    /**
     * Load mock contract data
     */
    loadMockData() {
        this.contracts = [
            {
                id: 1,
                blockchain: 'bitcoin',
                amount: 0.05,
                counterparty: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                executionDate: '2024-12-15',
                status: 'activo',
                createdAt: '2024-09-01'
            },
            {
                id: 2,
                blockchain: 'solana',
                amount: 2.5,
                counterparty: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                executionDate: '2024-11-30',
                status: 'pendiente',
                createdAt: '2024-09-10'
            },
            {
                id: 3,
                blockchain: 'bitcoin',
                amount: 0.1,
                counterparty: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                executionDate: '2024-10-20',
                status: 'completado',
                createdAt: '2024-08-15'
            }
        ];
    }

    /**
     * Setup all event listeners using modern addEventListener
     */
    setupEventListeners() {
        // Form submission
        const contractForm = document.getElementById('contract-form');
        if (contractForm) {
            contractForm.addEventListener('submit', (e) => this.handleFormSubmission(e));
        }

        // Preview button
        const previewBtn = document.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewContract());
        }

        // Event delegation for contract actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('contract-detail-btn')) {
                e.preventDefault();
                const contractId = parseInt(e.target.dataset.contractId);
                this.viewContractDetails(contractId);
            }
        });
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        const contractForm = document.getElementById('contract-form');
        if (contractForm && typeof setupRealTimeValidation === 'function') {
            setupRealTimeValidation(contractForm);
        }
    }

    /**
     * Handle form submission
     */
    handleFormSubmission(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const contractData = {
            blockchain: formData.get('blockchain'),
            amount: parseFloat(formData.get('amount')),
            counterparty: formData.get('counterparty'),
            executionDate: formData.get('executionDate')
        };

        // Validate contract data
        if (window.bitForwardValidator) {
            const errors = bitForwardValidator.validateContract(contractData);
            if (errors.length > 0) {
                this.showValidationErrors(errors);
                return;
            }
        }

        // Process contract creation
        this.createContract(contractData);
    }

    /**
     * Create a new contract
     */
    createContract(contractData) {
        const newContract = {
            id: Date.now(),
            ...contractData,
            status: 'pendiente',
            createdAt: new Date().toISOString().split('T')[0]
        };

        this.contracts.push(newContract);
        this.displayContracts();
        
        // Show success notification
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.success(
                'Contrato creado exitosamente',
                {
                    title: '✅ ¡Éxito!',
                    details: `Contrato ID: ${newContract.id}`,
                    duration: 5000
                }
            );
        }

        // Reset form
        document.getElementById('contract-form').reset();
    }

    /**
     * Preview contract before creation
     */
    previewContract() {
        const form = document.getElementById('contract-form');
        const formData = new FormData(form);
        
        // Validate first
        if (window.bitForwardValidator) {
            const contractData = {
                blockchain: formData.get('blockchain'),
                amount: parseFloat(formData.get('amount')),
                counterparty: formData.get('counterparty'),
                executionDate: formData.get('executionDate')
            };
            
            const errors = bitForwardValidator.validateContract(contractData);
            if (errors.length > 0) {
                this.showValidationErrors(errors);
                return;
            }
        }
        
        // Create preview content safely
        const previewContainer = this.createPreviewContent(formData);
        
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.info(
                'Vista previa generada',
                {
                    title: '👁️ Vista Previa',
                    details: 'El contrato está listo para ser creado',
                    duration: 8000
                }
            );
        }
        
        console.log('Vista previa del contrato generada');
    }

    /**
     * Create preview content using safe DOM methods
     */
    createPreviewContent(formData) {
        const container = document.createElement('div');
        container.style.cssText = 'background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto;';
        
        const title = document.createElement('h3');
        title.style.cssText = 'color: #2c3e50; margin-top: 0;';
        title.textContent = '📋 Vista Previa del Contrato';
        
        const detailsContainer = document.createElement('div');
        detailsContainer.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;';
        
        const details = [
            { label: '🔗 Blockchain:', value: formData.get('blockchain').toUpperCase() },
            { label: '💰 Cantidad:', value: `${formData.get('amount')} ${this.getTokenSymbol(formData.get('blockchain'))}` },
            { label: '👤 Contraparte:', value: formData.get('counterparty') },
            { label: '📅 Fecha de Ejecución:', value: this.formatDate(formData.get('executionDate')) }
        ];
        
        details.forEach(detail => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = detail.label;
            p.appendChild(strong);
            p.appendChild(document.createTextNode(` ${detail.value}`));
            detailsContainer.appendChild(p);
        });
        
        const statusContainer = document.createElement('div');
        statusContainer.style.cssText = 'background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;';
        
        const statusText = document.createElement('p');
        statusText.style.cssText = 'margin: 0; color: #27ae60; font-weight: 600;';
        statusText.textContent = '✅ Contrato validado y listo para crear';
        statusContainer.appendChild(statusText);
        
        container.appendChild(title);
        container.appendChild(detailsContainer);
        container.appendChild(statusContainer);
        
        return container;
    }

    /**
     * View contract details
     */
    viewContractDetails(contractId) {
        const contract = this.contracts.find(c => c.id === contractId);
        if (contract) {
            console.log('Visualizando detalles del contrato:', contractId);
            alert(`Funcionalidad de detalles del contrato ${contractId} - Por implementar en futuras versiones.`);
        }
    }

    /**
     * Display contracts using safe DOM methods
     */
    displayContracts() {
        const contractsList = document.getElementById('contracts-list');
        if (!contractsList) return;

        // Clear existing content
        contractsList.textContent = '';

        if (!this.contracts || this.contracts.length === 0) {
            this.displayNoContracts(contractsList);
            this.updateContractsStats(0, 0, 0);
            return;
        }

        // Update statistics
        const activeCount = this.contracts.filter(c => c.status === 'activo').length;
        const completedCount = this.contracts.filter(c => c.status === 'completado').length;
        this.updateContractsStats(this.contracts.length, activeCount, completedCount);

        // Create contract cards
        this.contracts.forEach(contract => {
            const contractCard = this.createContractCard(contract);
            contractsList.appendChild(contractCard);
        });
    }

    /**
     * Display no contracts message
     */
    displayNoContracts(container) {
        const noContractsDiv = document.createElement('div');
        noContractsDiv.className = 'no-contracts';
        
        const message1 = document.createElement('p');
        message1.textContent = '📋 No tienes contratos creados aún.';
        
        const message2 = document.createElement('p');
        message2.textContent = '¡Crea tu primer contrato usando el formulario de arriba!';
        
        noContractsDiv.appendChild(message1);
        noContractsDiv.appendChild(message2);
        container.appendChild(noContractsDiv);
    }

    /**
     * Create a contract card using safe DOM methods
     */
    createContractCard(contract) {
        const card = document.createElement('div');
        card.className = 'contract-card';
        card.dataset.contractId = contract.id;

        // Header
        const header = document.createElement('div');
        header.className = 'contract-header';

        const blockchainBadge = document.createElement('span');
        blockchainBadge.className = `blockchain-badge ${contract.blockchain}`;
        blockchainBadge.textContent = contract.blockchain.toUpperCase();

        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${contract.status}`;
        statusBadge.textContent = contract.status.toUpperCase();

        header.appendChild(blockchainBadge);
        header.appendChild(statusBadge);

        // Details
        const details = document.createElement('div');
        details.className = 'contract-details';

        const detailsData = [
            { icon: '💰', label: 'Cantidad:', value: `${contract.amount} ${this.getTokenSymbol(contract.blockchain)}` },
            { icon: '👤', label: 'Contraparte:', value: this.shortenAddress(contract.counterparty), className: 'address-short' },
            { icon: '📅', label: 'Ejecución:', value: this.formatDate(contract.executionDate) },
            { icon: '📝', label: 'Creado:', value: this.formatDate(contract.createdAt) }
        ];

        detailsData.forEach(item => {
            const p = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = `${item.icon} ${item.label}`;
            
            const span = document.createElement('span');
            if (item.className) {
                span.className = item.className;
            }
            span.textContent = item.value;
            
            p.appendChild(strong);
            p.appendChild(document.createTextNode(' '));
            p.appendChild(span);
            details.appendChild(p);
        });

        // Actions
        const actions = document.createElement('div');
        actions.className = 'contract-actions';

        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn-secondary contract-detail-btn';
        detailBtn.dataset.contractId = contract.id;
        detailBtn.textContent = 'Ver Detalles';

        actions.appendChild(detailBtn);

        // Assemble card
        card.appendChild(header);
        card.appendChild(details);
        card.appendChild(actions);

        return card;
    }

    /**
     * Update contract statistics
     */
    updateContractsStats(total, active, completed) {
        const totalElement = document.getElementById('total-contracts');
        const activeElement = document.getElementById('active-contracts');
        const completedElement = document.getElementById('completed-contracts');
        
        if (totalElement) totalElement.textContent = total;
        if (activeElement) activeElement.textContent = active;
        if (completedElement) completedElement.textContent = completed;
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.error(
                'Corrige los errores antes de continuar',
                {
                    title: '❌ Validación Fallida',
                    details: `${errors.length} errores encontrados`,
                    duration: 5000
                }
            );
        }
    }

    /**
     * Show welcome notification
     */
    showWelcomeNotification() {
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.success(
                'Sistema iniciado correctamente',
                {
                    title: '🚀 BitForward v2.0',
                    details: 'Todas las funcionalidades están disponibles',
                    duration: 3000
                }
            );
        }
    }

    /**
     * Utility: Get token symbol for blockchain
     */
    getTokenSymbol(blockchain) {
        const symbols = {
            bitcoin: 'BTC',
            ethereum: 'ETH',
            solana: 'SOL'
        };
        return symbols[blockchain] || blockchain.toUpperCase();
    }

    /**
     * Utility: Shorten address for display
     */
    shortenAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Utility: Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BitForwardApp();
    app.init();
    
    // Make app globally available for debugging
    window.bitForwardApp = app;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardApp;
}