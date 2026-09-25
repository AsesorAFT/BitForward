# Campus ATF · diagnóstico, aula y laboratorio

El campus convierte las nueve misiones en una ruta de aprendizaje con nueve preguntas de diagnóstico y 27 ejercicios adicionales. La entrada es `atf.html`; conserva las comprobaciones de las misiones y las notas existentes.

## Recorrido

1. Diagnóstico de nueve conceptos, con opción «Aún no lo sé» y reanudación.
2. Mapa de conceptos y recomendación explicada según bases previas y dificultades.
3. Aula con explicación, fuente de la misión, ejercicio, pista y retroalimentación.
4. Laboratorio con nueve enlaces que abren la herramienta y el activo apropiados.
5. Descarga del avance y repaso propuesto siete días después de la última evidencia.

Una respuesta correcta en el diagnóstico no acredita dominio. Un concepto queda comprobado con dos ejercicios distintos correctos, sin pista, incluyendo al menos una aplicación. Un error posterior reabre el concepto. Repetir una pregunta vista en las últimas 24 horas sirve para practicar sin aumentar la evidencia. El historial se limita por ejercicio para que practicar un tema no borre los demás.

## Persistencia y alcance

La web pública usa la clave existente `bitforward-learning-v1`. Conserva `completed`, `entries` y `analysis`, y agrega `adaptive`. Si el navegador impide guardar, mantiene la sesión en memoria y lo comunica. Las modificaciones en otra sesión se detectan por revisión; se ofrece actualizar el avance.

La versión privada reutiliza identidad y MFA de AFORTU OS y guarda por usuario y versión de currículo. La calificación se realiza en servidor. El guardado concurrente y su evento de auditoría forman una transacción: una escritura atrasada o un fallo de auditoría no sobrescriben progreso. Las notas del laboratorio público siguen siendo locales.

El componente, motor, ejercicios y estilos se exportan al portal con `node scripts/export-afortu-learning.mjs ../afortu-os/apps/afortu-sites`. El flujo es exclusivamente público → privado. El currículo adaptativo tiene versión `atf-concepts-2026-09-v1`.

## Validación de esta entrega

- `npm run verify`: lint, formato, estructura, build, 15 páginas y pruebas DOM de herramientas y campus.
- `npm test -- --runInBand`: 3 suites y 10 pruebas existentes.
- `npm run smoke:pages`: navegador en 320, 390, 768 y 1440 px; navegación por teclado, diagnóstico completo, pistas, evidencia, recomendación, recarga, conservación de notas y enlaces de laboratorio.
- Revisión visual de capturas del campus, diagnóstico y aula en móvil/escritorio, realizada el 25 de septiembre de 2026. Sin desbordamiento horizontal detectado. No constituye una auditoría WCAG completa.
- Portal: TypeScript, lint, compilación vinext, validación del artefacto y 459 pruebas de regresión, incluidas cinco del API/almacenamiento adaptativo.

Para guardar capturas al ejecutar las pruebas: `CAMPUS_SCREENSHOTS=/ruta/local npm run smoke:pages`. Se usa Chrome de pruebas, sin cuentas de producción.

## Publicación

El sitio público puede publicarse con el acceso privado desactivado. La integración privada necesita primero la migración 0053 existente y luego 0054, despliegue y verificación con dos cuentas autorizadas. Sólo después se activa `AFORTU_LEARNING_READY=1`; ver [integración](INTEGRACION-AFORTU-OS.md).

Esta entrega no ejecuta migraciones ni despliegues productivos. Quedan fuera el chat de IA, pagos, sincronización de notas, certificaciones, salas 3D y colaboración. La siguiente etapa es probar el aprendizaje con alumnos y ampliar los casos según sus dificultades.
