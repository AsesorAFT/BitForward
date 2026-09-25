# Publicar BitForward — Misiones Cripto

La versión está preparada para la URL `https://asesoraft.github.io/BitForward/` y reutiliza
el flujo GitHub Actions del repositorio. La web pública no necesita un servidor ni claves de API. La capacitación privada se publica por separado en AFORTU OS.

## Desde el repositorio

1. Incorpora los cambios de la rama `codex/misiones-cripto` en un pull request.
2. En **Settings → Pages → Build and deployment**, conserva **Source: GitHub Actions**.
3. Comprueba los cambios antes de fusionar:

   ```bash
   npm ci
   npm run verify
   npm run verify:editorial
   npm run preview -- --host 127.0.0.1 --port 4173
   # En otra terminal:
   npm run smoke:pages
   ```

4. Con CI correcto, fusiona el pull request en `main`. Esto activa
   `.github/workflows/jekyll-gh-pages.yml`, que compila y publica `dist`.
5. Revisa la portada, las nueve misiones, la sesión ATF y las herramientas, el menú móvil y `cockpit.html` en la URL pública.

No publiques los archivos fuente directamente como `main / root`: las hojas de estilo y los
módulos pasan por Vite. Conserva el lockfile y las dependencias existentes.

## Si usas la entrega compilada

`BitForward-publicable.zip` contiene el interior de `dist`, listo para un alojamiento estático.
El flujo actual de este repositorio compila el código fuente; utiliza el ZIP compilado como
respaldo o para otro alojamiento, no para reemplazar su configuración de Actions.

## Enlaces listos para Instagram

- `/BitForward/misiones/001-antes-de-despegar.html`
- `/BitForward/misiones/002-gasolinera-ethereum.html`
- `/BitForward/misiones/003-la-boveda-cripto.html`

Las páginas son HTML reales: abrir un enlace directo o recargarlo funciona sin reglas de redirección.

## Revisión y reversión

La demo anterior sigue en `cockpit.html`. El diseño nuevo no modifica el servidor experimental.
Para volver a la portada anterior, revierte el commit del rediseño y deja que Actions publique
de nuevo. No borres imágenes históricas ni archivos de referencia.

## Estado de esta entrega

Los archivos locales están preparados para publicación. No se ha fusionado ni desplegado el
rediseño en producción automáticamente. La revisión visual en navegador está pendiente porque
el navegador integrado de esta sesión no pudo iniciarse.

## Activar la capacitación con cuenta

Después de publicar y verificar la ruta privada de AFORTU OS, define `AFORTU_LEARNING_READY=1` en Settings → Secrets and variables → Actions → Variables. El flujo la pasa como `VITE_AFORTU_LEARNING_READY`. No contiene secretos ni concede permisos: habilita el enlace al portal. Véase `docs/INTEGRACION-AFORTU-OS.md`.
