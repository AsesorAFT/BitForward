// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Interfaz de BitForward cargada y lista!");

    // Simulando datos de contratos existentes
    const mockContracts = [
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

    // Cargar y mostrar contratos existentes
    loadContracts(mockContracts);

    // Configurar el formulario de creación de contratos
    const contractForm = document.getElementById('contract-form');
    if (contractForm) {
        contractForm.addEventListener('submit', handleContractSubmission);
    }
});

/**
 * Carga y muestra la lista de contratos
 */
function loadContracts(contracts) {
    const contractsList = document.getElementById('contracts-list');
    if (!contractsList) return;

    if (contracts.length === 0) {
        contractsList.innerHTML = '<p class="no-contracts">No tienes contratos aún. ¡Crea tu primer contrato!</p>';
        return;
    }

    let contractsHTML = '';
    contracts.forEach(contract => {
        contractsHTML += `
            <div class="contract-card" data-blockchain="${contract.blockchain}">
                <div class="contract-header">
                    <span class="blockchain-badge ${contract.blockchain}">${contract.blockchain.toUpperCase()}</span>
                    <span class="status-badge ${contract.status}">${contract.status.toUpperCase()}</span>
                </div>
                <div class="contract-details">
                    <p><strong>Cantidad:</strong> ${contract.amount} ${contract.blockchain === 'bitcoin' ? 'BTC' : 'SOL'}</p>
                    <p><strong>Contraparte:</strong> ${contract.counterparty}</p>
                    <p><strong>Fecha de Ejecución:</strong> ${formatDate(contract.executionDate)}</p>
                    <p><strong>Creado:</strong> ${formatDate(contract.createdAt)}</p>
                </div>
                <div class="contract-actions">
                    <button class="btn-secondary" onclick="viewContractDetails(${contract.id})">Ver Detalles</button>
                </div>
            </div>
        `;
    });

    contractsList.innerHTML = contractsHTML;
}

/**
 * Maneja el envío del formulario de creación de contratos
 */
function handleContractSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const blockchain = formData.get('blockchain');
    const amount = formData.get('amount');
    const counterparty = formData.get('counterparty');
    const executionDate = formData.get('executionDate');

    if (!blockchain || !amount || !counterparty || !executionDate) {
        alert('Por favor, completa todos los campos del formulario.');
        return;
    }

    // Llamar a la función apropiada según la blockchain seleccionada
    if (blockchain === 'bitcoin') {
        crearContratoBitcoin(amount, counterparty, executionDate);
    } else if (blockchain === 'solana') {
        crearContratoSolana(amount, counterparty, executionDate);
    }
}

/**
 * Función placeholder para crear contratos en Bitcoin
 */
function crearContratoBitcoin(amount, counterparty, executionDate) {
    console.log('Creando contrato Bitcoin:', { amount, counterparty, executionDate });
    
    // Simular proceso de creación
    alert(`¡Contrato Bitcoin creado exitosamente!\n\nDetalles:\n- Cantidad: ${amount} BTC\n- Contraparte: ${counterparty}\n- Fecha de ejecución: ${executionDate}\n\nEn una implementación real, aquí se generaría el Bitcoin Script y se crearía la transacción.`);
    
    // Limpiar formulario
    document.getElementById('contract-form').reset();
    
    // TODO: Aquí se implementaría la lógica real de Bitcoin Script
    // - Generar el script de contrato
    // - Crear la transacción multi-sig
    // - Manejar las claves públicas de las partes
}

/**
 * Función placeholder para crear contratos en Solana
 */
function crearContratoSolana(amount, counterparty, executionDate) {
    console.log('Creando contrato Solana:', { amount, counterparty, executionDate });
    
    // Simular proceso de creación
    alert(`¡Contrato Solana creado exitosamente!\n\nDetalles:\n- Cantidad: ${amount} SOL\n- Contraparte: ${counterparty}\n- Fecha de ejecución: ${executionDate}\n\nEn una implementación real, aquí se crearía el programa Solana y se inicializaría la cuenta del contrato.`);
    
    // Limpiar formulario
    document.getElementById('contract-form').reset();
    
    // TODO: Aquí se implementaría la lógica real de Solana
    // - Crear el programa de contrato
    // - Inicializar la cuenta del contrato
    // - Configurar las instrucciones de ejecución
}

/**
 * Función para ver detalles de un contrato específico
 */
function viewContractDetails(contractId) {
    console.log('Visualizando detalles del contrato:', contractId);
    alert(`Funcionalidad de detalles del contrato ${contractId} - Por implementar en futuras versiones.`);
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}