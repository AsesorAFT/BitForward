/**
 * BitForward Rocket Theme JavaScript
 * Proporciona animaciones de cohete, estrellas y efectos visuales
 * para representar el despegue de BitForward en el mundo DeFi
 */

// Crear y animar estrellas en el fondo
function createStarryBackground() {
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars-container';
  document.body.appendChild(starsContainer);

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const starCount = Math.min(Math.floor((screenWidth * screenHeight) / 10000), 200);

  // Crear estrellas
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Tamaño aleatorio
    const size = Math.random() * 3;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Posición aleatoria
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Duración de parpadeo aleatoria
    const duration = 2 + Math.random() * 4;
    star.style.setProperty('--duration', `${duration}s`);

    // Retraso aleatorio para parpadeos no sincronizados
    star.style.animationDelay = `${Math.random() * 5}s`;

    starsContainer.appendChild(star);
  }
}

// Agregar partículas de fuego a los logos de cohete
function enhanceRocketLogos() {
  const logoWrappers = document.querySelectorAll('.logo-wrapper');

  logoWrappers.forEach(wrapper => {
    // Crear contenedor de partículas
    const particleContainer = document.createElement('div');
    particleContainer.className = 'flame-particles';
    wrapper.appendChild(particleContainer);

    // Generar partículas periódicamente cuando el mouse está sobre el logo
    wrapper.addEventListener('mouseenter', () => {
      wrapper.dataset.particlesActive = 'true';
      generateFlameParticles(particleContainer);
    });

    wrapper.addEventListener('mouseleave', () => {
      wrapper.dataset.particlesActive = 'false';
    });
  });
}

// Generar partículas de fuego
function generateFlameParticles(container) {
  if (container.parentElement.dataset.particlesActive !== 'true') {return;}

  // Crear partícula
  const particle = document.createElement('div');
  particle.className = 'flame-particle';

  // Color aleatorio de llama
  const colors = [
    'rgba(239, 68, 68, 0.7)', // Rojo
    'rgba(249, 115, 22, 0.7)', // Naranja
    'rgba(245, 158, 11, 0.7)', // Amarillo naranja
    'rgba(252, 211, 77, 0.5)'  // Amarillo claro
  ];

  particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

  // Tamaño aleatorio
  const size = Math.random() * 4 + 2;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;

  // Posición inicial
  particle.style.left = `${Math.random() * 20 - 10 + 10}px`; // Centrado con variación
  particle.style.bottom = '0px';

  // Dirección aleatoria para la caída
  const offsetX = Math.random() * 2 - 1; // -1 a 1
  const offsetY = Math.random() * 2 + 1; // 1 a 3

  particle.style.setProperty('--offset-x', offsetX);
  particle.style.setProperty('--offset-y', offsetY);

  // Añadir al contenedor
  container.appendChild(particle);

  // Eliminar después de la animación
  setTimeout(() => {
    particle.remove();
  }, 600);

  // Continuar generando partículas si sigue activo
  if (container.parentElement.dataset.particlesActive === 'true') {
    setTimeout(() => generateFlameParticles(container), Math.random() * 100 + 50);
  }
}

// Crear efecto de partículas
function createParticleExplosion(x, y, count, colors) {
  const particlesContainer = document.querySelector('.particles-container') ||
    (() => {
      const container = document.createElement('div');
      container.className = 'particles-container';
      document.body.appendChild(container);
      return container;
    })();

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Tamaño aleatorio
    const size = Math.random() * 5 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Posición inicial
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    // Color aleatorio de la lista
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    // Dirección aleatoria
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    particle.style.setProperty('--x', `${Math.cos(angle) * speed}`);
    particle.style.setProperty('--y', `${Math.sin(angle) * speed}`);

    // Duración aleatoria
    const duration = Math.random() * 0.5 + 0.7;
    particle.style.setProperty('--duration', `${duration}s`);

    particlesContainer.appendChild(particle);

    // Eliminar partícula después de la animación
    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
}

