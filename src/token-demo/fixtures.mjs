import { CATALOG } from './catalog.mjs';

// Supuesto deliberadamente uniforme: no procede de capturas ni cotizaciones.
export const SPOT_FIXTURES = Object.freeze(
  Object.fromEntries(
    CATALOG.filter(item => item.market === 'spot').map(item => [
      item.key,
      Object.freeze({
        source: 'simulation',
        fixtureId: 'spot-uniform-v1',
        priceQuoteUnits: '10000000',
        quoteDecimals: 6,
        baseDecimals: 8,
        executable: false,
      }),
    ])
  )
);
