/**
 * BitForward Animations & Transitions System
 * Sistema de animaciones y transiciones para mejorar la experiencia de usuario
 */

document.addEventListener('DOMContentLoaded', function () {
  // Inicializar sistema de notificaciones
  initNotificationSystem();

  // Añadir efectos de entrada para elementos
  addEntranceEffects();

  // Inicializar efectos de hover 3D para tarjetas
  init3DCardEffects();

  // Inicializar efectos de paralaje
  initParallaxEffects();

  // Configurar animaciones para elementos interactivos
  setupButtonAnimations();

  // Mejorar accesibilidad para elementos interactivos
  enhanceAccessibility();

  // Mostrar mensajes de bienvenida o notificaciones
  setTimeout(showWelcomeMessage, 2000);
});

/**
 * Sistema de notificaciones
 */
function initNotificationSystem() {
  // Crear contenedor de notificaciones si no existe
  if (!document.getElementById('notification-container')) {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.display = 'flex';
    notificationContainer.style.flexDirection = 'column';
    notificationContainer.style.gap = '10px';
    document.body.appendChild(notificationContainer);
  }

  // Exponer función global
  window.showNotification = showNotification;
}

/**
 * Muestra una notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duración en milisegundos
 */
function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('notification-container');

  // Crear notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  // Estilos base
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.marginBottom = '10px';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  notification.style.gap = '10px';
  notification.style.maxWidth = '350px';
  notification.style.backdropFilter = 'blur(10px)';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(20px)';
  notification.style.transition = 'all 0.3s ease';

  // Configurar colores según tipo
  let iconSvg, backgroundColor, borderColor;

  switch (type) {
    case 'success':
      backgroundColor = 'rgba(34, 197, 94, 0.2)';
      borderColor = '#22c55e';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'warning':
      backgroundColor = 'rgba(245, 158, 11, 0.2)';
      borderColor = '#f59e0b';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    case 'error':
      backgroundColor = 'rgba(239, 68, 68, 0.2)';
      borderColor = '#ef4444';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    default: // info
      backgroundColor = 'rgba(59, 130, 246, 0.2)';
      borderColor = '#3b82f6';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  notification.style.backgroundColor = backgroundColor;
  notification.style.borderLeft = `4px solid ${borderColor}`;

  // Estructura interna
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="notification-icon">
        ${iconSvg}
      </div>
      <div class="notification-content" style="color: #fff;">
        ${message}
      </div>
    </div>
    <button class="close-notification" aria-label="Cerrar" style="background: none; border: none; cursor: pointer; padding: 0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Añadir al contenedor
  container.appendChild(notification);

  // Botón de cerrar
  const closeButton = notification.querySelector('.close-notification');
  closeButton.addEventListener('click', () => {
    removeNotification(notification);
  });

  // Animar entrada
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 50);

  // Auto-cerrar después de la duración
  if (duration) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
}

/**
 * Elimina una notificación con animación
 */
function removeNotification(notification) {
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(20px)';

  setTimeout(() => {
    notification.remove();
  }, 300);
}

/**
 * Muestra un mensaje de bienvenida
 */
function showWelcomeMessage() {
  const user = localStorage.getItem('bitforward_user');

  if (user) {
    showNotification(
      `¡Bienvenido de vuelta, ${user}! El panel de control está actualizado.`,
      'success'
    );
  } else {
    // Solo mostrar si estamos en la página principal y no en el login
    const landingPage = document.querySelector('.landing-page');
    if (landingPage && getComputedStyle(landingPage).display !== 'none') {
      showNotification(
        '¡Bienvenido a BitForward! Explora nuestros servicios DeFi empresariales.',
        'info'
      );
    }
  }
}

/**
 * Añade efectos de entrada para elementos
 */
function addEntranceEffects() {
  const elementsToAnimate = document.querySelectorAll('.feature-card, .metric-card, .stat-card');

  // Configurar Intersection Observer
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(
            () => {
              entry.target.classList.add('animated');
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            },
            100 * Array.from(elementsToAnimate).indexOf(entry.target)
          );

          // Dejar de observar después de animar
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  // Aplicar estilos iniciales y observar
  elementsToAnimate.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    observer.observe(element);
  });
}

/**
 * Inicializa efectos 3D para tarjetas
 */
