# Roadmap BitForward — julio a octubre de 2026

## Objetivo

Convertir BitForward en un MVP educativo demostrable para incubación, usuarios piloto y futura integración con AFORTU OS, sin custodia, ejecución real ni datos de clientes dentro del repositorio.

## Prioridad dominante

**Confiabilidad antes que expansión:** una narrativa coherente, datos trazables, simulación útil, seguridad de información y calidad verificable.

## Fase 0 — Saneamiento y verdad operativa (0 a 14 días)

- [x] Retirar dependencias y bases de datos versionadas.
- [x] Eliminar claves privadas completas de archivos de ejemplo.
- [x] Publicar sólo el build estático en GitHub Pages.
- [x] Alinear README y estado real del MVP.
- [x] Añadir validación estática, build, lint, formato y smoke tests en CI.
- [ ] Rotar cualquier credencial que haya sido real.
- [ ] Decidir y ejecutar, con respaldo, la limpieza del historial Git.
- [ ] Cerrar o consolidar issues duplicados.

**Criterio de salida:** CI verde, cero bases/credenciales en la rama activa y backlog sin duplicados.

## Fase 1 — MVP educativo coherente (15 a 45 días)

- [x] Unificar navegación, lenguaje visual y accesibilidad en las rutas públicas.
- [x] Separar el sitio público de las vistas operativas del laboratorio.
- [x] Construir simulador de portafolio con BTC 60%, ETH 20%, SOL 10% y ADA 10%.
- [x] Incorporar bandas de rebalanceo de ±5 puntos y revisión mensual.
- [ ] Mostrar fuente, hora y estado de actualización de cada dato de mercado.
- [ ] Añadir gráfica histórica y comparación contra el portafolio modelo.
- [ ] Medir rendimiento y accesibilidad con una línea base reproducible.

**Criterio de salida:** un usuario puede entender la propuesta, simular una asignación y reconocer riesgos sin confundir la demo con una operación real.

## Fase 2 — Piloto controlado e incubación (46 a 90 días)

- [ ] Preparar expediente técnico y narrativa para incubación del IPN.
- [ ] Definir usuarios, problemas, propuesta de valor y modelo de ingresos.
- [ ] Diseñar PostgreSQL como sistema de registro, separado del frontend público.
- [ ] Definir Drive como fuente documental inicial, con permisos por rol.
- [ ] Implementar autenticación, roles, auditoría y ambientes separados.
- [ ] Probar con datos sintéticos y un grupo piloto controlado.
- [ ] Documentar revisión jurídica, de privacidad y ciberseguridad previa a datos reales.

**Criterio de salida:** piloto demostrable, arquitectura aprobada y decisión informada de inversión para la siguiente etapa.

## Fuera de alcance hasta nueva aprobación

- Mainnet, custodia o movimientos de capital real.
- DAO, token BFWD, staking o incentivos financieros.
- Derivados, apalancamiento, opciones, futuros o liquidaciones automáticas.
- Predicciones presentadas como certezas o recomendaciones automáticas.
- Carga de expedientes, CURP, estados de cuenta o información identificable en GitHub.

## Indicadores

| Tipo       | Indicador                                                   |     Meta de fase |
| ---------- | ----------------------------------------------------------- | ---------------: |
| Adelantado | PR con CI completa                                          |             100% |
| Adelantado | Issues P0/P1 con responsable y criterio de aceptación       |             100% |
| Riesgo     | Bases, llaves o datos identificables versionados            |                0 |
| Producto   | Rutas públicas marcadas como real, simulación o laboratorio |             100% |
| Calidad    | Errores críticos de accesibilidad en landing                |                0 |
| Resultado  | Usuarios piloto que completan la simulación sin ayuda       | Medir línea base |

## Decisión de arquitectura

BitForward se mantiene como módulo especializado de activos digitales. AFORTU OS será la capa superior para clientes, expedientes, oportunidades, ingresos, riesgos y aprendizaje. Compartirán contratos de integración; no mezclarán datos operativos con el repositorio público.
