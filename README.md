# BitForward: Construyendo el futuro de los acuerdos financieros

BitForward es una plataforma de contratos inteligentes multi-cadena diseñada para crear y ejecutar contratos forward sobre activos digitales.

## Visión General

Nuestra misión es ofrecer a individuos y empresas una plataforma segura, transparente y fácil de usar, protegiendo el valor de sus acuerdos futuros con la robustez de redes descentralizadas como Bitcoin y cadenas compatibles con EVM/Solana.

## Modos de Contrato

BitForward operará a través de dos modos principales:

### 1. Custodial Fijo (Multisig 2-de-2 con Timelock)

Este modo está diseñado para acuerdos donde el activo se mantiene en custodia hasta el cumplimiento del contrato, requiriendo la firma de ambas partes.

*   **En Bitcoin:** Utiliza una multifirma (multisig) 2-de-2 con un bloqueo temporal (`timelock`) que permite la devolución de fondos si el acuerdo no se completa en el plazo estipulado.
*   **En Solana/EVM:** Implementa un contrato de `escrow` para tokens como USDT (SPL en Solana o ERC-20 en EVM). La liberación de los fondos requiere la firma de ambas partes, con una opción de reembolso automático tras un periodo de vencimiento.

### 2. Referencial (Precio a Futuro)

Este modo permite a las partes acordar un precio a futuro para un activo, liquidando la diferencia en base a un precio de referencia proporcionado por un oráculo.

*   **En Bitcoin:** Se implementa mediante **Contratos de Registro Discreto (DLCs)**. Ambas partes bloquean colateral en BTC, y un oráculo de confianza firma la transacción final, distribuyendo los fondos según el precio del activo al vencimiento.
*   **En Solana/EVM:** Se utiliza un contrato inteligente que consulta un oráculo de precios como [Chainlink](https://chain.link/) para obtener el precio de BTC/USD al vencimiento. El contrato liquida automáticamente la posición en USDT.

## Arquitectura Técnica

La plataforma se compondrá de los siguientes elementos:

*   **Lógica On-Chain:**
    *   Scripts de Bitcoin y DLCs para las operaciones en la red Bitcoin.
    *   Programas en Solana (escritos en Rust) y Contratos Inteligentes en Solidity para cadenas EVM.
*   **Backend:** Un servicio para coordinar la creación de transacciones (PSBTs en Bitcoin), gestionar los feeds de precios de los oráculos y facilitar la comunicación y coordinación de firmas entre las partes.
*   **Frontend:** Una dApp (Aplicación Descentralizada) que permite a los usuarios crear, gestionar y visualizar sus contratos de forma intuitiva.

## Hoja de Ruta del MVP (Producto Mínimo Viable)

El desarrollo se abordará en dos fases principales:

1.  **Fase 1: Lanzamiento del Modo Custodial**
    *   Implementar y lanzar el contrato custodial 2-de-2 en Bitcoin.
    *   Implementar y lanzar el contrato de escrow en Solana/EVM para USDT.
2.  **Fase 2: Integración del Modo Referencial**
    *   Añadir soporte para contratos referenciales (futuros) utilizando DLCs en Bitcoin y oráculos en Solana/EVM.

## Riesgos Clave

Se han identificado los siguientes riesgos a gestionar:

*   **Regulatorio:** La naturaleza de los contratos referenciales puede estar sujeta a la regulación de derivados financieros.
*   **Seguridad de Oráculos:** La integridad del sistema referencial depende de la fiabilidad y resistencia a la manipulación de los oráculos de precios.
*   **Experiencia de Usuario (UX):** La gestión de llaves privadas y la firma de transacciones (especialmente con PSBTs) debe ser lo más sencilla y segura posible para el usuario final.
