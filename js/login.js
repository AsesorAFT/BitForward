const statusEl = () => document.getElementById('login-status');

function showStatus(message, isError = false) {
  const el = statusEl();
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#ffb3b3' : '#9bdcff';
  el.setAttribute('aria-live', 'polite');
}

function togglePassword() {
  const input = document.getElementById('password');
  const btn = document.getElementById('toggle-password');
  if (!input || !btn) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.textContent = isPassword ? '🙈' : '👁';
}

async function login(emailOrUser, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: emailOrUser, password }),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Respuesta inválida del servidor. Intenta de nuevo.');
  }
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || data?.msg || 'Credenciales inválidas');
  }
  return data;
}

function persistTokens(tokens, remember) {
  if (!tokens) return;
  if (remember) {
    localStorage.setItem('bf_access_token', tokens.accessToken);
    localStorage.setItem('bf_refresh_token', tokens.refreshToken);
  } else {
    sessionStorage.setItem('bf_access_token', tokens.accessToken);
    sessionStorage.setItem('bf_refresh_token', tokens.refreshToken);
  }
}

function setupWalletButton() {
  const walletBtn = document.getElementById('wallet-login');
  if (!walletBtn) return;
  walletBtn.addEventListener('click', () => {
    window.location.href = 'test-auth.html';
  });
}

function bindForm() {
  const form = document.getElementById('login-form');
  if (!form) return;
  // Llevar el foco al primer campo al cargar
  const usernameInput = document.getElementById('username');
  usernameInput?.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('username')?.value?.trim();
    const pwd = document.getElementById('password')?.value;
    const remember = document.getElementById('remember')?.checked;

    if (!username || !pwd) {
      showStatus('Completa usuario y contraseña', true);
      return;
    }

    try {
      showStatus('Validando...');
      const result = await login(username, pwd);
      persistTokens(result.data?.tokens, remember);
      showStatus('Acceso correcto, redirigiendo...');
      setTimeout(() => {
        window.location.href = 'mission-control.html';
      }, 600);
    } catch (error) {
      showStatus(error.message, true);
    }
  });
}

function init() {
  bindForm();
  setupWalletButton();
  document.getElementById('toggle-password')?.addEventListener('click', togglePassword);
}

document.addEventListener('DOMContentLoaded', init);
