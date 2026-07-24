# Publicación de BitForward en GitHub Pages

BitForward se publica desde GitHub Actions. La fuente de Pages debe permanecer configurada como
**GitHub Actions**; no debe cambiarse a `main / root`.

## Flujo de publicación

1. Crear una rama a partir de `main`.
2. Ejecutar la validación local:

   ```bash
   npm ci
   npm run verify
   npm test -- --runInBand --passWithNoTests
   ```

3. Abrir un pull request y esperar a que CI termine correctamente.
4. Fusionar el pull request en `main`.
5. El workflow `.github/workflows/jekyll-gh-pages.yml` construye el sitio con Vite y publica
   exclusivamente el artefacto `dist`.
6. Verificar:

   - <https://asesoraft.github.io/BitForward/>
   - <https://asesoraft.github.io/BitForward/index.html>

## Por qué se publica `dist`

El código fuente contiene módulos, JSX e importaciones que el navegador no puede ejecutar
directamente desde la raíz del repositorio. Vite transforma esos archivos, ajusta las rutas para
`/BitForward/` y genera los recursos finales con hash.

## Límites de GitHub Pages

- No ejecuta Node.js, Express ni rutas `/api`.
- El mercado público se consulta desde el navegador y conserva una referencia local si el
  proveedor no responde.
- BitForward no custodia recursos ni ejecuta operaciones desde esta publicación.
