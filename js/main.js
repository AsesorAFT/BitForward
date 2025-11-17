// js/main.js
import { initializeSentry } from './sentry-init.js';

// Inicializar Sentry tan pronto como sea posible
initializeSentry();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('¡Interfaz de BitForward cargada y lista!');

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

  const rawContractData = {
    blockchain: formData.get('blockchain'),
    amount: formData.get('amount'),
    counterparty: formData.get('counterparty'),
    executionDate: formData.get('executionDate'),
    strikePrice: formData.get('strikePrice') || '',
    contractType: 'forward'
  };

  let validationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    data: rawContractData
  };

  if (window.bitForwardValidator) {
    validationResult = bitForwardValidator.validateContract(rawContractData);
  }

  if (!validationResult.isValid) {
    const errorCount = validationResult.errors.length;
    notificationSystem.error(
      'Por favor corrige los errores en el formulario',
      {
        title: '❌ Validación Fallida',
        details: `${errorCount} errores encontrados`,
        duration: 5000
      }
    );

    validationResult.errors.forEach(error => {
      notificationSystem.validation(error, { duration: 3000 });
    });
    return;
  }

  if (validationResult.warnings.length > 0) {
    notificationSystem.warning(
      'Advertencias encontradas en el contrato',
      {
        details: validationResult.warnings.join(', '),
        duration: 6000
      }
    );
  }

  const sanitizedData = validationResult.data || rawContractData;
  const payload = {
    blockchain: sanitizedData.blockchain,
    amount: parseFloat(sanitizedData.amount),
    counterparty: sanitizedData.counterparty,
    executionDate: sanitizedData.executionDate,
    strikePrice: sanitizedData.strikePrice || undefined,
    contractType: sanitizedData.contractType || 'forward'
  };

  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Creando contrato...';
  submitButton.disabled = true;

  try {
    const response = await window.bitForwardAPI.createContract(payload);

    if (!response.success) {
      throw new Error(response.message || 'Error al crear el contrato');
    }

    notificationSystem.success(
      '¡Contrato creado exitosamente!',
      {
        title: '✅ Contrato Creado',
        details: `ID: ${response.data.id}`,
        duration: 5000
      }
    );

    if (typeof notificationSystem.contractCreated === 'function') {
      notificationSystem.contractCreated(
        response.data.id,
        payload.blockchain,
        payload.amount
      );
    }

    form.reset();
    clearAllFieldErrors(form);
    await loadContractsFromAPI();

    if (response.data.shareUrl) {
      notificationSystem.info(
        `Enlace para compartir: ${response.data.shareUrl}`,
        {
          title: '🔗 Contrato Compartible',
          duration: 8000
        }
      );
    }
  } catch (error) {
    if (window.bitForwardAPI?.handleError) {
      window.bitForwardAPI.handleError(error, 'creación de contrato');
    } else {
      console.error('Error al crear el contrato:', error);
    }
    notificationSystem.error(
      'Error al crear el contrato',
      {
        details: error.message,
        duration: 5000
      }
    );
  } finally {
    submitButton.textContent = originalText;
    submitButton.disabled = false;
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