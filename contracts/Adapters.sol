// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAdapter.sol";

/**
 * @title Base Adapter for DeFi Protocol Integration
 * @dev Patrón de adaptador para desacoplar la lógica del Vault de protocolos externos
 * @author AsesorAFT - Senior DeFi Architecture
 */
abstract contract BaseAdapter is IAdapter {
    
    address public immutable vault;
    
    modifier onlyVault() {
        require(msg.sender == vault, "BaseAdapter: Only vault can call");
        _;
    }
    
    constructor(address _vault) {
        vault = _vault;
    }
    
    /**
     * @notice Template method pattern - implementado por adaptadores específicos
     */
    function execute(bytes calldata data) external virtual override onlyVault;
    
    /**
     * @notice Obtiene información del protocolo
     */
    function getProtocolInfo() external view virtual override returns (
        string memory name,
        string memory version,
        address protocolAddress
    );
}

/**
 * @title Uniswap V3 Adapter
 * @dev Adaptador específico para interactuar con Uniswap V3
 */
contract UniswapV3Adapter is BaseAdapter {
    
    // Uniswap V3 interfaces
    interface ISwapRouter {
        struct ExactInputSingleParams {
            address tokenIn;
            address tokenOut;
            uint24 fee;
            address recipient;
            uint256 deadline;
            uint256 amountIn;
            uint256 amountOutMinimum;
            uint160 sqrtPriceLimitX96;
        }
        
        function exactInputSingle(ExactInputSingleParams calldata params) 
            external 
            payable 
            returns (uint256 amountOut);
    }
    
    ISwapRouter public constant UNISWAP_ROUTER = 
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    
    constructor(address _vault) BaseAdapter(_vault) {}
    
    /**
     * @notice Ejecuta swap en Uniswap V3
     * @param data Datos codificados del swap
     */
    function execute(bytes calldata data) external override onlyVault {
        (
            address tokenIn,
            address tokenOut,
            uint24 fee,
            uint256 amountIn,
            uint256 amountOutMinimum
        ) = abi.decode(data, (address, address, uint24, uint256, uint256));
        
        // Verificar balance suficiente en el vault
        require(
            IERC20(tokenIn).balanceOf(vault) >= amountIn,
            "UniswapAdapter: Insufficient balance"
        );
        
        // Aprobar tokens al router
        IERC20(tokenIn).approve(address(UNISWAP_ROUTER), amountIn);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: vault,
            deadline: block.timestamp + 300, // 5 minutos
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });
        
        UNISWAP_ROUTER.exactInputSingle(params);
    }
    
    function getProtocolInfo() external pure override returns (
        string memory name,
        string memory version,
        address protocolAddress
    ) {
        return ("Uniswap", "V3", 0xE592427A0AEce92De3Edee1F18E0157C05861564);
    }
}

/**
 * @title Aave V3 Adapter  
 * @dev Adaptador para interactuar con Aave V3 (lending/borrowing)
 */
contract AaveV3Adapter is BaseAdapter {
    
    interface IPool {
        function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
        function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
        function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
        function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    }
    
    IPool public constant AAVE_POOL = 
        IPool(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2);
    
    constructor(address _vault) BaseAdapter(_vault) {}
    
    /**
     * @notice Ejecuta operación en Aave (supply, borrow, repay, withdraw)
     */
    function execute(bytes calldata data) external override onlyVault {
        (
            string memory operation,
            address asset,
            uint256 amount,
            uint256 interestRateMode
        ) = abi.decode(data, (string, address, uint256, uint256));
        
        if (keccak256(bytes(operation)) == keccak256(bytes("supply"))) {
            IERC20(asset).approve(address(AAVE_POOL), amount);
            AAVE_POOL.supply(asset, amount, vault, 0);
            
        } else if (keccak256(bytes(operation)) == keccak256(bytes("borrow"))) {
            AAVE_POOL.borrow(asset, amount, interestRateMode, 0, vault);
            
        } else if (keccak256(bytes(operation)) == keccak256(bytes("repay"))) {
            IERC20(asset).approve(address(AAVE_POOL), amount);
            AAVE_POOL.repay(asset, amount, interestRateMode, vault);
            
        } else if (keccak256(bytes(operation)) == keccak256(bytes("withdraw"))) {
            AAVE_POOL.withdraw(asset, amount, vault);
        }
    }
    
    function getProtocolInfo() external pure override returns (
        string memory name,
        string memory version,
        address protocolAddress
    ) {
        return ("Aave", "V3", 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2);
    }
}
