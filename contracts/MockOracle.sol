// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracle.sol";

/**
 * @title MockOracle
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Oráculo mock para testing y desarrollo
 * @notice En producción debe ser reemplazado por Chainlink o Redstone
 * 
 * ADVERTENCIA: Este contrato es solo para testing y desarrollo.
 * NO usar en producción. Los precios pueden ser manipulados por el owner.
 */
contract MockOracle is IOracle, Ownable {
    
    // ========== VARIABLES DE ESTADO ==========
    
    PriceData private latestPriceData;
    uint8 private constant DECIMALS = 8;
    string private constant ASSET_PAIR = "BTC/USD";
    
    /// @dev Staleness threshold (1 hora)
    uint256 public constant STALENESS_THRESHOLD = 3600;
    
    /// @dev Flag para simular oracle down
    bool public isDown;
    
    // ========== EVENTOS ==========
    
    event MockPriceSet(uint256 price, uint256 confidence);
    event OracleStatusChanged(bool isDown);
    
    // ========== CONSTRUCTOR ==========
    
    constructor() {
        // Configurar precio inicial: $67,000 BTC
        latestPriceData = PriceData({
            price: 67000 * 10**DECIMALS,
            timestamp: block.timestamp,
            confidence: 10000 // 100% confidence
        });
        
        emit MockPriceSet(latestPriceData.price, latestPriceData.confidence);
    }
    
    // ========== FUNCIONES PÚBLICAS ==========
    
    /**
     * @inheritdoc IOracle
     */
    function getLatestPrice() external view override returns (uint256 price) {
        require(!isDown, "Oracle is down");
        require(_isPriceValid(), "Price data is stale");
        return latestPriceData.price;
    }
    
    /**
     * @inheritdoc IOracle
     */
    function getLatestPriceData() external view override returns (PriceData memory) {
        require(!isDown, "Oracle is down");
        require(_isPriceValid(), "Price data is stale");
        return latestPriceData;
    }
    
    /**
     * @inheritdoc IOracle
     */
    function isHealthy() external view override returns (bool) {
        return !isDown && _isPriceValid() && latestPriceData.confidence >= 8000; // Min 80% confidence
    }
    
    /**
     * @inheritdoc IOracle
     */
    function decimals() external pure override returns (uint8) {
        return DECIMALS;
    }
    
    // ========== FUNCIONES DE TESTING ==========
    
    /**
     * @dev Establece un nuevo precio (solo para testing)
     * @param price Nuevo precio en USD con 8 decimales
     * @param confidence Nivel de confianza (basis points)
     */
    function setPrice(uint256 price, uint256 confidence) external onlyOwner {
        require(price > 0, "Invalid price");
        require(confidence <= 10000, "Invalid confidence");
        
        latestPriceData = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence
        });
        
        emit PriceUpdated(ASSET_PAIR, price, block.timestamp);
        emit MockPriceSet(price, confidence);
    }
    
    /**
     * @dev Simula movimiento de precio basado en volatilidad
     * @param volatilityBps Volatilidad en basis points (ej: 500 = 5%)
     * @param isPositive true para movimiento positivo, false para negativo
     */
    function simulatePriceMovement(uint256 volatilityBps, bool isPositive) external onlyOwner {
        require(volatilityBps <= 2000, "Volatility too high"); // Max 20%
        
        uint256 currentPrice = latestPriceData.price;
        uint256 priceChange = (currentPrice * volatilityBps) / 10000;
        
        uint256 newPrice = isPositive 
            ? currentPrice + priceChange
            : currentPrice - priceChange;
            
        require(newPrice > 0, "Price would be zero");
        
        latestPriceData.price = newPrice;
        latestPriceData.timestamp = block.timestamp;
        
        emit PriceUpdated(ASSET_PAIR, newPrice, block.timestamp);
        emit MockPriceSet(newPrice, latestPriceData.confidence);
    }
    
    /**
     * @dev Simula una serie de precios para backtesting
     * @param prices Array de precios a aplicar secuencialmente
     * @param intervals Array de intervalos de tiempo entre cada precio
     */
    function simulatePriceSeries(uint256[] calldata prices, uint256[] calldata intervals) 
        external 
        onlyOwner 
    {
        require(prices.length == intervals.length, "Array length mismatch");
        require(prices.length > 0, "Empty arrays");
        
        // Solo actualiza el primer precio, el resto se puede hacer con llamadas separadas
        require(prices[0] > 0, "Invalid first price");
        
        latestPriceData.price = prices[0];
        latestPriceData.timestamp = block.timestamp + intervals[0];
        
        emit PriceUpdated(ASSET_PAIR, prices[0], latestPriceData.timestamp);
    }
    
    /**
     * @dev Establece el estado del oráculo (up/down)
     * @param _isDown true para simular oracle caído
     */
    function setOracleStatus(bool _isDown) external onlyOwner {
        isDown = _isDown;
        emit OracleStatusChanged(_isDown);
    }
    
    /**
     * @dev Establece datos de precio con timestamp custom
     * @param price Precio en USD con 8 decimales
     * @param timestamp Timestamp custom
     * @param confidence Nivel de confianza
     */
    function setPriceWithTimestamp(
        uint256 price, 
        uint256 timestamp, 
        uint256 confidence
    ) external onlyOwner {
        require(price > 0, "Invalid price");
        require(timestamp > 0, "Invalid timestamp");
        require(confidence <= 10000, "Invalid confidence");
        
        latestPriceData = PriceData({
            price: price,
            timestamp: timestamp,
            confidence: confidence
        });
        
        emit PriceUpdated(ASSET_PAIR, price, timestamp);
        emit MockPriceSet(price, confidence);
    }
    
    // ========== FUNCIONES DE VISTA ADICIONALES ==========
    
    /**
     * @dev Obtiene información del asset pair
     */
    function getAssetPair() external pure returns (string memory) {
        return ASSET_PAIR;
    }
    
    /**
     * @dev Verifica si el precio actual es válido (no stale)
     */
    function isPriceValid() external view returns (bool) {
        return _isPriceValid();
    }
    
    /**
     * @dev Obtiene tiempo restante antes de que el precio sea stale
     */
    function getTimeToStale() external view returns (uint256) {
        if (isDown || block.timestamp >= latestPriceData.timestamp + STALENESS_THRESHOLD) {
            return 0;
        }
        return (latestPriceData.timestamp + STALENESS_THRESHOLD) - block.timestamp;
    }
    
    // ========== FUNCIONES INTERNAS ==========
    
    /**
     * @dev Verifica si el precio no está desactualizado
     */
    function _isPriceValid() internal view returns (bool) {
        return block.timestamp <= latestPriceData.timestamp + STALENESS_THRESHOLD;
    }
    
    // ========== FUNCIONES DE CONVENIENCIA PARA TESTING ==========
    
    /**
     * @dev Simula crash de BTC (precio baja 20-50%)
     */
    function simulateCrash() external onlyOwner {
        uint256 currentPrice = latestPriceData.price;
        // Baja entre 20% y 50%
        uint256 crashPercent = 2000 + (block.timestamp % 3000); // 20-50%
        uint256 newPrice = currentPrice - (currentPrice * crashPercent / 10000);
        
        latestPriceData.price = newPrice;
        latestPriceData.timestamp = block.timestamp;
        latestPriceData.confidence = 9500; // Menor confianza durante crash
        
        emit PriceUpdated(ASSET_PAIR, newPrice, block.timestamp);
        emit MockPriceSet(newPrice, 9500);
    }
    
    /**
     * @dev Simula pump de BTC (precio sube 10-30%)
     */
    function simulatePump() external onlyOwner {
        uint256 currentPrice = latestPriceData.price;
        // Sube entre 10% y 30%
        uint256 pumpPercent = 1000 + (block.timestamp % 2000); // 10-30%
        uint256 newPrice = currentPrice + (currentPrice * pumpPercent / 10000);
        
        latestPriceData.price = newPrice;
        latestPriceData.timestamp = block.timestamp;
        latestPriceData.confidence = 9800; // Alta confianza durante pump
        
        emit PriceUpdated(ASSET_PAIR, newPrice, block.timestamp);
        emit MockPriceSet(newPrice, 9800);
    }
    
    /**
     * @dev Restablece precio a un valor típico de BTC
     */
    function resetToDefaultPrice() external onlyOwner {
        latestPriceData = PriceData({
            price: 67000 * 10**DECIMALS,
            timestamp: block.timestamp,
            confidence: 10000
        });
        
        emit PriceUpdated(ASSET_PAIR, latestPriceData.price, block.timestamp);
        emit MockPriceSet(latestPriceData.price, 10000);
    }
}
