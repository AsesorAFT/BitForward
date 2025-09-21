// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAdapter Interface
 * @dev Interface estándar para todos los adaptadores de protocolo
 */
interface IAdapter {
    function execute(bytes calldata data) external;
    
    function getProtocolInfo() external view returns (
        string memory name,
        string memory version,
        address protocolAddress
    );
}

/**
 * @title IOracle Interface
 * @dev Interface para oráculos de precios
 */
interface IOracle {
    function getPrice(address asset) external view returns (uint256 price, uint256 timestamp);
    
    function getPriceWithDecimals(address asset) external view returns (
        uint256 price,
        uint8 decimals,
        uint256 timestamp
    );
}

/**
 * @title IStrategyExecutor Interface
 * @dev Interface para el ejecutor de estrategias
 */
interface IStrategyExecutor {
    function executeHedge(
        address assetIn,
        address assetOut,
        uint256 amount,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
    
    function openCollateralizedLoan(
        address collateralAsset,
        address debtAsset,
        uint256 collateralAmount,
        uint256 debtAmount
    ) external returns (uint256 loanId);
    
    function closeLoan(uint256 loanId) external;
    
    function getLoanHealth(uint256 loanId) external view returns (uint256 healthFactor);
}
