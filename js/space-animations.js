/**
 * BitForward Space Animation
 * Maneja la creación y animación de estrellas, cohetes y elementos espaciales
 */

document.addEventListener('DOMContentLoaded', function() {
  // Crear el contenedor de fondo espacial si no existe
  if (!document.querySelector('.space-background')) {
    initSpaceBackground();
  }
  
  // Iniciar las animaciones de cohete
  initRocketAnimations();
  
  // Detectar scroll para efectos de paralaje
  window.addEventListener('scroll', function() {
    createParallaxEffect();
  });
});

/**
 * Inicializa el fondo espacial con estrellas y nebulosas
 */
function initSpaceBackground() {
  // Crear contenedor principal
  const spaceBackground = document.createElement('div');
  spaceBackground.className = 'space-background';
  
  // Añadir capa de estrellas
  const starsLayer = document.createElement('div');
  starsLayer.className = 'stars-layer';
  
  // Añadir nebulosas
  const nebula1 = document.createElement('div');
  nebula1.className = 'space-nebula nebula-1';
  
  const nebula2 = document.createElement('div');
  nebula2.className = 'space-nebula nebula-2';
  
  // Añadir polvo estelar
  const stardust = document.createElement('div');
  stardust.className = 'stardust';
  
  // Añadir overlay con gradiente
  const spaceOverlay = document.createElement('div');
  spaceOverlay.className = 'space-overlay';
  
  // Generar estrellas
  generateStars(starsLayer, 100);
  
  // Construir estructura
  spaceBackground.appendChild(stardust);
  spaceBackground.appendChild(nebula1);
  spaceBackground.appendChild(nebula2);
  spaceBackground.appendChild(starsLayer);
  document.body.appendChild(spaceBackground);
  document.body.appendChild(spaceOverlay);
}

/**
 * Genera estrellas en el fondo
 * @param {HTMLElement} container - El contenedor donde se crearán las estrellas
 * @param {number} count - Cantidad de estrellas a generar
 */
function generateStars(container, count) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    
    // Propiedades aleatorias
    const size = Math.random() * 2 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 3 + 2;
    const opacity = Math.random() * 0.7 + 0.3;
    
    // Aplicar estilos
    star.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: white;
      border-radius: 50%;
      top: ${y}%;
      left: ${x}%;
      opacity: ${opacity};
      box-shadow: 0 0 ${size * 2}px rgba(255,255,255,0.8);
      animation: starTwinkle ${duration}s ease-in-out infinite;
      animation-delay: ${delay}s;
    `;
    
    container.appendChild(star);
  }
  
  // Añadir keyframe para animación de estrellas si no existe
  if (!document.getElementById('star-animation')) {
    const style = document.createElement('style');
    style.id = 'star-animation';
    style.innerHTML = `
      @keyframes starTwinkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Inicializa las animaciones de cohete
 */
function initRocketAnimations() {
  // Buscar todos los elementos de cohete
  const rockets = document.querySelectorAll('.rocket-icon, .rocket-logo');
  
  rockets.forEach(rocket => {
    // Animación al hacer hover
    rocket.addEventListener('mouseenter', function() {
      this.classList.add('rocket-hover');
    });
    
    rocket.addEventListener('mouseleave', function() {
      this.classList.remove('rocket-hover');
    });
    
    // Agregar clase inicial para animación de entrada
    if (!rocket.classList.contains('rocket-animated')) {
      rocket.classList.add('rocket-animated');
    }
  });
  
  // Animación para el logo si existe
  const logoRocket = document.querySelector('.logo-rocket');
  if (logoRocket) {
    // Iniciar animación del logo
    animateLogoRocket(logoRocket);
  }
}

/**
 * Anima el logo de cohete con un movimiento suave
 * @param {HTMLElement} logoElement - El elemento del logo
 */
function animateLogoRocket(logoElement) {
  // Movimiento suave
  logoElement.style.transition = 'transform 0.5s ease-out';
  
  // Animación de "propulsión" periódica
  setInterval(() => {
    logoElement.classList.add('rocket-thrust');
    
    setTimeout(() => {
      logoElement.classList.remove('rocket-thrust');
    }, 1000);
  }, 5000);
}

/**
 * Crea efecto de paralaje al hacer scroll
 */
function createParallaxEffect() {
  const scrollPosition = window.scrollY;
  
  // Mover las estrellas a diferentes velocidades
  const starsLayers = document.querySelectorAll('.stars-layer');
  starsLayers.forEach((layer, index) => {
    const speed = (index + 1) * 0.05;
    layer.style.transform = `translateY(${scrollPosition * speed}px)`;
  });
  
  // Mover las nebulosas
  const nebulas = document.querySelectorAll('.space-nebula');
  nebulas.forEach((nebula, index) => {
    const speed = (index + 1) * 0.02;
    nebula.style.transform = `translateY(${scrollPosition * speed}px)`;
  });
}

/**
 * Añade un cohete que vuela a través de la pantalla
 * @param {Object} options - Opciones de configuración
 */
function addFlyingRocket(options = {}) {
  const defaults = {
    size: 30,
    duration: 5,
    delay: 0,
    path: 'cubic-bezier(0.2, 0.8, 0.8, 0.2)',
    startPosition: { x: -50, y: Math.random() * 70 + 15 },
    endPosition: { x: 120, y: Math.random() * 70 + 15 }
  };
  
  const config = {...defaults, ...options};
  
  // Crear elemento de cohete
  const rocket = document.createElement('div');
  rocket.className = 'flying-rocket';
  
  // Aplicar estilos
  rocket.style.cssText = `
    position: fixed;
    width: ${config.size}px;
    height: ${config.size * 1.5}px;
    background-image: url('/assets/rocket-small.svg');
    background-size: contain;
    background-repeat: no-repeat;
    left: ${config.startPosition.x}%;
    top: ${config.startPosition.y}%;
    z-index: 100;
    transform: rotate(45deg);
    filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
    opacity: 0;
  `;
  
  // Añadir al DOM
  document.body.appendChild(rocket);
  
  // Forzar reflow
  rocket.offsetWidth;
  
  // Aplicar animación
  rocket.style.transition = `
    left ${config.duration}s ${config.path},
    top ${config.duration}s ${config.path},
    opacity 0.5s ease-in, opacity 0.5s ${config.duration - 0.5}s ease-out
  `;
  
  setTimeout(() => {
    rocket.style.opacity = '1';
    rocket.style.left = `${config.endPosition.x}%`;
    rocket.style.top = `${config.endPosition.y}%`;
    
    // Eliminar después de completar
    setTimeout(() => {
      rocket.style.opacity = '0';
      setTimeout(() => rocket.remove(), 500);
    }, (config.duration - 0.5) * 1000);
  }, config.delay * 1000);
}

// Exportar funciones para uso global
window.BitForwardSpace = {
  initSpaceBackground,
  addFlyingRocket,
  generateStars
};
