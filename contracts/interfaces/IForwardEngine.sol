// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IForwardEngine
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Interface para el motor de contratos forward de BitForward
 * @notice Gestiona creación, ejecución y liquidación de forwards descentralizados
 */
interface IForwardEngine {
    
    /**
     * @dev Estructura completa de un contrato forward
     * @param id ID único del contrato
     * @param user Dirección del usuario (trader)
     * @param collateralAmount Colateral depositado en tokens base
     * @param notionalUSD Valor nocional en USD (8 decimales)
     * @param entryPrice Precio BTC/USD al momento de apertura (8 decimales)
     * @param targetPrice Precio objetivo para ejecución automática (opcional)
     * @param expiryTimestamp Timestamp Unix de vencimiento
     * @param leverageRatio Apalancamiento usado (ej: 2x = 200, máx 1000 = 10x)
     * @param isLong true para posición larga, false para corta
     * @param status Estado actual del contrato
     * @param createdAt Timestamp de creación
     * @param executedAt Timestamp de ejecución (0 si no ejecutado)
     */
    struct ForwardContract {
        uint256 id;
        address user;
        uint256 collateralAmount;
        uint256 notionalUSD;
        uint256 entryPrice;
        uint256 targetPrice;
        uint256 expiryTimestamp;
        uint256 leverageRatio;
        bool isLong;
        ForwardStatus status;
        uint256 createdAt;
        uint256 executedAt;
    }
    
    /**
     * @dev Estados posibles de un contrato forward
     */
    enum ForwardStatus {
        ACTIVE,      // Contrato activo, en espera
        EXECUTED,    // Ejecutado exitosamente
        LIQUIDATED,  // Liquidado por bajo colateral
        EXPIRED,     // Vencido sin ejecución
        CANCELLED    // Cancelado por el usuario
    }
    
    /**
     * @dev Estructura para configuración de riesgo
     * @param minCollateralRatio Ratio mínimo de colateral (basis points)
     * @param liquidationThreshold Umbral de liquidación (basis points)
     * @param maxLeverage Apalancamiento máximo permitido
     * @param maxNotionalPerUser Exposición máxima por usuario (USD)
     * @param protocolFee Comisión del protocolo (basis points)
     */
    struct RiskConfig {
        uint256 minCollateralRatio;
        uint256 liquidationThreshold;
        uint256 maxLeverage;
        uint256 maxNotionalPerUser;
        uint256 protocolFee;
    }
    
    /**
     * @dev Abre un nuevo contrato forward
     * @param collateral Cantidad de colateral a depositar
     * @param notionalUSD Valor nocional del contrato en USD
     * @param expiry Timestamp de vencimiento
     * @param leverage Apalancamiento deseado (100 = 1x, 200 = 2x, etc.)
     * @param isLong true para posición larga, false para corta
     * @param targetPrice Precio objetivo para ejecución automática (0 para manual)
     * @return forwardId ID del contrato creado
     */
    function openForward(
        uint256 collateral,
        uint256 notionalUSD,
        uint256 expiry,
        uint256 leverage,
        bool isLong,
        uint256 targetPrice
    ) external returns (uint256 forwardId);
    
    /**
     * @dev Ejecuta un contrato forward manualmente
     * @param forwardId ID del contrato a ejecutar
     * @return pnl Ganancia/pérdida realizada (puede ser negativo)
     */
    function executeForward(uint256 forwardId) external returns (int256 pnl);
    
    /**
     * @dev Liquida un contrato sub-colateralizado
     * @param forwardId ID del contrato a liquidar
     * @return liquidationReward Recompensa para el liquidador
     */
    function liquidateForward(uint256 forwardId) external returns (uint256 liquidationReward);
    
    /**
     * @dev Cierra una posición antes del vencimiento
     * @param forwardId ID del contrato a cerrar
     * @return pnl Ganancia/pérdida realizada
     */
    function closePosition(uint256 forwardId) external returns (int256 pnl);
    
    /**
     * @dev Obtiene información completa de un contrato
     * @param forwardId ID del contrato
     * @return forward Estructura completa del contrato
     */
    function getForward(uint256 forwardId) external view returns (ForwardContract memory forward);
    
    /**
     * @dev Calcula el PnL actual de un contrato
     * @param forwardId ID del contrato
     * @return currentPnl Ganancia/pérdida no realizada actual
     */
    function calculatePnL(uint256 forwardId) external view returns (int256 currentPnl);
    
    /**
     * @dev Verifica si un contrato es liquidable
     * @param forwardId ID del contrato
     * @return isLiquidable true si el contrato puede ser liquidado
     * @return healthRatio Ratio de salud actual (basis points)
     */
    function isLiquidable(uint256 forwardId) external view returns (bool isLiquidable, uint256 healthRatio);
    
    /**
     * @dev Obtiene todos los contratos activos de un usuario
     * @param user Dirección del usuario
     * @return forwardIds Array de IDs de contratos activos
     */
    function getUserActiveForwards(address user) external view returns (uint256[] memory forwardIds);
    
    /**
     * @dev Obtiene la configuración de riesgo actual
     * @return config Estructura con todos los parámetros de riesgo
     */
    function getRiskConfig() external view returns (RiskConfig memory config);
    
    /**
     * @dev Obtiene estadísticas globales del protocolo
     * @return totalValueLocked TVL total en USD
     * @return activeContracts Número de contratos activos
     * @return totalVolume Volumen total histórico
     */
    function getProtocolStats() external view returns (
        uint256 totalValueLocked,
        uint256 activeContracts,
        uint256 totalVolume
    );
    
    // ========== EVENTOS ==========
    
    /**
     * @dev Emitido cuando se crea un nuevo forward
     */
    event ForwardOpened(
        uint256 indexed forwardId,
        address indexed user,
        uint256 collateral,
        uint256 notionalUSD,
        uint256 entryPrice,
        uint256 expiry,
        bool isLong,
        uint256 leverage
    );
    
    /**
     * @dev Emitido cuando se ejecuta un forward
     */
    event ForwardExecuted(
        uint256 indexed forwardId,
        address indexed user,
        int256 pnl,
        uint256 exitPrice,
        uint256 executedAt
    );
    
    /**
     * @dev Emitido cuando se liquida un forward
     */
    event ForwardLiquidated(
        uint256 indexed forwardId,
        address indexed user,
        address indexed liquidator,
        uint256 liquidationPrice,
        uint256 liquidatorReward
    );
    
    /**
     * @dev Emitido cuando se cierra una posición
     */
    event PositionClosed(
        uint256 indexed forwardId,
        address indexed user,
        int256 pnl,
        uint256 closePrice
    );
    
    /**
     * @dev Emitido cuando se actualiza la configuración de riesgo
     */
    event RiskConfigUpdated(
        uint256 minCollateralRatio,
        uint256 liquidationThreshold,
        uint256 maxLeverage,
        uint256 protocolFee
    );
}
