# 🔐 Sistema de Autenticación JWT con Wallets - BitForward

## ✅ IMPLEMENTACIÓN COMPLETADA

**Fecha:** 2025-10-19  
**Estado:** 🟢 PRODUCCIÓN  
**Prioridad:** #3 CRÍTICA (Completada)

---

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de autenticación basado en wallets** usando el estándar **SIWE (Sign-In with Ethereum)** con tokens JWT para autenticación persistente.

### Características Principales:

✅ **Sign-In with Ethereum (SIWE)**
- Autenticación sin contraseña usando firma de wallet
- Nonces únicos de un solo uso
- Verificación criptográfica de firma
- Sin costo de gas (off-chain signing)

✅ **JWT con Refresh Tokens**
- Access tokens (15 minutos)
- Refresh tokens (7 días)
- Rotación automática de tokens
- Revocación individual y masiva

✅ **Seguridad Enterprise-Grade**
- Rate limiting por IP y dirección
- Almacenamiento seguro en memoria (Redis-ready)
- Protección contra replay attacks
- Logging de seguridad

✅ **Frontend Completo**
- Cliente JavaScript con auto-refresh
- Persistencia en localStorage
- Sistema de eventos
- Interceptor HTTP con auth automática

✅ **Backend Robusto**
- Express.js + JWT
- Middleware de protección de rutas
- Endpoints REST completos
- Validación de chains

---

## 🏗️ Arquitectura

### Stack Tecnológico:

**Backend:**
- Node.js + Express.js
- jsonwebtoken (JWT generation/verification)
- ethers.js v6 (signature verification)
- express-rate-limit (rate limiting)
- crypto (nonce generation)

**Frontend:**
- Vanilla JavaScript (ES6+)
- ethers.js v5 (wallet integration)
- localStorage (token persistence)
- Fetch API (HTTP client)

---

## 📁 Estructura de Archivos

### Backend (`/server`):

```
server/
├── config/
│   └── auth.config.js          # Configuración centralizada de auth
├── services/
│   └── AuthService.js          # Lógica principal de autenticación
├── middleware/
│   ├── walletAuth.js           # Middleware de protección de rutas
│   └── rateLimiter.js          # Rate limiting
├── routes/
│   └── walletAuth.js           # Endpoints REST de auth
└── server.js                   # Registro de rutas
```

### Frontend (`/js`):

```
js/
└── wallet-auth-client.js       # Cliente de autenticación
```

### Testing:

```
test-auth.html                  # Página de prueba completa
```

---

## 🔌 API Endpoints

### 1. POST `/api/auth/wallet/nonce`
**Generar nonce para firma**

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3...",
    "message": "BitForward Authentication\n\nPlease sign...",
    "expiresAt": 1634567890000,
    "chainId": 1
  }
}
```

**Rate Limit:** 20 requests / 15 minutos

---

### 2. POST `/api/auth/wallet/verify`
**Verificar firma y obtener tokens**

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0xabcdef...",
  "nonce": "a1b2c3...",
  "chainId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m",
    "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "chainId": 1
  }
}
```

**Errors:**
- `401 VERIFICATION_FAILED` - Firma inválida
- `400` - Campos faltantes
- `429` - Rate limit excedido

---

### 3. POST `/api/auth/wallet/refresh`
**Refrescar access token**

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Errors:**
- `401 REFRESH_FAILED` - Token inválido/expirado

---

### 4. POST `/api/auth/wallet/logout`
**Cerrar sesión (revocar tokens)**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "logoutAll": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Options:**
- `logoutAll: false` - Revocar solo el refresh token proporcionado
- `logoutAll: true` - Revocar TODOS los refresh tokens del usuario

---

### 5. GET `/api/auth/wallet/me`
**Obtener información del usuario autenticado**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "chainId": 1,
    "authenticated": true
  }
}
```

---

### 6. GET `/api/auth/wallet/stats`
**Estadísticas del sistema de auth (debug)**

**Response:**
```json
{
  "success": true,
  "data": {
    "activeNonces": 5,
    "refreshTokens": 12,
    "addressesWithAttempts": 3
  }
}
```

---

## 🛡️ Middleware de Protección

### 1. `requireWalletAuth`
**Requiere autenticación con wallet**

```javascript
const { requireWalletAuth } = require('./middleware/walletAuth');

router.get('/protected', requireWalletAuth, (req, res) => {
    // req.wallet contiene { address, chainId }
    res.json({ address: req.wallet.address });
});
```

### 2. `optionalWalletAuth`
**Autenticación opcional**

```javascript
const { optionalWalletAuth } = require('./middleware/walletAuth');

