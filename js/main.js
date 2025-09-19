// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Interfaz de BitForward (Modo Custodial) cargada y lista!");

    // Generar ID de contrato automáticamente
    generateContractId();
    
    // Renderizar contratos de ejemplo
    renderSampleContracts();
    
    // Configurar manejadores de eventos
    setupEventHandlers();
});

function generateContractId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contractId = `BTC-FWD-${timestamp}-${random}`;
    
    const contractIdInput = document.getElementById('contract-id');
    if (contractIdInput) {
        contractIdInput.value = contractId;
    }
}

function setupEventHandlers() {
    const form = document.getElementById('form-nuevo-contrato');
    const createBtn = document.getElementById('create-contract-btn');
    
    // Habilitar el botón cuando todos los campos requeridos estén llenos
    const requiredFields = form.querySelectorAll('input[required]');
    
    function checkFormValidity() {
        const isValid = Array.from(requiredFields).every(field => field.value.trim() !== '');
        createBtn.disabled = !isValid;
    }
    
    requiredFields.forEach(field => {
        field.addEventListener('input', checkFormValidity);
    });
    
    // Manejar envío del formulario (por ahora solo mostrar mensaje)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Funcionalidad de creación de contratos en desarrollo. Los datos del formulario se han capturado correctamente.');
        
        // Limpiar formulario y generar nuevo ID
        form.reset();
        generateContractId();
        checkFormValidity();
    });
}

function renderSampleContracts() {
    const contractsList = document.querySelector('.contracts-list');
    
    // Datos de ejemplo para demostración
    const sampleContracts = [
        {
            id: 'BTC-FWD-1704067200-001',
            counterpartAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            amount: '0.05000000',
            expiryDate: '2024-12-31T23:59',
            status: 'active',
            createdDate: '2024-01-01T10:00'
        },
        {
            id: 'BTC-FWD-1703980800-002',
            counterpartAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
            amount: '0.10000000',
            expiryDate: '2024-01-15T15:30',
            status: 'expired',
            createdDate: '2023-12-30T14:15'
        },
        {
            id: 'BTC-FWD-1704153600-003',
            counterpartAddress: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
            amount: '0.25000000',
            expiryDate: '2024-06-15T12:00',
            status: 'active',
            createdDate: '2024-01-02T09:30'
        }
    ];
    
    if (sampleContracts.length === 0) {
        contractsList.innerHTML = '<p class="loading-message">No hay contratos disponibles</p>';
        return;
    }
    
    const contractsHTML = sampleContracts.map(contract => `
        <div class="contract-card">
            <div class="contract-header">
                <span class="contract-id">${contract.id}</span>
                <span class="contract-status ${contract.status === 'active' ? 'status-active' : 'status-expired'}">
                    ${contract.status === 'active' ? 'Activo' : 'Vencido'}
                </span>
            </div>
            <div class="contract-details">
                <div class="contract-detail">
                    <div class="contract-detail-label">Contraparte</div>
                    <div class="contract-detail-value">${contract.counterpartAddress.substring(0, 20)}...</div>
                </div>
                <div class="contract-detail">
                    <div class="contract-detail-label">Monto</div>
                    <div class="contract-detail-value">${contract.amount} BTC</div>
                </div>
                <div class="contract-detail">
                    <div class="contract-detail-label">Vencimiento</div>
                    <div class="contract-detail-value">${formatDate(contract.expiryDate)}</div>
                </div>
                <div class="contract-detail">
                    <div class="contract-detail-label">Creado</div>
                    <div class="contract-detail-value">${formatDate(contract.createdDate)}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    contractsList.innerHTML = contractsHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}