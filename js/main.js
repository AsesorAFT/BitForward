// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log("¡Interfaz de BitForward cargada y lista!");

    // Configurar el formulario de creación de contratos
    const contractForm = document.getElementById('contract-form');
    if (contractForm) {
        contractForm.addEventListener('submit', handleContractSubmission);
        
        // Agregar validación en tiempo real
        setupRealTimeValidation(contractForm);
    }

    // Cargar contratos desde la API
    await loadContractsFromAPI();

    // Verificar estado de la API
    try {
        const healthResponse = await window.bitForwardAPI.getHealth();
        if (healthResponse.success) {
            console.log('✅ API conectada exitosamente');
        }
    } catch (error) {
        console.warn('⚠️ API no disponible, usando modo offline');
        loadMockContracts(); // Fallback a datos simulados
    }

    // Mostrar notificación de bienvenida
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.info(
            'BitForward v2.0 con Motor de Persistencia cargado exitosamente',
            {
                title: '🚀 Sistema Iniciado',
                details: 'Todas las funcionalidades están disponibles',
                duration: 3000
            }
        );
    }
});

/**
 * Maneja el envío del formulario de creación de contratos
 */
async function handleContractSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Recopilar datos del contrato
    const contractData = {
        blockchain: formData.get('blockchain'),
        amount: parseFloat(formData.get('amount')),
        counterpartyAddress: formData.get('counterparty'),
        executionDate: formData.get('executionDate'),
        contractType: 'forward'
    };

    // Validación del lado del cliente
    if (window.bitForwardValidator) {
        const errors = bitForwardValidator.validateContract(contractData);
        if (errors.length > 0) {
            notificationSystem.error(
                'Por favor corrige los errores en el formulario',
                {
                    title: '❌ Validación Fallida',
                    details: `${errors.length} errores encontrados`,
                    duration: 5000
                }
            );
            
            // Mostrar primer error
            errors.forEach(error => {
                notificationSystem.validation(error, { duration: 3000 });
            });
            return;
        }
    }

    // Mostrar indicador de carga
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creando contrato...';
    submitButton.disabled = true;

    try {
        // Crear contrato usando la API
        const response = await window.bitForwardAPI.createContract(contractData);
        
        if (response.success) {
            // Éxito
            notificationSystem.success(
                '¡Contrato creado exitosamente!',
                {
                    title: '✅ Contrato Creado',
                    details: `ID: ${response.data.id}`,
                    duration: 5000
                }
            );

            // Limpiar formulario
            form.reset();
            
            // Limpiar validaciones visuales
            clearAllFieldErrors(form);

            // Recargar contratos
            await loadContractsFromAPI();

            // Mostrar URL para compartir
            if (response.data.shareUrl) {
                notificationSystem.info(
                    `Enlace para compartir: ${response.data.shareUrl}`,
                    {
                        title: '� Contrato Compartible',
                        duration: 8000
                    }
                );
            }

        } else {
            throw new Error(response.message || 'Error al crear el contrato');
        }

    } catch (error) {
        window.bitForwardAPI.handleError(error, 'creación de contrato');
    } finally {
        // Restaurar botón
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

/**
 * Configura validación en tiempo real para el formulario
 */
function setupRealTimeValidation(form) {
    const fields = {
        'contract-amount': 'amount',
        'counterparty': 'counterparty',
        'execution-date': 'executionDate',
        'blockchain-select': 'blockchain'
    };

    Object.entries(fields).forEach(([elementId, fieldName]) => {
        const element = form.querySelector(`#${elementId}`);
        if (element) {
            // Validar al salir del campo (blur)
            element.addEventListener('blur', () => {
                validateFieldRealTime(element, fieldName, form);
            });

            // Validar mientras escribe (para campos de texto)
            if (element.type === 'text' || element.type === 'number') {
                let timeout;
                element.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        validateFieldRealTime(element, fieldName, form);
                    }, 500); // Esperar 500ms después de dejar de escribir
                });
            }

            // Validar al cambiar (para selects y dates)
            if (element.type === 'select-one' || element.type === 'date') {
                element.addEventListener('change', () => {
                    validateFieldRealTime(element, fieldName, form);
                });
            }
        }
    });
}

/**
 * Valida un campo específico en tiempo real
 */
function validateFieldRealTime(element, fieldName, form) {
    if (!window.bitForwardValidator) return;

    // Limpiar errores previos
    clearFieldError(element);

    if (!element.value || element.value.trim() === '') {
        return; // No validar campos vacíos en tiempo real
    }

    // Obtener contexto para validación
    const context = getValidationContext(form);
    
    // Validar el campo
    const errors = bitForwardValidator.validateField(fieldName, element.value, context);
    
    if (errors.length > 0) {
        showFieldError(element, errors[0]);
    } else {
        showFieldSuccess(element);
    }
}

