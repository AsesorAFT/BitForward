/**
 * BitForward Mobile Interactions
 * Scripts para mejorar la interactividad en dispositivos móviles
 */

document.addEventListener('DOMContentLoaded', function() {
  // Verificar si es un dispositivo móvil
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  
  // Configurar menú móvil
  setupMobileMenu();
  
  // Optimizar animaciones según dispositivo
  optimizeAnimations(isMobile);
  
  // Configurar gestos táctiles
  if ('ontouchstart' in window) {
    setupTouchInteractions();
  }
  
  // Inicializar lazy loading para imágenes y recursos
  setupLazyLoading();
  
  // Monitorear eventos de resize para adaptación dinámica
  window.addEventListener('resize', debounce(handleResize, 250));
});

/**
 * Configura el menú móvil y su comportamiento
 */
function setupMobileMenu() {
  const menuToggle = document.createElement('button');
  menuToggle.className = 'mobile-menu-toggle';
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  menuToggle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `;
  
  // Buscar el elemento de navegación y añadir el botón de menú
  const nav = document.querySelector('.landing-nav');
  if (nav) {
    // Insertar antes del primer hijo de nav
    nav.insertBefore(menuToggle, nav.firstChild);
    
    // Añadir evento click
    menuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // También cerrar menú al hacer clic en cualquier enlace del menú
  const menuLinks = document.querySelectorAll('.landing-menu a');
  menuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  
  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function(event) {
    const nav = document.querySelector('.landing-nav');
    const menu = document.querySelector('.landing-menu');
    if (nav && menu && !nav.contains(event.target) && document.body.classList.contains('mobile-menu-active')) {
      closeMobileMenu();
    }
  });
}

/**
 * Alterna la visibilidad del menú móvil
 */
function toggleMobileMenu() {
  document.body.classList.toggle('mobile-menu-active');
  
  // Cambiar el aria-label según el estado del menú
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  if (menuToggle) {
    const isOpen = document.body.classList.contains('mobile-menu-active');
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    
    // Cambiar ícono según estado
    if (isOpen) {
      menuToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      menuToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    }
  }
}

/**
 * Cierra el menú móvil
 */
function closeMobileMenu() {
  document.body.classList.remove('mobile-menu-active');
  
  // Restaurar ícono de menú
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    menuToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
  }
}

/**
 * Optimiza las animaciones según el dispositivo
 */
function optimizeAnimations(isMobile) {
  // Reducir número de estrellas en dispositivos móviles
  const starsContainer = document.querySelector('.stars-container');
  if (starsContainer) {
    if (isMobile) {
      // Reducir estrellas en móvil
      const stars = starsContainer.querySelectorAll('.star');
      stars.forEach((star, index) => {
        if (index % 4 !== 0) { // Mantener solo 1 de cada 4 estrellas
          star.style.display = 'none';
        }
      });
      
      // Desactivar shooting stars en móvil
      const shootingStars = document.querySelectorAll('.shooting-star');
      shootingStars.forEach(star => {
        star.style.display = 'none';
      });
    }
  }
  
  // Optimizar efectos de parallax
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (isMobile) {
    parallaxElements.forEach(el => {
      el.style.transform = 'none';
      el.style.transition = 'none';
    });
  }
}

/**
 * Configurar interacciones táctiles específicas
 */
function setupTouchInteractions() {
  // Soporte para gestos de deslizamiento
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);
  
  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, false);
  
  function handleSwipeGesture() {
    // Detectar dirección del swipe
    if (touchEndX < touchStartX - 100) {
      // Deslizamiento hacia la izquierda
      showNextContent();
    }
    
    if (touchEndX > touchStartX + 100) {
      // Deslizamiento hacia la derecha
      showPreviousContent();
    }
  }
  
  // Añadir feedback táctil para elementos interactivos
  const buttons = document.querySelectorAll('button, .btn, [role="button"]');
  buttons.forEach(button => {
    button.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    });
    
    button.addEventListener('touchend', function() {
      this.classList.remove('touch-active');
    });
  });
}

/**
 * Muestra el siguiente contenido (carousel, tabs)
 */
function showNextContent() {
  // Implementar navegación para carousels o tabs
  const activeCarousel = document.querySelector('.carousel-container');
  if (activeCarousel) {
    // Lógica para avanzar al siguiente slide
    const nextButton = activeCarousel.querySelector('.carousel-next');
    if (nextButton) nextButton.click();
  }
}

/**
 * Muestra el contenido anterior (carousel, tabs)
 */
function showPreviousContent() {
  // Implementar navegación para carousels o tabs
  const activeCarousel = document.querySelector('.carousel-container');
  if (activeCarousel) {
    // Lógica para retroceder al slide anterior
    const prevButton = activeCarousel.querySelector('.carousel-prev');
    if (prevButton) prevButton.click();
  }
}

/**
 * Configura lazy loading para imágenes y recursos pesados
 */
function setupLazyLoading() {
  // Usar IntersectionObserver si está disponible
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback para navegadores que no soportan IntersectionObserver
    // Cargar todas las imágenes después de que la página esté completamente cargada
    window.addEventListener('load', function() {
      const lazyImages = document.querySelectorAll('[data-src]');
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    });
  }
}

/**
 * Maneja el evento de resize de la ventana
 */
function handleResize() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  
  // Reoptimizar animaciones
  optimizeAnimations(isMobile);
  
  // Cerrar menú móvil si estamos en escritorio
  if (!isMobile && document.body.classList.contains('mobile-menu-active')) {
    closeMobileMenu();
  }
}

/**
 * Función de debounce para limitar llamadas repetidas
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Exponer funciones al ámbito global para uso desde otros scripts
window.BitForwardMobile = {
  toggleMobileMenu,
  closeMobileMenu,
  optimizeAnimations
};
