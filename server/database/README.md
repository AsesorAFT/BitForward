# Base de datos local

Este directorio contiene únicamente código de configuración y migración. Las bases SQLite se generan de forma local y están excluidas por `.gitignore`.

Reglas:

- No subir bases `.db`, `.sqlite` o `.sqlite3`.
- No usar datos de clientes como fixtures de desarrollo o pruebas.
- Usar datos sintéticos y efímeros en CI.
- En producción, la persistencia debe vivir fuera del repositorio y usar secretos del entorno.

Para crear una base local vacía:

```bash
npm run db:setup
```
