# BitForward v2.0 🚀

<<<<<<< Updated upstream
# BitForward v2.0 🚀

**Advanced Multi-Blockchain DeFi Forward Contracts Platform**

BitForward v2.0 es una plataforma DeFi de vanguardia que permite crear, gestionar y ejecutar contratos forward en múltiples blockchains (Bitcoin, Ethereum, Solana) con integración real de wallets y smart contracts.

## ✨ Nuevas Funcionalidades v2.0

### 🔐 **Integración Real de Wallets**
- **MetaMask** (Ethereum) - Integración completa con eventos en tiempo real
- **Phantom** (Solana) - Soporte nativo para transacciones Solana
- **WalletConnect** - Conectividad universal con múltiples wallets
- **Coinbase Wallet** - Integración directa
- **Auto-detección** de wallets disponibles
- **Gestión de estados** avanzada con subscripciones
- **UI moderna** con notificaciones y feedback visual

### ⛓️ **Smart Contracts Reales**
- **Contratos Ethereum** desplegables en mainnet/testnet
- **Gestión de colateral** automática y segura
- **Ejecución automática** al vencimiento
- **Eventos en blockchain** para tracking en tiempo real
- **Integración con oráculos** de precios (CoinGecko, Binance, Coinbase)
- **Fees de plataforma** configurables
- **Pausado de emergencia** y funciones administrativas

### 🏗️ **Arquitectura Frontend Modular**
```javascript
// Aplicación principal
BitForwardApp - Gestión completa del ciclo de vida

// Estado centralizado
BitForwardStore - State management con subscripciones

// Cliente API robusto  
BitForwardAPI - HTTP client con retry, cache, interceptors

// Gestión de Wallets
WalletManager - Integración multi-wallet
WalletUI - Interfaz moderna y responsiva

// Blockchain Integration
BitForwardBlockchain - Integración real con contratos
```

### 🔒 **Seguridad y Autenticación**
- **JWT Authentication** con refresh tokens
- **Bcrypt** password hashing (12 rounds)
- **Rate limiting** (100 requests/15min)
- **CORS protection** configurado
- **Helmet.js** para headers de seguridad
- **Input validation** con Joi
- **Error handling** centralizado
- **Logging** estructurado con Winston

### 📊 **Sistema de Monitoreo**
- **Logging categorizado** (info, warn, error, security, blockchain)
- **Métricas de performance** 
- **Error tracking** con stack traces
- **API response times**
- **Blockchain transaction monitoring**

## 🚀 Instalación Rápida

### Método 1: Setup Automático (Recomendado)
```bash
# Clonar el repositorio
git clone https://github.com/yourusername/BitForward.git
cd BitForward

# Ejecutar setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# Iniciar la plataforma
npm run start
```

### Método 2: Setup Manual
```bash
# Instalar dependencias del backend
cd server
npm install

# Instalar dependencias del frontend (Hardhat para contratos)
cd ..
npm install

# Configurar variables de entorno
cp server/.env.example server/.env
# Editar server/.env con tus claves API

# Inicializar base de datos
cd server
node -e "require('./database/database.js').init()"

# Iniciar servicios
npm run start
```

## 📱 Acceso a la Plataforma

### URLs de Acceso:
- **Frontend**: http://localhost:8080
- **Dashboard**: http://localhost:8080/dashboard.html  
- **Backend API**: http://localhost:3000
- **Docs API**: Revisar API.md

### Credenciales Demo:
- **Usuario**: `demo`
- **Contraseña**: `password123`

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```env
# Configuración de red
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8080

# JWT y Seguridad
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# APIs Blockchain  
INFURA_PROJECT_ID=your_infura_id
ALCHEMY_API_KEY=your_alchemy_key
MORALIS_API_KEY=your_moralis_key

# RPCs de Blockchain
ETHEREUM_MAINNET_RPC=https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}
ETHEREUM_GOERLI_RPC=https://goerli.infura.io/v3/${INFURA_PROJECT_ID}
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Contratos Desplegados (se llenan después del deploy)
ETHEREUM_CONTRACT_ADDRESS=0x...
SOLANA_PROGRAM_ID=...
```

### Despliegue de Smart Contracts
```bash
# Compilar contratos
npx hardhat compile

# Desplegar en testnet
npm run deploy:goerli

# Desplegar en mainnet (¡CUIDADO!)
npm run deploy:mainnet

# Verificar en Etherscan
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
```

