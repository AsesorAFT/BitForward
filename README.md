# BitForward | By AFORTU

**Aprende con ATF. Analiza con método. Construye tu criterio.**

Un ecosistema educativo 100% cripto: Bitcoin, Ethereum, Tether, Cardano, Solana y USDC. Conserva el personaje ATF elegido por el usuario y el vínculo By AFORTU.

## Disponible en esta versión

- Home con tipografías locales Space Grotesk y Manrope; negro, azul eléctrico, violeta y acentos de cada criptoactivo.
- Nueve Misiones Cripto agrupadas en Entender, Analizar y Documentar. Cada misión contiene explicación, fuente, práctica y comprobación.
- Sesión guiada con ATF: elegir tema, entender, practicar, recibir retroalimentación y continuar. Utiliza lecciones preparadas; no simula un chat de IA.
- Práctica diaria para móvil con una pregunta por día, diagnóstico, explicación y repaso adaptado a las respuestas guardadas en este navegador.
- Laboratorio con comparador de seis activos, escenario de exposición, calculadora de gas, ficha de análisis y bitácora descargable.
- Mercado BTC/USD con velas históricas de Coinbase Exchange, fuente y hora de consulta visibles, tabla accesible, descarga CSV e hipótesis locales exportables.
- Simulador educativo spot, largo y corto con capital ficticio, costos y umbral teórico de liquidación basados en supuestos introducidos por la persona usuaria.
- Respaldo JSON exportable e importable para progreso, ficha y bitácora. Las hipótesis del mercado BTC tienen su propia descarga y no forman parte de ese respaldo.
- Acceso Explorador gratuito. Analista y Círculo AFORTU se presentan como propuesta, sin precios, suscripciones ni cobros habilitados.
- Entrada al acceso de AFORTU OS, activable después de publicar la capacitación privada en el portal.
- BitForward Reporta con fuentes primarias y fechas. Seguridad y comunidad oficial en Instagram.
- `cockpit.html` conserva la experiencia anterior y sus nueve módulos ilustrativos.

La experiencia identifica únicamente a AFORTU como institución. No solicita fondos, conecta wallets ni ejecuta operaciones. Las velas BTC/USD son datos históricos consultados a una fuente externa, no una cotización ejecutable en tiempo real; las demás calculadoras usan valores manuales. Los formularios del laboratorio son locales y no se transmiten a un servidor. No deben contener contraseñas, claves ni datos sensibles.

## Desarrollo y validación

Requisitos: Node.js 20–22 y npm 10 o superior, según el proyecto existente.

```bash
npm ci
npm run dev
npm run verify
npm run preview -- --host 127.0.0.1 --port 4173
```

`verify` ejecuta lint, formato, guardas de la demo conservada, build, validación de las páginas públicas y pruebas de las herramientas/sesión ATF con DOM. Estas últimas no sustituyen una auditoría visual de navegador.

Con el preview activo, `npm run smoke:pages` ejecuta las pruebas de navegador existentes. Los informes de validación indican cuáles se han podido ejecutar en esta entrega.

## Estructura

| Ruta o carpeta                           | Uso                                                 |
| ---------------------------------------- | --------------------------------------------------- |
| `index.html`                             | Portada y Reporta                                   |
| `misiones.html`, `misiones/*.html`       | Catálogo y nueve lecturas con URL propia            |
| `laboratorio.html`                       | Cinco herramientas gratuitas                        |
| `atf.html`                               | Capacitación guiada sin cuenta                      |
| `practica.html`                          | Pregunta diaria y repaso adaptado                   |
| `mercado.html`                           | Velas BTC/USD históricas e hipótesis                |
| `simulador.html`                         | Escenarios ficticios spot, largo y corto            |
| `membresias.html`, `acceso.html`         | Niveles propuestos y conexión AFORTU OS             |
| `src/ecosystem`                          | Currículo, herramientas, cálculos, progreso y tutor |
| `css/editorial.css`, `css/ecosystem.css` | Identidad visual y responsive                       |
| `assets/fonts`, `assets/crypto`          | Fuentes e iconos locales con licencias              |
| `assets/brand/advisor-atf-approved.webp` | ATF definitivo, optimizado sin cambiar el diseño    |
| `cockpit.html`                           | Demo original conservada                            |

## Mantener el contenido

El currículo vive en `src/ecosystem/data.mjs`, y los seis artículos nuevos en `content.mjs`. Las primeras tres lecturas conservan su texto original. Ejecuta `npm run generate:learning` para actualizar catálogo, artículos y páginas del ecosistema; después aplica Prettier a los HTML generados. No edites manualmente el cuerpo de las páginas que genera ese script: se reemplazaría en la siguiente ejecución. La portada se edita directamente en `index.html`.

Vite descubre los HTML de `misiones/` y genera rutas reales compatibles con GitHub Pages. Al ampliar el currículo, revisa también los identificadores de progreso, las preguntas y la versión exportada al portal. Conserva fuentes primarias y fechas de revisión explícitas.

## Datos locales y cuenta

El sitio público guarda progreso, una ficha y hasta 100 notas bajo `bitforward-learning-v1`, sólo al completar una comprobación o elegir guardar. La práctica diaria usa el mismo estado de aprendizaje. Mi bitácora permite descargar e importar un respaldo JSON compatible, con vista previa y confirmación antes de reemplazar los datos existentes; también permite borrar con confirmación. Las hipótesis de Mercado BTC se guardan por separado en este navegador y pueden descargarse como Markdown. Un navegador privado o que bloquee almacenamiento puede impedir guardar; la interfaz lo informa.

La capacitación privada de AFORTU OS guarda comprobaciones por identidad. No importa notas locales ni comparte cookies con GitHub Pages. Ver [integración y activación](docs/INTEGRACION-AFORTU-OS.md).

## Publicar

Consulta [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md). El flujo de Actions publica **sólo `dist`**. El servidor experimental no forma parte del sitio y no fue modificado.

Consulta también [auditoría](docs/AUDITORIA-MISIONES.md), [ecosistema y membresías](docs/ECOSISTEMA-Y-MEMBRESIAS.md) y [personaje oficial](docs/DIRECCION-ATF.md).
