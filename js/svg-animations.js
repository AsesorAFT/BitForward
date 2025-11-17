/**
 * BitForward SVG Animation Manager
 * Controla y mejora las animaciones del logo SVG
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeRocketAnimations();
});

/**
 * Inicializa las animaciones del cohete SVG
 */
function initializeRocketAnimations() {
  // Obtener todas las instancias del logo animado
  const animatedLogos = document.querySelectorAll('.animated-logo');

  // Configurar cada instancia
  animatedLogos.forEach(logo => {
    setupSvgInteractivity(logo);
  });

  // Aplicar efectos adicionales cuando se detecte soporte SVG completo
  if (window.SVGElement && window.SVGSVGElement) {
    console.log('Soporte SVG completo detectado - activando animaciones avanzadas');
    enableAdvancedAnimations();
  }
}

/**
 * Configura la interactividad del SVG
 */
function setupSvgInteractivity(logoElement) {
  // Asegurarse de que el SVG se cargue completamente
  logoElement.addEventListener('load', () => {
    // Intentar acceder al documento SVG
    try {
      const svgDoc = logoElement.contentDocument;
      if (!svgDoc) {return;}

      // Encontrar elementos animables dentro del SVG
      const flamesGroup = svgDoc.querySelector('.flames');
      const starsGroup = svgDoc.querySelector('.stars');

      if (flamesGroup) {
        // Aumentar la animación de las llamas al hacer hover
        logoElement.addEventListener('mouseenter', () => {
          const flamePaths = flamesGroup.querySelectorAll('path');
          flamePaths.forEach(path => {
            if (path.getAnimations()) {
              path.getAnimations().forEach(anim => {
                anim.playbackRate = 2.0; // Acelerar animación
              });
            }
          });
        });

        logoElement.addEventListener('mouseleave', () => {
          const flamePaths = flamesGroup.querySelectorAll('path');
          flamePaths.forEach(path => {
            if (path.getAnimations()) {
              path.getAnimations().forEach(anim => {
                anim.playbackRate = 1.0; // Restaurar velocidad normal
              });
            }
          });
        });
      }
    } catch (e) {
      console.warn('No se pudo acceder al documento SVG:', e);
    }
  });
}

/**
 * Habilita animaciones avanzadas para navegadores modernos
 */
function enableAdvancedAnimations() {
  // Comprueba si se pueden crear elementos SVG dinámicamente
  try {
    // Crear un efecto de partículas de estrellas en el fondo
    createStarryBackground();

    // Configurar animación mejorada para el hover
    const logos = document.querySelectorAll('.animated-logo');
    logos.forEach(logo => {
      logo.addEventListener('mouseenter', createRocketBlastParticles);
    });
  } catch (e) {
    console.warn('No se pudieron habilitar animaciones avanzadas:', e);
  }
}

/**
 * Crea efecto de fondo estrellado
 */
function createStarryBackground() {
  const container = document.createElement('div');
  container.className = 'stars-container';
  document.body.appendChild(container);

  // Crear estrellas aleatorias
  for (let i = 0; i < 50; i++) {
    createStar(container);
  }
}

/**
 * Crea una estrella en el contenedor
 */
function createStar(container) {
  const star = document.createElement('div');
  star.className = 'star';

  // Posición aleatoria
  const x = Math.random() * 100;
  const y = Math.random() * 100;

  // Tamaño aleatorio
  const size = Math.random() * 2 + 1;

  // Duración aleatoria para el parpadeo
  const duration = Math.random() * 3 + 2;

  // Aplicar estilos
  star.style.left = `${x}%`;
  star.style.top = `${y}%`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.setProperty('--duration', `${duration}s`);

  container.appendChild(star);
}

/**
 * Crea partículas cuando el cohete despega (hover)
 */
function createRocketBlastParticles(event) {
  // Solo crear partículas una vez por evento hover
  if (this.dataset.particlesCreated === 'true') {return;}
  this.dataset.particlesCreated = 'true';

  // Obtener la posición del logo
  const rect = this.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.bottom;

  // Crear contenedor de partículas si no existe
  let container = document.querySelector('.particles-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'particles-container';
    document.body.appendChild(container);
  }

  // Crear partículas
  for (let i = 0; i < 15; i++) {
    createParticle(container, x, y);
  }

  // Limpiar bandera cuando termina la animación
  setTimeout(() => {
    this.dataset.particlesCreated = 'false';
  }, 1000);
}

/**
 * Crea una partícula individual
 */
function createParticle(container, x, y) {
  const particle = document.createElement('div');
  particle.className = 'particle';

  // Dirección aleatoria
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 3 + 2;

  // Calcular desplazamiento
  const moveX = Math.cos(angle) * velocity;
  const moveY = Math.sin(angle) * velocity;

  // Tamaño aleatorio
  const size = Math.random() * 3 + 1;

  // Duración aleatoria
  const duration = Math.random() * 0.6 + 0.4;

  // Aplicar estilos
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.setProperty('--x', moveX);
  particle.style.setProperty('--y', moveY);
  particle.style.setProperty('--duration', `${duration}s`);

  // Colores de llama aleatoria
  const colors = ['#F97316', '#F59E0B', '#EF4444'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  particle.style.background = color;

  container.appendChild(particle);

  // Eliminar partícula después de la animación
  setTimeout(() => {
    particle.remove();
  }, duration * 1000);
}

// Exportar funciones para uso global
window.RocketAnimations = {
  initialize: initializeRocketAnimations,
  createStarryBackground,
  createRocketBlastParticles
};
