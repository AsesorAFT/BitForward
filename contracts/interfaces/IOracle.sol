// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOracle
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Interface para oráculos de precios siguiendo estándares de Chainlink
 * @notice Esta interfaz abstrae la fuente de precios para máxima flexibilidad
 */
interface IOracle {
    
    /**
     * @dev Estructura para datos de precio con metadatos de confiabilidad
     * @param price Precio en USD con 8 decimales (ej: $70,000 = 7000000000000)
     * @param timestamp Timestamp Unix de la última actualización
     * @param confidence Nivel de confianza del precio (basis points, 10000 = 100%)
     */
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence;
    }
    
    /**
     * @dev Obtiene el precio más reciente con validaciones de staleness
     * @return price Precio actual en USD con 8 decimales
     * @notice Revierte si el precio está desactualizado (>1 hora)
     */
    function getLatestPrice() external view returns (uint256 price);
    
    /**
     * @dev Obtiene datos completos de precio con metadatos
     * @return priceData Estructura completa con precio, timestamp y confianza
     */
    function getLatestPriceData() external view returns (PriceData memory priceData);
    
    /**
     * @dev Verifica si el oráculo está operativo y los datos son confiables
     * @return isHealthy true si el oráculo funciona correctamente
     */
    function isHealthy() external view returns (bool isHealthy);
    
    /**
     * @dev Obtiene el número de decimales usado por el oráculo
     * @return decimals Número de decimales (típicamente 8 para precios USD)
     */
    function decimals() external view returns (uint8 decimals);
    
    /**
     * @dev Emitido cuando se actualiza un precio
     * @param asset Identificador del activo (ej: "BTC/USD")
     * @param price Nuevo precio
     * @param timestamp Momento de la actualización
     */
    event PriceUpdated(
        string indexed asset,
        uint256 price,
        uint256 timestamp
    );
}