## 🔗 Integración de Wallets

### Wallets Soportadas:
| Wallet | Blockchain | Estado | Features |
|--------|------------|--------|----------|
| MetaMask | Ethereum | ✅ Completo | Tx, Sign, Events |
| Phantom | Solana | ✅ Completo | Tx, Sign, Events |
| WalletConnect | Multi | 🔄 En desarrollo | Universal |
| Coinbase Wallet | Ethereum | ✅ Completo | Tx, Sign |

### Uso de Wallets en Código:
```javascript
// Conectar wallet
await walletManager.connectWallet('metamask');

// Firmar mensaje
const signature = await walletManager.signMessage('metamask', 'Hello BitForward!');

// Enviar transacción
const txHash = await walletManager.sendTransaction('metamask', {
    to: '0x...',
    value: ethers.utils.parseEther('0.1')
});
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Test suite completo
npm run test

# Tests de backend
cd server && npm test

# Tests de contratos
npx hardhat test

# Tests de integración
npm run test:integration
```

### Test Coverage
- ✅ Authentication & JWT
- ✅ Database operations  
- ✅ API endpoints
- ✅ Smart contracts
- ✅ Wallet integration
- ✅ Error handling

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run start          # Iniciar plataforma completa
npm run dev            # Modo desarrollo con hot reload
npm run test           # Ejecutar test suite

# Contratos
npm run deploy         # Deploy en red local
npm run deploy:goerli  # Deploy en Goerli testnet  
npm run deploy:mainnet # Deploy en mainnet
npm run verify         # Verificar contratos en Etherscan

# Utilidades
npm run setup          # Setup automático inicial
npm run clean          # Limpiar archivos temporales
npm run lint           # Verificar código
npm run format         # Formatear código
```

## 📊 Monitoreo y Logs

### Estructura de Logs:
```
logs/
├── bitforward.log      # Log principal
├── error.log          # Solo errores
├── security.log       # Eventos de seguridad
└── blockchain.log     # Transacciones blockchain
```

### Métricas Disponibles:
- **API Response Times**
- **Wallet Connection Events**  
- **Smart Contract Interactions**
- **Error Rates**
- **User Authentication Events**
- **Database Query Performance**

## 🏗️ Arquitectura Técnica

### Stack Tecnológico:
```
Frontend:
├── HTML5/CSS3/JavaScript (Vanilla)
├── Wallet Integration (MetaMask, Phantom)
├── State Management (BitForwardStore)
└── Blockchain Integration (ethers.js, solana-web3.js)

Backend:
├── Node.js + Express.js
├── SQLite Database
├── JWT Authentication
├── Winston Logging
└── Rate Limiting

Blockchain:
├── Ethereum Smart Contracts (Solidity 0.8.19)
├── Hardhat Development Framework
├── OpenZeppelin Libraries
└── Multi-network Support

Security:
├── Helmet.js
├── CORS Protection
├── Input Validation (Joi)
├── Bcrypt Password Hashing
└── Rate Limiting
```

### Flujo de Datos:
```
Usuario → Wallet → Frontend → API → Database
                     ↓
              Smart Contract → Blockchain
```

## 🤝 Contribuir

### Setup para Desarrollo:
```bash
# Fork del repositorio
git clone https://github.com/tuusuario/BitForward.git
cd BitForward

# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits
git add .
git commit -m "feat: nueva funcionalidad increíble"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

### Guías de Contribución:
- 📋 **Issues**: Reportar bugs o solicitar features
- 🔄 **Pull Requests**: Contribuir código
- 📖 **Documentación**: Mejorar docs y guías
- 🧪 **Testing**: Añadir tests y casos edge

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

### Documentación:
- 📚 [API Documentation](API.md)
- 🛠️ [Development Guide](DEVELOPMENT.md)
- 🔧 [Configuration Guide](docs/configuration.md)

### Contacto:
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/BitForward/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/BitForward/discussions)
- 📧 **Email**: bitforward@example.com

---

## ⚡ Estado del Proyecto

