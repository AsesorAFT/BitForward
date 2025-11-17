/**
 * Hero Section Interactions for BitForward Landing Page
 *
 * This script handles specific UI interactions for the hero section,
 * such as the "Connect Wallet" button functionality.
 */
document.addEventListener('DOMContentLoaded', () => {
  const connectWalletBtn = document.getElementById('connect-wallet-btn');

  if (!connectWalletBtn) {
    return;
  }

  // Check if a global wallet handler exists (from app.js or similar)
  const handleGlobalWalletConnect = () => {
    if (window.app && typeof window.app.handleWalletConnect === 'function') {
      // For now, we'll simulate connecting with a default wallet type
      window.app.handleWalletConnect('MetaMask');
      return true;
    }
    return false;
  };

  // Fallback function if no global handler is found
  const handleLocalWalletConnect = () => {
    console.log('Simulating wallet connection...');

    connectWalletBtn.disabled = true;
    connectWalletBtn.textContent = 'Conectando...';

    // Simulate a network request
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo

      if (success) {
        connectWalletBtn.textContent = 'Wallet Conectada';
        connectWalletBtn.classList.remove('btn-outline');
        connectWalletBtn.classList.add('btn-success-custom'); // A new class for styling
        console.log('Wallet connected successfully (simulated).');

        // Optionally, redirect or update UI
        // window.location.href = '/dashboard.html';

      } else {
        connectWalletBtn.textContent = 'Error al Conectar';
        connectWalletBtn.classList.remove('btn-outline');
        connectWalletBtn.classList.add('btn-error-custom'); // A new class for styling
        console.error('Failed to connect wallet (simulated).');

        // Re-enable after a delay
        setTimeout(() => {
          connectWalletBtn.disabled = false;
          connectWalletBtn.textContent = 'Conectar Wallet';
          connectWalletTbn.classList.remove('btn-error-custom');
          connectWalletBtn.classList.add('btn-outline');
        }, 2000);
      }
    }, 1500);
  };

  connectWalletBtn.addEventListener('click', () => {
    // Try to use the global handler first
    if (!handleGlobalWalletConnect()) {
      // If it doesn't exist, use the local fallback
      handleLocalWalletConnect();
    }
  });

  // Add custom styles for the new button states
  const style = document.createElement('style');
  style.textContent = `
        .btn-success-custom {
            background-color: var(--color-success);
            color: #fff;
            border-color: var(--color-success);
        }
        .btn-error-custom {
            background-color: var(--color-error);
            color: #fff;
            border-color: var(--color-error);
        }
    `;
  document.head.appendChild(style);
});
