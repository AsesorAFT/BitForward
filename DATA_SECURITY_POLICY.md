# Política de datos de BitForward

## Regla no negociable

GitHub contiene código y documentación técnica; nunca datos de clientes, expedientes, credenciales, estados de cuenta, identificadores personales ni bases de datos operativas.

## Arquitectura prevista

- **Google Drive:** fuente documental inicial, con permisos por rol y expedientes separados.
- **PostgreSQL:** sistema de registro para clientes, oportunidades, ingresos, riesgos y trazabilidad.
- **GitHub:** código, infraestructura declarativa, migraciones y fixtures sintéticos.

## Controles mínimos

1. Bases locales, archivos `.env`, llaves y logs están ignorados por Git.
2. CI valida que no se versionen `node_modules`, bases de datos o claves privadas completas.
3. Las pruebas sólo usan datos sintéticos y bases efímeras.
4. Los secretos se cargan desde el entorno o un gestor de secretos.
5. Cualquier exportación de cliente se concilia fuera del repositorio y con acceso restringido.

## Respuesta ante exposición

Si se detecta información sensible en Git:

1. Retirarla de la rama activa.
2. Revocar o rotar credenciales potencialmente expuestas.
3. Determinar si se requiere reescribir el historial del repositorio.
4. Verificar clones, artefactos y despliegues que pudieran conservar copias.
5. Documentar el incidente y escalarlo a asesoría jurídica o de privacidad cuando corresponda.
