// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IVault
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @dev Interface para vaults de liquidez basada en ERC-4626
 * @notice Gestiona la liquidez del protocolo y emite tokens LP componibles
 */
interface IVault {
    
    /**
     * @dev Estructura para métricas del vault
     * @param totalDeposits Total de activos depositados
     * @param totalShares Total de shares (LP tokens) emitidos
     * @param utilization Ratio de utilización (basis points, 10000 = 100%)
     * @param apy Rendimiento anual actual (basis points)
     */
    struct VaultMetrics {
        uint256 totalDeposits;
        uint256 totalShares;
        uint256 utilization;
        uint256 apy;
    }
    
    /**
     * @dev Token subyacente del vault (ej: WBTC en RSK)
     * @return asset Dirección del token ERC20 subyacente
     */
    function asset() external view returns (IERC20 asset);
    
    /**
     * @dev Total de activos bajo gestión
     * @return totalAssets Cantidad total de activos en el vault
     */
    function totalAssets() external view returns (uint256 totalAssets);
    
    /**
     * @dev Deposita activos y recibe shares del vault
     * @param assets Cantidad de activos a depositar
     * @param receiver Dirección que recibirá los shares
     * @return shares Cantidad de shares emitidos
     */
    function deposit(uint256 assets, address receiver) 
        external 
        returns (uint256 shares);
    
    /**
     * @dev Retira activos quemando shares
     * @param assets Cantidad de activos a retirar
     * @param receiver Dirección que recibirá los activos
     * @param owner Dueño de los shares a quemar
     * @return shares Cantidad de shares quemados
     */
    function withdraw(uint256 assets, address receiver, address owner) 
        external 
        returns (uint256 shares);
    
    /**
     * @dev Transfiere liquidez al engine de forwards (solo autorizado)
     * @param to Dirección destino
     * @param amount Cantidad a transferir
     * @notice Solo el ForwardEngine autorizado puede llamar esta función
     */
    function transferLiquidity(address to, uint256 amount) external;
    
    /**
     * @dev Retorna liquidez al vault después de ejecutar un forward
     * @param amount Cantidad a retornar
     * @param pnl Ganancia/pérdida del forward (puede ser negativo)
     */
    function returnLiquidity(uint256 amount, int256 pnl) external;
    
    /**
     * @dev Obtiene métricas actuales del vault
     * @return metrics Estructura con métricas completas
     */
    function getVaultMetrics() external view returns (VaultMetrics memory metrics);
    
    /**
     * @dev Calcula la cantidad máxima que se puede retirar
     * @param owner Dueño de los shares
     * @return maxAssets Cantidad máxima de activos que se pueden retirar
     */
    function maxWithdraw(address owner) external view returns (uint256 maxAssets);
    
    /**
     * @dev Verifica si hay suficiente liquidez disponible
     * @param amount Cantidad requerida
     * @return available true si hay liquidez suficiente
     */
    function hasAvailableLiquidity(uint256 amount) external view returns (bool available);
    
    /**
     * @dev Emitido cuando se depositan activos
     * @param caller Quien hizo el depósito
     * @param owner Dueño de los shares
     * @param assets Cantidad depositada
     * @param shares Shares emitidos
     */
    event Deposit(
        address indexed caller,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    
    /**
     * @dev Emitido cuando se retiran activos
     * @param caller Quien hizo el retiro
     * @param receiver Quien recibe los activos
     * @param owner Dueño de los shares
     * @param assets Cantidad retirada
     * @param shares Shares quemados
     */
    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );
    
    /**
     * @dev Emitido cuando se transfiere liquidez al engine
     * @param to Dirección destino
     * @param amount Cantidad transferida
     */
    event LiquidityTransferred(
        address indexed to,
        uint256 amount
    );
}