/**
 * Obtiene el contexto necesario para validación
 */
function getValidationContext(form) {
    const formData = new FormData(form);
    return {
        blockchain: formData.get('blockchain'),
        amount: formData.get('amount'),
        counterparty: formData.get('counterparty'),
        executionDate: formData.get('executionDate')
    };
}

/**
 * Muestra error en un campo específico
 */
function showFieldError(element, message) {
    element.classList.add('field-error');
    element.classList.remove('field-success');
    
    // Crear o actualizar mensaje de error
    let errorElement = element.parentNode.querySelector('.field-error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        element.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Muestra éxito en un campo específico
 */
function showFieldSuccess(element) {
    element.classList.add('field-success');
    element.classList.remove('field-error');
    clearFieldError(element);
}

/**
 * Limpia errores de un campo
 */
function clearFieldError(element) {
    element.classList.remove('field-error', 'field-success');
    const errorElement = element.parentNode.querySelector('.field-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Carga contratos desde la API
 */
async function loadContractsFromAPI() {
    try {
        const response = await window.bitForwardAPI.getContracts({
            limit: 20,
            sortBy: 'created_at',
            sortOrder: 'DESC'
        });

        if (response.success) {
            loadContracts(response.data.contracts);
            
            // Actualizar estadísticas si están disponibles
            if (response.data.contracts.length > 0) {
                await updateDashboardStats();
            }
        } else {
            throw new Error(response.message || 'Error al cargar contratos');
        }

    } catch (error) {
        console.error('Error cargando contratos:', error);
        
        // Fallback a datos mock
        loadMockContracts();
    }
}

/**
 * Carga datos mock como fallback
 */
function loadMockContracts() {
    const mockContracts = [
        {
            id: 'mock-1',
            blockchain: 'bitcoin',
            amount: 0.05,
            counterparty_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            execution_date: '2024-12-15',
            status: 'active',
            created_at: '2024-09-01'
        },
        {
            id: 'mock-2',
            blockchain: 'ethereum', 
            amount: 2.5,
            counterparty_address: '0x742d35Cc6634C0532925a3b8D4e6b8f8Ca3EB3',
            execution_date: '2024-11-30',
            status: 'pending',
            created_at: '2024-09-10'
        },
        {
            id: 'mock-3',
            blockchain: 'solana',
            amount: 10.0,
            counterparty_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
            execution_date: '2024-10-20',
            status: 'completed',
            created_at: '2024-08-15'
        }
    ];

    loadContracts(mockContracts);
    
    // Mostrar notificación de modo offline
    if (window.notificationSystem) {
        notificationSystem.warning(
            'Modo offline activado - Usando datos de ejemplo',
            {
                title: '⚠️ Sin conexión a API',
                duration: 4000
            }
        );
    }
}

/**
 * Actualiza las estadísticas del dashboard desde la API
 */
async function updateDashboardStats() {
    try {
        const response = await window.bitForwardAPI.getDashboardStats();
        
        if (response.success) {
            const stats = response.data.overview;
            updateContractsStats(
                stats.totalContracts,
                stats.activeContracts,
                stats.completedContracts
            );
        }

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

/**
 * Limpia todos los errores de campos en el formulario
 */
function clearAllFieldErrors(form) {
    const fields = form.querySelectorAll('input, select');
    fields.forEach(field => {
        clearFieldError(field);
    });
}
    const contractsList = document.getElementById('contracts-list');
    
    if (!contracts || contracts.length === 0) {
        contractsList.innerHTML = `
            <div class="no-contracts">
                <p>📋 No tienes contratos creados aún.</p>
                <p>¡Crea tu primer contrato usando el formulario de arriba!</p>
            </div>
        `;
        updateContractsStats(0, 0, 0);
        return;
    }

    // Actualizar estadísticas
    const activeCount = contracts.filter(c => c.status === 'activo').length;
    const completedCount = contracts.filter(c => c.status === 'completado').length;
    updateContractsStats(contracts.length, activeCount, completedCount);

/**
 * Carga y muestra los contratos en la interfaz
 */
function loadContracts(contracts) {
    const contractsList = document.getElementById('contracts-list');
    
    if (!contracts || contracts.length === 0) {
        contractsList.innerHTML = `
            <div class="no-contracts">
                <p>📋 No tienes contratos creados aún.</p>
                <p>¡Crea tu primer contrato usando el formulario de arriba!</p>
            </div>
        `;
        updateContractsStats(0, 0, 0);
        return;
    }

    // Actualizar estadísticas
    const activeCount = contracts.filter(c => c.status === 'active').length;
    const completedCount = contracts.filter(c => c.status === 'completed').length;
    updateContractsStats(contracts.length, activeCount, completedCount);

    const contractsHTML = contracts.map(contract => `
        <div class="contract-card" data-contract-id="${contract.id}">
            <div class="contract-header">
                <span class="blockchain-badge ${contract.blockchain}">${contract.blockchain.toUpperCase()}</span>
                <span class="status-badge ${contract.status}">${contract.status.toUpperCase()}</span>
            </div>
            <div class="contract-details">
                <p><strong>💰 Cantidad:</strong> <span>${contract.amount} ${contract.blockchain === 'bitcoin' ? 'BTC' : contract.blockchain === 'ethereum' ? 'ETH' : 'SOL'}</span></p>
                <p><strong>👤 Contraparte:</strong> <span class="address-short">${shortenAddress(contract.counterparty_address || contract.counterparty)}</span></p>
                <p><strong>📅 Ejecución:</strong> <span>${formatDate(contract.execution_date || contract.executionDate)}</span></p>
                <p><strong>📝 Creado:</strong> <span>${formatDate(contract.created_at || contract.createdAt)}</span></p>
            </div>
            <div class="contract-actions">
                <button class="btn-secondary" onclick="viewContractDetails('${contract.id}')">
                    Ver Detalles
                </button>
            </div>
        </div>
    `).join('');

    contractsList.innerHTML = contractsHTML;
}

/**
 * Actualiza las estadísticas de contratos
 */
function updateContractsStats(total, active, completed) {
    const totalElement = document.getElementById('total-contracts');
    const activeElement = document.getElementById('active-contracts');
    const completedElement = document.getElementById('completed-contracts');
    
    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
    if (completedElement) completedElement.textContent = completed;
}

/**
 * Acorta una dirección para mostrarla de forma legible
 */
function shortenAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formatea una fecha para mostrarla de forma legible
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Muestra una vista previa del contrato antes de crearlo
 */
function previewContract() {
    const form = document.getElementById('contract-form');
    const formData = new FormData(form);
    
    // Validar primero
    if (window.bitForwardValidator) {
        const contractData = {
            blockchain: formData.get('blockchain'),
            amount: parseFloat(formData.get('amount')),
            counterparty: formData.get('counterparty'),
            executionDate: formData.get('executionDate')
        };
        
        const errors = bitForwardValidator.validateContract(contractData);
        if (errors.length > 0) {
            notificationSystem.error(
                'Corrige los errores antes de ver la vista previa',
                {
                    title: '❌ Validación Fallida',
                    details: `${errors.length} errores encontrados`,
                    duration: 5000
                }
            );
            return;
        }
    }
    
    // Mostrar vista previa
    const preview = `
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto;">
            <h3 style="color: #2c3e50; margin-top: 0;">📋 Vista Previa del Contrato</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>🔗 Blockchain:</strong> ${formData.get('blockchain').toUpperCase()}</p>
                <p><strong>💰 Cantidad:</strong> ${formData.get('amount')} ${getTokenSymbol(formData.get('blockchain'))}</p>
                <p><strong>👤 Contraparte:</strong> ${formData.get('counterparty')}</p>
                <p><strong>📅 Fecha de Ejecución:</strong> ${formatDate(formData.get('executionDate'))}</p>
            </div>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
                <p style="margin: 0; color: #27ae60; font-weight: 600;">✅ Contrato validado y listo para crear</p>
            </div>
        </div>
    `;
    
    notificationSystem.info(
        'Vista previa generada',
        {
            title: '👁️ Vista Previa',
            details: 'El contrato está listo para ser creado',
            duration: 8000
        }
    );
    
    // En una implementación real, aquí abriríamos un modal
    console.log('Vista previa del contrato:', preview);
}

/**
 * Obtiene el símbolo del token según la blockchain
 */
function getTokenSymbol(blockchain) {
    const symbols = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        solana: 'SOL'
    };
    return symbols[blockchain] || 'TOKEN';
}

/**
 * Muestra detalles completos de un contrato
 */
function viewContractDetails(contractId) {
    notificationSystem.info(
        `Cargando detalles del contrato #${contractId}`,
        {
            title: '📄 Detalles del Contrato',
            details: 'Función en desarrollo',
            duration: 3000
        }
    );
    
    // En una implementación real, aquí cargaríamos y mostraríamos los detalles completos
    console.log(`Ver detalles del contrato ${contractId}`);
}

/**
 * Maneja el envío del formulario de creación de contratos con validación avanzada
 */
async function handleContractSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contractData = {
        blockchain: formData.get('blockchain'),
        amount: formData.get('amount'),
        counterparty: formData.get('counterparty'),
        executionDate: formData.get('executionDate'),
        strikePrice: 50000, // Precio por defecto, en producción vendría del formulario
        contractType: 'standard',
        collateral: 10
    };

    // Validar usando el sistema de validación
    const validationResult = bitForwardValidator.validateContract(contractData);
    
    if (!validationResult.isValid) {
        // Mostrar errores de validación
        notificationSystem.validationErrors(
            validationResult.errors, 
            validationResult.warnings
        );
        return;
    }

    // Mostrar warnings si los hay
    if (validationResult.warnings.length > 0) {
        notificationSystem.warning(
            'Advertencias encontradas en el contrato',
            {
                details: validationResult.warnings.join(', '),
                duration: 6000
            }
        );
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando contrato...';
    
    try {
        // Usar datos sanitizados de la validación
        const contract = await bitForward.createForwardContract(validationResult.data);
        
        // Mostrar notificación de éxito
        notificationSystem.contractCreated(
            contract.id, 
            contract.blockchain, 
            contract.amount
        );
        
        // Limpiar formulario
        event.target.reset();
        
        // Actualizar dashboard si existe
        if (window.bitForwardApp?.dashboard) {
            window.bitForwardApp.dashboard.updateAllWidgets();
        }
        
    } catch (error) {
        console.error('Error al crear contrato:', error);
        notificationSystem.error(
            'Error al crear el contrato',
            {
                details: error.message,
                duration: 8000
            }
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Función placeholder para crear contratos en Bitcoin
 */
function crearContratoBitcoin(amount, counterparty, executionDate) {
    console.log('Creando contrato Bitcoin:', { amount, counterparty, executionDate });
    
    // Simular proceso de creación
    showSuccess(`¡Contrato Bitcoin creado exitosamente!\n\nDetalles:\n- Cantidad: ${amount} BTC\n- Contraparte: ${counterparty}\n- Fecha de ejecución: ${formatDate(executionDate)}`);
    
    // Limpiar formulario
    document.getElementById('contract-form').reset();
    
    // TODO: Aquí se implementaría la lógica real de Bitcoin Script
    // - Generar el script de contrato
    // - Crear la transacción multi-sig
    // - Manejar las claves públicas de las partes
    
    // Usar el prototipo BitForward
    if (typeof bitForward !== 'undefined') {
        const contract = bitForward.createForwardContract('bitcoin', amount, counterparty, executionDate, null);
        if (contract) {
            console.log('Contrato registrado en BitForward:', contract);
        }
    }
}

/**
 * Función placeholder para crear contratos en Solana
 */
function crearContratoSolana(amount, counterparty, executionDate) {
    console.log('Creando contrato Solana:', { amount, counterparty, executionDate });
    
    // Simular proceso de creación
    showSuccess(`¡Contrato Solana creado exitosamente!\n\nDetalles:\n- Cantidad: ${amount} SOL\n- Contraparte: ${counterparty}\n- Fecha de ejecución: ${formatDate(executionDate)}`);
    
    // Limpiar formulario
    document.getElementById('contract-form').reset();
    
    // TODO: Aquí se implementaría la lógica real de Solana
    // - Crear el programa de contrato
    // - Inicializar la cuenta del contrato
    // - Configurar las instrucciones de ejecución
    
    // Usar el prototipo BitForward
    if (typeof bitForward !== 'undefined') {
        const contract = bitForward.createForwardContract('solana', amount, counterparty, executionDate, null);
        if (contract) {
            console.log('Contrato registrado en BitForward:', contract);
        }
    }
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

/**
 * Valida direcciones de blockchain
 */
function validateAddress(address, blockchain) {
    if (blockchain === 'bitcoin') {
        // Validar formato de dirección Bitcoin (Legacy, P2SH, Bech32)
        return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    } else if (blockchain === 'solana') {
        // Validar formato de dirección Solana (Base58)
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    return false;
}

/**
 * Valida que la fecha de ejecución sea futura
 */
function validateExecutionDate(dateString) {
    const executionDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    return executionDate >= today;
}

/**
 * Muestra mensajes de error al usuario
 */
function showError(message) {
    // Crear elemento de notificación si no existe
    let errorDiv = document.getElementById('error-notification');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #e74c3c;
            color: white;
            padding: 1rem;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Muestra mensajes de éxito al usuario
 */
function showSuccess(message) {
    let successDiv = document.getElementById('success-notification');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #27ae60;
            color: white;
            padding: 1rem;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}