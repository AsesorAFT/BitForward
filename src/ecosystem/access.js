// Only enable after the companion route has been deployed in AFORTU OS.
const ready = import.meta.env.VITE_AFORTU_LEARNING_READY === '1';
if (ready) {
  const link = document.querySelector('[data-afortu-learning-link]');
  if (link) {
    link.href = 'https://app.afortu.com.mx/mi-afortu/bitforward';
    link.textContent = 'Continuar con mi cuenta AFORTU OS';
    link.removeAttribute('target');
    link.removeAttribute('rel');
  }
  const status = document.querySelector('[data-afortu-learning-status]');
  if (status) status.textContent = 'CAPACITACIÓN CON TU CUENTA';
  const detail = document.querySelector('[data-afortu-learning-detail]');
  if (detail)
    detail.textContent =
      'Entra a la capacitación privada con el mismo acceso de AFORTU OS. Allí, las comprobaciones se guardan en tu cuenta y puedes retomar tu ruta desde otro dispositivo.';
  const local = document.querySelector('[data-afortu-learning-local]');
  if (local)
    local.textContent =
      'Si prefieres explorar sin cuenta, puedes usar la guía local. Su progreso y las notas del laboratorio permanecen únicamente en este navegador.';
  const planned = document.querySelector('[data-afortu-learning-intro]');
  if (planned)
    planned.textContent =
      'Usa tu cuenta de AFORTU OS para continuar la capacitación de BitForward con ATF y conservar tu avance.';
  const faq = document.querySelector('[data-afortu-learning-faq]');
  if (faq)
    faq.textContent =
      'La capacitación privada reconoce tu identidad de AFORTU OS y guarda las comprobaciones completadas. Las herramientas públicas siguen siendo gratuitas. Las membresías de pago están en desarrollo.';
}