router.get('/public', optionalWalletAuth, (req, res) => {
    // req.wallet existe si está autenticado, undefined si no
    if (req.wallet) {
        res.json({ message: 'Authenticated', address: req.wallet.address });
    } else {
        res.json({ message: 'Anonymous' });
    }
});
```

### 3. `requireOwnWallet`
**Verificar que accede a sus propios datos**

```javascript
const { requireWalletAuth, requireOwnWallet } = require('./middleware/walletAuth');

router.get('/wallet/:address/data', 
    requireWalletAuth, 
    requireOwnWallet, 
    (req, res) => {
        // Solo puede acceder si req.wallet.address === req.params.address
        res.json({ data: 'Your private data' });
    }
);
```

### 4. `requireChainId`
**Validar chain soportada**

```javascript
const { requireWalletAuth, requireChainId } = require('./middleware/walletAuth');

router.post('/contract/deploy',
    requireWalletAuth,
    requireChainId([1, 137, 56]), // Solo Ethereum, Polygon, BSC
    (req, res) => {
        res.json({ message: 'Contract deployed' });
    }
);
```

---

## 💻 Uso del Cliente Frontend

### Inicialización:

```javascript
// Cliente ya instanciado globalmente
const authClient = window.walletAuthClient;

// O crear nueva instancia
const authClient = new WalletAuthClient('http://localhost:3000/api');
```

### Login (Flujo Completo):

```javascript
// Necesitas un wallet manager conectado
const walletManager = window.walletManager;

try {
    // 1. Conectar wallet primero
    await walletManager.connectMetaMask();
    
    // 2. Login con SIWE
    const result = await authClient.login(walletManager);
    
    console.log('Autenticado:', result.address);
    // Tokens guardados automáticamente en localStorage
    
} catch (error) {
    console.error('Error en login:', error.message);
}
```

### Hacer Requests Autenticados:

```javascript
// Método 1: usando authenticatedFetch (auto-refresh incluido)
const response = await authClient.authenticatedFetch(
    'http://localhost:3000/api/contracts/my-contracts',
    {
        method: 'GET'
    }
);

const data = await response.json();

