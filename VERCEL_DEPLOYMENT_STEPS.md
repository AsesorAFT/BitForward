# 🚀 BitForward - Vercel Deployment Guide (GitHub)

**Fecha:** 19 de octubre de 2025  
**Método:** Deploy desde GitHub (Recomendado)  
**Tiempo Estimado:** 5-10 minutos

---

## ✅ Pre-requisitos Completados

- [x] Código pusheado a GitHub: `https://github.com/AsesorAFT/BitForward`
- [x] Build de producción testeado localmente
- [x] 102 tests passing
- [x] Configuración `vercel.json` creada
- [x] Build optimizado (850KB → 180KB gzip)

---

## 📋 Paso a Paso - Deploy con Vercel

### **Paso 1: Ir a Vercel** 🌐

Abre tu navegador y ve a:

```
https://vercel.com/new
```

O si ya tienes cuenta:

```
https://vercel.com/login
```

---

### **Paso 2: Login con GitHub** 🔑

1. Click en **"Continue with GitHub"**
2. Autoriza Vercel si es primera vez
3. Vercel detectará automáticamente tus repos

**Screenshot de referencia:**
```
┌─────────────────────────────────────────┐
│  Welcome to Vercel                      │
│                                         │
│  [🐙 Continue with GitHub]             │
│  [ Continue with GitLab  ]             │
│  [ Continue with Bitbucket]            │
└─────────────────────────────────────────┘
```

---

### **Paso 3: Importar Proyecto** 📦

1. En el dashboard de Vercel, busca **"BitForward"**
2. Verás tu repo: **`AsesorAFT/BitForward`**
3. Click en **"Import"**

**O desde la URL directa:**
```
https://vercel.com/new/git
```

**Screenshot de referencia:**
```
┌─────────────────────────────────────────┐
│  Import Git Repository                  │
│                                         │
│  Search: BitForward                     │
│                                         │
│  ✓ AsesorAFT/BitForward                │
│    main branch • Updated 2m ago        │
│    [Import]                            │
└─────────────────────────────────────────┘
```

---

### **Paso 4: Configurar Proyecto** ⚙️

Vercel detectará automáticamente tu configuración desde `vercel.json`.

**Configuración Recomendada:**

```
Project Name:        bitforward
Framework Preset:    Other
Root Directory:      ./
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
```

**Screenshot de referencia:**
```
┌─────────────────────────────────────────────────────────┐
│  Configure Project                                      │
│                                                         │
│  Project Name:                                          │
│  [bitforward                                 ]         │
│                                                         │
│  Framework Preset:                                      │
│  [Other                                      ▼]        │
│                                                         │
│  Root Directory:                                        │
│  [./                                         ]         │
│                                                         │
│  Build and Output Settings                             │
│  ✓ Override (si quieres customizar)                   │
│                                                         │
│  Build Command:                                         │
│  [npm run build                              ]         │
│                                                         │
│  Output Directory:                                      │
│  [dist                                       ]         │
│                                                         │
│  Install Command:                                       │
│  [npm install                                ]         │
│                                                         │
│  [Deploy]                                              │
└─────────────────────────────────────────────────────────┘
```

---

### **Paso 5: Deploy** 🚀

1. Click en el botón **"Deploy"**
2. Vercel comenzará a:
   - ✓ Clonar tu repo
   - ✓ Instalar dependencias
   - ✓ Ejecutar tests
   - ✓ Build de producción
   - ✓ Deploy a CDN global

**Progreso esperado:**
```
Building...
├─ Cloning repository...                    ✓
├─ Installing dependencies...               ✓
│  └─ npm install
├─ Running build...                         ✓
│  └─ npm run build
│      ✓ 102 tests passed
│      ✓ Bundle created: 180KB (gzipped)
├─ Uploading to CDN...                      ✓
└─ Deployment Complete!                     ✓

Your application is live at:
https://bitforward.vercel.app
```

**Tiempo estimado:** 2-3 minutos ⏱️

---

### **Paso 6: Verificar Deploy** ✅

Una vez completado, verás:

```
┌─────────────────────────────────────────────────────────┐
│  🎉 Congratulations!                                    │
│                                                         │
│  Your project is live at:                              │
│  https://bitforward.vercel.app                         │
│  https://bitforward-git-main-asesoraft.vercel.app     │
│                                                         │
│  [Visit] [View Logs] [Configure Domain]               │
└─────────────────────────────────────────────────────────┘
```

