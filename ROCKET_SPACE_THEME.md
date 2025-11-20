# BitForward Rocket Space Theme

![BitForward Logo](assets/logo-rocket-animated.svg)

## Visión General

El tema espacial con cohetes para BitForward es una experiencia visual inmersiva que combina:

- Fondos espaciales con estrellas y nebulosas animadas
- Cohetes interactivos y animados que responden a las acciones del usuario
- Elementos de interfaz estilizados con efectos espaciales
- Animaciones suaves y efectos de paralaje para una experiencia fluida

## Características Principales

### 1. Fondo Espacial Dinámico

- Estrellas que parpadean con diferentes tamaños y brillos
- Nebulosas distantes con movimientos sutiles
- Polvo estelar y efecto de profundidad
- Meteoros ocasionales que cruzan la pantalla

### 2. Elementos de Cohete

- Logo de cohete animado en la navegación
- Botones estilo cohete con efectos de propulsión
- Cohetes voladores que aparecen en momentos clave
- Indicadores de progreso y carga con estilo de cohete

### 3. Componentes de UI Espaciales

- Tarjetas con efectos de brillo estelar
- Tablas estilizadas con gradientes espaciales
- Formularios con campos de entrada espaciales
- Navegación con efectos de desplazamiento entre planetarios

### 4. Optimización de Rendimiento

- Carga progresiva y bajo demanda de recursos
- Detección de preferencias de reducción de movimiento
- Optimización para dispositivos móviles y conexiones lentas
- Degradado elegante para navegadores antiguos

## Estructura de Archivos

```
BitForward/
├── css/
│   ├── space-background.css - Estilos para el fondo espacial
│   └── rocket-theme.css - Estilos para elementos de cohete y UI
├── js/
│   ├── space-animations.js - Animaciones de estrellas y elementos espaciales
│   ├── rocket-animations.js - Animaciones específicas para cohetes
│   ├── rocket-space-theme.js - Aplicación del tema a elementos DOM
│   ├── space-theme-config.js - Configuración personalizable
│   └── space-theme-loader.js - Cargador dinámico de recursos
└── assets/
    └── logo-rocket-animated.svg - Logo de cohete animado
```

## Implementación

### Instrucciones para desarrolladores

1. Incluir el script loader en el head de cada página
2. Aplicar las clases específicas del tema a los elementos correspondientes
3. Utilizar las funciones de animación para eventos específicos

Consulta `SPACE_THEME_IMPLEMENTATION.md` para instrucciones detalladas.

### Personalización

El tema es altamente personalizable a través del archivo `space-theme-config.js`:

```javascript
// Ejemplo de personalización
SPACE_THEME_CONFIG.effects.stars.count = 200; // Más estrellas
SPACE_THEME_CONFIG.effects.meteors.frequency = 5000; // Meteoros más frecuentes
SPACE_THEME_CONFIG.colors.primary = '#00aaff'; // Cambiar color principal
```

## Compatibilidad

- Navegadores modernos: Chrome, Firefox, Safari, Edge
- Dispositivos: Escritorio, tableta y móvil
- Accesibilidad: Respeta preferencias de reducción de movimiento

## Ejemplos

### HTML Básico con Tema Espacial

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BitForward | Tema Espacial</title>
    <script src="js/space-theme-loader.js"></script>
  </head>
  <body>
    <header class="space-nav">
      <div class="container">
        <img src="assets/logo-rocket-animated.svg" class="logo-rocket" alt="BitForward" />
        <nav>
          <a href="#" class="space-nav-link">Inicio</a>
          <a href="#" class="space-nav-link">Dashboard</a>
          <a href="#" class="space-nav-link">Préstamos</a>
        </nav>
      </div>
    </header>

    <main>
      <section class="space-container">
        <h1>Despegando en el Mundo DeFi 🚀</h1>
        <p>Contenido con tema espacial...</p>
        <button class="rocket-button">¡Despegar!</button>
      </section>
    </main>

    <script>
      // Lanzar un cohete cuando se hace clic en el botón
      document.querySelector('.rocket-button').addEventListener('click', function () {
        if (window.BitForwardSpace) {
          window.BitForwardSpace.addFlyingRocket();
        }
      });
    </script>
  </body>
</html>
```

## Créditos

Desarrollado por el equipo de BitForward para el Proyecto Fénix.

---

Para más información, contacta al equipo de desarrollo de BitForward.
