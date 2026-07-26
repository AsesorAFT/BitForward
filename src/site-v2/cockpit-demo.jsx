import { useEffect, useMemo, useState } from 'react';
import logoUrl from '../../assets/brand/bitforward-logo-v2.webp';
import heroUrl from '../../assets/brand/hero-intelligence.webp';
import rocketUrl from '../../assets/brand/rocket-hero-v2.webp';

const sections = [
  { id: 'panel', code: '00', label: 'Cockpit', short: 'Inicio' },
  { id: 'perfil', code: '01', label: 'Perfil del Piloto', short: 'Perfil' },
  { id: 'plan', code: '02', label: 'Plan de Vuelo', short: 'Plan' },
  { id: 'telemetria', code: '03', label: 'Telemetría', short: 'Datos' },
  { id: 'bitacora', code: '04', label: 'Bitácora', short: 'Bitácora' },
  { id: 'navigator', code: '05', label: 'Navigator', short: 'Navigator' },
  { id: 'torre', code: '06', label: 'Torre AFORTU', short: 'Torre' },
  { id: 'privacidad', code: '07', label: 'Privacidad', short: 'Privacidad' },
  { id: 'pagos', code: '08', label: 'Métodos de pago', short: 'Pagos' },
];

const towerTabs = [
  ['dossiers', 'Expedientes', '1'],
  ['decisions', 'Decisiones', '1'],
  ['review', 'Mesa AFORTU', '1'],
];

const positions = [
  { symbol: 'BTC', role: 'Núcleo', value: 30000, cost: 27000, weight: 50 },
  { symbol: 'ETH', role: 'Infraestructura', value: 18000, cost: 17400, weight: 30 },
  { symbol: 'SOL', role: 'Crecimiento', value: 8000, cost: 8400, weight: 13.3 },
  { symbol: 'ADA', role: 'Satélite', value: 4000, cost: 4600, weight: 6.7 },
];

const systems = [
  ['Casco', 'Conocimiento y experiencia declarados'],
  ['Oxígeno', 'Liquidez y reserva separada'],
  ['Escudo', 'Capital y pérdida máxima declarados'],
  ['Navegación', 'Objetivo y horizonte documentados'],
  ['Protocolo', 'Custodia y disciplina documentadas'],
];

const intents = {
  contradictions: {
    eyebrow: 'CONTRADICCIONES · RESULTADO SIMULADO',
    title: 'Una regla necesita revisión.',
    summary:
      'La exposición ficticia de esta demostración es 30%, por debajo del límite de 35%. El pendiente es documental: falta registrar una revisión semanal.',
    facts: [
      ['Exposición observada', '30%'],
      ['Límite del plan', '35%'],
      ['Pérdida bajo estrés', '$24,000 MXN'],
      ['Límite de pérdida', '$50,000 MXN'],
    ],
  },
  scenarios: {
    eyebrow: 'ESCENARIOS · RESULTADO SIMULADO',
    title: 'El escenario cambia la pérdida matemática, no la decisión.',
    summary:
      'Una caída hipotética de 40% sobre $60,000 MXN equivale a $24,000 MXN. La demo no indica comprar, vender ni modificar posiciones.',
    facts: [
      ['Capital de referencia', '$200,000 MXN'],
      ['Exposición ficticia', '$60,000 MXN'],
      ['Caída hipotética', '−40%'],
      ['Pérdida matemática', '$24,000 MXN'],
    ],
  },
  review: {
    eyebrow: 'REVISIÓN · RESULTADO SIMULADO',
    title: 'El expediente necesita una fuente fechada.',
    summary:
      'Antes de una revisión humana, la muestra pide confirmar fuente, fecha y criterio de cierre. Ningún expediente real se crea desde esta página.',
    facts: [
      ['Perfil', 'Completo'],
      ['Plan', 'Revisión 3'],
      ['Telemetría', 'Muestra ficticia'],
      ['Pago', 'No configurado'],
    ],
  },
};

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

function currentSection() {
  const id = window.location.hash.replace('#', '');
  return sections.some(section => section.id === id) ? id : 'panel';
}

function MicroLabel({ children }) {
  return <p className="demo-micro-label">{children}</p>;
}