### ✅ Completado v2.0:
- [x] Integración real de wallets (MetaMask, Phantom)
- [x] Smart contracts Ethereum desplegables
- [x] Frontend modular y state management
- [x] Sistema de autenticación JWT completo
- [x] API REST robusta con validación
- [x] Logging y monitoreo avanzado
- [x] Setup automático y scripts de desarrollo
- [x] Documentación completa

### 🔄 En Desarrollo:
- [ ] Smart contracts Solana (Rust)
- [ ] WalletConnect integration
- [ ] Advanced price oracles
- [ ] Mobile responsive improvements
- [ ] Multi-language support

### 🎯 Roadmap v3.0:
- [ ] Layer 2 support (Polygon, Arbitrum)
- [ ] Cross-chain bridges
- [ ] Governance token
- [ ] Yield farming
- [ ] Insurance protocols
- [ ] Mobile app (React Native)

**¡BitForward v2.0 - El futuro de los contratos forward DeFi está aquí! 🚀**
=======
**La plataforma DeFi más avanzada para contratos forward descentralizados con sistema de autenticación BiT-ID integrado.**
>>>>>>> Stashed changes

---

## 🎯 **Visión 2025**

<<<<<<< Updated upstream
BitForward revoluciona los contratos financieros tradicionales llevándolos al ecosistema DeFi. Nuestra plataforma permite crear, ejecutar y gestionar contratos forward, préstamos colateralizados y otros derivados de manera completamente descentralizada, ofreciendo transparencia, seguridad y eficiencia sin precedentes.

Nuestra visión es convertirnos en la empresa líder de finanzas programables en América Latina, democratizando el acceso a herramientas financieras sofisticadas y construyendo el futuro de los contratos inteligentes multi-cadena.

## ✨ **Características Principales**

### 🔗 **Multi-Blockchain Support**
- **Bitcoin**: Contratos usando Bitcoin Script avanzado (Taproot, SegWit).
- **Ethereum**: Smart contracts en Solidity con integración EVM y Layer 2.
- **Solana**: Programas nativos en Rust para alta performance y bajo costo.

### 📊 **Dashboard Profesional**
- Analytics en tiempo real y KPIs (TVL, Volumen, Contratos Activos).
- Gestión avanzada de portfolio y posiciones.
- Métricas de riesgo integradas y monitoreo de salud de préstamos.
- Visualización interactiva de datos.

### 💰 **Plataforma de Préstamos**
- Préstamos colateralizados con LTV dinámico.
- Múltiples activos para colateral y préstamo (BTC, ETH, SOL, stablecoins).
- Liquidación automática y gestión de riesgos.

### 🛡️ **Seguridad Enterprise**
- Auditorías de smart contracts planificadas.
- Sistema de validación multi-capa (Guardián de Contratos).
- Gestión descentralizada de colateral.
- Oracle system con feeds de precios redundantes.
=======
BitForward revoluciona los contratos forward tradicionales llevándolos al ecosistema DeFi con un sistema de autenticación empresarial completo. Nuestra plataforma permite crear, ejecutar y gestionar contratos forward de manera completamente descentralizada, ofreciendo transparencia, seguridad y eficiencia sin precedentes.

## ✨ **Características Principales**

### � **Portal de Acceso BiT-ID**
- **Autenticación JWT**: Sistema de tokens seguros con localStorage
- **Registro/Login Modal**: Interfaz moderna con validación en tiempo real
- **Gestión de Sesiones**: Control automático de tokens y expiración
- **Integración Cross-Platform**: Auth consistente en dashboard y lending

### �🔗 **Multi-Blockchain Support**
- **Bitcoin**: Contratos usando Bitcoin Script avanzado
- **Ethereum**: Smart contracts en Solidity con integración EVM
- **Solana**: Programas nativos en Rust para alta performance

### 📊 **Dashboard Profesional**
- Analytics en tiempo real con protección de autenticación
- Gestión avanzada de portfolio para usuarios autenticados
- Métricas de riesgo integradas con control de acceso
- Visualización interactiva de datos protegidos

### 🏦 **Plataforma de Préstamos DeFi**
- **Préstamos Colateralizados**: Bitcoin, Ethereum, Solana como colateral
- **Cálculo LTV Dinámico**: Ratios de liquidación en tiempo real
- **Multi-término**: Préstamos desde 30 días hasta 5 años
- **Autenticación Requerida**: Acceso solo para usuarios registrados

