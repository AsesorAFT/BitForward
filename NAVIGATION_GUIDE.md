# 🗺️ BitForward - Guía de Navegación Rápida

## 🌐 URLs de Acceso (localhost:8080)

### 🚀 Punto de entrada

1. **Landing & CTA principal** - `/index.html`
   - Hero con mensaje claro y un único botón “Conectar billetera y abrir dashboard”.
   - Explica el flujo completo y enlaza directamente al dashboard real (sin dashboards duplicados).
   - Navegación ligera hacia secciones informativas (productos, ventajas, métricas).

### 📊 Páginas Principales

2. **Dashboard** - `/dashboard.html`
   - Vista general del portafolio
   - Balance total y P&L
   - **Fees transparentes** (1% AUM + 10% performance)
   - Posiciones activas
   - Métricas de rendimiento

3. **Trading** - `/trading.html`
   - Crear contratos forward
   - Apalancamiento 1x-20x
   - Cálculo de liquidación en tiempo real
   - Gestión de posiciones
   - Dashboard de riesgo

4. **Lending** - `/lending.html`
   - Préstamos con colateral
   - LTV y Health Factor
   - APR dinámico
   - Múltiples colaterales

5. **Analytics** - `/analytics.html`
   - **TradingView integrado** 📈
   - Noticias cripto en tiempo real
   - Indicadores técnicos (RSI, MACD, Bollinger)
   - Sentimiento del mercado
   - Métricas on-chain