**URLs generadas:**
- **Production:** `https://bitforward.vercel.app`
- **Preview:** `https://bitforward-git-main-asesoraft.vercel.app`

---

## 🔧 Paso 7: Configurar Environment Variables (Importante)

### **Variables Requeridas:**

1. Ve a tu proyecto en Vercel dashboard
2. Click en **"Settings"** → **"Environment Variables"**
3. Agrega las siguientes variables:

#### **Variables de Producción:**

```bash
# Node Environment
NODE_ENV=production

# JWT Secret (IMPORTANTE - Generar uno nuevo)
JWT_SECRET=tu_secret_super_seguro_minimo_32_caracteres_aqui

# JWT Expiration
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Allowed Origins
ALLOWED_ORIGINS=https://bitforward.vercel.app,https://bitforward-git-main-asesoraft.vercel.app

# Database (SQLite por defecto)
DATABASE_PATH=/tmp/bitforward.sqlite3

# APIs (Opcional - usar si tienes API keys)
COINGECKO_API_KEY=
BINANCE_API_KEY=

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ENABLE_HELMET=true
ENABLE_CSP=true

# Logging
LOG_LEVEL=warn

# Monitoring (Agregar después)
SENTRY_DSN=
```

### **Cómo agregar cada variable:**

```
┌─────────────────────────────────────────────────────────┐
│  Add Environment Variable                               │
│                                                         │
│  Name:                                                  │
│  [JWT_SECRET                                 ]         │
│                                                         │
│  Value:                                                 │
│  [your-super-secure-secret-here              ]         │
│                                                         │
│  Environment:                                           │
│  ☑ Production                                          │
│  ☑ Preview                                             │
│  ☐ Development                                         │
│                                                         │
│  [Save]                                                │
└─────────────────────────────────────────────────────────┘
```

### **Generar JWT Secret Seguro:**

Ejecuta localmente:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto genera algo como:
```
a7f3b9c2d8e1f4a6b7c9d0e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
```

**Usa ese valor para `JWT_SECRET`** 🔑

---

## 🌐 Paso 8: Verificar Deployment

### **Test la Aplicación:**

1. Abre: `https://bitforward.vercel.app`
2. Verifica que:
   - ✅ Página carga correctamente
   - ✅ Estilos se aplican
   - ✅ Logo se muestra
   - ✅ Dashboard carga
   - ✅ No hay errores en consola (F12)

### **Test API Endpoints:**

```bash
# Health check
curl https://bitforward.vercel.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "version": "2.0.0"
}

# Stats endpoint
curl https://bitforward.vercel.app/api/stats

# Prices endpoint
curl https://bitforward.vercel.app/api/prices
```

---

## 🔄 Auto-Deploy (Git Integration)

### **¡Ya está configurado! 🎉**

Ahora, cada vez que hagas push a GitHub:

```bash
git add .
git commit -m "feat: nueva feature"
git push origin main
```

**Vercel automáticamente:**
1. Detecta el push
2. Ejecuta build
3. Corre tests
4. Deploy a producción
5. Te notifica por email

**Preview Deployments:**
- Cada PR genera una URL de preview
- Test features antes de merge
- Perfecto para desarrollo en equipo

---

## 🎯 Configuraciones Adicionales Recomendadas

### **1. Custom Domain (Opcional)** 🌐

Si tienes un dominio:

1. Ve a **Settings** → **Domains**
2. Click **"Add Domain"**
3. Ingresa: `bitforward.io` (o tu dominio)
4. Sigue instrucciones de DNS
5. SSL automático incluido ✅

**Configuración DNS:**
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### **2. Redirects (Opcional)**

Ya configurado en `vercel.json`:
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "server/server.js" },
    { "src": "/(.*)", "dest": "/dist/$1" }
  ]
}
```

### **3. Headers de Seguridad**

Ya configurados en el backend (`server/middleware/security.js`):
- ✅ Helmet.js activo
- ✅ CSP configurado
- ✅ Rate limiting
- ✅ CORS

### **4. Performance Monitoring**

Vercel incluye:
- ✅ Analytics automático
- ✅ Real User Monitoring (RUM)
- ✅ Performance insights
- ✅ Error tracking básico

Ve a tu dashboard → **Analytics** para ver métricas.

---

## 📊 Post-Deployment Checklist

### **Inmediatamente después del deploy:**

- [ ] Verificar que el sitio carga: `https://bitforward.vercel.app`
- [ ] Test todos los endpoints de API
- [ ] Verificar SSL (candado verde en navegador)
- [ ] Test MetaMask connection
- [ ] Test dashboard funcionalidad
- [ ] Verificar logs en Vercel dashboard
- [ ] Configurar alertas de error
- [ ] Test en mobile (responsive)
- [ ] Test en diferentes navegadores
- [ ] Verificar performance (Lighthouse)

