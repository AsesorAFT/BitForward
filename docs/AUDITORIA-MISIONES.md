# Auditoría y rediseño: BitForward | By AFORTU

Fecha: 25 de septiembre de 2026. Base inspeccionada: `7de7219` de `main`.

## Revisión previa a los cambios

1. **Entrada y estructura — necesita reenfoque.** `index.html` monta `CockpitDemo`: nueve módulos de un simulador institucional. No hay portada editorial, catálogo de misiones, noticias ni conexión con Instagram. La ruta de entrada presupone una relación con una cuenta simulada. Se propone una portada que permita entender, elegir y leer una misión.
2. **Identidad — buena base reutilizable.** El repositorio incluye el logotipo de la captura de Instagram, un astronauta de 800 × 1200 y tres escenas WebP. Se conservan esas imágenes y la atribución By AFORTU. A petición posterior del usuario, el acento turquesa se sustituye por azul eléctrico y violeta. La captura recuperada muestra el perfil `bitforward_aft`; no contiene una referencia del personaje a mayor resolución. El astronauta utilizado procede del repositorio oficial.
3. **Móvil — complejidad innecesaria para el nuevo objetivo.** El código ofrece un dock de nueve destinos. Puede servir al simulador, pero agrega decisiones antes de consumir contenido. Se propone navegación editorial de cuatro destinos y menú móvil, con lectura continua y enlaces directos a cada misión.
4. **Contenido — desalineado con Misiones Cripto.** Perfil, pagos inactivos, reglas de exposición y expedientes dominan la experiencia. Se conserva la demo como `cockpit.html`; la nueva portada prioriza fundamentos, Ethereum, custodia, noticias documentadas y comunidad. No se presentan videos inexistentes como reproducibles.
5. **Rendimiento e indexación — oportunidad concreta.** El HTML inicial sólo ofrece un contenedor vacío y un aviso de JavaScript. Se pasa la portada y las misiones a HTML estático y se mantiene React sólo en las superficies interactivas: demo, laboratorio y tutor. Las imágenes ya son ligeras (aproximadamente 10–100 KB cada una); se conservan, con dimensiones explícitas y carga diferida bajo el primer bloque. No se agregan fuentes remotas, feeds externos ni SDK de carteras.
6. **Accesibilidad — conservar y extender.** La demo ya contiene enlace de salto, estados accesibles y reducción de movimiento. La portada incluirá estructura semántica, un h1 por página, foco visible, navegación por teclado, controles de al menos 44 px y menú con estado accesible. La inspección del código no demuestra por sí sola conformidad WCAG.
7. **Publicación y código — reutilizar la infraestructura.** Vite, el lockfile y el flujo GitHub Pages ya existen. Las comprobaciones actuales están acopladas al título y módulos de la demo. Se mantendrán sus verificaciones en la ruta conservada y se añadirán comprobaciones de la nueva portada y enlaces. No se modifica el servidor experimental ni se publica como parte del sitio.

## Alcance y límites iniciales

Se inspeccionaron la página publicada, el código del repositorio, los recursos gráficos y la referencia de Instagram. El navegador integrado no pudo iniciarse por un fallo de su sandbox. Las observaciones anteriores de móvil y accesibilidad proceden del código; la comprobación visual queda pendiente de la alternativa de navegador autorizada por el usuario.

## Criterio editorial

- Noticias con fuente primaria, fecha del acontecimiento cuando esté verificada y fecha de revisión editorial.
- Diferenciar claramente lo publicado de los planes de una red. No mostrar cotizaciones inventadas ni titulares como datos en vivo.
- Misiones disponibles como lecturas; los reels se consultan en el perfil oficial de Instagram.
- No captar información personal, pagos, frases de recuperación ni conexiones a wallets.
- Mantener el vínculo institucional sin atribuir al contenido garantías o recomendaciones individuales.

## Resultado implementado

- Quince páginas: home, catálogo, nueve misiones, laboratorio, tutor ATF, membresías y acceso. Demo histórica conservada en una ruta independiente.
- ATF oficial tomado de la imagen elegida por el usuario, optimizada para web sin rediseñar traje o casco.
- Tipografías variables locales Space Grotesk y Manrope. Base negra, azul eléctrico y violeta; iconos BTC, ETH, USDT, ADA, SOL y USDC con sus colores.
- Nueve misiones en tres rutas con práctica y comprobación. Tutor estructurado por tema, sin simular respuestas de IA.
- Comparador de seis activos, calculadoras de exposición y gas, ficha descargable y bitácora local. Formularios etiquetados, estados de error y borrado confirmado.
- Integración de cuenta implementada por separado en el repositorio privado de AFORTU OS; el enlace público se activa sólo después de su despliegue.
- Membresías de pago presentadas como propuesta; sin cobros o servicios fingidos.

## Validación

- Sitio público: lint, formato, guardas estáticas, build, quince páginas y comprobaciones DOM de enlaces, menú, teclado, filtros, herramientas, notas, borrado, progreso y recorrido ATF.
- Cálculos verificados con escenarios de pérdida, pérdida de paridad, valores extremos, entradas inválidas y gas.
- Dependencias de producción actualizadas dentro de sus versiones compatibles: Express, body-parser, qs, ip-address, Joi, tar y Undici. La auditoría npm de producción del 25 de septiembre de 2026 reportó cero vulnerabilidades conocidas; esto no sustituye una revisión de seguridad del código.
- Portal AFORTU OS: compilación, TypeScript y lint correctos; suite de 453 pruebas pasada, incluidas ocho pruebas nuevas de capacitación. Aislamiento entre usuarios, control de acceso, solicitudes de otro origen, respuestas inválidas, repetición y auditoría transaccional comprobados.
- La revisión visual automatizada permanece pendiente del navegador alternativo: el navegador integrado de la sesión falla al iniciarse. Las comprobaciones DOM no prueban distribución visual, contraste renderizado o funcionamiento con lector de pantalla. No se afirma una puntuación Lighthouse ni conformidad WCAG completa.
- La sesión real con llave/MFA de una cuenta de producción, el despliegue y la migración de producción no se ejecutaron.

## Rendimiento

ATF pesa aproximadamente 108 KB, las escenas de Ethereum y seguridad 95/118 KB y cada fuente local unos 22–24 KB. La portada y los artículos mantienen contenido estático. Las imágenes inferiores usan carga diferida y dimensiones explícitas. El bundle de React se reserva para las superficies interactivas. Estos son datos de archivos, no métricas de rendimiento de campo.
