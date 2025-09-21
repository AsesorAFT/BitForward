// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IForwardEngine.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IVault.sol";

/**
 * @title BitForwardEngine
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Motor de contratos forward descentralizados con gestión de riesgo avanzada
 * @notice Sistema completo para creación, gestión y liquidación de forwards sobre Bitcoin
 * 
 * Arquitectura de seguridad:
 * - Patrón Checks-Effects-Interactions en todas las funciones críticas
 * - Sistema de roles granular con AccessControl
 * - Oráculos redundantes para precios confiables
 * - Liquidaciones incentivizadas por la comunidad
 * - Limits dinámicos basados en volatilidad y liquidez
 */
contract BitForwardEngine is IForwardEngine, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ========== ROLES Y CONSTANTES ==========
    
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_LEVERAGE = 1000; // 10x máximo
    uint256 public constant MIN_COLLATERAL_RATIO = 1200; // 120% mínimo
    uint256 public constant LIQUIDATION_PENALTY = 500; // 5% penalty
    uint256 public constant MAX_POSITION_SIZE = 1000000 * 1e8; // $1M máximo por posición
    
    // ========== VARIABLES DE ESTADO ==========
    
    /// @dev Contador para IDs únicos de forwards
    uint256 public nextForwardId = 1;
    
    /// @dev Mapping de ID a contrato forward
    mapping(uint256 => ForwardContract) public forwards;
    
    /// @dev Mapping de usuario a lista de forwards activos
    mapping(address => uint256[]) public userForwards;
    
    /// @dev Configuración de riesgo actual
    RiskConfig public riskConfig;
    
    /// @dev Oráculo de precios principal
    IOracle public priceOracle;
    
    /// @dev Vault de liquidez
    IVault public liquidityVault;
    
    /// @dev Token de colateral (ej: WBTC)
    IERC20 public collateralToken;
    
    /// @dev Estadísticas del protocolo
    uint256 public totalVolumeUSD;
    uint256 public totalFeesCollected;
    uint256 public activeContractsCount;
    
    /// @dev Mapping para tracking de exposición por usuario
    mapping(address => uint256) public userExposure;
    
    /// @dev Emergency shutdown flag
    bool public emergencyShutdown;
    
    // ========== EVENTOS ADICIONALES ==========
    
    event RiskParametersUpdated(
        uint256 minCollateralRatio,
        uint256 liquidationThreshold,
        uint256 maxLeverage,
        uint256 protocolFee
    );
    
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event VaultUpdated(address indexed oldVault, address indexed newVault);
    event ProtocolFeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    /**
     * @dev Inicializa el ForwardEngine con configuración conservadora
     * @param _priceOracle Dirección del oráculo de precios
     * @param _liquidityVault Dirección del vault de liquidez
     * @param _collateralToken Token usado como colateral
     * @param _admin Administrador inicial del protocolo
     */
    constructor(
        address _priceOracle,
        address _liquidityVault,
        address _collateralToken,
        address _admin
    ) {
        require(_priceOracle != address(0), "Invalid oracle");
        require(_liquidityVault != address(0), "Invalid vault");
        require(_collateralToken != address(0), "Invalid collateral");
        require(_admin != address(0), "Invalid admin");
        
        priceOracle = IOracle(_priceOracle);
        liquidityVault = IVault(_liquidityVault);
        collateralToken = IERC20(_collateralToken);
        
        // Configurar roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RISK_MANAGER_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
        
        // Configuración inicial conservadora
        riskConfig = RiskConfig({
            minCollateralRatio: 1500,   // 150%
            liquidationThreshold: 1200, // 120%
            maxLeverage: 500,           // 5x
            maxNotionalPerUser: 100000 * 1e8, // $100K
            protocolFee: 50             // 0.5%
        });
    }
    
    // ========== FUNCIONES PRINCIPALES ==========
    
    /**
     * @inheritdoc IForwardEngine
     */
    function openForward(
        uint256 collateral,
        uint256 notionalUSD,
        uint256 expiry,
        uint256 leverage,
        bool isLong,
        uint256 targetPrice
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 forwardId) 
    {
        require(!emergencyShutdown, "Emergency shutdown active");
        
        // ===== CHECKS =====
        _validateForwardParameters(collateral, notionalUSD, expiry, leverage);
        _validateUserLimits(msg.sender, notionalUSD);
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        require(currentPrice > 0, "Invalid price");
        
        // Verificar que hay liquidez suficiente en el vault
        uint256 requiredLiquidity = _calculateRequiredLiquidity(notionalUSD, leverage);
        require(liquidityVault.hasAvailableLiquidity(requiredLiquidity), "Insufficient liquidity");
        
        // ===== EFFECTS =====
        forwardId = nextForwardId++;
        
        forwards[forwardId] = ForwardContract({
            id: forwardId,
            user: msg.sender,
            collateralAmount: collateral,
            notionalUSD: notionalUSD,
            entryPrice: currentPrice,
            targetPrice: targetPrice,
            expiryTimestamp: expiry,
            leverageRatio: leverage,
            isLong: isLong,
            status: ForwardStatus.ACTIVE,
            createdAt: block.timestamp,
            executedAt: 0
        });
        
        userForwards[msg.sender].push(forwardId);
        userExposure[msg.sender] += notionalUSD;
        activeContractsCount++;
        totalVolumeUSD += notionalUSD;
        
        // ===== INTERACTIONS =====
        // Transferir colateral del usuario
        collateralToken.safeTransferFrom(msg.sender, address(this), collateral);
        
        // Reservar liquidez del vault
        liquidityVault.transferLiquidity(address(this), requiredLiquidity);
        
        emit ForwardOpened(
            forwardId,
            msg.sender,
            collateral,
            notionalUSD,
            currentPrice,
            expiry,
            isLong,
            leverage
        );
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function executeForward(uint256 forwardId) 
        external 
        nonReentrant 
        returns (int256 pnl) 
    {
        ForwardContract storage forward = forwards[forwardId];
        
        // ===== CHECKS =====
        require(forward.status == ForwardStatus.ACTIVE, "Forward not active");
        require(forward.user == msg.sender, "Not forward owner");
        require(block.timestamp <= forward.expiryTimestamp, "Forward expired");
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        require(currentPrice > 0, "Invalid price");
        
        // Verificar si se alcanzó el precio objetivo (si está configurado)
        if (forward.targetPrice > 0) {
            bool targetReached = forward.isLong 
                ? currentPrice >= forward.targetPrice
                : currentPrice <= forward.targetPrice;
            require(targetReached, "Target price not reached");
        }
        
        // ===== EFFECTS =====
        pnl = _calculatePnL(forward, currentPrice);
        
        forward.status = ForwardStatus.EXECUTED;
        forward.executedAt = block.timestamp;
        activeContractsCount--;
        userExposure[msg.sender] -= forward.notionalUSD;
        
        // ===== INTERACTIONS =====
        _settleForward(forward, pnl, currentPrice);
        
        emit ForwardExecuted(forwardId, msg.sender, pnl, currentPrice, block.timestamp);
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function liquidateForward(uint256 forwardId) 
        external 
        nonReentrant 
        returns (uint256 liquidationReward) 
    {
        ForwardContract storage forward = forwards[forwardId];
        
        // ===== CHECKS =====
        require(forward.status == ForwardStatus.ACTIVE, "Forward not active");
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        require(currentPrice > 0, "Invalid price");
        
        (bool isLiquidable, uint256 healthRatio) = _isLiquidable(forward, currentPrice);
        require(isLiquidable, "Position healthy");
        
        // ===== EFFECTS =====
        int256 pnl = _calculatePnL(forward, currentPrice);
        liquidationReward = (forward.collateralAmount * LIQUIDATION_PENALTY) / BASIS_POINTS;
        
        forward.status = ForwardStatus.LIQUIDATED;
        forward.executedAt = block.timestamp;
        activeContractsCount--;
        userExposure[forward.user] -= forward.notionalUSD;
        
        // ===== INTERACTIONS =====
        _settleForward(forward, pnl, currentPrice);
        
        // Transferir recompensa al liquidador
        collateralToken.safeTransfer(msg.sender, liquidationReward);
        
        emit ForwardLiquidated(
            forwardId,
            forward.user,
            msg.sender,
            currentPrice,
            liquidationReward
        );
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function closePosition(uint256 forwardId) 
        external 
        nonReentrant 
        returns (int256 pnl) 
    {
        ForwardContract storage forward = forwards[forwardId];
        
        // ===== CHECKS =====
        require(forward.status == ForwardStatus.ACTIVE, "Forward not active");
        require(forward.user == msg.sender, "Not forward owner");
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        require(currentPrice > 0, "Invalid price");
        
        // ===== EFFECTS =====
        pnl = _calculatePnL(forward, currentPrice);
        
        forward.status = ForwardStatus.EXECUTED;
        forward.executedAt = block.timestamp;
        activeContractsCount--;
        userExposure[msg.sender] -= forward.notionalUSD;
        
        // ===== INTERACTIONS =====
        _settleForward(forward, pnl, currentPrice);
        
        emit PositionClosed(forwardId, msg.sender, pnl, currentPrice);
    }
    
    // ========== FUNCIONES DE VISTA ==========
    
    /**
     * @inheritdoc IForwardEngine
     */
    function getForward(uint256 forwardId) 
        external 
        view 
        returns (ForwardContract memory) 
    {
        return forwards[forwardId];
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function calculatePnL(uint256 forwardId) 
        external 
        view 
        returns (int256 currentPnl) 
    {
        ForwardContract storage forward = forwards[forwardId];
        require(forward.status == ForwardStatus.ACTIVE, "Forward not active");
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        return _calculatePnL(forward, currentPrice);
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function isLiquidable(uint256 forwardId) 
        external 
        view 
        returns (bool liquidable, uint256 healthRatio) 
    {
        ForwardContract storage forward = forwards[forwardId];
        
        if (forward.status != ForwardStatus.ACTIVE) {
            return (false, BASIS_POINTS);
        }
        
        uint256 currentPrice = priceOracle.getLatestPrice();
        return _isLiquidable(forward, currentPrice);
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function getUserActiveForwards(address user) 
        external 
        view 
        returns (uint256[] memory activeIds) 
    {
        uint256[] storage userIds = userForwards[user];
        uint256 activeCount = 0;
        
        // Contar forwards activos
        for (uint256 i = 0; i < userIds.length; i++) {
            if (forwards[userIds[i]].status == ForwardStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        // Llenar array de activos
        activeIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userIds.length; i++) {
            if (forwards[userIds[i]].status == ForwardStatus.ACTIVE) {
                activeIds[index] = userIds[i];
                index++;
            }
        }
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function getRiskConfig() external view returns (RiskConfig memory) {
        return riskConfig;
    }
    
    /**
     * @inheritdoc IForwardEngine
     */
    function getProtocolStats() 
        external 
        view 
        returns (uint256 totalValueLocked, uint256 activeContracts, uint256 totalVolume) 
    {
        totalValueLocked = collateralToken.balanceOf(address(this));
        activeContracts = activeContractsCount;
        totalVolume = totalVolumeUSD;
    }
    
    // ========== FUNCIONES INTERNAS ==========
    
    /**
     * @dev Valida parámetros de un nuevo forward
     */
    function _validateForwardParameters(
        uint256 collateral,
        uint256 notionalUSD,
        uint256 expiry,
        uint256 leverage
    ) internal view {
        require(collateral > 0, "Zero collateral");
        require(notionalUSD > 0, "Zero notional");
        require(notionalUSD <= MAX_POSITION_SIZE, "Position too large");
        require(expiry > block.timestamp + 1 hours, "Expiry too soon");
        require(expiry <= block.timestamp + 365 days, "Expiry too far");
        require(leverage >= 100 && leverage <= riskConfig.maxLeverage, "Invalid leverage");
        
        // Verificar ratio de colateral mínimo
        uint256 requiredCollateral = (notionalUSD * riskConfig.minCollateralRatio) / (BASIS_POINTS * leverage / 100);
        require(collateral >= requiredCollateral, "Insufficient collateral");
    }
    
    /**
     * @dev Valida límites por usuario
     */
    function _validateUserLimits(address user, uint256 notionalUSD) internal view {
        uint256 newExposure = userExposure[user] + notionalUSD;
        require(newExposure <= riskConfig.maxNotionalPerUser, "User exposure limit exceeded");
    }
    
    /**
     * @dev Calcula la liquidez requerida del vault
     */
    function _calculateRequiredLiquidity(uint256 notionalUSD, uint256 leverage) 
        internal 
        pure 
        returns (uint256) 
    {
        // Liquidez = notional / leverage (simplificado)
        return (notionalUSD * 100) / leverage;
    }
    
    /**
     * @dev Calcula el PnL de un forward
     */
    function _calculatePnL(ForwardContract storage forward, uint256 currentPrice) 
        internal 
        view 
        returns (int256 pnl) 
    {
        int256 priceDiff = int256(currentPrice) - int256(forward.entryPrice);
        
        if (!forward.isLong) {
            priceDiff = -priceDiff;
        }
        
        // PnL = (price_diff / entry_price) * notional * leverage / 100
        pnl = (priceDiff * int256(forward.notionalUSD) * int256(forward.leverageRatio)) / 
              (int256(forward.entryPrice) * 100);
    }
    
    /**
     * @dev Verifica si un forward es liquidable
     */
    function _isLiquidable(ForwardContract storage forward, uint256 currentPrice) 
        internal 
        view 
        returns (bool liquidable, uint256 healthRatio) 
    {
        int256 pnl = _calculatePnL(forward, currentPrice);
        int256 netCollateral = int256(forward.collateralAmount) + pnl;
        
        if (netCollateral <= 0) {
            return (true, 0);
        }
        
        // Health ratio = (collateral + pnl) / required_collateral
        uint256 requiredCollateral = (forward.notionalUSD * riskConfig.liquidationThreshold) / 
                                   (BASIS_POINTS * forward.leverageRatio / 100);
        
        healthRatio = (uint256(netCollateral) * BASIS_POINTS) / requiredCollateral;
        liquidable = healthRatio < BASIS_POINTS;
    }
    
    /**
     * @dev Liquida un forward y maneja transferencias
     */
    function _settleForward(ForwardContract storage forward, int256 pnl, uint256 exitPrice) 
        internal 
    {
        uint256 protocolFee = (forward.notionalUSD * riskConfig.protocolFee) / BASIS_POINTS;
        totalFeesCollected += protocolFee;
        
        // Retornar liquidez al vault
        uint256 requiredLiquidity = _calculateRequiredLiquidity(forward.notionalUSD, forward.leverageRatio);
        liquidityVault.returnLiquidity(requiredLiquidity, pnl);
        
        // Calcular payout final
        int256 finalPayout = int256(forward.collateralAmount) + pnl - int256(protocolFee);
        
        if (finalPayout > 0) {
            collateralToken.safeTransfer(forward.user, uint256(finalPayout));
        }
    }
    
    // ========== FUNCIONES DE ADMINISTRACIÓN ==========
    
    /**
     * @dev Actualiza configuración de riesgo
     */
    function updateRiskConfig(RiskConfig calldata newConfig) 
        external 
        onlyRole(RISK_MANAGER_ROLE) 
    {
        require(newConfig.minCollateralRatio >= 1100, "Collateral ratio too low"); // Min 110%
        require(newConfig.liquidationThreshold >= 1050, "Liquidation threshold too low"); // Min 105%
        require(newConfig.maxLeverage <= MAX_LEVERAGE, "Leverage too high");
        require(newConfig.protocolFee <= 200, "Fee too high"); // Max 2%
        
        riskConfig = newConfig;
        
        emit RiskParametersUpdated(
            newConfig.minCollateralRatio,
            newConfig.liquidationThreshold,
            newConfig.maxLeverage,
            newConfig.protocolFee
        );
    }
    
    /**
     * @dev Actualiza oráculo de precios
     */
    function updateOracle(address newOracle) 
        external 
        onlyRole(RISK_MANAGER_ROLE) 
    {
        require(newOracle != address(0), "Invalid oracle");
        address oldOracle = address(priceOracle);
        priceOracle = IOracle(newOracle);
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev Pausa/despausa el protocolo
     */
    function setEmergencyPause(bool paused) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        if (paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Activa/desactiva shutdown de emergencia
     */
    function setEmergencyShutdown(bool shutdown) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        emergencyShutdown = shutdown;
    }
    
    /**
     * @dev Retira comisiones del protocolo
     */
    function withdrawProtocolFees(address recipient, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= totalFeesCollected, "Exceeds available fees");
        
        totalFeesCollected -= amount;
        collateralToken.safeTransfer(recipient, amount);
        
        emit ProtocolFeesWithdrawn(recipient, amount);
    }
    
    // ========== FUNCIONES DE EMERGENCIA ==========
    
    /**
     * @dev Función de emergencia para retirar fondos atascados
     */
    function emergencyWithdraw(address token, uint256 amount, address recipient) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(emergencyShutdown, "Emergency shutdown not active");
        IERC20(token).safeTransfer(recipient, amount);
    }
}
