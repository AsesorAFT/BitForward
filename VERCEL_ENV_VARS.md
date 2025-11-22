# 🔑 Environment Variables para Vercel

**IMPORTANTE:** Copia estas variables EXACTAMENTE como están en tu dashboard de Vercel.

## Variables a Agregar (Settings → Environment Variables)

### Variable 1: JWT_SECRET

```
Name: JWT_SECRET
Value: 1ce1a54004267c05d80522957f06771f9cce0d74f6b4e0adcda1143efa9a574a
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 2: JWT_REFRESH_SECRET

```
Name: JWT_REFRESH_SECRET
Value: 1487deb2dcf6b170c0c07f7e155c71e4ab2d8f2caadaa2fe32086fbf530ae42c
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 3: SESSION_SECRET

```
Name: SESSION_SECRET
Value: 508a78e035720e537c9d6e255a439632e78651b062e77174936297acb542f4b9
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 4: ENCRYPTION_KEY

```
Name: ENCRYPTION_KEY
Value: 4cada97eda7fba1fb79ef9c1c3e5dc262e0278c70553bc8fa57dc3667f1ee8bc
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 5: NODE_ENV

```
Name: NODE_ENV
Value: production
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 6: ALLOWED_ORIGINS

```
Name: ALLOWED_ORIGINS
Value: https://bitforward.vercel.app
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 7: DATABASE_PATH

```
Name: DATABASE_PATH
Value: /tmp/bitforward.sqlite3
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 8: ENABLE_HELMET

```
Name: ENABLE_HELMET
Value: true
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 9: ENABLE_CSP

```
Name: ENABLE_CSP
Value: true
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 10: RATE_LIMIT_MAX

```
Name: RATE_LIMIT_MAX
Value: 100
Environment: ☑ Production  ☑ Preview  ☐ Development
```

### Variable 11: LOG_LEVEL

```
Name: LOG_LEVEL
Value: warn
Environment: ☑ Production  ☑ Preview  ☐ Development
```

---

## 📋 Checklist de Configuración

- [ ] Ir a tu proyecto en Vercel
- [ ] Click en "Settings"
- [ ] Click en "Environment Variables"
- [ ] Agregar cada variable (11 total)
- [ ] Marcar "Production" y "Preview" para cada una
- [ ] Click "Save" después de cada variable
- [ ] Ir a "Deployments"
- [ ] Click en ⋯ del último deployment
- [ ] Seleccionar "Redeploy"
- [ ] Confirmar el redeploy
- [ ] Esperar 2-3 minutos
- [ ] Verificar que https://bitforward.vercel.app funciona

---

## ⚡ Quick Copy/Paste (Para agregar rápido)

Si prefieres copiar todo de una vez, aquí está en formato compacto:

```env
JWT_SECRET=1ce1a54004267c05d80522957f06771f9cce0d74f6b4e0adcda1143efa9a574a
JWT_REFRESH_SECRET=1487deb2dcf6b170c0c07f7e155c71e4ab2d8f2caadaa2fe32086fbf530ae42c
SESSION_SECRET=508a78e035720e537c9d6e255a439632e78651b062e77174936297acb542f4b9
ENCRYPTION_KEY=4cada97eda7fba1fb79ef9c1c3e5dc262e0278c70553bc8fa57dc3667f1ee8bc
NODE_ENV=production
ALLOWED_ORIGINS=https://bitforward.vercel.app
DATABASE_PATH=/tmp/bitforward.sqlite3
ENABLE_HELMET=true
ENABLE_CSP=true
RATE_LIMIT_MAX=100
LOG_LEVEL=warn
```

---

## 🔗 Links Útiles

- Dashboard de tu proyecto: https://vercel.com/asesoraft/bitforward
- Environment Variables: https://vercel.com/asesoraft/bitforward/settings/environment-variables
- Deployments: https://vercel.com/asesoraft/bitforward/deployments

---

## ⚠️ Importante

**Estos secrets son únicos para tu instalación.**

- NO los compartas públicamente
- NO los commits a Git
- NO los pongas en código
- SÍ guárdalos en un password manager seguro

**Después de agregarlos en Vercel:**

- Vercel los encripta automáticamente
- Solo son accesibles durante el build/runtime
- No aparecen en logs públicos

---

## ✅ Verificación Post-Deploy

Después del redeploy, verifica:

1. **Homepage:** https://bitforward.vercel.app
   - Debe mostrar el dashboard
   - Logo visible
   - Sin errores en consola (F12)

2. **API Health:** https://bitforward.vercel.app/api/health
   - Debe retornar: `{"status":"ok",...}`

3. **API Stats:** https://bitforward.vercel.app/api/stats
   - Debe retornar datos de estadísticas

Si algo falla, revisa los logs en:
https://vercel.com/asesoraft/bitforward/deployments → Click en el deployment → "View Function Logs"

---

**Generado:** 19 de octubre de 2025  
**Para:** BitForward Production Deployment  
**By:** DevOps Team