### 🛡️ **Seguridad Enterprise**
- Sistema de autenticación completo con validación de contraseñas
- Auditorías automáticas de contratos
- Sistema de validación multi-capa
- Gestión descentralizada de colateral con control de acceso
- Oracle system con feeds redundantes

### ⚡ **Performance**
- Ejecución automática de contratos
- Fees optimizados por blockchain
- Interfaz responsive y moderna
- Sistema de notificaciones en tiempo real
>>>>>>> Stashed changes

## 🏗️ **Arquitectura del Sistema**

```
BitForward v2.0 Architecture
├── Frontend Layer
<<<<<<< Updated upstream
│   ├── Dashboard Empresarial (enterprise.html)
│   ├── Plataforma de Préstamos (lending.html)
│   └── Sistema de Componentes y Estilos (corporate.css)
├── Backend Layer (Node.js/Express)
│   ├── API RESTful (Autenticación, Contratos, Préstamos)
│   ├── Motor Financiero (Lógica de LTV, Intereses)
│   └── Oráculo de Precios (Integración con APIs externas)
=======
│   ├── Dashboard Avanzado (enterprise.html)
│   ├── Sistema de Préstamos (lending.html)
│   ├── Portal BiT-ID (auth.js, auth.css)
│   └── UI/UX Responsive (dashboard.css, lending.css)
├── Authentication System
│   ├── Modal Management (auth.js)
│   ├── JWT Token System
│   ├── Form Validation
│   ├── Session Management
│   └── Password Security
├── Core Engine
│   ├── Gestión de Contratos (prototype.js)
│   ├── Sistema de Eventos
│   ├── Portfolio Management
│   ├── Risk Analytics
│   └── Lending Platform (lending.js)
>>>>>>> Stashed changes
├── Blockchain Layer
│   ├── Integración con Wallets (MetaMask, Phantom, etc.)
│   ├── Smart Contracts (Solidity, Rust)
│   └── Cross-chain Bridge (Futuro)
└── Database Layer (SQLite/PostgreSQL)
    ├── Esquema Relacional (Usuarios, Contratos, Préstamos)
    └── Índices Optimizados para Consultas Financieras
```

## 🚀 **Quick Start**

### Desarrollo Local (Full-Stack)
Se necesitan **dos** terminales para ejecutar el proyecto completo.

```bash
# Clonar el repositorio
git clone https://github.com/AsesorAFT/BitForward.git
cd BitForward

# Instalar dependencias
npm install

# Terminal 1: Iniciar el Servidor Backend
npm run server:dev

# Terminal 2: Iniciar el Servidor Frontend
npm run dev

# Abrir en el navegador
<<<<<<< Updated upstream
open http://localhost:5173/enterprise.html
```

## 📋 **Roadmap 2025**

### ✅ **Q4 2024 - Foundation** (Completado)
- [x] Arquitectura Full-Stack (Frontend, Backend, API).
- [x] Identidad Corporativa "BitForward Financial Technologies".
- [x] Sistema de Autenticación (BiT-ID) con JWT.
- [x] Motor Financiero v1 para Préstamos (Backend).

### 🔥 **Q1 2025 - MVP Launch**
- [ ] Integración de Wallets (MetaMask, Phantom).
- [ ] Despliegue de Smart Contracts en Testnet.
- [ ] Conexión completa del Frontend con el Motor Financiero.
- [ ] Auditorías de seguridad iniciales.
=======
open http://localhost:8080/enterprise.html

