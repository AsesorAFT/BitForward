# Formación, carrito y experiencia móvil

Esta entrega añade una ruta desde cero, un ejercicio lineal de riesgo long/short y un catálogo comercial con carrito. Los planes de pago, precios y prestaciones siguen siendo propuestas. No hay instrucciones de transferencia, wallet ni cobros activos en la web pública.

- `ruta.html`: seis etapas; la primera lección puede leerse sin JavaScript. Las rutas avanzadas se identifican como programa por desarrollar.
- `src/commerce/catalog.mjs`: productos, precios propuestos en centavos, reglas del carrito, mapa formativo y cálculo simplificado de exposición/P&L.
- `membresias.html`: selección mensual/anual, un solo plan (Círculo incluye Analista), cohorte opcional, quitar, persistencia local y descarga de propuesta.
- `scripts/generate-learning.mjs`: fuente del HTML de ambas páginas y navegación; los cuerpos están en `src/commerce/templates.mjs`.
- `scripts/smoke-commerce.mjs`: pruebas de catálogo, cálculo, interfaz y anchuras 320/390/768/1440 px.

Los periodos son 30 y 365 días con renovación manual. El simulador no calcula liquidación real ni incluye costes, funding, mantenimiento de margen o precios en vivo. No ejecuta operaciones.

La capa privada de pedidos en AFORTU OS utiliza el mismo identificador de catálogo `bf-formation-2026-09-v1`, valida precios en servidor y requiere autenticación y MFA. `VITE_BITFORWARD_COMMERCE_READY` permanece apagado hasta desplegar y verificar esa capa, configurar los receptores y aprobar contenido, oferta, calendario y condiciones. Sólo entonces revisar también los textos de disponibilidad antes de anunciar ventas. Nunca poner credenciales o datos bancarios reales en variables `VITE_*`.

La primera fase privada admite transferencia MXN, BTC por la red Bitcoin y Binance Pay personal para BTC o USDT, todos con revisión manual. El QR personal no identifica un pedido por sí mismo ni confirma la recepción. La cuenta y enlace del receptor se guardan sólo en configuración privada. USDT en cadena, conexión de MetaMask, Binance Pay Merchant, tarjetas, notificaciones y verificación automática son ampliaciones pendientes. El carrito de vista previa no crea pedidos ni reserva cupos.

La prioridad de uso es el teléfono: columna única, etiquetas claras, tipografía legible, controles táctiles y barra de carrito móvil. El futuro campus inmersivo debe ser opcional y mantener una experiencia ligera sin 3D. Aún deben probarse dispositivos físicos y personas principiantes antes de activar cobros.