function init3DCardEffects() {
  const cards = document.querySelectorAll('.feature-card, .glass-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', handleCardMove);
    card.addEventListener('mouseleave', handleCardLeave);
  });
}

/**
 * Maneja el movimiento del mouse sobre las tarjetas para efecto 3D
 */
function handleCardMove(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Calcular la rotación basada en la posición del mouse
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = (y - centerY) / 10;
  const rotateY = (centerX - x) / 10;

  // Aplicar transformación
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

  // Efecto de luz
  const intensity = 0.2;
  const shine = document.createElement('div');
  shine.className = 'card-shine';

  if (!card.querySelector('.card-shine')) {
    shine.style.position = 'absolute';
    shine.style.top = '0';
    shine.style.left = '0';
    shine.style.right = '0';
    shine.style.bottom = '0';
    shine.style.pointerEvents = 'none';
    shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, ${intensity}) 0%, rgba(255, 255, 255, 0) 80%)`;
    shine.style.borderRadius = 'inherit';
    card.appendChild(shine);
  } else {
    card.querySelector('.card-shine').style.background =
      `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, ${intensity}) 0%, rgba(255, 255, 255, 0) 80%)`;
  }
}

/**
 * Maneja la salida del mouse de las tarjetas
 */
function handleCardLeave(e) {
  const card = e.currentTarget;

  // Restaurar posición
  card.style.transform = '';

  // Eliminar efecto de luz
  const shine = card.querySelector('.card-shine');
  if (shine) {
    shine.remove();
  }
}

/**
 * Inicializa efectos de parallax
 */
function initParallaxEffects() {
  // Parallax para el fondo de estrellas
  const starsContainer = document.querySelector('.stars-container');

  if (starsContainer) {
    window.addEventListener('mousemove', e => {
      const moveX = (e.clientX - window.innerWidth / 2) * -0.005;
      const moveY = (e.clientY - window.innerHeight / 2) * -0.005;

      starsContainer.style.transform = `translate(${moveX}%, ${moveY}%)`;
    });
  }

  // Parallax para elementos con atributo data-parallax
  window.addEventListener('scroll', () => {
    const elements = document.querySelectorAll('[data-parallax]');

    elements.forEach(element => {
      const speed = element.getAttribute('data-parallax');
      const rect = element.getBoundingClientRect();
      const scrollPos = window.scrollY;

      // Solo aplicar si está en el viewport
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const yPos = -((scrollPos - rect.top) * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      }
    });
  });
}

/**
 * Configura animaciones para botones
 */
function setupButtonAnimations() {
  const buttons = document.querySelectorAll(
    'button:not(.close-notification), .btn-primary, .btn-secondary, .wallet-btn, .action-btn'
  );

  buttons.forEach(button => {
    // Añadir ripple effect
    button.addEventListener('click', createRippleEffect);

    // Efectos de hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
}

/**
 * Crea efecto de ripple al hacer clic
 */
function createRippleEffect(e) {
  const button = e.currentTarget;

  // Verificar si ya tiene un ripple
  const ripple = document.createElement('span');
  ripple.classList.add('ripple-effect');

  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${e.clientX - rect.left - radius}px`;
  ripple.style.top = `${e.clientY - rect.top - radius}px`;
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s linear';
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';

  // Asegurar que el botón tiene position: relative
  const position = getComputedStyle(button).position;
  if (position === 'static') {
    button.style.position = 'relative';
  }

  button.appendChild(ripple);

  // Remover el ripple después de la animación
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Mejora la accesibilidad para elementos interactivos
 */
function enhanceAccessibility() {
  // Añadir focus visible para navegación por teclado
  const focusableElements = document.querySelectorAll(
    'a, button, input, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach(element => {
    // Añadir estilos cuando el elemento recibe foco mediante teclado
    element.addEventListener('focus', e => {
      if (e.target.matches(':focus-visible')) {
        e.target.style.outline = '2px solid #3b82f6';
        e.target.style.outlineOffset = '2px';
      }
    });

    // Eliminar estilos cuando pierde el foco
    element.addEventListener('blur', e => {
      e.target.style.outline = '';
      e.target.style.outlineOffset = '';
    });
  });
}

// Añadir estilos para la animación de ripple
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