// Método 2: manual con token
const token = authClient.getAccessToken();
const response = await fetch('http://localhost:3000/api/contracts', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### Logout:

```javascript
// Cerrar sesión actual
await authClient.logout();

// Cerrar TODAS las sesiones del usuario
await authClient.logout(true);
```

### Event Listeners:

```javascript
// Escuchar eventos de autenticación
authClient.on('login', (data) => {
    console.log('Usuario autenticado:', data.address);
    updateUI(data);
});

authClient.on('logout', () => {
    console.log('Sesión cerrada');
    redirectToLogin();
});

authClient.on('tokenRefreshed', () => {
    console.log('Token refrescado automáticamente');
});

authClient.on('error', (error) => {
    console.error('Error de autenticación:', error);
    showErrorNotification(error.message);
});
```

### Verificar Estado:

```javascript
// Verificar si está autenticado
if (authClient.isAuthenticated()) {
    console.log('Usuario autenticado');
    
    // Obtener información del usuario
    const userInfo = await authClient.getUserInfo();
    console.log('Address:', userInfo.address);
    console.log('Chain:', userInfo.chainId);
}
```

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (`.env`):

```env
# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-me
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-me

# Token Durations
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW=15m

# Server
PORT=3000
NODE_ENV=production
```

### Actualizar Configuración:

Editar `/server/config/auth.config.js`:

```javascript
module.exports = {
    jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET,
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
    },
    auth: {
        nonceExpiry: 5 * 60 * 1000,  // 5 minutos
        maxLoginAttempts: 5,
        loginAttemptWindow: 15 * 60 * 1000
    }
};
```

---

## 🧪 Testing

### Página de Prueba: `test-auth.html`

**Características:**
- ✅ Conexión de MetaMask
- ✅ Flujo completo de SIWE
- ✅ Visualización de 5 pasos del flujo
- ✅ Status indicators en tiempo real
- ✅ Console log de eventos
- ✅ Obtener información de usuario
- ✅ Cerrar sesión

**Para probar:**

1. Iniciar servidor backend:
```bash
cd server
npm start
```

2. Abrir en navegador:
```
http://localhost:8080/test-auth.html
```

3. Seguir pasos en UI:
   - Conectar MetaMask
   - Iniciar Sesión (firmar mensaje)
   - Obtener Info Usuario
   - Cerrar Sesión

---

## 🔄 Flujo de Autenticación SIWE

### Diagrama de Secuencia:

```
┌──────────┐          ┌─────────┐          ┌─────────┐
│ Frontend │          │ Backend │          │  Wallet │
└─────┬────┘          └────┬────┘          └────┬────┘
      │                    │                    │
      │ 1. POST /nonce     │                    │
      │ {address,chainId}  │                    │
      │───────────────────>│                    │
      │                    │                    │
      │ {nonce,message}    │                    │
      │<───────────────────│                    │
      │                    │                    │
      │ 2. Sign message    │                    │
      │────────────────────────────────────────>│
      │                    │                    │
      │                    │   signature        │
      │<────────────────────────────────────────│
      │                    │                    │
      │ 3. POST /verify    │                    │
      │ {address,sig,nonce}│                    │
      │───────────────────>│                    │
      │                    │                    │
      │                    │ 4. Verify signature│
      │                    │ (ethers.verify)    │
      │                    │                    │
      │ 5. JWT tokens      │                    │
      │<───────────────────│                    │
      │                    │                    │
      │ 6. Store tokens    │                    │
      │ (localStorage)     │                    │
      │                    │                    │
```

### Paso a Paso:

1. **Frontend solicita nonce**
   - Envía dirección de wallet al servidor
   - Servidor genera nonce único (32 bytes random)
   - Nonce válido por 5 minutos

2. **Usuario firma mensaje**
   - Frontend construye mensaje con nonce
   - MetaMask solicita firma al usuario
   - Firma generada off-chain (sin gas)

3. **Frontend envía firma**
   - Envía signature + nonce al servidor
   - Servidor marca nonce como usado

4. **Backend verifica firma**
   - Usa `ethers.verifyMessage()` para verificar
   - Compara dirección recuperada con la reclamada
   - Si coincide, genera tokens JWT

5. **Tokens generados**
   - Access token: 15 minutos (para requests)
   - Refresh token: 7 días (para renovar)
   - Ambos con signature HMAC

6. **Sesión activa**
   - Frontend guarda tokens en localStorage
   - Auto-refresh cada 10 minutos
   - Persistencia entre recargas de página

---

## 🚀 Próximas Mejoras

### Posibles Extensiones:

1. **Base de Datos para Tokens**
   - Migrar de memoria a PostgreSQL/MongoDB
   - Persistencia de refresh tokens
   - Historial de sesiones

2. **Redis para Nonces**
   - Cache distribuido
   - Expiración automática
   - Escalabilidad horizontal

3. **Multi-Signature Support**
   - Soporte para wallets multi-sig
   - Gnosis Safe integration
   - Hardware wallets (Ledger, Trezor)

4. **OAuth2 Flow**
   - Integración con OAuth2 estándar
   - Scopes y permisos granulares
   - Authorization Code Flow

5. **Session Management Dashboard**
   - UI para ver sesiones activas
   - Revocar sesiones remotamente
   - Logs de actividad por usuario

6. **2FA Adicional**
   - TOTP (Google Authenticator)
   - SMS verification
   - Email confirmation

7. **SSO (Single Sign-On)**
   - Login único para múltiples apps
   - SAML 2.0 support
   - Enterprise SSO (Okta, Auth0)

---

## 📝 Checklist de Implementación

### Backend:
- [x] AuthService con SIWE
- [x] Generación de nonces
- [x] Verificación de firmas (ethers.js)
- [x] Generación de JWT
- [x] Refresh token system
- [x] Rate limiting
- [x] Middleware de protección
- [x] Endpoints REST
- [x] Configuración centralizada
- [x] Logging de seguridad

### Frontend:
- [x] WalletAuthClient
- [x] Login con SIWE
- [x] Auto-refresh de tokens
- [x] localStorage persistence
- [x] Sistema de eventos
- [x] HTTP client con auth
- [x] Manejo de errores
- [x] Integración con wallet manager

### Testing:
- [x] Página de prueba completa
- [x] Visualización de flujo
- [x] Console log
- [x] Status indicators

### Documentación:
- [x] README completo
- [x] Ejemplos de uso
- [x] API reference
- [x] Diagramas de flujo
- [x] Guía de configuración

---

## 🎯 Impacto en MVP

**Antes:** Sin sistema de autenticación real, usuarios anónimos

**Ahora:** Sistema profesional de autenticación basado en wallets

**Mejoras al MVP:**
- ✅ Autenticación sin contraseñas
- ✅ Seguridad enterprise-grade
- ✅ Sesiones persistentes
- ✅ Protección de datos por usuario
- ✅ Rate limiting anti-abuse
- ✅ Estándar SIWE

**Progreso de Madurez del MVP:**
- Web3 Integration: ✅ 100%
- Price Feeds: ✅ 100%
- JWT Auth: ✅ 100%
- **Nuevo status: ~88% completado**

---

## 🔗 Referencias

- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Implementado por:** BitForward Team  
**Fecha:** 2025-10-19  
**Versión:** 1.0.0