function ModuleHeader({ code, eyebrow, title, detail, badge }) {
  return (
    <header className="demo-module-header">
      <div>
        <MicroLabel>
          {code} · {eyebrow}
        </MicroLabel>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {badge ? <span className="demo-large-status">{badge}</span> : null}
    </header>
  );
}

function DemoButton({ children, onClick, secondary = false, disabled = false }) {
  return (
    <button
      type="button"
      className={secondary ? 'demo-action demo-action-secondary' : 'demo-action'}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}

function Notice({ children, onClose }) {
  return (
    <div className="demo-notice" role="status">
      <span>{children}</span>
      <button type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}

function Overview({ notify, motionPaused }) {
  return (
    <div className="demo-overview">
      <section
        className="demo-mission-hero"
        style={{ '--demo-hero': `url(${heroUrl})` }}
        aria-labelledby="demo-welcome"
      >
        <div className="demo-mission-copy">
          <MicroLabel>BITFORWARD · PROYECTO CRIPTO DE AFORTU</MicroLabel>
          <h1 id="demo-welcome">
            Buen regreso, <em>Piloto Demo.</em>
          </h1>
          <p>
            Esta cabina muestra cómo se organizan contexto, reglas, telemetría y decisiones. Todo el
            contenido de esta versión es ficticio.
          </p>
          <div className="demo-priority">
            <span>REVISIÓN DE MISIÓN</span>
            <h2>La revisión semanal sigue pendiente.</h2>
            <p>
              Las cifras de ejemplo están dentro de los límites. Falta documentar que el piloto
              revisó la evidencia.
            </p>
            <a className="demo-action" href="#navigator">
              Abrir explicación <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="demo-mission-visual">
          <img src={rocketUrl} alt="" aria-hidden="true" />
          <div className="demo-mission-stage">
            <strong>4/4</strong>
            <span>etapas demostradas</span>
            <small>{motionPaused ? 'Movimiento pausado' : 'Trayectoria activa'}</small>
          </div>
          <div className="demo-trajectory" aria-hidden="true">
            <span />
            <i>◆</i>
          </div>
        </div>
      </section>

      <section className="demo-metric-grid" aria-label="Estado ficticio de misión">
        {[
          ['PILOT', '5/5', 'Sistemas del piloto confirmados'],
          ['PLAN', 'R3', 'Plan de muestra activo'],
          ['TEL', '$60,000', 'Exposición ficticia capturada'],
          ['LOG', '3', 'Entradas de ejemplo'],
        ].map(metric => (
          <article key={metric[0]}>
            <span>{metric[0]}</span>
            <strong>{metric[1]}</strong>
            <p>{metric[2]}</p>
          </article>
        ))}
      </section>

      <section className="demo-control-grid">
        <div className="demo-radar">
          <header className="demo-radar-header">
            <div>
              <MicroLabel>RADAR DE DESVIACIONES · DEMO</MicroLabel>
              <h2>Revisión requerida</h2>
              <p>Hay un control documental pendiente; no existe una desviación financiera.</p>
            </div>
            <span className="demo-status demo-status-attention">Revisión requerida</span>
          </header>
          <div className="demo-deviation-counts">
            <div>
              <strong>0</strong>
              <span>críticas</span>
            </div>
            <div className="attention">
              <strong>1</strong>
              <span>atención</span>
            </div>
            <div>
              <strong>0</strong>
              <span>faltantes</span>
            </div>
            <div>
              <strong>11</strong>
              <span>controles</span>
            </div>
          </div>
          <article className="demo-finding">
            <span className="demo-finding-marker" aria-hidden="true" />
            <div>
              <header>
                <span>OVERVIEW.WEEKLY_REVIEW_DUE</span>
                <em>ATENCIÓN</em>
              </header>
              <h3>Aún no existe una revisión semanal.</h3>
              <p>
                La muestra registra datos coherentes, pero todavía no conserva evidencia conductual
                de una revisión.
              </p>
              <dl>
                <div>
                  <dt>Exposición ficticia</dt>
                  <dd>30%</dd>
                  <small>Telemetría demo · 25 jul 2026</small>
                </div>
                <div>
                  <dt>Límite declarado</dt>
                  <dd>35%</dd>
                  <small>Plan de muestra · revisión 3</small>
                </div>
              </dl>
              <a href="#navigator">Abrir explicación completa →</a>
            </div>
          </article>
        </div>
        <aside className="demo-weekly-card">
          <MicroLabel>REVISIÓN SEMANAL</MicroLabel>
          <h2>Registra lo que revisaste.</h2>
          <p>En la demo no se guarda información ni se modifica ningún expediente.</p>
          <div className="demo-readonly-note">
            <span>Nota de control</span>
            <p>Ejemplo: revisé límites, fuente y fecha de la telemetría.</p>
          </div>
          <DemoButton onClick={() => notify('Demostración visual: la revisión no fue guardada.')}>
            Simular revisión
          </DemoButton>
          <small>
            Esta acción sólo enseña el flujo. No confirma consentimiento ni una revisión real.
          </small>
        </aside>
      </section>

      <section className="demo-overview-grid">
        <div className="demo-system-card">
          <header>
            <div>
              <MicroLabel>MAPA DEL PILOTO</MicroLabel>
              <h2>Integridad del sistema personal.</h2>
            </div>
            <span>5/5 DEMOSTRADOS</span>
          </header>
          <ol>
            {systems.map((system, index) => (
              <li key={system[0]}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{system[0]}</strong>
                  <small>{system[1]}</small>
                </div>
                <em>LISTO</em>
              </li>
            ))}
          </ol>
          <a className="demo-text-link" href="#perfil">
            Ver Perfil del Piloto →
          </a>
        </div>
        <aside className="demo-timeline">
          <MicroLabel>SECUENCIA OPERATIVA</MicroLabel>
          <h2>Una siguiente acción.</h2>
          {[
            ['01', 'Perfil', '6/6 campos ficticios'],
            ['02', 'Plan', 'Revisión 3'],
            ['03', 'Telemetría', 'Muestra fechada'],
            ['04', 'Expediente', 'BF-DEMO-0001'],
          ].map(item => (
            <div className="demo-timeline-row" key={item[0]}>
              <span>{item[0]}</span>
              <div>
                <strong>{item[1]}</strong>
                <small>{item[2]}</small>
              </div>
              <em>LISTO</em>
            </div>
          ))}
          <div className="demo-scope-note">
            <strong>Frontera de la demostración</strong>
            <p>
              No compra, vende, custodia, autentica usuarios, procesa pagos ni emite recomendaciones
              individuales.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Profile() {
  return (
    <div className="demo-module">
      <ModuleHeader
        code="01"
        eyebrow="PERFIL DEL PILOTO"
        title="Documenta capacidad antes de medir exposición."
        detail="La muestra utiliza información sintética. No ingreses datos personales o patrimoniales en esta página."
        badge="6/6 CAMPOS DEMO"
      />
      <div className="demo-two-column">
        <section className="demo-panel">
          <MicroLabel>CONTEXTO FICTICIO</MicroLabel>
          <div className="demo-detail-grid">
            {[
              ['Piloto', 'Piloto Demo'],
              ['Objetivo', 'Aprender un proceso disciplinado'],
              ['Horizonte', '36 meses'],
              ['Experiencia', 'Intermedia'],
              ['Capital de referencia', '$200,000 MXN'],
              ['Pérdida máxima', '$50,000 MXN'],
              ['Liquidez', '6 meses'],
              ['Reserva separada', 'Sí · dato simulado'],
            ].map(item => (
              <div key={item[0]}>
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
              </div>
            ))}
          </div>
          <div className="demo-info-strip">
            Los campos son de solo lectura y no representan a una persona real.
          </div>
        </section>
        <aside className="demo-system-card compact">
          <MicroLabel>SISTEMAS DEL PILOTO</MicroLabel>
          <ol>
            {systems.map((system, index) => (
              <li key={system[0]}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{system[0]}</strong>
                  <small>{system[1]}</small>
                </div>
                <em>DEMO</em>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Plan() {
  return (
    <div className="demo-module">
      <ModuleHeader
        code="02"
        eyebrow="PLAN DE VUELO"
        title="Convierte intención en reglas revisables."
        detail="El plan demostrativo conserva propósito, límites y criterios de revisión sin ejecutar una estrategia."
        badge="R3 · MUESTRA"
      />
      <section className="demo-panel demo-plan-hero">
        <div>
          <MicroLabel>PLAN PRIMARIO · DATOS FICTICIOS</MicroLabel>
          <h2>Disciplina antes que pronóstico.</h2>
          <p>Explorar un proceso de control de exposición y documentar por qué una regla cambia.</p>
        </div>
        <div className="demo-plan-orbit" aria-hidden="true">
          <span>35%</span>
          <small>LÍMITE DEMO</small>
        </div>
      </section>
      <div className="demo-rule-grid">
        {[
          ['Universo', 'BTC, ETH, SOL y ADA como muestra educativa.'],
          ['Límite', 'La exposición ficticia no rebasa 35% del capital de referencia.'],
          ['Aportación', 'No existe una regla operativa ni una instrucción de depósito.'],
          ['Revisión', 'Revisar fuente, fecha, límites y evidencia cada semana.'],
          ['Invalidación', 'Detener el análisis si falta una fuente o el objetivo cambia.'],
          ['Próxima revisión', '31 de julio de 2026 · fecha demostrativa.'],
        ].map((rule, index) => (
          <article key={rule[0]}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{rule[0]}</h3>
            <p>{rule[1]}</p>
          </article>
        ))}
      </div>
      <div className="demo-info-strip">
        El Plan de Vuelo de esta página es una representación visual: no prescribe activos,
        porcentajes ni operaciones.
      </div>
    </div>
  );
}

function Telemetry() {
  const [drop, setDrop] = useState(40);
  const total = positions.reduce((sum, position) => sum + position.value, 0);
  const stressLoss = total * (drop / 100);
  const withinLimit = stressLoss <= 50000;
  return (
    <div className="demo-module">
      <ModuleHeader
        code="03"
        eyebrow="TELEMETRÍA"
        title="Una fotografía ficticia, no una conexión de cartera."
        detail="Las posiciones son sintéticas y el cálculo ocurre únicamente en memoria. No se conecta una wallet ni una cuenta."
        badge="FUENTE DEMO"
      />
      <section className="demo-metric-grid standalone" aria-label="Resumen de telemetría">
        {[
          ['EXPOSICIÓN', money.format(total), '30% del capital de referencia'],
          ['COSTO DEMO', '$57,400', 'Cifra ficticia'],
          ['ESCENARIO', `−${drop}%`, 'Caída hipotética'],
          [
            'PÉRDIDA',
            money.format(stressLoss),
            withinLimit ? 'Dentro del límite' : 'Rebasa el límite',
          ],
        ].map(metric => (
          <article key={metric[0]}>
            <span>{metric[0]}</span>
            <strong>{metric[1]}</strong>
            <p>{metric[2]}</p>
          </article>
        ))}
      </section>
      <div className="demo-telemetry-grid">
        <section className="demo-panel demo-table-panel">
          <header>
            <div>
              <MicroLabel>POSICIONES DE EJEMPLO</MicroLabel>
              <h2>Composición de la muestra.</h2>
            </div>
            <span>NO ES CARTERA REAL</span>
          </header>
          <div className="demo-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>Rol</th>
                  <th>Valor ficticio</th>
                  <th>Peso</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr key={position.symbol}>
                    <th>{position.symbol}</th>
                    <td>{position.role}</td>
                    <td>{money.format(position.value)}</td>
                    <td>{position.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="demo-panel demo-stress-panel">
          <MicroLabel>PRUEBA DE ESTRÉS</MicroLabel>
          <h2>Caída hipotética.</h2>
          <p>Selecciona un escenario para observar la aritmética, no una recomendación.</p>
          <div className="demo-scenario-buttons" role="group" aria-label="Escenario de caída">
            {[20, 40, 60].map(value => (
              <button
                type="button"
                key={value}
                aria-pressed={drop === value}
                className={drop === value ? 'active' : ''}
                onClick={() => setDrop(value)}
              >
                −{value}%
              </button>
            ))}
          </div>
          <div className={`demo-stress-result ${withinLimit ? 'ok' : 'alert'}`}>
            <span>Pérdida matemática</span>
            <strong>{money.format(stressLoss)}</strong>
            <small>Límite ficticio: $50,000 MXN</small>
          </div>
          <p className="demo-fine-print">
            El escenario no indica comprar, vender, depositar, retirar o rebalancear.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Journal({ notify }) {
  return (
    <div className="demo-module">
      <ModuleHeader
        code="04"
        eyebrow="BITÁCORA"
        title="Preserva lo que pensabas antes del resultado."
        detail="La versión pública no ofrece texto libre: evita que se introduzcan datos reales y muestra únicamente ejemplos."
        badge="3 ENTRADAS DEMO"
      />
      <div className="demo-journal-grid">
        {[
          [
            'TESIS',
            'PORTAFOLIO DEMO',
            'Revisar límites antes de observar rendimiento.',
            '25 jul 2026',
          ],
          ['REVISIÓN', 'FUENTES', 'Confirmar que cada cifra tenga fuente y fecha.', '24 jul 2026'],
          [
            'APRENDIZAJE',
            'DISCIPLINA',
            'Una regla sólo cambia con evidencia documentada.',
            '22 jul 2026',
          ],
        ].map((entry, index) => (
          <article key={entry[1]}>
            <header>
              <span>{entry[0]}</span>
              <em>0{index + 1}</em>
            </header>
            <h2>{entry[1]}</h2>
            <p>{entry[2]}</p>
            <footer>
              <small>{entry[3]}</small>
              <button
                type="button"
                onClick={() =>
                  notify('Demostración visual: la entrada original no fue modificada.')
                }
              >
                Simular revisión
              </button>
            </footer>
          </article>
        ))}
      </div>
      <div className="demo-info-strip">
        No se pueden crear notas en esta demo. La plataforma protegida será la única superficie para
        información real.
      </div>
    </div>
  );
}

function Navigator() {
  const [intent, setIntent] = useState('contradictions');
  const result = intents[intent];
  return (
    <div className="demo-module">
      <ModuleHeader
        code="05"
        eyebrow="NAVIGATOR"
        title="Explica relaciones sin convertirlas en órdenes."
        detail="Las lecturas están predefinidas y sólo utilizan el conjunto de datos sintético de esta página."
        badge="SIMULADOR"
      />
      <div className="demo-navigator-layout">
        <nav aria-label="Intenciones de Navigator">
          <MicroLabel>ELEGIR LECTURA</MicroLabel>
          {[
            ['contradictions', 'Detectar contradicciones'],
            ['scenarios', 'Comparar escenarios'],
            ['review', 'Preparar revisión'],
          ].map(option => (
            <button
              type="button"
              key={option[0]}
              className={intent === option[0] ? 'active' : ''}
              aria-pressed={intent === option[0]}
              onClick={() => setIntent(option[0])}
            >
              <span>0{Object.keys(intents).indexOf(option[0]) + 1}</span>
              {option[1]}
            </button>
          ))}
          <div className="demo-scope-note">
            <strong>Límite</strong>
            <p>Navigator Demo no elige activos ni indica una operación.</p>
          </div>
        </nav>
        <section className="demo-navigator-result" aria-live="polite">
          <MicroLabel>{result.eyebrow}</MicroLabel>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
          <div className="demo-fact-grid">
            {result.facts.map(fact => (
              <div key={fact[0]}>
                <span>{fact[0]}</span>
                <strong>{fact[1]}</strong>
              </div>
            ))}
          </div>
          <div className="demo-observation">
            <span>OBSERVACIÓN</span>
            <p>
              La salida demuestra la estructura explicable del sistema. No proviene de una cuenta,
              asesor o motor privado.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Tower({ notify }) {
  const [tab, setTab] = useState('dossiers');

  const moveTabFocus = (event, index) => {
    const keyOffsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
    };
    if (!(event.key in keyOffsets) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    let nextIndex;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = towerTabs.length - 1;
    else nextIndex = (index + keyOffsets[event.key] + towerTabs.length) % towerTabs.length;
    setTab(towerTabs[nextIndex][0]);
    event.currentTarget.parentElement?.children[nextIndex]?.focus();
  };

  return (
    <div className="demo-module demo-tower">
      <ModuleHeader
        code="06"
        eyebrow="TORRE AFORTU"
        title="Convierte una misión documentada en una muestra revisable."
        detail="La referencia, la huella y los estados que aparecen aquí son ficticios. No existe expediente en servidor."
        badge="MODO DEMO"
      />
      <ol className="demo-stepper" aria-label="Flujo demostrativo de expediente">
        {[
          ['01', 'Contexto', 'Datos sintéticos listos'],
          ['02', 'Evidencia', 'Fuentes de ejemplo'],
          ['03', 'Consentimiento', 'No aplicable en demo'],
          ['04', 'Revisión', 'Estado ilustrativo'],
        ].map(step => (
          <li key={step[0]}>
            <span>{step[0]}</span>
            <div>
              <strong>{step[1]}</strong>
              <small>{step[2]}</small>
            </div>
          </li>
        ))}
      </ol>
      <nav className="demo-tabs" role="tablist" aria-label="Vistas de Torre AFORTU">
        {towerTabs.map((option, index) => (
          <button
            type="button"
            role="tab"
            key={option[0]}
            id={`tower-tab-${option[0]}`}
            aria-controls={`tower-panel-${option[0]}`}
            aria-selected={tab === option[0]}
            tabIndex={tab === option[0] ? 0 : -1}
            className={tab === option[0] ? 'active' : ''}
            onClick={() => setTab(option[0])}
            onKeyDown={event => moveTabFocus(event, index)}
          >
            {option[1]} <span>{option[2]}</span>
          </button>
        ))}
      </nav>
      {tab === 'dossiers' ? (
        <section
          className="demo-tower-panel"
          role="tabpanel"
          id="tower-panel-dossiers"
          aria-labelledby="tower-tab-dossiers"
        >
          <article className="demo-dossier-card">
            <header>
              <div>
                <MicroLabel>BF-DEMO-0001 · REFERENCIA FICTICIA</MicroLabel>
                <h2>Revisión del marco de control.</h2>
              </div>
              <span>EN REVISIÓN · DEMO</span>
            </header>
            <p>
              Pregunta de muestra: ¿la evidencia disponible permite confirmar que los límites y la
              fuente siguen vigentes?
            </p>
            <dl>
              <div>
                <dt>Alcance</dt>
                <dd>Perfil, plan, telemetría y radar ficticios</dd>
              </div>
              <div>
                <dt>Huella</dt>
                <dd>HUELLA-DEMO · no verificable</dd>
              </div>
              <div>
                <dt>Presentación</dt>
                <dd>25 jul 2026 · fecha de ejemplo</dd>
              </div>
            </dl>
            <DemoButton onClick={() => window.print()} secondary>
              Imprimir reporte demo
            </DemoButton>
          </article>
          <aside className="demo-report-watermark">DEMO</aside>
        </section>
      ) : null}
      {tab === 'decisions' ? (
        <section
          className="demo-tower-panel"
          role="tabpanel"
          id="tower-panel-decisions"
          aria-labelledby="tower-tab-decisions"
        >
          <article className="demo-decision-card">
            <span>PRIORIDAD ESTÁNDAR · FICTICIA</span>
            <h2>Actualizar la nota de fuente.</h2>
            <p>
              Responsable: Piloto Demo · Fecha ilustrativa: 31 jul 2026 · Criterio: fuente y fecha
              visibles.
            </p>
            <DemoButton
              onClick={() => notify('Demostración visual: ninguna decisión fue cerrada.')}
            >
              Simular cierre
            </DemoButton>
          </article>
        </section>
      ) : null}
      {tab === 'review' ? (
        <section
          className="demo-tower-panel"
          role="tabpanel"
          id="tower-panel-review"
          aria-labelledby="tower-tab-review"
        >
          <article className="demo-review-card">
            <MicroLabel>MESA HUMANA · REPRESENTACIÓN</MicroLabel>
            <h2>La revisión real no ocurre en GitHub Pages.</h2>
            <p>
              Un asesor autorizado tendría que abrir el expediente dentro del entorno protegido,
              revisar evidencia y dejar una observación trazable.
            </p>
            <div className="demo-info-strip">
              Esta pantalla no asigna asesores, no captura consentimiento y no actualiza estados.
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

function Privacy({ notify }) {
  return (
    <div className="demo-module">
      <ModuleHeader
        code="07"
        eyebrow="PRIVACIDAD"
        title="Una demo pública debe ser operacionalmente estéril."
        detail="Esta interfaz no crea cuentas, no envía formularios, no usa APIs de mercado y no conserva datos patrimoniales."
        badge="SIN DATOS REALES"
      />
      <div className="demo-privacy-grid">
        {[
          ['01', 'Sin autenticación', 'No solicita correo, contraseña, código ni identidad.'],
          ['02', 'Sin persistencia', 'Los controles se reinician al recargar la página.'],
          ['03', 'Sin wallet', 'No conecta, firma ni solicita direcciones o frases semilla.'],
          ['04', 'Sin pagos', 'No recibe dinero, CLABE, tarjeta, SPEI o datos bancarios.'],
          ['05', 'Sin expediente', 'Las referencias y huellas son marcadores ficticios.'],
          ['06', 'Sin recomendación', 'Explica aritmética y procesos; no indica operaciones.'],
        ].map(item => (
          <article key={item[0]}>
            <span>{item[0]}</span>
            <h2>{item[1]}</h2>
            <p>{item[2]}</p>
          </article>
        ))}
      </div>
      <section className="demo-panel demo-boundary-panel">
        <div>
          <MicroLabel>CONTROL DE SESIÓN</MicroLabel>
          <h2>Comprueba la ausencia de almacenamiento.</h2>
          <p>La acción confirma que esta página no conserva información entre recargas.</p>
        </div>
        <DemoButton
          onClick={() => notify('La demo no guarda datos; no había información que borrar.')}
          secondary
        >
          Comprobar almacenamiento
        </DemoButton>
      </section>
    </div>
  );
}

function Payments() {
  return (
    <div className="demo-module">
      <ModuleHeader
        code="08"
        eyebrow="MÉTODOS DE PAGO"
        title="La contratación todavía no forma parte de esta demostración."
        detail="AFORTU está definiendo el flujo comercial y el método de pago. Publicarlo requerirá validación jurídica, seguridad y un procesador externo."
        badge="EN CONFIGURACIÓN"
      />
      <section className="demo-payment-status">
        <div>
          <MicroLabel>ESTADO DEL MÓDULO</MicroLabel>
          <h2>Sin cargos activos.</h2>
          <p>
            Esta página no solicita, transmite ni almacena información bancaria. Tampoco genera
            ligas, referencias, QR, recibos o instrucciones de transferencia.
          </p>
        </div>
        <span aria-hidden="true">08</span>
      </section>
      <div className="demo-payment-grid">
        {[
          ['Plan', 'Piloto demostrativo', 'Identidad comercial aún por definir'],
          ['Método', 'No configurado', 'Sin tarjeta, CLABE, SPEI o wallet'],
          ['Próximo cobro', 'No aplica', 'No existe suscripción ni cargo recurrente'],
          ['Disponibilidad', 'Después del piloto', 'Sujeto a validación legal y técnica'],
        ].map(item => (
          <article key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
            <p>{item[2]}</p>
          </article>
        ))}
      </div>
      <section className="demo-panel demo-payment-boundary">
        <div>
          <MicroLabel>FRONTERA DE SEGURIDAD</MicroLabel>
          <h2>No realices depósitos desde esta página.</h2>
          <p>
            Cualquier cobro futuro deberá mostrar identidad del proveedor, precio total, términos,
            cancelación y aviso de privacidad antes de solicitar datos.
          </p>
        </div>
        <button type="button" disabled className="demo-disabled-action">
          Configurar método de pago · próximamente
        </button>
      </section>
    </div>
  );
}

const sectionComponents = {
  panel: Overview,
  perfil: Profile,
  plan: Plan,
  telemetria: Telemetry,
  bitacora: Journal,
  navigator: Navigator,
  torre: Tower,
  privacidad: Privacy,
  pagos: Payments,
};

export default function CockpitDemo() {
  const [active, setActive] = useState(currentSection);
  const [notice, setNotice] = useState('');
  const [motionPaused, setMotionPaused] = useState(false);
  const activeMeta = sections.find(section => section.id === active) ?? sections[0];
  const ActiveModule = sectionComponents[active];

  useEffect(() => {
    const onHashChange = () => {
      setActive(currentSection());
      window.scrollTo({ top: 0, behavior: 'auto' });
      window.requestAnimationFrame(() => document.getElementById('demo-content')?.focus());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${activeMeta.label} | BitForward Mission Control Demo`;
  }, [activeMeta.label]);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 920px)').matches) return;
    const dock = document.querySelector('.demo-mobile-dock');
    const activeLink = dock?.querySelector('a[aria-current="page"]');
    if (!dock || !activeLink) return;
    dock.scrollTo({
      left: activeLink.offsetLeft - (dock.clientWidth - activeLink.clientWidth) / 2,
      behavior: 'auto',
    });
  }, [active]);

  const activeProps = useMemo(
    () => ({
      notify: setNotice,
      motionPaused,
    }),
    [motionPaused]
  );

  return (
    <div className={motionPaused ? 'demo-shell motion-paused' : 'demo-shell'}>
      <a
        className="demo-skip-link"
        href="#demo-content"
        onClick={event => {
          event.preventDefault();
          document.getElementById('demo-content')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <div className="demo-banner" role="note">
        DEMO PÚBLICA · DATOS FICTICIOS · NO RECIBE DINERO
      </div>
      <aside className="demo-sidebar" aria-label="Navegación del Mission Control Demo">
        <a className="demo-brand" href="#panel">
          <img src={logoUrl} alt="BitForward" />
          <span>MISSION CONTROL · DEMO</span>
        </a>
        <nav>
          <p>SISTEMA DEMOSTRATIVO</p>
          {sections.map(section => (
            <a
              href={`#${section.id}`}
              key={section.id}
              className={active === section.id ? 'active' : ''}
              aria-current={active === section.id ? 'page' : undefined}
            >
              <span>{section.code}</span>
              {section.label}
            </a>
          ))}
        </nav>
        <footer>
          <div>
            <span aria-hidden="true">◆</span>
            <p>
              <strong>Demostración estática</strong>
              <small>Sin cuenta · sin almacenamiento</small>
            </p>
          </div>
          <p>BitForward Mission Control™</p>
          <small>Proyecto cripto de AFORTU · 2026</small>
        </footer>
      </aside>
      <div className="demo-workspace">
        <header className="demo-topbar">
          <div className="demo-location">
            <span>{activeMeta.code}</span>
            <strong>{activeMeta.label}</strong>
          </div>
          <div className="demo-topbar-actions">
            <span className="demo-session">
              <i aria-hidden="true" />
              MODO DEMOSTRACIÓN
            </span>
            <button
              type="button"
              className="demo-quiet-button"
              onClick={() => setMotionPaused(value => !value)}
              aria-pressed={motionPaused}
            >
              {motionPaused ? 'Activar movimiento' : 'Pausar movimiento'}
            </button>
            <a className="demo-pilot-chip" href="#privacidad">
              <span>P</span>
              <div>
                <strong>Piloto Demo</strong>
                <small>Datos sintéticos</small>
              </div>
            </a>
          </div>
        </header>
        <main id="demo-content" className="demo-content" tabIndex="-1">
          {notice ? <Notice onClose={() => setNotice('')}>{notice}</Notice> : null}
          <ActiveModule {...activeProps} />
        </main>
        <footer className="demo-footer">
          <span>BitForward Mission Control™ · Demostración pública Alpha 0.3</span>
          <span>Sin custodia, ejecución, autenticación, pagos ni recomendación individual.</span>
        </footer>
      </div>
      <nav className="demo-mobile-dock" aria-label="Navegación móvil">
        {sections.map(section => (
          <a
            href={`#${section.id}`}
            key={section.id}
            className={active === section.id ? 'active' : ''}
            aria-current={active === section.id ? 'page' : undefined}
          >
            <span>{section.code}</span>
            {section.short}
          </a>
        ))}
      </nav>
    </div>
  );
}