6. **Community** - `/community.html`
   - Chat en vivo 💬
   - Canales públicos (#general, #señales, #bitcoin, etc.)
   - Mensajes directos (DMs)
   - Compartir señales de trading
   - Leaderboard de top traders

7. **Enterprise** - `/enterprise.html`
   - **AFORTU Holdings Ecosystem** 🏢
   - Launchpad & Crowdfunding
   - Seminarios y capacitación
   - Proyectos del ecosistema

---

## 🎯 Flujo de Usuario Recomendado

### Para Nuevos Usuarios:
```
1. index.html → Leer la propuesta de valor y usar el CTA principal
2. dashboard.html → Conectar wallet y revisar portafolio inicial
3. analytics.html → Analizar el mercado
4. trading.html → Crear primera posición
5. community.html → Unirse a la comunidad
```

### Para Traders Activos:
```
1. index.html → Acceso directo al dashboard (CTA)
2. dashboard.html → Ver portafolio
3. analytics.html → Revisar gráficos TradingView
4. trading.html → Operar forwards
5. community.html → Compartir señales
```

### Para Institucionales:
```
1. index.html → Resumen ejecutivo + CTA al dashboard
2. enterprise.html → Explorar servicios
3. dashboard.html → Gestionar portafolio
4. lending.html → Préstamos corporativos
```

---

## 🔗 Navegación Integrada

- La landing (`index.html`) ofrece navegación ligera entre secciones y el CTA directo al dashboard.
- Las vistas internas mantienen sus headers originales mientras se completa la unificación global.
- Recomendación actual: volver al dashboard mediante el botón global dentro de cada módulo o usando el CTA de la landing.

---

## 🎨 Elementos de Diseño Comunes

### Header
- Logo BitForward con navegación ligera en la landing (Inicio, Productos, Ventajas, Métricas).
- Páginas internas mantienen sus headers específicos hasta la unificación completa.

### Footer
- Landing con mensaje institucional compacto.
- Páginas internas conservan el indicador de estado en vivo (🟢) y enlaces de soporte.

### Efectos Visuales
- Glassmorphism en todas las tarjetas
- Gradientes espaciales
- Animaciones suaves
- Glow effects en hover

---

## 📱 Responsiveness

Todas las páginas son responsive:
- Desktop: Vista completa con sidebars
- Tablet: Grid adaptable
- Mobile: Stack vertical

---

## 🛠️ Componentes Interactivos

### Dashboard
- ✅ Cálculo automático de fees
- ✅ Actualización en tiempo real
- ✅ Gráficos de P&L

### Trading
- ✅ Slider de leverage
- ✅ Toggle Long/Short
- ✅ Cálculo de liquidación

### Analytics
- ✅ Selector de símbolos TradingView
- ✅ Refresh de noticias
- ✅ Filtros de análisis

### Community
- ✅ Input de mensajes (Enter para enviar)
- ✅ Búsqueda de canales
- ✅ Estados online/offline
- ✅ Reacciones a mensajes

### Enterprise
- ✅ Cards interactivas de proyectos
- ✅ Barras de progreso en campañas
- ✅ Registro a webinars

---

## 🔐 Sistema de Autenticación

Estado actual:
- ✅ Botón "Conectar Wallet" en todas las páginas
- ✅ Integración con MetaMask preparada
- ⏳ Persistencia de sesión (próximamente)

---

## 📊 Datos en Tiempo Real

### Implementado:
- ✅ Precios de activos (demo)
- ✅ Cálculos de posiciones
- ✅ Métricas del mercado
- ✅ Sentimiento (Fear & Greed)

### Próximamente:
- ⏳ WebSocket para chat real
- ⏳ API de noticias en vivo
- ⏳ Price oracles de Chainlink
- ⏳ Actualización de balances

---

## 🎓 Recursos de Ayuda

### En Analytics
- TradingView: Gráficos profesionales con indicadores
- News Feed: Últimas noticias con análisis de sentimiento
- On-Chain: Métricas de la blockchain

### En Community
- #general: Chat principal
- #señales: Trading signals
- #bitcoin, #ethereum: Chats específicos
- Top Traders: Aprende de los mejores

### En Enterprise
- Seminarios: Capacitación en vivo
- Launchpad: Proyectos para invertir
- Ecosystem: Servicios de AFORTU Holdings

---

## 🚀 Iniciar Servidor

```bash
# Método 1: Python
python3 -m http.server 8080

# Método 2: Script
./start.sh

# Método 3: VS Code Task
Cmd+Shift+P → "Run Task" → "Start BitForward Development Server"
```

Luego accede a: `http://localhost:8080/dashboard.html`

---

## ✨ Features Destacadas

### 💰 Modelo de Fees Transparente
```
Fee Anual: 1% sobre AUM
Performance: 10% sobre ganancias > 10%
```

### 📈 TradingView Professional
```
- Múltiples timeframes
- Indicadores técnicos
- Alertas de precio
- Análisis avanzado
```

### 💬 Social Trading
```
- Compartir señales
- Copy trading
- Leaderboards
- Chat en vivo
```

### 🏢 Ecosistema AFORTU
```
- 6 divisiones empresariales
- Launchpad para IDOs
- Educación y seminarios
- Proyectos innovadores
```

---

## 📞 Navegación Rápida desde Terminal

```bash
# Abrir todas las páginas principales
open http://localhost:8080/dashboard.html
open http://localhost:8080/trading.html
open http://localhost:8080/lending.html
open http://localhost:8080/analytics.html
open http://localhost:8080/community.html
open http://localhost:8080/enterprise.html
```

---

## 🎯 Testing Checklist

### Dashboard
- [ ] Conectar wallet
- [ ] Ver balance total
- [ ] Revisar fees calculados
- [ ] Navegar a otras páginas

### Trading
- [ ] Cambiar asset (BTC/ETH/SOL/AVAX)
- [ ] Toggle Long/Short
- [ ] Mover slider de leverage
- [ ] Ver precio de liquidación actualizado

### Analytics
- [ ] Cambiar símbolo en TradingView
- [ ] Scroll en feed de noticias
- [ ] Revisar indicadores técnicos

### Community
- [ ] Escribir mensaje en chat
- [ ] Presionar Enter para enviar
- [ ] Click en canales diferentes
- [ ] Ver top traders

### Enterprise
- [ ] Explorar cada división de AFORTU
- [ ] Ver campañas de launchpad
- [ ] Revisar seminarios próximos

---

**BitForward** - Proyecto Fénix v1.0  
*Navegación fluida, diseño espacial, features completas* 🚀
