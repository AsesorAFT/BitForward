# BitForward DeFi Dashboard

Un dashboard moderno y elegante para gestionar portfolios DeFi con integración completa de Web3.

## 🎨 Características del Diseño

### **Esquema de Colores Moderno**

- **Fondo:** Gradiente azul profundo (#0f0f23 → #1a1a2e → #16213e)
- **Efectos Glassmorphism:** Superficies translúcidas con blur
- **Colores Principales:** Azul vibrante (#3b82f6) con gradientes
- **Acentos:** Verde esmeralda (#10b981) y amarillo dorado (#f59e0b)

### **Efectos Visuales**

- ✨ Glassmorphism con backdrop-filter
- 🌟 Gradientes dinámicos en botones y elementos
- 💫 Animaciones suaves y transiciones
- 🎯 Efectos hover interactivos
- 📱 Diseño completamente responsive

## 🚀 Instalación

```bash
# Navegar al directorio del dashboard
cd dashboard-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Ethers.js v6** para integración Web3
- **CSS Moderno** con variables CSS y efectos glassmorphism

## 📦 Estructura del Proyecto

```
dashboard-app/
├── src/
│   ├── components/
│   │   ├── shared/           # Componentes reutilizables
│   │   │   └── WalletConnect.tsx
│   │   └── dashboard/        # Componentes del dashboard
│   │       ├── PortfolioOverview.tsx
│   │       └── StrategyExecutor.tsx
│   ├── context/
│   │   └── Web3Context.tsx   # Context para Web3
│   ├── hooks/
│   │   └── useWeb3.ts        # Hook personalizado Web3
│   ├── styles/
│   │   └── global.css        # Estilos globales modernos
│   ├── App.tsx               # Componente principal
│   └── main.tsx              # Punto de entrada
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Funcionalidades

### **Conexión de Wallet**

- Conectar/desconectar MetaMask
- Mostrar dirección de wallet
- Detección automática de cambios de cuenta

### **Portfolio Overview**

- Balance de ETH en tiempo real
- Estadísticas del portfolio
- Acciones rápidas (Deposit, Withdraw, Refresh)

### **Strategy Executor**

- 4 estrategias DeFi predefinidas:
  - 🔄 **Hedge Trading** (Medium Risk, 8-15% APY)
  - 🏦 **Yield Farming** (Low Risk, 3-8% APY)
  - 📈 **Leveraged Positions** (High Risk, 15-25% APY)
  - ⚡ **Arbitrage** (Medium Risk, 5-12% APY)

## 🎨 Personalización de Colores

Para cambiar el esquema de colores, edita las variables CSS en `src/styles/global.css`:

```css
:root {
  /* Cambia estos valores para personalizar */
  --background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  --primary: #3b82f6;
  --accent: #10b981;
  --warning: #f59e0b;
  /* ... más variables */
}
```

## 🔧 Configuración de Red

El dashboard está configurado para trabajar con:

- **Red local:** localhost:8545 (Hardhat/Ganache)
- **Testnet:** Configurable en Web3Context
- **Mainnet:** Para producción

## 📱 Responsive Design

El dashboard es completamente responsive con breakpoints optimizados:

- **Desktop:** Grid de 2 columnas
- **Tablet:** Grid adaptativo
- **Mobile:** Columna única con navegación optimizada

## 🚀 Próximos Pasos

1. **Instalar dependencias:** `npm install`
2. **Desarrollo:** `npm run dev`
3. **Conectar wallet:** Usar MetaMask
4. **Explorar:** Interactuar con los componentes

## 📋 Notas Técnicas

- Requiere MetaMask u otro wallet compatible
- Optimizado para redes Ethereum
- Incluye manejo de errores robusto
- TypeScript para mayor seguridad de tipos

---

**¡Disfruta tu nuevo dashboard DeFi con diseño moderno y glassmorphism! 🎉**
