# Acceso compartido con AFORTU OS

El usuario confirmó el portal `https://app.afortu.com.mx/`. La capacitación privada se implementó como ruta del propio portal: `/mi-afortu/bitforward`. Reutiliza su identidad, sesión y verificación. La web pública continúa siendo estática y apta para GitHub Pages.

No se crean cuentas duplicadas, no se capturan credenciales en BitForward y no se pasan tokens por URL. Los permisos sobre expedientes o carteras no cambian. La versión inicial guarda comprobaciones de aprendizaje; no activa membresías de pago ni sincroniza notas del laboratorio público.

## Activación coordinada

1. Publicar y verificar primero el cambio del portal privado, incluida su migración de progreso. Su paquete de integración y sus pruebas se entregan por separado del sitio público.
2. Publicar el laboratorio público de esta entrega antes de abrir la capacitación privada a usuarios, porque las prácticas lo utilizan.
3. Cuando la ruta privada esté operativa, definir la variable de repositorio **AFORTU_LEARNING_READY** con valor `1` en GitHub Actions y volver a publicar BitForward.
4. Para una compilación manual: `VITE_AFORTU_LEARNING_READY=1 npm run build`.

Sin la variable, `acceso.html` explica el estado y enlaza al portal oficial y al aprendizaje sin cuenta. Con ella, ofrece **Continuar con mi cuenta AFORTU OS** hacia la capacitación privada. La variable controla sólo el enlace y los textos; nunca concede acceso ni derechos.

## Actualización del currículo

`scripts/export-afortu-learning.mjs <ruta apps/afortu-sites>` exporta únicamente contenido educativo y recursos públicos aprobados hacia el checkout privado. No lee ni incorpora información del portal en este repositorio. Después de exportar, revisar las pruebas y la versión de currículo del portal antes de publicar.

El despliegue del portal, la migración de producción y la activación del enlace no se ejecutaron automáticamente en esta entrega.
