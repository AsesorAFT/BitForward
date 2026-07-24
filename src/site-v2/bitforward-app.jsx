import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import logoUrl from '../../assets/brand/bitforward-logo-v2.webp';
import iconUrl from '../../assets/brand/bitforward-app-icon-192.png';
import rocketHeroUrl from '../../assets/brand/rocket-hero-v2.webp';
import orbitalMissionUrl from '../../assets/brand/orbital-mission-v2.webp';

const MARKET_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano&price_change_percentage=24h,7d&sparkline=true';
const MARKET_CACHE_KEY = 'bitforward-market-v2';
const MARKET_CACHE_TTL = 2 * 60 * 1e3;
const fallbackAssets = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 65776,
    change24h: -1,
    change7d: 2.6,
    history: [68, 64, 59, 56, 61, 58, 63, 65],
    role: 'Núcleo',
    allocation: 60,
    thesis: 'Reserva digital y activo de referencia del ecosistema.',
    risk: 'Volatilidad alta',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 1928,
    change24h: -0.39,
    change7d: 1.4,
    history: [63, 66, 59, 55, 60, 58, 61, 60],
    role: 'Infraestructura',
    allocation: 20,
    thesis: 'Capa programable para activos, pagos y aplicaciones.',
    risk: 'Volatilidad alta',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 77.88,
    change24h: -0.56,
    change7d: -2.1,
    history: [65, 61, 64, 57, 59, 55, 58, 56],
    role: 'Crecimiento',
    allocation: 10,
    thesis: 'Exposición acotada a infraestructura de alto desempeño.',
    risk: 'Volatilidad muy alta',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.1744,
    change24h: 0.09,
    change7d: 3.2,
    history: [43, 46, 44, 49, 52, 51, 55, 58],
    role: 'Satélite',
    allocation: 10,
    thesis: 'Posición satélite para diversificar la tesis tecnológica.',
    risk: 'Volatilidad muy alta',
  },
];
const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});
const scenarios = {
  stress: {
    label: 'Estrés',
    annualRate: -0.15,
    detail: 'Contracción hipotética de −15% anual.',
  },
  discipline: {
    label: 'Disciplina',
    annualRate: 0.08,
    detail: 'Supuesto didáctico de +8% anual.',
  },
  expansion: {
    label: 'Expansión',
    annualRate: 0.18,
    detail: 'Escenario hipotético de +18% anual.',
  },
};
const allocation = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    weight: 0.6,
    color: '#16e0bd',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    weight: 0.2,
    color: '#7c5cfc',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    weight: 0.1,
    color: '#53a6ff',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    weight: 0.1,
    color: '#c785ff',
  },
];
const readinessControls = [
  {
    id: 'liquidity',
    title: 'Liquidez',
    detail: 'Existe un fondo de emergencia separado.',
  },
  {
    id: 'horizon',
    title: 'Horizonte',
    detail: 'El capital no se necesita en al menos tres años.',
  },
  {
    id: 'loss',
    title: 'Capacidad de pérdida',
    detail: 'Una caída fuerte no obligaría a vender.',
  },
  {
    id: 'custody',
    title: 'Custodia',
    detail: 'Accesos y respaldos están documentados.',
  },
  {
    id: 'discipline',
    title: 'Disciplina',
    detail: 'Hay límite de exposición y regla de rebalanceo.',
  },
];
function sampleHistory(values) {
  if (!Array.isArray(values) || values.length === 0) return [];
  if (values.length <= 18) return values.filter(Number.isFinite);
  const step = (values.length - 1) / 17;
  return Array.from({ length: 18 }, (_, index) => {
    const value = values[Math.round(index * step)];
    return Number.isFinite(value) ? value : 0;
  });
}
function readMarketCache(allowStale = false) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(MARKET_CACHE_KEY) || 'null');
    const validShape = cached?.payload?.assets?.length === 4;
    const isFresh = Date.now() - Number(cached?.timestamp || 0) < MARKET_CACHE_TTL;
    if (!validShape || (!allowStale && !isFresh)) return null;
    return cached.payload;
  } catch {
    return null;
  }
}
async function fetchPublicMarket(force = false) {
  const freshCache = force ? null : readMarketCache(false);
  if (freshCache) return freshCache;
  try {
    const response = await fetch(MARKET_URL, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    const rows = await response.json();
    const byId = new Map(rows.map(row => [row.id, row]));
    const assets = fallbackAssets.map(definition => {
      const row = byId.get(definition.id);
      if (!row || !Number.isFinite(row.current_price)) {
        throw new Error(`Missing market data for ${definition.id}`);
      }
      return {
        ...definition,
        price: row.current_price,
        change24h: row.price_change_percentage_24h ?? 0,
        change7d: row.price_change_percentage_7d_in_currency ?? 0,
        history: sampleHistory(row.sparkline_in_7d?.price ?? []),
      };
    });
    const payload = {
      assets,
      source: 'CoinGecko',
      updatedAt: new Date().toISOString(),
      isFallback: false,
    };
    window.localStorage.setItem(
      MARKET_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), payload })
    );
    return payload;
  } catch {
    const staleCache = readMarketCache(true);
    if (staleCache) {
      return {
        ...staleCache,
        source: 'CoinGecko · última lectura',
        isFallback: true,
      };
    }
    return {
      assets: fallbackAssets,
      source: 'Referencia local',
      updatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
function formatPrice(value) {
  if (value < 1) return `$${value.toFixed(4)}`;
  return numberFormatter.format(value);
}
function formatChange(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
function formatMarketTime(value) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch {
    return 'Referencia disponible';
  }
}
function buildProjection(initialCapital, monthlyContribution, months, annualRate) {
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  let value = initialCapital;
  let contributed = initialCapital;
  const records = [{ month: 0, value, contributed: initialCapital }];
  for (let month = 1; month <= months; month += 1) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    contributed += monthlyContribution;
    records.push({ month, value, contributed });
  }
  return {
    records,
    finalValue: value,
    contributed,
    result: value - contributed,
    resultPercent: contributed > 0 ? (value - contributed) / contributed : 0,
  };
}
function ProjectionChart({ records }) {
  const width = 820;
  const height = 310;
  const padding = 28;
  const maximum = Math.max(...records.flatMap(record => [record.value, record.contributed]), 1);
  const point = (record, index, field) => {
    const x = padding + (index / Math.max(records.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (record[field] / maximum) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const valuePoints = records.map((record, index) => point(record, index, 'value')).join(' ');
  const contributionPoints = records
    .map((record, index) => point(record, index, 'contributed'))
    .join(' ');
  return (
    <svg
      className="projection-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Gráfica del valor hipotético contra el capital aportado"
    >
      <defs>
        <linearGradient id="projection-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16e0bd" stopOpacity=".3" />
          <stop offset="100%" stopColor="#16e0bd" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(line => (
        <line
          key={line}
          x1={padding}
          x2={width - padding}
          y1={height - padding - (height - padding * 2) * line}
          y2={height - padding - (height - padding * 2) * line}
          className="chart-grid-line"
        />
      ))}
      <polygon
        points={`${padding},${height - padding} ${valuePoints} ${width - padding},${height - padding}`}
        fill="url(#projection-fill)"
      />
      <polyline points={contributionPoints} className="contribution-line" />
      <polyline points={valuePoints} className="value-line" />
      <text x={padding} y={height - 8} className="chart-label">
        Inicio
      </text>
      <text x={width - padding} y={height - 8} textAnchor="end" className="chart-label">
        Mes {records.length - 1}
      </text>
    </svg>
  );
}
function Sparkline({ values, positive, large = false }) {
  const gradientId = `spark-${useId().replaceAll(':', '')}`;
  const safeValues =
    values.length > 1 ? values : values.length === 1 ? [values[0], values[0]] : [0, 0];
  const width = large ? 760 : 150;
  const height = large ? 250 : 54;
  const padding = large ? 12 : 4;
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(max - min, 1);
  const points = safeValues
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  return (
    <svg
      className={large ? 'sparkline sparkline-large' : 'sparkline'}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Tendencia ${positive ? 'positiva' : 'negativa'} del periodo`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? '#16e0bd' : '#ff647c'} stopOpacity=".3" />
          <stop offset="100%" stopColor={positive ? '#16e0bd' : '#ff647c'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#16e0bd' : '#ff647c'}
        strokeWidth={large ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="BitForward, volver al inicio">
      <img className="brand-logo" src={logoUrl} alt="BitForward v2.0" width="900" height="560" />
    </a>
  );
}
function Home() {
  const [market, setMarket] = useState({
    assets: fallbackAssets,
    source: 'Referencia local',
    updatedAt: /* @__PURE__ */ new Date().toISOString(),
    isFallback: true,
  });
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [capital, setCapital] = useState(1e5);
  const [monthly, setMonthly] = useState(3e3);
  const [horizon, setHorizon] = useState(36);
  const [scenario, setScenario] = useState('discipline');
  const [readiness, setReadiness] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');
  const [comparisonSort, setComparisonSort] = useState('allocation');
  const [patrimony, setPatrimony] = useState(5e5);
  const [lossLimit, setLossLimit] = useState(5e4);
  const [stressDrawdown, setStressDrawdown] = useState(40);
  const [rebalanceContribution, setRebalanceContribution] = useState(5e3);
  const [holdings, setHoldings] = useState({
    bitcoin: 45e3,
    ethereum: 3e4,
    solana: 15e3,
    cardano: 1e4,
  });
  const [workspaceStatus, setWorkspaceStatus] = useState('');
  const [missionStep, setMissionStep] = useState(1);
  const [missionMode, setMissionMode] = useState('new');
  const [motionPaused, setMotionPaused] = useState(false);
  const scrollProgressRef = useRef(null);
  const missionHeadingRef = useRef(null);
  const refreshMarket = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const payload = await fetchPublicMarket(true);
      if (payload.assets?.length === 4) setMarket(payload);
    } catch {
      setMarket(current => ({
        ...current,
        source: 'Última referencia disponible',
        isFallback: true,
      }));
    } finally {
      setLoadingMarket(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    fetchPublicMarket(false)
      .then(payload => {
        if (active && payload.assets?.length === 4) setMarket(payload);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
        scrollProgressRef.current?.style.setProperty('transform', `scaleX(${progress})`);
      });
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);
  const selected = useMemo(
    () => market.assets.find(asset => asset.id === selectedAsset) ?? market.assets[0],
    [market.assets, selectedAsset]
  );
  const positiveAssets = market.assets.filter(asset => asset.change24h >= 0).length;
  const marketBias =
    positiveAssets >= 3
      ? 'Impulso amplio'
      : positiveAssets <= 1
        ? 'Presión defensiva'
        : 'Mercado selectivo';
  const sortedAssets = useMemo(
    () =>
      [...market.assets].sort((first, second) => second[comparisonSort] - first[comparisonSort]),
    [comparisonSort, market.assets]
  );
  const projection = useMemo(
    () =>
      buildProjection(
        Math.max(capital, 0),
        Math.max(monthly, 0),
        horizon,
        scenarios[scenario].annualRate
      ),
    [capital, monthly, horizon, scenario]
  );
  const readinessScore = readiness.length;
  const readinessReading =
    readinessScore <= 2
      ? {
          label:
            readinessScore === 0 ? 'Sin evaluar' : `${readinessScore}/5 · Estructura insuficiente`,
          detail:
            readinessScore === 0
              ? 'Marca los controles que ya existen hoy.'
              : 'La prioridad es resolver liquidez, horizonte y control operativo.',
          tone: 'blocked',
        }
      : readinessScore === 3
        ? {
            label: '3/5 · Preparación parcial',
            detail: 'Existen bases, pero una caída fuerte todavía puede romper la estrategia.',
            tone: 'caution',
          }
        : {
            label: `${readinessScore}/5 · Base más sólida`,
            detail: 'La estructura es más resistente; aún requiere perfilamiento individual.',
            tone: 'ready',
          };
  const maximumExposure = Math.min(
    Math.max(patrimony, 0),
    stressDrawdown > 0 ? Math.max(lossLimit, 0) / (stressDrawdown / 100) : 0
  );
  const exposurePercent = patrimony > 0 ? (maximumExposure / patrimony) * 100 : 0;
  const totalHoldings = allocation.reduce(
    (sum, asset) => sum + Math.max(holdings[asset.id] ?? 0, 0),
    0
  );
  const rebalanceRows = allocation.map(asset => {
    const current = Math.max(holdings[asset.id] ?? 0, 0);
    const target = totalHoldings * asset.weight;
    return {
      ...asset,
      current,
      currentWeight: totalHoldings > 0 ? current / totalHoldings : 0,
      target,
      delta: target - current,
    };
  });
  const futureTotal = totalHoldings + Math.max(rebalanceContribution, 0);
  const contributionGaps = allocation.map(asset => ({
    ...asset,
    gap: Math.max(futureTotal * asset.weight - Math.max(holdings[asset.id] ?? 0, 0), 0),
  }));
  const totalGap = contributionGaps.reduce((sum, asset) => sum + asset.gap, 0);
  const contributionPlan = contributionGaps.map(asset => ({
    ...asset,
    amount:
      totalGap > 0
        ? (asset.gap / totalGap) * Math.max(rebalanceContribution, 0)
        : asset.weight * Math.max(rebalanceContribution, 0),
  }));
  const missionExposure = missionMode === 'portfolio' ? totalHoldings : Math.max(capital, 0);
  const missionStressLoss = missionExposure * (stressDrawdown / 100);
  const missionWithinLimit = missionStressLoss <= Math.max(lossLimit, 0);
  const moveMission = step => {
    setMissionStep(Math.min(Math.max(step, 1), 4));
    window.setTimeout(() => missionHeadingRef.current?.focus(), 0);
  };
  const toggleReadiness = id => {
    setReadiness(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };
  const buildScenarioSummary = () =>
    [
      'BitForward · Escenario educativo',
      `Capital inicial: ${mxnFormatter.format(capital)}`,
      `Aportación mensual: ${mxnFormatter.format(monthly)}`,
      `Horizonte: ${horizon} meses`,
      `Escenario: ${scenarios[scenario].label} (${(scenarios[scenario].annualRate * 100).toFixed(0)}% anual hipotético)`,
      `Capital aportado: ${mxnFormatter.format(projection.contributed)}`,
      `Valor hipotético: ${mxnFormatter.format(projection.finalValue)}`,
      `Resultado hipotético: ${mxnFormatter.format(projection.result)}`,
      'Aviso: simulación informativa; no es pronóstico ni recomendación.',
    ].join('\n');
  const copyScenario = async () => {
    try {
      await navigator.clipboard.writeText(buildScenarioSummary());
      setCopyStatus('Resumen copiado');
    } catch {
      setCopyStatus('El navegador bloqueó el portapapeles');
    }
    window.setTimeout(() => setCopyStatus(''), 2400);
  };
  const exportScenario = () => {
    const rows = [
      ['BitForward v2.0 · Escenario educativo'],
      ['Fecha de exportación', new Date().toISOString()],
      ['Fuente de mercado', market.source],
      ['Capital inicial (MXN)', capital.toFixed(2)],
      ['Aportación mensual (MXN)', monthly.toFixed(2)],
      ['Horizonte (meses)', String(horizon)],
      ['Escenario', scenarios[scenario].label],
      ['Tasa anual hipotética', String(scenarios[scenario].annualRate)],
      [],
      ['Mes', 'Capital aportado', 'Valor hipotético'],
      ...projection.records.map(record => [
        String(record.month),
        record.contributed.toFixed(2),
        record.value.toFixed(2),
      ]),
      [],
      ['Aviso', 'Simulación informativa; no es pronóstico ni recomendación de inversión.'],
    ];
    const csv = `\uFEFF${rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'bitforward-escenario-educativo.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1e3);
  };
  const saveWorkspace = () => {
    try {
      window.localStorage.setItem(
        'bitforward-workspace-v2',
        JSON.stringify({
          version: 2,
          capital,
          monthly,
          horizon,
          scenario,
          patrimony,
          lossLimit,
          stressDrawdown,
          rebalanceContribution,
          holdings,
        })
      );
      setWorkspaceStatus('Sesión guardada en este dispositivo');
    } catch {
      setWorkspaceStatus('No fue posible guardar la sesión');
    }
    window.setTimeout(() => setWorkspaceStatus(''), 2600);
  };
  const restoreWorkspace = () => {
    try {
      const saved = window.localStorage.getItem('bitforward-workspace-v2');
      if (!saved) {
        setWorkspaceStatus('No hay una sesión guardada');
        window.setTimeout(() => setWorkspaceStatus(''), 2600);
        return;
      }
      const workspace = JSON.parse(saved);
      if (workspace?.version !== 2) {
        throw new Error('Unsupported workspace version');
      }
      if (Number.isFinite(workspace.capital)) setCapital(workspace.capital ?? 0);
      if (Number.isFinite(workspace.monthly)) setMonthly(workspace.monthly ?? 0);
      if (Number.isFinite(workspace.horizon)) setHorizon(workspace.horizon ?? 36);
      if (workspace.scenario && Object.prototype.hasOwnProperty.call(scenarios, workspace.scenario))
        setScenario(workspace.scenario);
      if (Number.isFinite(workspace.patrimony)) setPatrimony(workspace.patrimony ?? 0);
      if (Number.isFinite(workspace.lossLimit)) setLossLimit(workspace.lossLimit ?? 0);
      if (Number.isFinite(workspace.stressDrawdown))
        setStressDrawdown(workspace.stressDrawdown ?? 50);
      if (Number.isFinite(workspace.rebalanceContribution))
        setRebalanceContribution(workspace.rebalanceContribution ?? 0);
      if (workspace.holdings) setHoldings(workspace.holdings);
      setWorkspaceStatus('Sesión recuperada');
    } catch {
      window.localStorage.removeItem('bitforward-workspace-v2');
      setWorkspaceStatus('La sesión guardada no era válida');
    }
    window.setTimeout(() => setWorkspaceStatus(''), 2600);
  };
  const clearWorkspace = () => {
    try {
      window.localStorage.removeItem('bitforward-workspace-v2');
      setWorkspaceStatus('Sesión local eliminada');
    } catch {
      setWorkspaceStatus('No fue posible eliminar la sesión');
    }
    window.setTimeout(() => setWorkspaceStatus(''), 2600);
  };
  const resetDesk = () => {
    setPatrimony(5e5);
    setLossLimit(5e4);
    setStressDrawdown(40);
    setRebalanceContribution(5e3);
    setHoldings({
      bitcoin: 45e3,
      ethereum: 3e4,
      solana: 15e3,
      cardano: 1e4,
    });
  };
  return (
    <main id="inicio" className={motionPaused ? 'motion-paused' : ''}>
      <a className="skip-link" href="#mision">
        Ir al Centro de Misión
      </a>
      <header className="site-header">
        <Brand />
        <nav className={mobileOpen ? 'nav-links is-open' : 'nav-links'}>
          <a href="#mision" onClick={() => setMobileOpen(false)}>
            Centro de Misión
          </a>
          <a href="#mercado" onClick={() => setMobileOpen(false)}>
            Radar
          </a>
          <a href="#modelo" onClick={() => setMobileOpen(false)}>
            Génesis
          </a>
          <a href="#metodologia" onClick={() => setMobileOpen(false)}>
            Método
          </a>
          <a href="#afortu" onClick={() => setMobileOpen(false)}>
            AFORTU
          </a>
        </nav>
        <div className="header-status">
          <span className={market.isFallback ? 'live-dot is-reference' : 'live-dot'} />
          <span>
            {market.isFallback ? 'Datos de referencia' : `${market.source} · actualizado`}
          </span>
          <button
            className="motion-toggle"
            type="button"
            aria-pressed={motionPaused}
            onClick={() => setMotionPaused(value => !value)}
          >
            {motionPaused ? 'Reanudar efectos' : 'Pausar efectos'}
          </button>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label={mobileOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(value => !value)}
        >
          <span />
          <span />
        </button>
        <div
          ref={scrollProgressRef}
          className="scroll-progress"
          style={{ transform: 'scaleX(0)' }}
          aria-hidden="true"
        />
      </header>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="launch-badge">
            <span className="live-dot" />
            Sistema AFORTU · BitForward v2.0
          </div>
          <p className="eyebrow">BITFORWARD · PROYECTO CRIPTO DE AFORTU</p>
          <h1 id="hero-title">
            Tu estrategia cripto necesita una misión. <em>No una apuesta.</em>
          </h1>
          <p className="hero-lead">
            Define cuánto riesgo puedes asumir, prueba caídas y convierte tus supuestos en reglas de
            asignación, aportación y rebalanceo antes de tomar una decisión.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#mision">
              Iniciar mi misión <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="#metodologia">
              Explorar el método <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mission-path" aria-label="Ruta de análisis BitForward">
            <span>
              <b>01</b>
              Definir misión
            </span>
            <i aria-hidden="true" />
            <span>
              <b>02</b>
              Probar turbulencia
            </span>
            <i aria-hidden="true" />
            <span>
              <b>03</b>
              Mantener órbita
            </span>
          </div>
          <div className="trust-row">
            <span>Proyecto AFORTU</span>
            <span>Sin custodia ni ejecución</span>
            <span>Supuestos visibles</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img
            className="hero-rocket-art"
            src={rocketHeroUrl}
            alt=""
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <div className="hero-starfield" />
          <div className="hero-orbit orbit-one">
            <i />
          </div>
          <div className="hero-orbit orbit-two">
            <i />
          </div>
          <div className="hero-core">
            <span />
          </div>
          <div className="floating-node node-bank">
            <small>ÓRBITA</small>
            60 / 20 / 10 / 10
          </div>
          <div className="floating-node node-chart">
            <small>RUMBO</small>
            Riesgo primero
          </div>
          <div className="floating-node node-cube">
            <small>SEÑAL</small>
            Datos trazables
          </div>
          <div className="telemetry-line telemetry-one" />
          <div className="telemetry-line telemetry-two" />
        </div>
        <aside className="session-card" aria-label="Lectura ejecutiva de mercado">
          <img
            className="session-brand"
            src={iconUrl}
            alt=""
            width="192"
            height="192"
            aria-hidden="true"
          />
          <div>
            <span>RADAR DE MERCADO</span>
            <small>
              {market.isFallback
                ? `${market.source} · sin señal en vivo`
                : `${market.source} · ${formatMarketTime(market.updatedAt)}`}
            </small>
          </div>
          <strong>{marketBias}</strong>
          <p>Dirección, amplitud y volatilidad antes de definir la trayectoria.</p>
          <div className="session-metrics">
            <span>
              <b>4</b>
              activos
            </span>
            <span>
              <b>3</b>
              herramientas
            </span>
            <span>
              <b>{market.isFallback ? 'Referencia' : formatMarketTime(market.updatedAt)}</b>
              corte
            </span>
          </div>
        </aside>
      </section>
      <section className="mission-center" id="mision" aria-labelledby="mission-title">
        <div className="section-shell">
          <div className="mission-intro">
            <div>
              <p className="eyebrow">CENTRO DE MISIÓN</p>
              <h2 id="mission-title">De una intención a una ruta medible.</h2>
            </div>
            <p>
              En cuatro decisiones, BitForward conecta tu capital, horizonte y tolerancia de pérdida
              con una trayectoria que puedes revisar antes de comprometer recursos.
            </p>
          </div>
          <div className="mission-workspace">
            <aside className="mission-rail" aria-label="Progreso de la misión">
              <div className="mission-progress">
                <span>MISIÓN {missionStep}/4</span>
                <div aria-hidden="true">
                  <i style={{ width: `${missionStep * 25}%` }} />
                </div>
              </div>
              <ol>
                {[
                  ['Definir', 'Objetivo y límites'],
                  ['Cargar', 'Posición actual'],
                  ['Probar', 'Escenario adverso'],
                  ['Trazar', 'Plan de acción'],
                ].map(([title, detail], index) => {
                  const step = index + 1;
                  return (
                    <li
                      className={
                        missionStep === step
                          ? 'is-current'
                          : missionStep > step
                            ? 'is-complete'
                            : ''
                      }
                      key={title}
                    >
                      <button
                        type="button"
                        disabled={step > missionStep}
                        aria-current={missionStep === step ? 'step' : void 0}
                        onClick={() => moveMission(step)}
                      >
                        <span>{String(step).padStart(2, '0')}</span>
                        <span>
                          <strong>{title}</strong>
                          <small>{detail}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mission-flight" aria-hidden="true">
                <span className={`mission-rocket mission-step-${missionStep}`}>
                  <img src={iconUrl} alt="" width="192" height="192" />
                </span>
                <i />
                <b>ÓRBITA</b>
              </div>
            </aside>
            <div className="mission-stage">
              {missionStep === 1 && (
                <div className="mission-panel">
                  <div className="panel-label">
                    <span>01</span>
                    <div>
                      <small>PLATAFORMA DE LANZAMIENTO</small>
                      <h3 ref={missionHeadingRef} tabIndex={-1}>
                        Define el tamaño y los límites de la misión.
                      </h3>
                    </div>
                  </div>
                  <p className="mission-panel-lead">
                    No empezamos preguntando qué comprar. Empezamos por cuánto capital analizar,
                    durante cuánto tiempo y qué pérdida sería inaceptable.
                  </p>
                  <div className="mission-fields">
                    <label className="control-field">
                      <span>
                        Capital a analizar <small>MXN</small>
                      </span>
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        max="100000000"
                        step="1000"
                        value={capital}
                        onChange={event => setCapital(Math.max(Number(event.target.value), 0))}
                      />
                    </label>
                    <label className="control-field">
                      <span>
                        Patrimonio líquido <small>MXN</small>
                      </span>
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="10000"
                        value={patrimony}
                        onChange={event => setPatrimony(Math.max(Number(event.target.value), 0))}
                      />
                    </label>
                    <label className="control-field">
                      <span>
                        Pérdida máxima tolerable <small>MXN</small>
                      </span>
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="1000"
                        value={lossLimit}
                        onChange={event => setLossLimit(Math.max(Number(event.target.value), 0))}
                      />
                    </label>
                    <label className="range-field mission-horizon">
                      <span>
                        Horizonte <strong>{horizon} meses</strong>
                      </span>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        step="12"
                        value={horizon}
                        onChange={event => setHorizon(Number(event.target.value))}
                      />
                      <small>
                        <span>12 meses</span>
                        <span>120 meses</span>
                      </small>
                    </label>
                  </div>
                  <div className="mission-reading">
                    <span>PRIMER LÍMITE CALCULADO</span>
                    <strong>{mxnFormatter.format(maximumExposure)}</strong>
                    <p>
                      Exposición máxima matemática si pruebas una caída de {stressDrawdown}% y
                      mantienes la pérdida dentro de {mxnFormatter.format(lossLimit)}.
                    </p>
                  </div>
                  <div className="mission-actions">
                    <small>Escenario educativo; no es una recomendación.</small>
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={capital <= 0 || patrimony <= 0}
                      onClick={() => moveMission(2)}
                    >
                      Continuar <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
              {missionStep === 2 && (
                <div className="mission-panel">
                  <div className="panel-label">
                    <span>02</span>
                    <div>
                      <small>ENCENDIDO</small>
                      <h3 ref={missionHeadingRef} tabIndex={-1}>
                        Indica desde dónde comienzas.
                      </h3>
                    </div>
                  </div>
                  <div className="mission-mode" role="group" aria-label="Punto de partida">
                    <button
                      type="button"
                      className={missionMode === 'new' ? 'is-active' : ''}
                      aria-pressed={missionMode === 'new'}
                      onClick={() => setMissionMode('new')}
                    >
                      <span>Empiezo desde cero</span>
                      <small>Exploraré una arquitectura de referencia.</small>
                    </button>
                    <button
                      type="button"
                      className={missionMode === 'portfolio' ? 'is-active' : ''}
                      aria-pressed={missionMode === 'portfolio'}
                      onClick={() => setMissionMode('portfolio')}
                    >
                      <span>Ya tengo activos</span>
                      <small>Compararé mi posición contra el modelo.</small>
                    </button>
                  </div>
                  {missionMode === 'portfolio' ? (
                    <div className="mission-holdings">
                      {allocation.map(asset => (
                        <label key={asset.id}>
                          <span>
                            <i style={{ background: asset.color }} />
                            <strong>{asset.symbol}</strong>
                            <small>Meta {(asset.weight * 100).toFixed(0)}%</small>
                          </span>
                          <input
                            inputMode="decimal"
                            type="number"
                            min="0"
                            step="500"
                            value={holdings[asset.id]}
                            aria-label={`Valor actual de ${asset.name} en pesos`}
                            onChange={event =>
                              setHoldings(current => ({
                                ...current,
                                [asset.id]: Math.max(Number(event.target.value), 0),
                              }))
                            }
                          />
                        </label>
                      ))}
                      <div className="mission-total">
                        <span>Exposición registrada</span>
                        <strong>{mxnFormatter.format(totalHoldings)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="mission-reference">
                      <div className="allocation-ring mini-ring" aria-hidden="true">
                        <div>
                          <strong>60/20</strong>
                          <span>10/10</span>
                        </div>
                      </div>
                      <div>
                        <span>MODELO EDUCATIVO DE REFERENCIA</span>
                        <h4>Génesis 60 / 20 / 10 / 10</h4>
                        <p>
                          Un núcleo dominante y posiciones satélite acotadas. Es una base para
                          explorar concentración y diversificación, no una fórmula universal.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="mission-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => moveMission(1)}
                    >
                      <span aria-hidden="true">←</span> Volver
                    </button>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => moveMission(3)}
                    >
                      Probar resistencia <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
              {missionStep === 3 && (
                <div className="mission-panel">
                  <div className="panel-label">
                    <span>03</span>
                    <div>
                      <small>TURBULENCIA CONTROLADA</small>
                      <h3 ref={missionHeadingRef} tabIndex={-1}>
                        Somete la trayectoria a una caída severa.
                      </h3>
                    </div>
                  </div>
                  <p className="mission-panel-lead">
                    Elige un escenario hipotético. No predice el mercado: mide si la exposición que
                    planteas rebasa el límite que tú definiste.
                  </p>
                  <div className="mission-stress-options">
                    {[25, 40, 60].map(drawdown => (
                      <button
                        type="button"
                        className={stressDrawdown === drawdown ? 'is-active' : ''}
                        aria-pressed={stressDrawdown === drawdown}
                        key={drawdown}
                        onClick={() => setStressDrawdown(drawdown)}
                      >
                        <span>Caída hipotética</span>
                        <strong>−{drawdown}%</strong>
                        <small>
                          Pérdida estimada {mxnFormatter.format(missionExposure * (drawdown / 100))}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div
                    className={
                      missionWithinLimit
                        ? 'mission-verdict is-contained'
                        : 'mission-verdict is-exceeded'
                    }
                    role="status"
                  >
                    <span>
                      {missionWithinLimit
                        ? 'DENTRO DEL LÍMITE DECLARADO'
                        : 'REBASA EL LÍMITE DECLARADO'}
                    </span>
                    <strong>{mxnFormatter.format(missionStressLoss)}</strong>
                    <p>
                      Con una exposición de {mxnFormatter.format(missionExposure)}, una caída de{' '}
                      {stressDrawdown}% produciría esta pérdida matemática aproximada, sin
                      considerar impuestos, comisiones ni liquidez.
                    </p>
                  </div>
                  <div className="mission-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => moveMission(2)}
                    >
                      <span aria-hidden="true">←</span> Volver
                    </button>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => moveMission(4)}
                    >
                      Trazar el plan <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
              {missionStep === 4 && (
                <div className="mission-panel mission-complete">
                  <div className="panel-label">
                    <span>04</span>
                    <div>
                      <small>ÓRBITA DE CONTROL</small>
                      <h3 ref={missionHeadingRef} tabIndex={-1}>
                        Tu hoja de ruta está lista para revisión.
                      </h3>
                    </div>
                    <span className="result-chip">Plan de misión</span>
                  </div>
                  <div className="mission-summary-grid">
                    <div>
                      <span>
                        {missionMode === 'portfolio'
                          ? 'Exposición registrada'
                          : 'Capital analizado'}
                      </span>
                      <strong>{mxnFormatter.format(missionExposure)}</strong>
                      <small>{horizon} meses de horizonte</small>
                    </div>
                    <div>
                      <span>Techo de exposición</span>
                      <strong>{mxnFormatter.format(maximumExposure)}</strong>
                      <small>Según tu pérdida máxima</small>
                    </div>
                    <div>
                      <span>Prueba de estrés</span>
                      <strong>−{stressDrawdown}%</strong>
                      <small>
                        {missionWithinLimit ? 'Dentro del límite' : 'Rebasa el límite declarado'}
                      </small>
                    </div>
                  </div>
                  <div className="mission-directives">
                    <article>
                      <span>01</span>
                      <div>
                        <strong>Revisa el techo</strong>
                        <p>
                          Bajo los supuestos declarados, una exposición superior a{' '}
                          {mxnFormatter.format(maximumExposure)} rebasa el límite de pérdida
                          indicado.
                        </p>
                      </div>
                    </article>
                    <article>
                      <span>02</span>
                      <div>
                        <strong>Aporta con disciplina</strong>
                        <p>Simula una aportación periódica antes de alterar el modelo.</p>
                      </div>
                    </article>
                    <article>
                      <span>03</span>
                      <div>
                        <strong>Revisa por excepción</strong>
                        <p>Revalúa cuando un peso se aleje más de cinco puntos de su objetivo.</p>
                      </div>
                    </article>
                  </div>
                  <div className="mission-actions mission-final-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => moveMission(1)}
                    >
                      Ajustar supuestos
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={saveWorkspace}
                    >
                      Guardar en este dispositivo
                    </button>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => window.print()}
                    >
                      Imprimir o guardar como PDF <span aria-hidden="true">↗</span>
                    </button>
                    <span role="status">{workspaceStatus}</span>
                  </div>
                  <p className="mission-disclaimer">
                    Resultado educativo basado en datos manuales y supuestos hipotéticos; no es
                    pronóstico ni recomendación de inversión. BitForward no recibe dinero, no
                    custodia llaves ni ejecuta operaciones. No se consideran impuestos, comisiones
                    ni condiciones de liquidez. Los activos digitales pueden ocasionar la pérdida
                    parcial o total del capital.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="market-strip" aria-label="Resumen del mercado digital">
        <div className="strip-heading">
          <span>Telemetría de mercado</span>
          <small>SEÑAL USD · 24H</small>
        </div>
        <div className="strip-grid">
          {market.assets.map(asset => (
            <button
              className={selectedAsset === asset.id ? 'ticker-card is-selected' : 'ticker-card'}
              type="button"
              key={asset.id}
              onClick={() => setSelectedAsset(asset.id)}
              aria-label={`Ver detalle de ${asset.name}`}
            >
              <span className="ticker-title">
                <i />
                <b>{asset.symbol}</b>
                <small>{asset.name}</small>
              </span>
              <span className="ticker-content">
                <span>
                  <strong>{formatPrice(asset.price)}</strong>
                  <small className={asset.change24h >= 0 ? 'change-positive' : 'change-negative'}>
                    {formatChange(asset.change24h)} 24h
                  </small>
                </span>
                <Sparkline values={asset.history} positive={asset.change24h >= 0} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="market-section section-shell" id="mercado">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RADAR DE MERCADO</p>
            <h2>Precio con contexto, no como señal de compra.</h2>
          </div>
          <div className="market-meta" aria-live="polite">
            <span>{market.isFallback ? 'Referencia informativa' : market.source}</span>
            <button type="button" onClick={() => void refreshMarket()} disabled={loadingMarket}>
              {loadingMarket ? 'Actualizando…' : 'Actualizar datos ↻'}
            </button>
          </div>
        </div>
        <div className="market-console">
          <div
            className="asset-selector"
            role="tablist"
            aria-label="Activos"
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                return;
              }
              event.preventDefault();
              const currentIndex = market.assets.findIndex(asset => asset.id === selected.id);
              const nextIndex =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? market.assets.length - 1
                    : event.key === 'ArrowRight'
                      ? (currentIndex + 1) % market.assets.length
                      : (currentIndex - 1 + market.assets.length) % market.assets.length;
              const nextAsset = market.assets[nextIndex];
              setSelectedAsset(nextAsset.id);
              window.requestAnimationFrame(() => {
                document.getElementById(`asset-tab-${nextAsset.id}`)?.focus();
              });
            }}
          >
            {market.assets.map(asset => (
              <button
                type="button"
                role="tab"
                id={`asset-tab-${asset.id}`}
                aria-controls="asset-panel"
                aria-selected={selected.id === asset.id}
                tabIndex={selected.id === asset.id ? 0 : -1}
                className={selected.id === asset.id ? 'is-active' : ''}
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
              >
                <span>{asset.symbol}</span>
                <small>{asset.role}</small>
              </button>
            ))}
          </div>
          <article
            className="asset-detail"
            id="asset-panel"
            role="tabpanel"
            aria-labelledby={`asset-tab-${selected.id}`}
          >
            <div className="asset-detail-top">
              <div>
                <p>
                  {selected.name} · {selected.symbol}/USD
                </p>
                <strong>{formatPrice(selected.price)}</strong>
              </div>
              <div className="change-block">
                <span className={selected.change24h >= 0 ? 'change-positive' : 'change-negative'}>
                  {formatChange(selected.change24h)}
                </span>
                <small>24 horas</small>
              </div>
            </div>
            <Sparkline values={selected.history} positive={selected.change24h >= 0} large />
            <div className="asset-facts">
              <div>
                <span>Función en el modelo</span>
                <strong>{selected.role}</strong>
              </div>
              <div>
                <span>Peso de referencia</span>
                <strong>{selected.allocation}%</strong>
              </div>
              <div>
                <span>Riesgo observado</span>
                <strong>{selected.risk}</strong>
              </div>
              <div className="asset-thesis">
                <span>Tesis educativa</span>
                <strong>{selected.thesis}</strong>
              </div>
            </div>
          </article>
        </div>
        <div className="comparison-panel" aria-labelledby="comparison-title">
          <div className="comparison-heading">
            <div>
              <p className="eyebrow">COMPARADOR</p>
              <h3 id="comparison-title">Señales lado a lado.</h3>
            </div>
            <div className="comparison-sort" aria-label="Ordenar comparador">
              {[
                ['allocation', 'Peso'],
                ['change24h', '24 h'],
                ['change7d', '7 d'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={comparisonSort === key ? 'is-active' : ''}
                  aria-pressed={comparisonSort === key}
                  onClick={() => setComparisonSort(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="comparison-table">
            <div className="comparison-row comparison-header">
              <span>Activo</span>
              <span>Precio</span>
              <span>24 h</span>
              <span>7 d</span>
              <span>Peso</span>
              <span>Función</span>
            </div>
            {sortedAssets.map(asset => (
              <button
                type="button"
                className="comparison-row"
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
              >
                <span>
                  <i />
                  <strong>{asset.symbol}</strong>
                  <small>{asset.name}</small>
                </span>
                <span>{formatPrice(asset.price)}</span>
                <span className={asset.change24h >= 0 ? 'change-positive' : 'change-negative'}>
                  {formatChange(asset.change24h)}
                </span>
                <span className={asset.change7d >= 0 ? 'change-positive' : 'change-negative'}>
                  {formatChange(asset.change7d)}
                </span>
                <span>{asset.allocation}%</span>
                <span>{asset.role}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="model-section section-shell" id="modelo">
        <div className="model-intro">
          <div>
            <p className="eyebrow">MODELO GÉNESIS</p>
            <h2>Arquitectura 60 / 20 / 10 / 10.</h2>
          </div>
          <p>
            Un núcleo dominante y posiciones satélite acotadas. La asignación enseña estructura; no
            sustituye el perfil de riesgo ni la reserva de liquidez.
          </p>
        </div>
        <div className="model-grid">
          <div className="allocation-visual">
            <div className="allocation-ring">
              <div>
                <strong>Génesis</strong>
                <span>Base educativa</span>
              </div>
            </div>
            <div className="model-rule">
              <span>Banda de control</span>
              <strong>±5 puntos</strong>
              <small>Rebalanceo por excepción</small>
            </div>
          </div>
          <div className="allocation-table">
            {allocation.map((asset, index) => (
              <div className="allocation-row" key={asset.symbol}>
                <span className="allocation-index">0{index + 1}</span>
                <i style={{ background: asset.color }} />
                <div>
                  <strong>{asset.name}</strong>
                  <small>{asset.symbol} · Función estructural</small>
                </div>
                <b>{asset.weight * 100}%</b>
                <span>{mxnFormatter.format(capital * asset.weight)}</span>
              </div>
            ))}
            <label className="model-capital-field">
              <span>Capital de referencia</span>
              <input
                type="number"
                min="1000"
                max="100000000"
                step="1000"
                value={capital}
                onChange={event => setCapital(Math.max(Number(event.target.value), 0))}
              />
              <small>MXN</small>
            </label>
          </div>
        </div>
      </section>
      <section className="tools-section" id="herramientas">
        <div className="section-shell">
          <div className="section-heading tools-heading">
            <div>
              <p className="eyebrow">MESA AVANZADA</p>
              <h2>Profundiza sólo cuando lo necesites.</h2>
            </div>
            <p>
              El Centro de Misión resuelve la ruta esencial. Aquí puedes abrir cálculos de
              exposición, rebalanceo y aportaciones con mayor detalle.
            </p>
          </div>
          <details className="advanced-tools">
            <summary>
              <span>
                <small>HERRAMIENTAS CONECTADAS</small>
                <strong>Abrir Mesa de Análisis avanzada</strong>
              </span>
              <span aria-hidden="true">+</span>
            </summary>
            <div className="advanced-tools-body">
              <div className="tool-commandbar">
                <div>
                  <span className="live-dot" />
                  <p>
                    <strong>Sesión local opcional</strong>
                    <small>
                      Si guardas, los datos quedan sólo en este navegador. Elimínalos en un equipo
                      compartido.
                    </small>
                  </p>
                </div>
                <div>
                  <button type="button" onClick={resetDesk}>
                    Restablecer
                  </button>
                  <button type="button" onClick={saveWorkspace}>
                    Guardar sesión local
                  </button>
                  <button type="button" onClick={restoreWorkspace}>
                    Recuperar
                  </button>
                  <button type="button" onClick={clearWorkspace}>
                    Eliminar sesión
                  </button>
                  <button type="button" onClick={() => window.print()}>
                    Imprimir / PDF
                  </button>
                </div>
                <span role="status">{workspaceStatus}</span>
              </div>
              <div className="tools-grid">
                <article className="tool-card exposure-tool">
                  <div className="tool-card-heading">
                    <span>01</span>
                    <div>
                      <small>CONTROL DE PÉRDIDA</small>
                      <h3>Límite de exposición</h3>
                    </div>
                  </div>
                  <p className="tool-intro">
                    Convierte una pérdida máxima tolerable en un techo matemático de exposición
                    digital.
                  </p>
                  <div className="tool-input-grid">
                    <label className="control-field">
                      <span>
                        Patrimonio líquido <small>MXN</small>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={patrimony}
                        onChange={event => setPatrimony(Math.max(Number(event.target.value), 0))}
                      />
                    </label>
                    <label className="control-field">
                      <span>
                        Pérdida máxima <small>MXN</small>
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={lossLimit}
                        onChange={event => setLossLimit(Math.max(Number(event.target.value), 0))}
                      />
                    </label>
                  </div>
                  <label className="range-field stress-field">
                    <span>
                      Caída de estrés <strong>−{stressDrawdown}%</strong>
                    </span>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      step="5"
                      value={stressDrawdown}
                      onChange={event => setStressDrawdown(Number(event.target.value))}
                    />
                    <small>
                      <span>−20%</span>
                      <span>−80%</span>
                    </small>
                  </label>
                  <div className="exposure-result">
                    <span>Exposición máxima matemática</span>
                    <strong>{mxnFormatter.format(maximumExposure)}</strong>
                    <div>
                      <i style={{ width: `${Math.min(exposurePercent, 100)}%` }} />
                    </div>
                    <p>
                      Equivale a <b>{exposurePercent.toFixed(1)}%</b> del patrimonio líquido bajo el
                      supuesto de caída seleccionado.
                    </p>
                  </div>
                  <div className="stress-grid" aria-label="Pruebas de tensión">
                    {[25, 40, 60].map(drawdown => (
                      <div key={drawdown}>
                        <span>Caída −{drawdown}%</span>
                        <strong>{mxnFormatter.format(maximumExposure * (drawdown / 100))}</strong>
                        <small>Pérdida sobre el techo calculado</small>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="tool-card rebalance-tool">
                  <div className="tool-card-heading">
                    <span>02</span>
                    <div>
                      <small>DISCIPLINA DE CARTERA</small>
                      <h3>Rebalanceador Génesis</h3>
                    </div>
                  </div>
                  <p className="tool-intro">
                    Registra el valor actual de cada posición y compara contra la arquitectura 60 /
                    20 / 10 / 10.
                  </p>
                  <div className="holding-inputs">
                    {allocation.map(asset => (
                      <label key={asset.id}>
                        <span>
                          <i style={{ background: asset.color }} />
                          <b>{asset.symbol}</b>
                          <small>Meta {(asset.weight * 100).toFixed(0)}%</small>
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={holdings[asset.id]}
                          aria-label={`Valor actual de ${asset.name} en pesos`}
                          onChange={event =>
                            setHoldings(current => ({
                              ...current,
                              [asset.id]: Math.max(Number(event.target.value), 0),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="rebalance-table">
                    <div className="rebalance-row rebalance-header">
                      <span>Activo</span>
                      <span>Actual</span>
                      <span>Meta</span>
                      <span>Ajuste</span>
                    </div>
                    {rebalanceRows.map(asset => (
                      <div className="rebalance-row" key={asset.id}>
                        <span>{asset.symbol}</span>
                        <span>{(asset.currentWeight * 100).toFixed(1)}%</span>
                        <span>{(asset.weight * 100).toFixed(0)}%</span>
                        <strong
                          className={asset.delta >= 0 ? 'change-positive' : 'change-negative'}
                        >
                          {asset.delta >= 0 ? '+' : ''}
                          {mxnFormatter.format(asset.delta)}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="portfolio-total">
                    <span>Valor registrado</span>
                    <strong>{mxnFormatter.format(totalHoldings)}</strong>
                  </div>
                </article>
              </div>
              <article className="contribution-tool">
                <div className="tool-card-heading">
                  <span>03</span>
                  <div>
                    <small>APORTACIÓN SIN VENTAS</small>
                    <h3>Distribuye el siguiente fondeo hacia las brechas.</h3>
                  </div>
                </div>
                <label className="contribution-input">
                  <span>Siguiente aportación</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={rebalanceContribution}
                    onChange={event =>
                      setRebalanceContribution(Math.max(Number(event.target.value), 0))
                    }
                  />
                  <small>MXN</small>
                </label>
                <div className="contribution-plan">
                  {contributionPlan.map(asset => (
                    <div key={asset.id}>
                      <span>
                        <i style={{ background: asset.color }} />
                        {asset.symbol}
                      </span>
                      <strong>{mxnFormatter.format(asset.amount)}</strong>
                      <small>
                        {rebalanceContribution > 0
                          ? `${((asset.amount / rebalanceContribution) * 100).toFixed(0)}% del fondeo`
                          : 'Sin fondeo'}
                      </small>
                    </div>
                  ))}
                </div>
                <p>
                  Regla mecánica para reducir desviaciones usando capital nuevo. No considera
                  impuestos, comisiones, liquidez ni idoneidad individual.
                </p>
              </article>
            </div>
          </details>
        </div>
      </section>
      <section className="simulator-section" id="simulador">
        <div className="section-shell">
          <div className="section-heading simulator-heading">
            <div>
              <p className="eyebrow">LABORATORIO DE ESCENARIOS</p>
              <h2>Prueba la estrategia. Después decide.</h2>
            </div>
            <p>
              Ajusta capital, aportaciones, horizonte y escenario. Todo el cálculo ocurre en tu
              navegador.
            </p>
          </div>
          <div className="simulator-workspace">
            <form className="simulator-controls" onSubmit={event => event.preventDefault()}>
              <div className="panel-label">
                <span>01</span>
                <div>
                  <small>ENTRADAS</small>
                  <strong>Construye el escenario</strong>
                </div>
              </div>
              <label className="control-field">
                <span>
                  Capital inicial <small>MXN</small>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="1000"
                  value={capital}
                  onChange={event => setCapital(Math.max(Number(event.target.value), 0))}
                />
              </label>
              <label className="control-field">
                <span>
                  Aportación mensual <small>MXN</small>
                </span>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  step="500"
                  value={monthly}
                  onChange={event => setMonthly(Math.max(Number(event.target.value), 0))}
                />
              </label>
              <label className="range-field">
                <span>
                  Horizonte <strong>{horizon} meses</strong>
                </span>
                <input
                  type="range"
                  min="12"
                  max="120"
                  step="12"
                  value={horizon}
                  onChange={event => setHorizon(Number(event.target.value))}
                />
                <small>
                  <span>12 meses</span>
                  <span>120 meses</span>
                </small>
              </label>
              <fieldset className="scenario-field">
                <legend>Escenario anual hipotético</legend>
                {Object.entries(scenarios).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    className={scenario === key ? 'is-active' : ''}
                    aria-pressed={scenario === key}
                    onClick={() => setScenario(key)}
                  >
                    <strong>{item.label}</strong>
                    <span>
                      {item.annualRate > 0 ? '+' : ''}
                      {(item.annualRate * 100).toFixed(0)}%
                    </span>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </fieldset>
              <div className="simulator-note">
                <span>!</span>
                <p>
                  Los escenarios son supuestos constantes, no pronósticos ni promesas de
                  rendimiento.
                </p>
              </div>
            </form>
            <div className="results-panel" tabIndex={-1}>
              <div className="panel-label">
                <span>02</span>
                <div>
                  <small>RESULTADO</small>
                  <strong>Lectura del escenario</strong>
                </div>
                <span className="result-chip">{scenarios[scenario].label}</span>
              </div>
              <div className="result-metrics">
                <div className="primary-result">
                  <span>Valor hipotético final</span>
                  <strong>{mxnFormatter.format(projection.finalValue)}</strong>
                  <small>Al mes {horizon} con aportaciones mensuales constantes</small>
                </div>
                <div>
                  <span>Capital aportado</span>
                  <strong>{mxnFormatter.format(projection.contributed)}</strong>
                </div>
                <div>
                  <span>Resultado hipotético</span>
                  <strong
                    className={projection.result >= 0 ? 'change-positive' : 'change-negative'}
                  >
                    {mxnFormatter.format(projection.result)}
                  </strong>
                </div>
                <div>
                  <span>Variación sobre aportado</span>
                  <strong
                    className={
                      projection.resultPercent >= 0 ? 'change-positive' : 'change-negative'
                    }
                  >
                    {formatChange(projection.resultPercent * 100)}
                  </strong>
                </div>
              </div>
              <ProjectionChart records={projection.records} />
              <div className="chart-legend">
                <span>
                  <i className="legend-value" /> Valor hipotético
                </span>
                <span>
                  <i className="legend-contribution" /> Capital aportado
                </span>
              </div>
              <div className="result-actions">
                <button type="button" onClick={() => void copyScenario()}>
                  Copiar resumen
                </button>
                <button type="button" onClick={exportScenario}>
                  Exportar CSV
                </button>
                <span role="status">{copyStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="methodology-section section-shell" id="metodologia">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SISTEMA DE DECISIÓN</p>
            <h2>Menos ruido. Más trazabilidad.</h2>
          </div>
          <p>
            Cada lectura explica qué dato se usó, qué supuesto cambió y qué regla protege la
            decisión.
          </p>
        </div>
        <div className="method-grid">
          {[
            ['Observar', 'Datos públicos, fuente y hora de actualización visibles.'],
            ['Formular', 'Capital, aportaciones, horizonte y supuestos explícitos.'],
            ['Simular', 'Resultado reproducible y comparación contra lo aportado.'],
            ['Controlar', 'Exposición, liquidez, rebalanceo y capacidad de pérdida.'],
          ].map(([title, detail], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <div className="method-icon" aria-hidden="true">
                <i />
              </div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <div className="risk-architecture">
          <div className="risk-visual">
            <img
              className="risk-orbit-art"
              src={orbitalMissionUrl}
              alt=""
              width="1536"
              height="1024"
              loading="lazy"
              aria-hidden="true"
            />
            <div className="risk-orbit risk-orbit-one" />
            <div className="risk-orbit risk-orbit-two" />
            <div className="risk-orbit risk-orbit-three" />
            <div className="risk-center">
              <small>BITFORWARD</small>
              <strong>Órbita segura</strong>
              <span>riesgo antes que retorno</span>
            </div>
            <div className="orbit-caption orbit-caption-one">
              <span>01</span>
              Exposición
            </div>
            <div className="orbit-caption orbit-caption-two">
              <span>02</span>
              Liquidez
            </div>
            <div className="orbit-caption orbit-caption-three">
              <span>03</span>
              Disciplina
            </div>
          </div>
          <div className="risk-copy">
            <p className="eyebrow">MARCO DE CONTROL</p>
            <h2>Primero protección. Después crecimiento.</h2>
            <p>
              El potencial no elimina el riesgo. BitForward separa una tesis patrimonial de una
              reacción emocional.
            </p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Límite de exposición</strong>
                  <p>Capital compatible con volatilidad y pérdida posible.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Reserva de liquidez</strong>
                  <p>El portafolio digital no reemplaza una reserva.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Rebalanceo por excepción</strong>
                  <p>La asignación vuelve al objetivo al romper su banda.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Custodia documentada</strong>
                  <p>Accesos, respaldos y comprobantes se separan.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>
      <section className="afortu-section section-shell" id="afortu">
        <div className="afortu-brand-panel">
          <div className="afortu-copy">
            <p className="eyebrow">BITFORWARD · UNA INICIATIVA DE AFORTU</p>
            <h2>La capa cripto de una visión patrimonial más amplia.</h2>
            <p>
              BitForward nace dentro de AFORTU para estudiar los activos digitales por la función
              que pueden cumplir, el riesgo que agregan y las reglas necesarias para darles
              seguimiento. No presenta cripto como un atajo hacia el rendimiento.
            </p>
            <p>
              La plataforma integra educación financiera, análisis cuantitativo y planeación en un
              sistema propio: primero la misión, después la trayectoria, la telemetría y,
              finalmente, una órbita con reglas.
            </p>
            <div className="afortu-signature">
              <img src={logoUrl} alt="BitForward v2.0" width="900" height="560" loading="lazy" />
              <span>
                <strong>Proyecto cripto de AFORTU</strong>
                <small>Método BitForward · versión 2.0 · julio de 2026</small>
              </span>
            </div>
          </div>
          <div className="afortu-system">
            <p>LO QUE HACE DIFERENTE AL SISTEMA</p>
            {[
              [
                'Misión antes que mercado',
                'El objetivo, el horizonte y la pérdida tolerable van antes que cualquier activo.',
              ],
              [
                'Telemetría, no euforia',
                'Cada cifra muestra fuente, corte, moneda y supuesto para poder revisarla.',
              ],
              [
                'Órbita con reglas',
                'Exposición, pruebas de estrés, aportaciones y rebalanceo viven en una misma ruta.',
              ],
            ].map(([title, detail], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              </article>
            ))}
            <blockquote>
              “El cohete expresa avance. Lo difícil de copiar es el sistema: supuestos visibles,
              reglas reproducibles y una metodología que puede auditarse.”
            </blockquote>
          </div>
        </div>
      </section>
      <section className="diagnostic-section">
        <div className="section-shell diagnostic-grid">
          <div className="diagnostic-copy">
            <p className="eyebrow">DIAGNÓSTICO EDUCATIVO</p>
            <h2>¿Tu estructura resiste la volatilidad?</h2>
            <p>
              Marca sólo lo que ya existe hoy. Esta lectura identifica brechas; no determina
              idoneidad ni reemplaza una evaluación profesional.
            </p>
            <div className={`diagnostic-result ${readinessReading.tone}`}>
              <span>PREPARACIÓN OBSERVADA</span>
              <strong>{readinessReading.label}</strong>
              <p>{readinessReading.detail}</p>
              <div>
                <i style={{ width: `${readinessScore * 20}%` }} />
              </div>
            </div>
          </div>
          <div className="readiness-list">
            {readinessControls.map(control => (
              <label key={control.id}>
                <input
                  type="checkbox"
                  checked={readiness.includes(control.id)}
                  onChange={() => toggleReadiness(control.id)}
                />
                <span className="custom-check" aria-hidden="true" />
                <span>
                  <strong>{control.title}</strong>
                  <small>{control.detail}</small>
                </span>
              </label>
            ))}
            <button type="button" onClick={() => setReadiness([])}>
              Restablecer diagnóstico
            </button>
          </div>
        </div>
      </section>
      <section className="scope-section section-shell">
        <div className="scope-card">
          <div>
            <p className="eyebrow">FRONTERA DE RESPONSABILIDAD</p>
            <h2>Lo que BitForward es. Y lo que no es.</h2>
          </div>
          <div className="scope-columns">
            <article>
              <span>SÍ</span>
              <strong>Inteligencia y simulación</strong>
              <p>
                Lectura de mercado, escenarios educativos, reglas de riesgo y trazabilidad
                metodológica.
              </p>
            </article>
            <article>
              <span>NO</span>
              <strong>Custodia o ejecución</strong>
              <p>
                No recibe dinero, no guarda llaves, no opera activos y no garantiza rendimientos.
                Tampoco constituye oferta, asesoría individual ni intermediación.
              </p>
            </article>
          </div>
        </div>
        <div className="closing-cta">
          <div>
            <p className="eyebrow">PRÓXIMA TRAYECTORIA</p>
            <h2>No despegues sin una ruta.</h2>
            <p>
              Abre el Centro de Misión, prueba tus supuestos y conserva un plan que puedas revisar
              antes de tomar cualquier decisión.
            </p>
          </div>
          <a className="button button-primary" href="#mision">
            Abrir Centro de Misión <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <nav className="mobile-dock" aria-label="Navegación rápida">
        <a href="#mision">
          <span aria-hidden="true">↗</span>
          Misión
        </a>
        <a href="#mercado">
          <span aria-hidden="true">◉</span>
          Radar
        </a>
        <a href="#modelo">
          <span aria-hidden="true">◎</span>
          Génesis
        </a>
        <a href="#afortu">
          <span aria-hidden="true">A</span>
          AFORTU
        </a>
      </nav>
      <button
        className="mobile-motion-toggle"
        type="button"
        aria-pressed={motionPaused}
        onClick={() => setMotionPaused(value => !value)}
      >
        {motionPaused ? 'Reanudar efectos' : 'Pausar efectos'}
      </button>
      <footer className="site-footer">
        <Brand />
        <div>
          <a href="#mision">Centro de Misión</a>
          <a href="#mercado">Radar</a>
          <a href="#modelo">Modelo Génesis</a>
          <a href="#metodologia">Método</a>
          <a href="#afortu">AFORTU</a>
          <a href="mailto:contacto@afortu.com.mx?subject=Consulta%20BitForward">Contacto</a>
        </div>
        <p>
          © 2026 AFORTU. BitForward ofrece análisis y simulaciones educativas; no custodia recursos
          ni ejecuta operaciones, y no constituye oferta, asesoría individual ni intermediación. Los
          activos digitales son altamente volátiles y pueden ocasionar la pérdida parcial o total
          del capital.
        </p>
      </footer>
    </main>
  );
}
export { Home as default };
