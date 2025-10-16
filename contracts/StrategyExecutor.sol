// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAdapter.sol";
import "./Vault.sol";

/**
 * @title BitForward Strategy Executor
 * @dev Ejecuta estrategias complejas combinando múltiples protocolos DeFi
 * @author AsesorAFT - Senior DeFi Architect
 */
contract StrategyExecutor is ReentrancyGuard, Ownable {
    
    BitForwardVault public immutable vault;
    
    // Adaptadores disponibles
    mapping(string => address) public adapters;
    mapping(uint256 => LoanData) public loans;
    
    uint256 public nextLoanId = 1;
    uint256 public constant MIN_HEALTH_FACTOR = 1.2e18; // 120%
    
    struct LoanData {
        address collateralAsset;
        address debtAsset;
        uint256 collateralAmount;
        uint256 debtAmount;
        uint256 timestamp;
        bool isActive;
    }
    
    // ============ EVENTS ============
    
    event HedgeExecuted(
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed user
    );
    
    event LoanOpened(
        uint256 indexed loanId,
        address indexed collateralAsset,
        address indexed debtAsset,
        uint256 collateralAmount,
        uint256 debtAmount
    );
    
    event LoanClosed(uint256 indexed loanId, uint256 repayAmount);
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _vault) {
        vault = BitForwardVault(_vault);
    }
    
    // ============ HEDGE EXECUTION ============
    
    /**
     * @notice Ejecuta una cobertura intercambiando un activo volátil por uno estable
     * @param assetIn Activo volátil a intercambiar
     * @param assetOut Activo estable a recibir
     * @param amount Cantidad a intercambiar
     * @param minAmountOut Cantidad mínima a recibir (protección contra slippage)
     * @return amountOut Cantidad real recibida
     */
    function executeHedge(
        address assetIn,
        address assetOut,
        uint256 amount,
        uint256 minAmountOut
    ) external onlyOwner nonReentrant returns (uint256 amountOut) {
        
        require(adapters["uniswap"] != address(0), "Uniswap adapter not set");
        require(amount > 0, "Amount must be greater than 0");
        
        // Codificar datos para el adaptador de Uniswap
        bytes memory swapData = abi.encode(
            assetIn,    // tokenIn
            assetOut,   // tokenOut
            3000,       // fee (0.3%)
            amount,     // amountIn
            minAmountOut // amountOutMinimum
        );
        
        // Ejecutar swap a través del vault
        vault.executeStrategy(adapters["uniswap"], swapData);
        
        // Calcular amount out (simplificado - en producción usaríamos el return value)
        amountOut = minAmountOut; // Placeholder
        
        emit HedgeExecuted(assetIn, assetOut, amount, amountOut, msg.sender);
        
        return amountOut;
    }
    
    // ============ COLLATERALIZED LOANS ============
    
    /**
     * @notice Abre un préstamo colateralizado en Aave
     * @param collateralAsset Activo usado como colateral
     * @param debtAsset Activo a tomar prestado
     * @param collateralAmount Cantidad de colateral a depositar
     * @param debtAmount Cantidad a tomar prestado
     * @return loanId ID único del préstamo
     */
    function openCollateralizedLoan(
        address collateralAsset,
        address debtAsset,
        uint256 collateralAmount,
        uint256 debtAmount
    ) external onlyOwner nonReentrant returns (uint256 loanId) {
        
        require(adapters["aave"] != address(0), "Aave adapter not set");
        require(collateralAmount > 0 && debtAmount > 0, "Invalid amounts");
        
        loanId = nextLoanId++;
        
        // 1. Depositar colateral en Aave
        bytes memory supplyData = abi.encode(
            "supply",
            collateralAsset,
            collateralAmount,
            0 // interestRateMode (no usado en supply)
        );
        
        vault.executeStrategy(adapters["aave"], supplyData);
        
        // 2. Tomar préstamo contra el colateral
        bytes memory borrowData = abi.encode(
            "borrow",
            debtAsset,
            debtAmount,
            2 // variable interest rate
        );
        
        vault.executeStrategy(adapters["aave"], borrowData);
        
        // 3. Registrar el préstamo
        loans[loanId] = LoanData({
            collateralAsset: collateralAsset,
            debtAsset: debtAsset,
            collateralAmount: collateralAmount,
            debtAmount: debtAmount,
            timestamp: block.timestamp,
            isActive: true
        });
        
        emit LoanOpened(loanId, collateralAsset, debtAsset, collateralAmount, debtAmount);
        
        return loanId;
    }
    
    /**
     * @notice Cierra un préstamo repagando la deuda
     * @param loanId ID del préstamo a cerrar
     */
    function closeLoan(uint256 loanId) external onlyOwner nonReentrant {
        LoanData storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        
        // 1. Repagar la deuda
        bytes memory repayData = abi.encode(
            "repay",
            loan.debtAsset,
            loan.debtAmount,
            2 // variable interest rate
        );
        
        vault.executeStrategy(adapters["aave"], repayData);
        
        // 2. Retirar el colateral
        bytes memory withdrawData = abi.encode(
            "withdraw",
            loan.collateralAsset,
            loan.collateralAmount,
            0 // no usado en withdraw
        );
        
        vault.executeStrategy(adapters["aave"], withdrawData);
        
        // 3. Marcar préstamo como cerrado
        loan.isActive = false;
        
        emit LoanClosed(loanId, loan.debtAmount);
    }
    
    /**
     * @notice Calcula el health factor de un préstamo
     * @dev Simplificado - en producción usaríamos oráculos reales
     */
    function getLoanHealth(uint256 loanId) external view returns (uint256 healthFactor) {
        LoanData memory loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        
        // Simplificado: asumimos ratio 1:1 para el ejemplo
        // En producción: (collateralValue * liquidationThreshold) / debtValue
        healthFactor = (loan.collateralAmount * 1e18) / loan.debtAmount;
        
        return healthFactor;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Configura adaptadores para diferentes protocolos
     */
    function setAdapter(string memory protocol, address adapter) external onlyOwner {
        adapters[protocol] = adapter;
    }
    
    /**
     * @notice Obtiene información de un préstamo
     */
    function getLoanInfo(uint256 loanId) external view returns (LoanData memory) {
        return loans[loanId];
    }
    
    /**
     * @notice Lista todos los préstamos activos (simplificado)
     */
    function getActiveLoans() external view returns (uint256[] memory activeLoanIds) {
        // En producción, mantendríamos un array de IDs activos
        // Por simplicidad, retornamos los primeros 10
        uint256 count = 0;
        for (uint256 i = 1; i < nextLoanId && count < 10; i++) {
            if (loans[i].isActive) {
                count++;
            }
        }
        
        activeLoanIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextLoanId && index < count; i++) {
            if (loans[i].isActive) {
                activeLoanIds[index] = i;
                index++;
            }
        }
        
        return activeLoanIds;
    }
}