# Acceso a la plataforma de préstamos
open http://localhost:8080/lending.html
```

### Demo Credentials para BiT-ID
- **Email Demo**: `demo@bitforward.com`
- **Contraseña**: `BitForward2025!`
- **Registro**: Disponible con validación completa

### Características del Portal BiT-ID
- **Validación de Contraseña**: Mínimo 8 caracteres, mayúsculas, números y símbolos
- **Indicador de Fortaleza**: Visual en tiempo real de seguridad de contraseña
- **Autenticación Social**: UI preparada para Google, GitHub, LinkedIn
- **Sesión Persistente**: Tokens JWT almacenados de forma segura
- **Protección de Rutas**: Acceso limitado a funciones premium sin autenticación

## 📋 **Roadmap 2025**

### ✅ **Q4 2024 - Foundation** (Completado)
- [x] Core engine v2.0
- [x] Multi-blockchain architecture
- [x] Advanced dashboard
- [x] Risk management system
- [x] Portal de Acceso BiT-ID
- [x] Sistema de autenticación JWT
- [x] Plataforma de préstamos DeFi
- [x] Validación de formularios avanzada
- [x] Gestión de sesiones segura

### 🔥 **Q1 2025 - MVP Launch**
- [ ] Mainnet deployment
- [ ] Wallet integrations (MetaMask, Phantom, Hardware wallets)
- [ ] Real blockchain contracts deployment
- [ ] Security audits
- [ ] Backend API para autenticación
- [ ] Integración completa de préstamos on-chain
- [ ] Sistema de liquidación automática
>>>>>>> Stashed changes

### 🚀 **Q2 2025 - Growth**
- [ ] Lanzamiento en Mainnet.
- [ ] Aplicación Móvil (React Native o PWA).
- [ ] Funcionalidades de trading avanzadas.
- [ ] API para clientes institucionales.

### 🌟 **Q3 2025 - Scale**
<<<<<<< Updated upstream
- [ ] Swaps Cross-chain.
- [ ] Mercado de derivados.
- [ ] Token de Gobernanza y DAO.
- [ ] Expansión global.
=======
- [ ] Cross-chain swaps
- [ ] Derivatives marketplace
- [ ] DAO governance token
- [ ] Global expansion

## 💼 **Business Model**

### **Revenue Streams**
1. **Transaction Fees**: 0.5% creation + 0.2% execution
2. **Premium Features**: Advanced analytics, API access
3. **Institutional Services**: White-label solutions
4. **Liquidity Provision**: Market making services

### **Value Proposition**
- **Para Traders**: Herramientas DeFi avanzadas con máxima seguridad
- **Para Instituciones**: Infraestructura enterprise-grade
- **Para Desarrolladores**: APIs robustas y documentación completa
- **Para el Ecosistema**: Innovación en productos financieros descentralizados

## 🛠️ **Tecnologías**

### **Frontend**
- Vanilla JavaScript (Enterprise-grade)
- CSS3 con animaciones avanzadas
- Progressive Web App capabilities
- Real-time WebSocket connections

### **Blockchain**
- **Bitcoin**: Script nativo, SegWit, Taproot
- **Ethereum**: Solidity, EIP-1559, Layer 2 ready
- **Solana**: Rust programs, high throughput

### **Infrastructure**
- Decentralized Oracle Network
- IPFS for data storage
- GraphQL APIs
- Real-time analytics

## 📊 **Métricas del Proyecto**

```
Líneas de Código:     ~3,200 (Optimizado para calidad)
Archivos:             20+ (Arquitectura modular)
Blockchains:          3 (Bitcoin, Ethereum, Solana)
Sistema Auth:         JWT completo con validación
Plataforma Lending:   Préstamos colateralizados DeFi
Test Coverage:        Implementación en curso
Performance Score:    95+ (Lighthouse)
Security Audits:      Planificado Q1 2025
```
>>>>>>> Stashed changes

## 🤝 **Contribuir al Proyecto**

¡Buscamos colaboradores apasionados por DeFi y blockchain!

### **Áreas de Contribución**
- **Development**: Frontend, Smart Contracts, APIs.
- **Security**: Auditorías, penetration testing.
- **Design**: UI/UX, branding.
- **Business**: Estrategia, partnerships, tokenomics.

### **Cómo Contribuir**
1.  Haz un Fork del repositorio.
2.  Crea tu rama de feature (`git checkout -b feature/AmazingFeature`).
3.  Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4.  Haz push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request.

## 📞 **Contacto y Comunidad**

### **Canales Oficiales**
- **GitHub**: [@AsesorAFT/BitForward](https://github.com/AsesorAFT/BitForward)
- **Discussions**: Para ideas y propuestas.
- **Issues**: Para reportes técnicos y bugs.

---

## 🌟 **¡Únete a la Revolución DeFi!**

BitForward no es solo una plataforma, es el futuro de los contratos financieros descentralizados. Estamos construyendo la infraestructura que democratizará el acceso a instrumentos financieros sofisticados.

**¿Listo para ser parte de algo grande?**

---

*Powered by innovation, secured by blockchain, driven by community.*

**AsesorAFT & BitForward Contributors** 🚀