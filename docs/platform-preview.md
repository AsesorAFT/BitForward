# BitForward · Plataforma integrada

`plataforma.html` reúne el catálogo y el flujo de compra simulada de PR #95 con una navegación común. Esta rama parte de `f4483a61e858ea4746f18df33f45d352cb2d1e43`; no cambia los portales de AFORTU ni habilita operaciones reales.

## Alcance verificable

- Inicio con accesos a Mercados, Comprar tokens, Futuros, Wallet, Portafolio, Academia y Comunidad.
- Catálogo de 43 mercados; búsqueda, filtros y favoritos persistentes. BTW Alpha y BTWUSDT perpetuo son entradas diferentes.
- Práctica Spot integrada con selección por instrumento. Alpha, bStocks y futuros conservan su estado de exploración.
- Wallet e historial derivados del mismo estado validado del simulador, con descarga. Las operaciones fallidas o rechazadas no cobran; las pendientes conservan la semántica de reserva del motor existente.
- Tres lecciones con preguntas, progreso local, calculadora educativa de futuros y bitácora personal descargable.
- Identidad visual BitForward, navegación por teclado, preferencias de movimiento reducido y tamaños móvil/escritorio.

Favoritos, lecciones y notas se guardan en localStorage. Las operaciones demo usan sessionStorage: no se sincronizan entre dispositivos. Comunidad es una bitácora personal; no hay participantes ni conversaciones compartidas. Los importes y precios de la práctica son sintéticos. No se solicitan claves, firmas, depósitos ni permisos de wallet.

## Ejecutar y comprobar

Con Node 22 y las dependencias del repositorio instaladas:

```sh
npm run build:platform
npx vite preview --config vite.platform.config.mjs
```

Abrir `http://127.0.0.1:4196/`. En otra terminal:

```sh
npm run test:platform
SMOKE_BASE_URL=http://127.0.0.1:4196 node tests/token-demo.browser.mjs
```

La compilación aislada usa `publicDir: false` y copia exclusivamente los documentos de demostración incluidos en `scripts/prepare-platform-preview.mjs`. No incorpora bases de datos, archivos de clientes, credenciales ni el resto de `public/`.

## Siguiente entrega propuesta

Conectar una wallet de prueba a una red de pruebas, validar red/contrato y registrar una operación de extremo a extremo con fondos de prueba. La ejecución real, custodia, precios en directo, identidad compartida y conversaciones multiusuario requieren una implementación posterior y no forman parte de esta vista previa.
