# Wallet propia · primera etapa de BitForward

Fecha: 30 de octubre de 2026.

## Implementado en esta entrega

La plataforma puede consultar una wallet EVM del navegador elegida por el usuario. No crea una wallet, no recibe fondos ni solicita claves, frases, firmas o aprobaciones de gasto. Las claves y las decisiones de compartir la dirección permanecen en la extensión o aplicación de wallet.

La selección usa EIP-6963 y un fallback EIP-1193, únicamente tras pulsar “Elegir mi wallet”. Autorizar la dirección no es autenticar una identidad de AFORTU. El nombre anunciado por la extensión no acredita su identidad; no se ejecutan sus iconos ni su HTML.

La conexión conserva dirección y lecturas exclusivamente en memoria. Se pierde al recargar o salir; no se incluye en descargas, registros demo, localStorage ni sessionStorage. Desconectar limpia la sesión local y los listeners; retirar el permiso del sitio se hace en la propia wallet.

Métodos permitidos: `eth_requestAccounts` tras consentimiento; `eth_accounts`, `eth_chainId`, `eth_blockNumber`, `eth_getBalance` para consulta. El saldo nativo se lee en un bloque concreto y se comprueban otra vez cuenta y red antes de mostrarlo. Cambiar de red/cuenta, revocar permisos o desconectar invalida respuestas en curso. Los importes se manejan con BigInt y no como números de coma flotante. Una lectura fallida no conserva un saldo presentado como actual.

Redes de consulta: Ethereum, Base, Arbitrum One, Optimism, Polygon, BNB Smart Chain, Avalanche C-Chain y Sepolia. No se cambia ni se añade una red automáticamente. No hay balances ERC-20, valoración en pesos, órdenes, swaps, retiros ni sincronización entre dispositivos. La página consulta a través de la wallet, cuyo proveedor RPC atiende las peticiones. La app no sube las direcciones a un backend propio.

## Separación de desarrollo, publicación y firma

1. Desarrollo: checkout y rama de revisión, fixtures sintéticos; ninguna clave de firma o fondos para el agente de código. Las pruebas usan un proveedor simulado.
2. Publicación: build aislado `vite.platform.config.mjs`. Incluye solo plataforma, demo y documentos enumerados, sin servidor histórico, claves ni datos de AFORTU. Sites conserva acceso privado. El workflow de PR tiene `contents: read`, no secretos de ejecución ni permiso de despliegue.
3. Firma: no existe en este bundle. El adaptador expone conectar, consultar y desconectar; no un método RPC arbitrario. El control de build rechaza rutas conocidas de envío/firma. Estos controles reducen errores de integración, no protegen contra una extensión maliciosa o un atacante con control total del frontend.

La CSP limita scripts y conexiones de la página al mismo origen. No sustituye la revisión de dependencias, del proveedor de wallet ni de futuras transacciones. La política de revisión protegida del repositorio y la aprobación de un publicador distinto no se han configurado en GitHub en esta entrega; requieren definir responsables. No se afirma que exista ya separación organizativa de poderes.

## Próxima etapa antes de manejar fondos

- Elegir una red de pruebas y verificar contratos por dirección y chain ID, no por símbolo; BTW y sus mercados conservan su clasificación independiente.
- Construir un intento de operación con red, contrato, método, destinatario, importe exacto, mínimo de salida, comisión y caducidad. Cualquier cambio invalida su revisión.
- Simular en la red, mostrar los efectos y comprobar otra vez cuenta/red/importe antes de solicitar una firma en la wallet. Sin aprobaciones ilimitadas por defecto.
- Verificar recibo, confirmaciones y fallos; no declarar una compra completada por recibir solamente un hash.
- Probar en testnet. La habilitación de proveedores, contratos y ejecución real necesita una entrega y revisión separadas. No reutilizar credenciales de publicación como credenciales de firma.

## Evidencia y fuentes

- `tests/wallet-session.test.mjs`: cancelación, precisión, red no soportada, revocación, respuestas tardías, cambio de cuenta/red, timeout y limpieza.
- `tests/wallet.browser.mjs`: consentimiento, escaping del proveedor, navegación, aislamiento demo, ausencia de persistencia y de peticiones externas de la página.
- `scripts/check-platform-wallet.mjs`: comprobación de fronteras del bundle.
- EIP-1193: https://eips.ethereum.org/EIPS/eip-1193
- EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
