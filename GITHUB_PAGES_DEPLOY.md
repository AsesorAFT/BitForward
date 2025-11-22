# Instrucciones para Publicar en GitHub Pages

Sigue estos pasos para publicar el proyecto BitForward en GitHub Pages:

## 1. Preparación del Repositorio

1. Asegúrate de que tienes un repositorio llamado `BitForward` en tu cuenta de GitHub (@AsesorAFT)
2. Si no lo tienes, créalo desde la interfaz de GitHub como repositorio público

## 2. Inicializar Git en el Proyecto Local (si no está inicializado)

```bash
cd /Volumes/mac/BitForward
git init
git add .
git commit -m "Proyecto BitForward inicial"
```

## 3. Conectar el Repositorio Local al Remoto

```bash
git remote add origin https://github.com/AsesorAFT/BitForward.git
```

## 4. Subir los Cambios al Repositorio

```bash
git push -u origin main
```

## 5. Configurar GitHub Pages

1. Ve a la configuración del repositorio en GitHub (Settings)
2. Desplázate hacia abajo hasta encontrar la sección "GitHub Pages"
3. En "Source", selecciona la rama "main" y la carpeta raíz "/ (root)"
4. Haz clic en "Save"
5. GitHub te proporcionará un enlace donde se publicará tu sitio (https://asesoraft.github.io/BitForward/)

## 6. Actualizar el Proyecto en el Futuro

Para actualizar el proyecto en el futuro, simplemente realiza cambios en tu repositorio local y súbelos:

```bash
git add .
git commit -m "Descripción de los cambios realizados"
git push origin main
```

Los cambios se reflejarán automáticamente en GitHub Pages después de unos minutos.

## 7. Verificar Despliegue

Visita https://asesoraft.github.io/BitForward/ para asegurarte de que el sitio se ha desplegado correctamente.

## Notas Importantes

- GitHub Pages tiene algunas limitaciones. No soporta backend ni bases de datos.
- Para funcionalidades del lado del servidor, considera usar servicios como Firebase, AWS, o un servidor propio.
- Los archivos grandes (>100MB) no son permitidos en GitHub. Considera usar Git LFS para archivos grandes.
