# DEPLOYMENT.md

# 🚀 Guía de Deployment para BitForward

Esta guía documenta el proceso para desplegar la aplicación BitForward en un entorno de producción. La configuración está optimizada para Netlify, pero también se incluyen instrucciones para otras plataformas.

---

## 📋 Checklist Pre-Deployment

Antes de cada deployment, asegúrate de completar los siguientes pasos para garantizar un lanzamiento exitoso y sin errores.

### 1. Sincronizar con la Rama Principal
Asegúrate de que tu rama local esté actualizada con los últimos cambios de `main`.
```bash
git checkout main
git pull origin main
```

### 2. Verificar Dependencias
Instala todas las dependencias y luego ejecuta una auditoría para encontrar y arreglar vulnerabilidades conocidas.
```bash
npm install
npm audit fix
```

### 3. Ejecutar Pruebas y Linting
Asegúrate de que todo el código cumple con los estándares de calidad y que todas las pruebas pasan.
```bash
npm run lint
npm test --if-present
```

### 4. Crear un Build de Producción Local
Simula el proceso de build que se ejecutará en el servidor para detectar posibles errores de compilación.
```bash
npm run build
```
Este comando utiliza la configuración de Vite para minificar, comprimir y optimizar todos los assets en la carpeta `dist/`.

### 5. Previsualizar el Build de Producción
Lanza un servidor local que sirva los archivos de la carpeta `dist/`. Esto te permite probar la versión de producción antes de desplegarla.
```bash
npm run preview
```
Abre tu navegador en `http://localhost:4173` (o el puerto que indique la terminal) y verifica:
- [ ] La aplicación carga sin errores de consola.
- [ ] La navegación entre páginas (`index`, `dashboard`, `analytics`) funciona.
- [ ] Todos los gráficos de ApexCharts se renderizan correctamente.
- [ ] El menú de navegación móvil es funcional.
- [ ] El diseño responsive se adapta correctamente a diferentes tamaños de pantalla.

### 6. (Opcional) Auditoría de Performance con Lighthouse
Con el servidor de previsualización corriendo, ejecuta una auditoría de Lighthouse para medir el rendimiento.
```bash
npm run lighthouse
```
**Objetivos:**
- **Performance:** > 90
- **Accessibility:** > 90
- **Best Practices:** > 90
- **SEO:** > 90

---

## 🌐 Opciones de Deployment

### Opción 1: Netlify (Recomendado y Automatizado)

El repositorio está configurado para **Continuous Deployment (CD)** en Netlify a través de GitHub Actions.

#### ¿Cómo funciona?
1.  **Push a `main`**: Cada vez que se hace un `push` o se fusiona un PR a la rama `main`, la GitHub Action definida en `.github/workflows/deploy.yml` se dispara automáticamente.
2.  **Build y Test**: La Action construye el proyecto, ejecuta linting y pruebas.
3.  **Deploy**: Si el paso anterior es exitoso, la Action despliega los artefactos de la carpeta `dist/` a Netlify.
4.  **Preview en PRs**: Cuando se abre un Pull Request hacia `main`, Netlify genera una URL de "Deploy Preview" para que puedas revisar los cambios en un entorno real antes de fusionar.

#### Configuración Inicial (Solo se hace una vez)

1.  **Crear un nuevo sitio en Netlify**:
    *   Ve a tu [dashboard de Netlify](https://app.netlify.com/start).
    *   Selecciona "Import an existing project" y elige tu repositorio de GitHub.

2.  **Configurar los Secretos en GitHub**:
    Para que la GitHub Action pueda autenticarse con Netlify, debes añadir los siguientes secretos en tu repositorio de GitHub (`Settings > Secrets and variables > Actions`):
    *   `NETLIFY_AUTH_TOKEN`:
        *   Ve a `User settings > Applications > Personal access tokens` en Netlify.
        *   Crea un nuevo token de acceso personal.
    *   `NETLIFY_SITE_ID`:
        *   Ve a `Site settings > General > Site details > API ID` en tu sitio de Netlify.

Una vez configurado, el proceso es totalmente automático.

### Opción 2: Vercel

1.  **Instalar Vercel CLI**:
    ```bash
    npm install -g vercel
    ```
2.  **Desplegar**:
    Desde la raíz de tu proyecto, ejecuta:
    ```bash
    vercel --prod
    ```
    Vercel detectará automáticamente que es un proyecto Vite y aplicará la configuración de build correcta. Tu archivo `vercel.json` existente ayudará a configurar los headers y redirecciones.

### Opción 3: GitHub Pages

El repositorio incluye un script para facilitar el deployment a GitHub Pages.
```bash
bash deploy-to-github.sh
```
Este script se encarga de construir el proyecto y empujar la carpeta `dist/` a la rama `gh-pages`.

---

## 🔧 Variables de Entorno

Si la aplicación requiere claves de API u otras variables de entorno, añádelas en la configuración de tu proveedor de hosting (Netlify, Vercel) y en los secretos de GitHub si son necesarias durante el build.

**Ejemplo en Netlify:**
`Site settings > Build & deploy > Environment`
- `NODE_VERSION`: `18`
- `NPM_VERSION`: `9`
- `VITE_API_URL`: `https://api.bitforward.app`

---

## 📈 Monitoreo Post-Deployment

Una vez que la aplicación esté en producción, considera integrar herramientas para monitorear su salud y rendimiento:

- **Analytics**: Google Analytics o Plausible para rastrear el tráfico de usuarios.
- **Error Tracking**: Sentry o LogRocket para capturar y diagnosticar errores de JavaScript en tiempo real.
- **Uptime Monitoring**: UptimeRobot o similar para recibir alertas si el sitio se cae.
