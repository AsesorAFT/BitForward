# 🏛️ Búnker de Datos Persistente - BitForward v2.0

## 🚀 Inicio Rápido con Persistencia SQLite

¡Bienvenido al nuevo **Búnker de Datos Persistente** de BitForward! Tu plataforma DeFi ahora cuenta con memoria permanente y robustez empresarial.

### 📋 Pre-requisitos

- **Node.js** v16+ 
- **npm** v8+
- Terminal/Consola

### ⚡ Instalación y Configuración (Una sola vez)

```bash
# 1. Instalar las nuevas dependencias del búnker
npm install

# 2. Construir el búnker de datos (crear base de datos SQLite)
npm run db:setup

# 3. ¡Listo! Tu búnker está construido 🎯
```

### 🎮 Comandos de Operación

#### Desarrollo Local
```bash
# Iniciar el servidor backend con persistencia
npm run server:dev

# En otra terminal: servir el frontend
npm run frontend
```

#### Comandos de Base de Datos
```bash
# Configurar la base de datos por primera vez
npm run db:setup

# Resetear completamente la base de datos
npm run db:reset

# Ver el estado de la base de datos
npm run server:dev
```

### 🌐 URLs de Acceso

Una vez iniciado el servidor:

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **API Info**: http://localhost:3000/api

### 🏗️ Arquitectura del Búnker

```
BitForward/
├── server/
│   ├── database/
│   │   ├── config.js          # Configuración de SQLite
│   │   ├── setup.js           # Constructor del búnker
│   │   └── bitforward.sqlite3 # TU BASE DE DATOS (auto-generada)
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación (SQLite)
│   │   ├── contracts.js      # Rutas de contratos (SQLite)
│   │   └── lending.js        # Rutas de préstamos (SQLite)
│   └── server.js             # Servidor principal
├── js/
│   ├── auth.js               # Frontend auth integrado
│   └── dashboard.js          # Dashboard empresarial
└── enterprise.html           # Interfaz principal
```

### 💾 Estructura de la Base de Datos

El búnker incluye 5 tablas principales:

1. **`users`** - Usuarios con autenticación
2. **`contracts`** - Contratos forward con métricas
3. **`loans`** - Préstamos con colateral
4. **`transactions`** - Historial auditable
5. **`system_config`** - Configuración del sistema

### 🔒 Características de Seguridad

- ✅ **Passwords hasheados** con bcryptjs (salt de 12 rounds)
- ✅ **JWT tokens** seguros para sesiones
- ✅ **Validación de datos** robusta
- ✅ **Base de datos transaccional** con integridad referencial
- ✅ **Logs de auditoría** para todas las operaciones

### 📊 Funcionalidades Principales

#### Autenticación
- Registro de usuarios con validación
- Login seguro con JWT
- Verificación de sesiones
- Profiles de usuario persistentes

#### Contratos Forward
- Creación de contratos con múltiples activos
- Cálculo automático de P&L
- Métricas de vencimiento
- Historial de transacciones

#### Plataforma de Préstamos
- Préstamos con colateral múltiple
- Cálculo de LTV dinámico
- Gestión de riesgos
- APR competitivos

### 🛠️ Comandos de Mantenimiento

```bash
# Ver logs del servidor
npm run server:dev

# Verificar estado de la base de datos
curl http://localhost:3000/api/health

# Backup de la base de datos
cp server/database/bitforward.sqlite3 backup-$(date +%Y%m%d).sqlite3

# Explorar la base de datos (opcional - requiere sqlite3)
sqlite3 server/database/bitforward.sqlite3
```

### 🔧 Solución de Problemas

#### Error: "Base de datos no inicializada"
```bash
npm run db:setup
```

#### Error: "Puerto 3000 en uso"
```bash
# Cambiar puerto en server/server.js línea:
this.port = process.env.PORT || 3001;  # Cambiar a 3001
```

#### Error: "No se puede conectar a la API"
```bash
# Verificar que el backend esté corriendo
npm run server:dev

# Verificar la URL en js/auth.js
const API_BASE_URL = 'http://localhost:3000/api';
```

### 📈 Próximos Pasos

1. **Registro de Usuario**: Crea tu primera cuenta en la plataforma
2. **Crear Contrato**: Establece tu primer contrato forward
3. **Explorar Préstamos**: Solicita liquidez usando cripto colateral
4. **Monitorear Dashboard**: Observa tus métricas en tiempo real

### 🎯 Ventajas del Búnker de Datos

| Antes (Memoria) | Ahora (Búnker SQLite) |
|-----------------|----------------------|
| ❌ Datos volátiles | ✅ Persistencia permanente |
| ❌ Reinicio = pérdida total | ✅ Datos sobreviven reinicios |
| ❌ Sin auditoría | ✅ Historial completo |
| ❌ Sin métricas históricas | ✅ Analytics temporales |
| ❌ Prototipo demo | ✅ Aplicación empresarial |

### 📞 Soporte

Si encuentras algún problema:

1. Revisa que hayas ejecutado `npm run db:setup`
2. Verifica que el puerto 3000 esté disponible
3. Consulta los logs del servidor para errores específicos
4. Asegúrate de tener permisos de escritura en el directorio

---

**🎉 ¡Felicidades! Tu plataforma BitForward ahora es permanente y robusta**

Cada usuario, contrato y transacción queda grabado para siempre en tu búnker de datos SQLite local.
