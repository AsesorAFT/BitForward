import '../../css/editorial.css';
import '../../css/ecosystem.css';
import '../../css/institutional-refinement.css';
import '../../js/pwa.js';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    navigation.classList.toggle('is-open', !expanded);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
}

const filters = document.querySelector('.filter-bar');
if (filters) {
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filters.querySelectorAll('button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    document.querySelectorAll('.mission-card').forEach(card => {
      card.hidden =
        button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count += 1;
    });
    document.querySelector('#filter-result').textContent =
      `${count} ${count === 1 ? 'misión disponible' : 'misiones disponibles'}`;
  });
}

const motionButton = document.querySelector('.motion-toggle');
if (motionButton) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  const updateMotion = () => {
    const reduced = preference.matches;
    document.documentElement.dataset.coinMotion =
      paused || reduced || document.hidden ? 'paused' : 'running';
    motionButton.disabled = reduced;
    motionButton.dataset.paused = String(paused || reduced);
    motionButton.querySelector('[data-motion-label]').textContent = reduced
      ? 'Movimiento reducido'
      : paused
        ? 'Activar movimiento'
        : 'Pausar movimiento';
  };
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  preference.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
}
