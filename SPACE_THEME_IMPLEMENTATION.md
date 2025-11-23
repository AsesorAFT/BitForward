# BitForward: Implementación del Tema Espacial con Cohetes

## Descripción

Esta guía explica cómo implementar el tema espacial con cohetes en todas las páginas de BitForward. El tema incluye un fondo espacial animado con estrellas, nebulosas, meteoros y cohetes voladores.

## Archivos Creados

1. `/css/space-background.css` - Estilos para el fondo espacial y elementos básicos
2. `/js/space-animations.js` - Animaciones para estrellas y elementos espaciales
3. `/js/rocket-animations.js` - Animaciones específicas para cohetes
4. `/js/rocket-space-theme.js` - Lógica para aplicar el tema a todos los elementos
5. `/js/space-theme-config.js` - Configuración para personalizar el tema
6. `/js/space-theme-loader.js` - Cargador dinámico de recursos

## Implementación en Nuevas Páginas

Para implementar el tema en cualquier página de BitForward, sigue estos pasos:

### 1. Agregar el script de carga en el `<head>` de la página

```html
<!-- Space Theme Loader - Debe ir antes que otros scripts -->
<script src="js/space-theme-loader.js"></script>
```

### 2. Crear los elementos HTML para el fondo espacial (opcional)

El tema crea estos elementos automáticamente, pero puedes personalizarlos:

```html
<div class="space-background">
  <div class="space-nebula nebula-1"></div>
  <div class="space-nebula nebula-2"></div>
  <div class="stars-layer"></div>
  <div class="stardust"></div>
</div>
<div class="space-overlay"></div>
```

### 3. Añadir clases de tema a los elementos

El tema aplica automáticamente las clases apropiadas, pero puedes hacerlo manualmente:

- `space-container` - Para contenedores principales
- `space-card` - Para tarjetas y paneles
- `space-nav` - Para barras de navegación
- `space-nav-link` - Para enlaces de navegación
- `space-table` - Para tablas
- `space-input` - Para campos de entrada
- `space-button` o `rocket-button` - Para botones

### 4. Personalizar la configuración (opcional)

Modifica el archivo `/js/space-theme-config.js` para personalizar:

- Número y comportamiento de estrellas
- Colores del tema
- Frecuencia de meteoros y cohetes voladores
- Habilitar/deshabilitar efectos específicos
- Configuración por tipo de página

## Elementos específicos de cohetes

### Botón estilo cohete:

```html
<button class="rocket-button">Despegar <i class="rocket-icon"></i></button>
```

### Logo animado de cohete:

```html
<img src="assets/logo-rocket-animated.svg" alt="BitForward" class="logo-rocket" />
```

### Lanzar cohetes programáticamente:

```javascript
// Después de que el tema espacial esté cargado
if (window.BitForwardSpace) {
  // Lanzar un cohete que cruza la pantalla
  window.BitForwardSpace.addFlyingRocket({
    size: 40, // tamaño en px
    duration: 5, // duración en segundos
    startPosition: { x: -10, y: 40 }, // posición inicial (%)
    endPosition: { x: 110, y: 20 }, // posición final (%)
  });
}
```

## Configuración por tipo de página

El tema detecta automáticamente el tipo de página y aplica estilos específicos:

- `home` - Página principal con efectos más intensos
- `dashboard` - Paneles con tarjetas y gráficos estilizados
- `lending` - Estilos específicos para la sección de préstamos
- `auth` - Efectos sutiles para páginas de autenticación

## Consideraciones de Accesibilidad y Rendimiento

El tema respeta la preferencia `prefers-reduced-motion` del usuario y se ajusta automáticamente para:

- Reducir o eliminar animaciones cuando el usuario lo prefiere
- Optimizar el rendimiento en dispositivos móviles
- Proporcionar degradado elegante en navegadores no compatibles

## Solución de Problemas

Si los efectos espaciales no aparecen:

1. Verifica que `space-theme-loader.js` esté cargado correctamente
2. Comprueba la consola del navegador para ver errores
3. Asegúrate de que la propiedad `enabled` en `space-theme-config.js` esté en `true`

---

Para más información, contacta al equipo de desarrollo de BitForward.
