// Existing init function
function init() {
  // Existing code...
}

// New mobile menu functionality
function initMobileMenu() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const dropdowns = document.querySelectorAll('.dropdown');
  const navLinks = document.querySelectorAll('.nav-link');
  const menu = document.getElementById('mobile-menu');

  // Handler for mobile menu toggle.
  mobileToggle.addEventListener('click', () => {
    menu.classList.toggle('is-active');
  });

  // Handler for dropdowns.
  dropdowns.forEach(dropdown => {
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    dropdownToggle.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });
  });

  // Close menu when a nav link is clicked.
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-active');
    });
  });

  // Close menu when clicked outside.
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !mobileToggle.contains(e.target)) {
      menu.classList.remove('is-active');
      dropdowns.forEach(dropdown => dropdown.classList.remove('is-open'));
    }
  });

  // Handle window resize events.
  window.addEventListener('resize', () => {
    // Optional: Adjust menu on resize if necessary.
  });
}

// Call the init function to set everything up.
init();
initMobileMenu();

// Keeping the document ready listener intact
document.addEventListener('DOMContentLoaded', () => {
  // Existing code...
});
