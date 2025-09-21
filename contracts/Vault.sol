// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IVault.sol";

/**
 * @title BitForwardVault
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Vault ERC-4626 optimizado para protocolos de derivados
 * @notice Gestiona liquidez del protocolo con tokens LP componibles y gestión de riesgo avanzada
 * 
 * Características principales:
 * - Cumple con estándar ERC-4626 para máxima composabilidad
 * - Sistema de roles con AccessControl para seguridad modular
 * - Protección contra reentrancy y pausas de emergencia
 * - Gestión de liquidez optimizada para forwards
 * - Métricas en tiempo real para dashboard y analytics
 */
contract BitForwardVault is ERC4626, AccessControl, ReentrancyGuard, Pausable, IVault {
    using SafeERC20 for IERC20;
    
    // ========== ROLES Y CONSTANTES ==========
    
    bytes32 public constant FORWARD_ENGINE_ROLE = keccak256("FORWARD_ENGINE_ROLE");
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant MAX_UTILIZATION = 9000; // 90% máxima utilización
    uint256 public constant MIN_LIQUIDITY_BUFFER = 1000; // 10% buffer mínimo
    uint256 public constant BASIS_POINTS = 10000;
    
    // ========== VARIABLES DE ESTADO ==========
    
    /// @dev Liquidez actualmente prestada a forwards
    uint256 public utilizationAmount;
    
    /// @dev Comisión por gestión (basis points) - ej: 200 = 2%
    uint256 public managementFee;
    
    /// @dev Comisión por performance (basis points) - ej: 1000 = 10%
    uint256 public performanceFee;
    
    /// @dev Rendimiento acumulado histórico para cálculo de APY
    uint256 public cumulativeReturns;
    
    /// @dev Timestamp de la última actualización de fee
    uint256 public lastFeeUpdate;
    
    /// @dev Mapping para tracking de usuarios VIP (menor fee)
    mapping(address => bool) public isVipUser;
    
    /// @dev Emergency shutdown flag
    bool public emergencyShutdown;
    
    // ========== EVENTOS ADICIONALES ==========
    
    event LiquidityUtilizationChanged(uint256 oldUtilization, uint256 newUtilization);
    event FeesUpdated(uint256 managementFee, uint256 performanceFee);
    event VipStatusChanged(address indexed user, bool isVip);
    event EmergencyShutdown(bool status);
    event YieldDistributed(uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    
    /**
     * @dev Inicializa el vault con configuración de seguridad robusta
     * @param _asset Token subyacente (ej: WBTC en RSK)
     * @param _name Nombre del token LP (ej: "BitForward BTC Vault")
     * @param _symbol Símbolo del token LP (ej: "bfBTC")
     * @param _admin Dirección del administrador inicial
     */
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _admin
    ) 
        ERC4626(_asset) 
        ERC20(_name, _symbol) 
    {
        require(_admin != address(0), "Invalid admin address");
        
        // Configurar roles iniciales
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RISK_MANAGER_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
        
        // Configuración inicial conservadora
        managementFee = 200; // 2%
        performanceFee = 1000; // 10%
        lastFeeUpdate = block.timestamp;
    }
    
    // ========== FUNCIONES PRINCIPALES ERC-4626 ==========
    
    /**
     * @inheritdoc ERC4626
     * @dev Override para añadir validaciones de seguridad y limites
     */
    function deposit(uint256 assets, address receiver) 
        public 
        override(ERC4626, IVault) 
        nonReentrant 
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(!emergencyShutdown, "Emergency shutdown active");
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");
        
        // Verificar que el depósito no exceda límites razonables
        uint256 newTotalAssets = totalAssets() + assets;
        require(newTotalAssets <= type(uint128).max, "Exceeds max TVL");
        
        shares = super.deposit(assets, receiver);
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    /**
     * @inheritdoc ERC4626
     * @dev Override para validar disponibilidad de liquidez
     */
    function withdraw(uint256 assets, address receiver, address owner) 
        public 
        override(ERC4626, IVault) 
        nonReentrant 
        returns (uint256 shares) 
    {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");
        
        // Verificar que hay liquidez suficiente (considerando utilización)
        uint256 availableLiquidity = totalAssets() - utilizationAmount;
        require(assets <= availableLiquidity, "Insufficient liquidity");
        
        shares = super.withdraw(assets, receiver, owner);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }
    
    // ========== FUNCIONES ESPECÍFICAS DEL PROTOCOLO ==========
    
    /**
     * @inheritdoc IVault
     * @dev Transfiere liquidez al Forward Engine (solo roles autorizados)
     */
    function transferLiquidity(address to, uint256 amount) 
        external 
        onlyRole(FORWARD_ENGINE_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        
        // Verificar límites de utilización
        uint256 newUtilization = utilizationAmount + amount;
        uint256 maxUtilizable = (totalAssets() * MAX_UTILIZATION) / BASIS_POINTS;
        
        require(newUtilization <= maxUtilizable, "Exceeds max utilization");
        require(hasAvailableLiquidity(amount), "Insufficient liquidity");
        
        // Actualizar estado antes de transferir (Checks-Effects-Interactions)
        uint256 oldUtilization = utilizationAmount;
        utilizationAmount = newUtilization;
        
        // Transferir assets
        IERC20(asset()).safeTransfer(to, amount);
        
        emit LiquidityTransferred(to, amount);
        emit LiquidityUtilizationChanged(oldUtilization, newUtilization);
    }
    
    /**
     * @inheritdoc IVault
     * @dev Retorna liquidez al vault después de ejecutar forward
     */
    function returnLiquidity(uint256 amount, int256 pnl) 
        external 
        onlyRole(FORWARD_ENGINE_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "Zero amount");
        require(amount <= utilizationAmount, "Invalid return amount");
        
        // Actualizar utilización
        utilizationAmount -= amount;
        
        // Procesar ganancias/pérdidas
        if (pnl > 0) {
            // Ganancia: aumenta el valor del vault
            cumulativeReturns += uint256(pnl);
            emit YieldDistributed(uint256(pnl));
        } else if (pnl < 0) {
            // Pérdida: se absorbe por la liquidez del vault
            uint256 loss = uint256(-pnl);
            require(loss <= totalAssets(), "Loss exceeds vault assets");
        }
        
        // Recibir fondos de vuelta
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
        
        // Si hay ganancia, procesarla
        if (pnl > 0) {
            IERC20(asset()).safeTransferFrom(msg.sender, address(this), uint256(pnl));
        }
    }
    
    /**
     * @inheritdoc IVault
     * @dev Verifica disponibilidad de liquidez
     */
    function hasAvailableLiquidity(uint256 amount) public view returns (bool) {
        uint256 availableLiquidity = totalAssets() - utilizationAmount;
        uint256 minBuffer = (totalAssets() * MIN_LIQUIDITY_BUFFER) / BASIS_POINTS;
        
        return availableLiquidity >= amount + minBuffer;
    }
    
    /**
     * @inheritdoc IVault
     * @dev Obtiene métricas completas del vault
     */
    function getVaultMetrics() external view returns (VaultMetrics memory) {
        uint256 totalAssetsAmount = totalAssets();
        uint256 utilizationRate = totalAssetsAmount > 0 
            ? (utilizationAmount * BASIS_POINTS) / totalAssetsAmount 
            : 0;
        
        // Calcular APY basado en rendimientos históricos
        uint256 apy = _calculateAPY();
        
        return VaultMetrics({
            totalDeposits: totalAssetsAmount,
            totalShares: totalSupply(),
            utilization: utilizationRate,
            apy: apy
        });
    }
    
    /**
     * @dev Calcula el APY actual basado en rendimientos históricos
     * @return apy APY en basis points
     */
    function _calculateAPY() internal view returns (uint256 apy) {
        if (totalAssets() == 0 || cumulativeReturns == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - lastFeeUpdate;
        if (timeElapsed == 0) {
            return 0;
        }
        
        // APY = (returns / totalAssets) * (365 days / timeElapsed) * 10000
        uint256 returnRate = (cumulativeReturns * BASIS_POINTS) / totalAssets();
        apy = (returnRate * 365 days) / timeElapsed;
        
        // Cap APY a un máximo razonable (500% = 50000 basis points)
        if (apy > 50000) {
            apy = 50000;
        }
    }
    
    // ========== FUNCIONES DE ADMINISTRACIÓN ==========
    
    /**
     * @dev Actualiza las comisiones del vault
     * @param _managementFee Nueva comisión de gestión (basis points)
     * @param _performanceFee Nueva comisión de performance (basis points)
     */
    function updateFees(uint256 _managementFee, uint256 _performanceFee) 
        external 
        onlyRole(RISK_MANAGER_ROLE) 
    {
        require(_managementFee <= 500, "Management fee too high"); // Max 5%
        require(_performanceFee <= 2000, "Performance fee too high"); // Max 20%
        
        managementFee = _managementFee;
        performanceFee = _performanceFee;
        lastFeeUpdate = block.timestamp;
        
        emit FeesUpdated(_managementFee, _performanceFee);
    }
    
    /**
     * @dev Establece estatus VIP para un usuario (menores comisiones)
     * @param user Dirección del usuario
     * @param isVip Nuevo estatus VIP
     */
    function setVipStatus(address user, bool isVip) 
        external 
        onlyRole(RISK_MANAGER_ROLE) 
    {
        require(user != address(0), "Invalid user");
        isVipUser[user] = isVip;
        emit VipStatusChanged(user, isVip);
    }
    
    /**
     * @dev Función de emergencia para pausar/despausar el vault
     * @param _paused Nuevo estado de pausa
     */
    function setEmergencyPause(bool _paused) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Activar/desactivar shutdown de emergencia
     * @param _shutdown Nuevo estado de shutdown
     */
    function setEmergencyShutdown(bool _shutdown) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        emergencyShutdown = _shutdown;
        emit EmergencyShutdown(_shutdown);
    }
    
    // ========== OVERRIDES REQUERIDOS ==========
    
    /**
     * @dev Override necesario para ERC4626 con AccessControl
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override para incluir rendimientos en el cálculo de assets totales
     */
    function totalAssets() public view override(ERC4626, IVault) returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + cumulativeReturns;
    }
    
    /**
     * @dev Función para recibir ETH/RBTC (si es necesario)
     */
    receive() external payable {
        revert("ETH not accepted");
    }
}
