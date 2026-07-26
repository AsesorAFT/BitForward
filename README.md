# BitForward

**Experiencia pública educativa de activos digitales de AFORTU.**

BitForward Mission Control presenta un marco visual para documentar contexto, límites, telemetría
ilustrativa y decisiones. La versión publicada en GitHub Pages es deliberadamente inerte: permite
recorrer la experiencia sin crear cuentas, guardar datos, conectar wallets, recibir dinero o
ejecutar operaciones.

> Estado al 26 de julio de 2026: **versión pública educativa en validación**. No es una plataforma
> transaccional, custodial ni un sistema autorizado para operar dinero de clientes.

## Qué funciona en la versión pública

- Cockpit navegable con nueve módulos: inicio, perfil, plan, telemetría, bitácora, Navigator, Torre
  AFORTU, privacidad y pagos en configuración.
- Datos sintéticos e ilustrativos que no corresponden a una persona, cuenta o portafolio real.
- Prueba de estrés determinista con escenarios de caída de 20%, 40% y 60%.
- Reporte ilustrativo imprimible desde Torre AFORTU.
- Navegación responsive desde 320 px, controles de teclado y reducción de movimiento.
- Guardas estáticas que impiden formularios, persistencia, conexiones de cartera, pagos y llamadas
  a APIs.

## Qué no hace

- No autentica usuarios ni abre cuentas.
- No solicita nombres, correos, contraseñas, frases semilla, direcciones o datos bancarios.
- No consulta balances, precios o portafolios reales.
- No compra, vende, rebalancea, custodia ni transfiere activos.
- No emite recomendaciones individualizadas ni promete rendimientos.
- No procesa cobros o suscripciones; el módulo de pagos permanece **en configuración**.

## Separación público–privado

BitForward mantiene dos superficies con responsabilidades distintas:

```text
GitHub Pages
└── Experiencia pública educativa
    ├── Interfaz y narrativa seleccionadas
    ├── Datos sintéticos
    └── Cero persistencia u operación

Núcleo privado de AFORTU
└── Cockpit protegido
    ├── Autenticación y permisos
    ├── Datos, expedientes y trazabilidad
    └── Lógica operativa no publicada
```

El núcleo privado, sus datos, motores, endpoints y metodología confidencial no forman parte de este
repositorio. La sincronización permitida es selectiva y unidireccional: sólo componentes visuales,
copy aprobado y fixtures sintéticos pueden trasladarse a la experiencia pública.

## Gobierno y frontera pública

La experiencia identifica únicamente a AFORTU como institución. La representación profesional,
los responsables, los alcances y las acreditaciones aplicables se documentan en los instrumentos
contractuales y expedientes internos correspondientes; esta superficie pública no expone datos
personales del equipo.

## Desarrollo local

Requisitos declarados por el proyecto: Node.js 20–22 y npm 10 o superior.

```bash
git clone https://github.com/AsesorAFT/BitForward.git
cd BitForward
npm ci
npm run dev
```

Verificaciones principales:

```bash
npm run lint
npm run format:check
npm run verify:static
npm run build
npm run smoke:pages
```

GitHub Pages publica únicamente el resultado de `npm run build`. No publica el servidor
experimental, archivos de entorno ni datos locales.

## Seguridad de datos

GitHub no es un sistema para información de clientes. Bases, credenciales, llaves, expedientes y
exportaciones deben permanecer fuera del repositorio. Consulta
[DATA_SECURITY_POLICY.md](DATA_SECURITY_POLICY.md).

## Despliegues

- Sitio público: [asesoraft.github.io/BitForward](https://asesoraft.github.io/BitForward/)
- Repositorio: [github.com/AsesorAFT/BitForward](https://github.com/AsesorAFT/BitForward)

## Aviso

BitForward presenta información educativa y escenarios ilustrativos. No constituye oferta pública,
intermediación, custodia, garantía de rendimiento ni recomendación individual. Los activos
digitales implican riesgo elevado de pérdida.

---

BitForward by AFORTU.