// Crear estrellas fugaces aleatorias
function createShootingStar() {
  const particlesContainer = document.querySelector('.particles-container') ||
    (() => {
      const container = document.createElement('div');
      container.className = 'particles-container';
      document.body.appendChild(container);
      return container;
    })();

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const star = document.createElement('div');
  star.className = 'shooting-star';

  // Posición inicial aleatoria (arriba o a la izquierda)
  const startFromTop = Math.random() > 0.5;
  let startX, startY, endX, endY, rotation;

  if (startFromTop) {
    startX = Math.random() * screenWidth;
    startY = -10;
    endX = startX + (Math.random() * 400 - 200);
    endY = screenHeight + 10;
    rotation = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  } else {
    startX = -10;
    startY = Math.random() * screenHeight;
    endX = screenWidth + 10;
    endY = startY + (Math.random() * 400 - 200);
    rotation = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  }

  star.style.left = `${startX}px`;
  star.style.top = `${startY}px`;

  // Establecer variables para la animación
  star.style.setProperty('--end-x', `${endX - startX}px`);
  star.style.setProperty('--end-y', `${endY - startY}px`);
  star.style.setProperty('--rotation', `${rotation}deg`);

  // Duración aleatoria
  const duration = Math.random() * 0.5 + 0.5;
  star.style.setProperty('--duration', `${duration}s`);

  particlesContainer.appendChild(star);

  // Eliminar estrella fugaz después de la animación
  setTimeout(() => {
    star.remove();
  }, duration * 1000);
}

// Agregar efecto 3D a las tarjetas
function addTiltEffect() {
  const cards = document.querySelectorAll('.metric-card, .action-btn, .glass-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = (y - centerY) / 10;
      const tiltY = (centerX - x) / 10;

      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// Animar los iconos cuando aparecen en pantalla
function animateIconsOnScroll() {
  const icons = document.querySelectorAll('.metric-icon, .action-icon');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'iconPop 0.5s forwards';
        observer.unobserve(entry.target);
      }
    });
  });

  icons.forEach(icon => {
    observer.observe(icon);
  });
}

// Crear efecto de resplandor en elementos destacados
function addGlowEffect() {
  const elements = document.querySelectorAll('.wallet-btn, .btn-primary, .status-badge.active');

  elements.forEach(element => {
    element.classList.add('rocket-glow');
  });
}

// Animación de progreso para porcentajes y métricas
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetWidth = entry.target.getAttribute('data-value') || '0%';
        entry.target.style.width = targetWidth;
        observer.unobserve(entry.target);
      }
    });
  });

  progressBars.forEach(bar => {
    observer.observe(bar);
  });
}

// Agregar estilo de tabla futurista
function enhanceTables() {
  const tables = document.querySelectorAll('table');

  tables.forEach(table => {
    table.classList.add('rocket-table');
  });
}

// Crear estrellas fugaces periódicamente
function startShootingStars() {
  // Crear una estrella fugaz inicial
  setTimeout(createShootingStar, 2000);

  // Crear estrellas fugaces periódicamente
  setInterval(() => {
    if (Math.random() < 0.3) { // 30% de probabilidad cada vez
      createShootingStar();
    }
  }, 5000);
}

// Inicializar todos los efectos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Detectar si el navegador soporta SVG avanzado
  const svgSupported = window.SVGElement && window.SVGSVGElement;

  createStarryBackground();
  enhanceRocketLogos();
  addTiltEffect();
  animateIconsOnScroll();
  addGlowEffect();
  animateProgressBars();
  enhanceTables();
  startShootingStars();

  // Inicializar las animaciones SVG avanzadas
  if (typeof window.RocketAnimations !== 'undefined') {
    window.RocketAnimations.initialize();
  }

  // Agregar estilo CSS para la animación de iconos
  const style = document.createElement('style');
  style.textContent = `
    @keyframes iconPop {
      0% { transform: scale(0); opacity: 0; }
      70% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Detectar clics en los logos de cohete para crear explosiones
  document.querySelectorAll('.animated-logo').forEach(logo => {
    logo.addEventListener('click', (e) => {
      const rect = logo.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.bottom;

      // Colores de las partículas
      const colors = [
        '#F97316', // Naranja
        '#F59E0B', // Amarillo naranja
        '#3B82F6', // Azul
        '#06B6D4'  // Cian
      ];

      // Crear explosión de partículas
      createParticleExplosion(x, y, 20, colors);
    });
  });
});

// Recrear estrellas cuando cambie el tamaño de la ventana
window.addEventListener('resize', () => {
  const starsContainer = document.querySelector('.stars-container');
  if (starsContainer) {
    starsContainer.remove();
    createStarryBackground();
  }
});
