export const CATALOG_VERSION = 'bf-formation-2026-09-v1';
export const products = [
  {
    id: 'analista',
    name: 'Analista',
    monthly: 49000,
    annual: 490000,
    group: 'membership',
    tagline: 'Construye un método, una semana a la vez.',
    features: [
      '4 casos documentados al mes, con fuentes y ejercicios.',
      '2 laboratorios guiados al mes y plantillas de investigación.',
      'Bitácora y seguimiento de tesis con tu cuenta.',
      'Rutas de análisis y simulación al completar sus prerrequisitos.',
    ],
  },
  {
    id: 'circulo',
    name: 'Círculo AFORTU',
    monthly: 129000,
    annual: 1290000,
    group: 'membership',
    tagline: 'Aprende con otras personas y recibe retroalimentación.',
    features: [
      'Todo lo propuesto en Analista.',
      '2 encuentros grupales de 60 minutos al mes.',
      '1 revisión mensual de tu trabajo con una rúbrica.',
      'Grupos de hasta 12 personas y comunidad moderada.',
    ],
  },
  {
    id: 'cohorte',
    name: 'De cero a tu primer análisis',
    once: 249000,
    group: 'cohort',
    tagline: 'Un programa de cuatro semanas con una entrega concreta.',
    features: [
      '8 sesiones guiadas: conceptos, seguridad y análisis.',
      'Proyecto final: una ficha con evidencia y riesgos.',
      'Evaluación inicial y final con retroalimentación.',
      'Hasta 20 participantes; calendario por confirmar.',
    ],
  },
];
export const money = cents =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
export function normalizeCart(input) {
  if (!Array.isArray(input)) return [];
  const result = [];
  for (const item of input) {
    const p = products.find(p => p.id === item?.id);
    if (!p || !['monthly', 'annual', 'once'].includes(item.period) || !p[item.period]) continue;
    if (result.some(i => products.find(p => p.id === i.id).group === p.group)) continue;
    result.push({ id: p.id, period: item.period });
  }
  return result;
}
export function cartTotal(cart) {
  return normalizeCart(cart).reduce(
    (sum, i) => sum + products.find(p => p.id === i.id)[i.period],
    0
  );
}
export function addToCart(cart, id, period) {
  const product = products.find(p => p.id === id);
  if (!product || !product[period]) return normalizeCart(cart);
  return normalizeCart([
    ...normalizeCart(cart).filter(i => products.find(p => p.id === i.id).group !== product.group),
    { id, period },
  ]);
}
export const levels = [
  {
    number: '00',
    name: 'Empieza desde cero',
    status: 'Introducción disponible',
    description:
      'Dinero digital, criptomoneda, Bitcoin y blockchain en palabras sencillas. No necesitas conocimientos previos.',
    result: 'Explicar qué es una criptomoneda sin confundirla con una cuenta bancaria.',
    topics: 'Dinero · Bitcoin · Red y activo · Precio y valor',
    link: '#desde-cero',
  },
  {
    number: '01',
    name: 'Muévete con seguridad',
    status: 'Misiones disponibles',
    description:
      'Distingue una wallet de un exchange. Aprende sobre claves, redes, comisiones y fraudes antes de transferir.',
    result: 'Completar una lista de comprobación de custodia y una transferencia simulada.',
    topics: 'Wallets · Exchange · Semilla · Comisiones',
    link: './misiones.html',
  },
  {
    number: '02',
    name: 'Aprende a investigar',
    status: 'Base disponible',
    description:
      'Compara Bitcoin, Ethereum y otros activos. Separa fuentes, hipótesis, riesgos y conclusiones.',
    result: 'Entregar tu primera ficha documentada y un escenario de pérdidas.',
    topics: 'Tokenomics · Stablecoins · Fuentes · Exposición',
    link: './laboratorio.html',
  },
  {
    number: '03',
    name: 'Trading con método',
    status: 'Programa por desarrollar',
    description:
      'Gráficos, velas, órdenes, liquidez, comisiones, tamaño de posición y evaluación de estrategias en simulación.',
    result: 'Mantener una bitácora de operaciones simuladas con costes y reglas reproducibles.',
    topics: 'Spot · Órdenes · Riesgo · Backtesting',
    link: './simulador.html',
  },
  {
    number: '04',
    name: 'Futuros y apalancamiento',
    status: 'Programa por desarrollar',
    description:
      'Posiciones largas y cortas, futuros y perpetuos, margen aislado y cruzado, funding y liquidación.',
    result:
      'Calcular cómo cambia una pérdida con el apalancamiento y explicar cuándo se liquida una posición.',
    topics: 'Long / short · Margen · Funding · Liquidación',
    link: './simulador.html',
  },
  {
    number: '05',
    name: 'Opciones y riesgos avanzados',
    status: 'Programa por desarrollar',
    description:
      'Calls y puts, primas, vencimientos y perfiles de pérdida. Las binarias se estudian por separado: pago fijo, pérdida total y evaluación de la plataforma.',
    result:
      'Comparar estructuras de pago y rechazar una operación cuyos riesgos no puedas explicar.',
    topics: 'Calls / puts · Griegas · Binarias · Contraparte',
    link: '#simulador',
  },
];
// Linear, price-change-only scenario. Not a margin engine or liquidation quote.
export function leverageScenario({ margin, leverage, move, direction }) {
  if (
    ![margin, leverage, move].every(Number.isFinite) ||
    margin <= 0 ||
    margin > 1e7 ||
    leverage < 1 ||
    leverage > 100 ||
    Math.abs(move) > 100 ||
    !['long', 'short'].includes(direction)
  )
    throw new Error('Revisa los valores del escenario.');
  const notional = margin * leverage;
  const pnl = ((notional * move) / 100) * (direction === 'short' ? -1 : 1);
  return { notional, pnl, marginChange: (pnl / margin) * 100, exhausted: pnl <= -margin };
}