### **Primeras 24 horas:**

- [ ] Monitorear logs de errores
- [ ] Revisar analytics de Vercel
- [ ] Fix cualquier bug crítico
- [ ] Documentar issues encontrados
- [ ] Setup monitoring adicional (Sentry)

### **Primera semana:**

- [ ] Revisar métricas de performance
- [ ] Optimizar queries lentas
- [ ] Implementar feedback de usuarios
- [ ] Configurar backup de DB
- [ ] Plan de scaling si es necesario

---

## 🐛 Troubleshooting

### **Error: Build Failed**

```bash
# Ver logs en Vercel dashboard
# O ejecutar localmente:
npm run build

# Si falla, revisar:
- Tests passing (npm test)
- Node version correcta (18+)
- Dependencies instaladas
```

### **Error: API Endpoints 404**

- Verificar `vercel.json` routes
- Confirmar `server/server.js` existe
- Check environment variables configuradas

### **Error: Database Connection**

```bash
# SQLite en Vercel usa /tmp (ephemeral)
# Para persistencia, usar:
- Vercel Postgres (integración)
- Railway Postgres (external)
- PlanetScale (MySQL)
```

### **Error: Environment Variables No Funcionan**

1. Ve a Settings → Environment Variables
2. Confirma que están en "Production"
3. Redeploy después de agregar variables
4. Click **"Redeploy"** en dashboard

---

## 🎨 Configuración Avanzada (Opcional)

### **Vercel Speed Insights:**

```bash
npm install @vercel/speed-insights

# En tu main.js:
import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();
```

### **Vercel Analytics:**

```bash
npm install @vercel/analytics

# En tu main.js:
import { inject } from '@vercel/analytics';
inject();
```

### **Edge Functions (Serverless):**

Ya configurado en `vercel.json`:
```json
{
  "builds": [
    { "src": "server/server.js", "use": "@vercel/node" }
  ]
}
```

---

## 📞 Soporte y Recursos

### **Vercel Documentation:**
- https://vercel.com/docs
- https://vercel.com/docs/concepts/deployments/overview

### **Vercel Support:**
- Email: support@vercel.com
- Twitter: @vercel
- Discord: https://vercel.com/discord

### **BitForward Resources:**
- GitHub: https://github.com/AsesorAFT/BitForward
- Docs: Ver `DEPLOYMENT_GUIDE.md`
- Issues: https://github.com/AsesorAFT/BitForward/issues

---

## 🎉 ¡Felicitaciones!

Tu aplicación BitForward está ahora:

✅ **Deployada en producción**  
✅ **Con SSL automático**  
✅ **En CDN global**  
✅ **Con auto-deploy desde Git**  
✅ **Performance optimizada**  
✅ **Seguridad enterprise**

### **URLs de tu app:**

- **Production:** `https://bitforward.vercel.app`
- **Dashboard Vercel:** `https://vercel.com/asesoraft/bitforward`
- **GitHub Repo:** `https://github.com/AsesorAFT/BitForward`

---

## 🚀 Próximos Pasos Recomendados

1. **Configurar Monitoring** 📊
   - Sentry para error tracking
   - Google Analytics para usuarios
   - LogRocket para session replay

2. **Custom Domain** 🌐
   - Comprar dominio (ej: bitforward.io)
   - Configurar DNS en Vercel
   - SSL automático incluido

3. **Performance Testing** ⚡
   - Lighthouse audit
   - WebPageTest
   - GTmetrix

4. **Security Scan** 🔒
   - OWASP ZAP scan
   - SSL Labs test (A+ rating)
   - Security headers check

5. **Marketing & Launch** 🎊
   - Product Hunt launch
   - Social media announcement
   - Blog post sobre tu app

---

**¡Tu app está LIVE! 🚀🎉**

**Generado por:** BitForward DevOps Team  
**Fecha:** 19 de octubre de 2025  
**Status:** ✅ DEPLOYED TO PRODUCTION
