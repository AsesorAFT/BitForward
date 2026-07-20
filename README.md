# BitForward

**Mesa de inteligencia de activos digitales de AFORTU.**

BitForward es una plataforma fintech educativa para simulación, análisis y gestión patrimonial con activos digitales, orientada a formación académica, innovación financiera y transferencia tecnológica.

> Estado actual, 19 de julio de 2026: **MVP público en validación**. No es una plataforma transaccional, custodial ni un sistema autorizado para operar dinero de clientes.

## Qué funciona hoy

- Landing pública con precios de BTC, ETH, SOL y ADA desde una API pública.
- Caché local de corta duración y actualización automática cada cinco minutos.
- Marco educativo de riesgo y portafolio modelo 60/20/10/10.
- Simulador determinista con escenarios definidos por el usuario, aportaciones mensuales,
  bandas de rebalanceo de ±5 puntos y exportación CSV.
- Sitio público reducido a inicio, simulador y metodología; los prototipos operativos no se publican.
- Frontend multipágina construido con Vite.
- Prototipos de dashboard, analítica, contratos y backend para investigación técnica.
- Build y lint reproducibles con Node.js 22.

## Qué todavía no está validado

- Autenticación y autorización para usuarios reales.
- Persistencia de producción en PostgreSQL.
- Integración operativa con custodios o subcuentas.
- Contratos inteligentes auditados y desplegados.
- Pruebas integrales, pentest y revisión regulatoria.
- Uso con información o capital real de clientes.

Los documentos históricos que hablan de “100% production-ready” describen una meta anterior y no sustituyen una verificación técnica actual.

## Regla de datos

GitHub no almacena información de clientes. Las bases locales, credenciales, llaves, expedientes y exportaciones están fuera del repositorio. Consulta [DATA_SECURITY_POLICY.md](DATA_SECURITY_POLICY.md).

## Arquitectura actual

```text
BitForward
├── Experiencia pública     HTML, CSS, JavaScript y precios de mercado
├── Simulación pública      Escenarios, riesgo, rebalanceo y exportación CSV
├── Laboratorio backend     Node.js, Express y SQLite sólo para desarrollo
├── Laboratorio blockchain  Contratos Solidity no auditados
└── Calidad                 Vite, ESLint, Prettier, smoke tests y GitHub Actions
```

La arquitectura objetivo separará el código público de la operación: Drive como fuente documental inicial y PostgreSQL como sistema de registro. Ninguna de esas fuentes debe replicarse en GitHub.

## Inicio rápido

Requisitos: Node.js 22 y npm 10 o superior.

```bash
git clone https://github.com/AsesorAFT/BitForward.git
cd BitForward
npm ci
npm run dev
```

Verificaciones principales:

```bash
npm run lint
npm run format:check
npm run verify:static
npm run build
npm test
npm audit --omit=dev --audit-level=high
```

El backend usa `sqlite3`, por lo que requiere soporte para módulos nativos. Las pruebas crean bases efímeras; nunca deben usar una base operativa.

## Despliegues

- Sitio público: [asesoraft.github.io/BitForward](https://asesoraft.github.io/BitForward/)
- Repositorio: [github.com/AsesorAFT/BitForward](https://github.com/AsesorAFT/BitForward)

GitHub Pages publica únicamente el resultado de `npm run build`; no publica el código del servidor, archivos de entorno ni datos locales.

## Prioridad de producto

La prioridad dominante es convertir el prototipo disperso en un MVP educativo verificable: una sola narrativa, datos confiables, simulación clara, controles de riesgo y cero información de clientes en el código. El plan vigente está en [ROADMAP.md](ROADMAP.md).

## Aviso

BitForward presenta información educativa y simulaciones. No constituye oferta pública, custodia, garantía de rendimiento ni recomendación individual. Los activos digitales implican riesgo elevado de pérdida.

---

BitForward by AFORTU.
