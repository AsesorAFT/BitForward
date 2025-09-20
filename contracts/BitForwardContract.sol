// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BitForwardContract
 * @dev Smart contract for forward agreements on Ethereum
 * @author BitForward v2.0
 */
contract BitForwardContract is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event ForwardCreated(
        uint256 indexed contractId,
        address indexed buyer,
        address indexed seller,
        address underlying,
        uint256 amount,
        uint256 strikePrice,
        uint256 expiryTime
    );
    
    event ForwardExecuted(
        uint256 indexed contractId,
        address indexed executor,
        uint256 settlementAmount
    );
    
    event ForwardCancelled(uint256 indexed contractId, string reason);
    
    event CollateralDeposited(
        uint256 indexed contractId,
        address indexed depositor,
        uint256 amount
    );
    
    event CollateralWithdrawn(
        uint256 indexed contractId,
        address indexed withdrawer,
        uint256 amount
    );

    // Structs
    struct ForwardContract {
        uint256 id;
        address buyer;
        address seller;
        address underlying; // Token address (address(0) for ETH)
        uint256 amount;
        uint256 strikePrice;
        uint256 expiryTime;
        uint256 createdAt;
        ContractStatus status;
        uint256 buyerCollateral;
        uint256 sellerCollateral;
        uint256 settlementAmount;
    }
    
    enum ContractStatus {
        Active,
        Executed,
        Cancelled,
        Expired
    }

    // State variables
    uint256 private _contractIdCounter;
    mapping(uint256 => ForwardContract) public forwardContracts;
    mapping(address => uint256[]) public userContracts;
    
    // Platform settings
    uint256 public platformFeeRate = 50; // 0.5% in basis points
    uint256 public constant MAX_FEE_RATE = 1000; // 10% max fee
    uint256 public constant MIN_COLLATERAL_RATIO = 1000; // 10% min collateral
    uint256 public constant MAX_CONTRACT_DURATION = 365 days;
    
    address public feeRecipient;
    bool public contractsPaused = false;
    
    // Modifiers
    modifier contractExists(uint256 contractId) {
        require(forwardContracts[contractId].id != 0, "Contract does not exist");
        _;
    }
    
    modifier contractActive(uint256 contractId) {
        require(
            forwardContracts[contractId].status == ContractStatus.Active,
            "Contract is not active"
        );
        _;
    }
    
    modifier onlyContractParty(uint256 contractId) {
        ForwardContract memory fc = forwardContracts[contractId];
        require(
            msg.sender == fc.buyer || msg.sender == fc.seller,
            "Not a contract party"
        );
        _;
    }
    
    modifier whenNotPaused() {
        require(!contractsPaused, "Contracts are paused");
        _;
    }

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        _contractIdCounter = 1;
    }

    /**
     * @dev Create a new forward contract
     * @param seller Address of the seller
     * @param underlying Token address (address(0) for ETH)
     * @param amount Amount of underlying asset
     * @param strikePrice Strike price in wei
     * @param duration Duration in seconds
     */
    function createForwardContract(
        address seller,
        address underlying,
        uint256 amount,
        uint256 strikePrice,
        uint256 duration
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(seller != address(0) && seller != msg.sender, "Invalid seller");
        require(amount > 0, "Amount must be greater than 0");
        require(strikePrice > 0, "Strike price must be greater than 0");
        require(duration > 0 && duration <= MAX_CONTRACT_DURATION, "Invalid duration");
        
        uint256 contractId = _contractIdCounter++;
        uint256 expiryTime = block.timestamp + duration;
        
        // Calculate required collateral (10% of notional value)
        uint256 notionalValue = amount * strikePrice / 1e18;
        uint256 requiredCollateral = notionalValue * MIN_COLLATERAL_RATIO / 10000;
        
        require(msg.value >= requiredCollateral, "Insufficient collateral");
        
        ForwardContract storage fc = forwardContracts[contractId];
        fc.id = contractId;
        fc.buyer = msg.sender;
        fc.seller = seller;
        fc.underlying = underlying;
        fc.amount = amount;
        fc.strikePrice = strikePrice;
        fc.expiryTime = expiryTime;
        fc.createdAt = block.timestamp;
        fc.status = ContractStatus.Active;
        fc.buyerCollateral = msg.value;
        
        userContracts[msg.sender].push(contractId);
        userContracts[seller].push(contractId);
        
        emit ForwardCreated(
            contractId,
            msg.sender,
            seller,
            underlying,
            amount,
            strikePrice,
            expiryTime
        );
        
        emit CollateralDeposited(contractId, msg.sender, msg.value);
        
        return contractId;
    }
    
    /**
     * @dev Seller deposits collateral
     * @param contractId The contract ID
     */
    function depositSellerCollateral(uint256 contractId) 
        external 
        payable 
        contractExists(contractId) 
        contractActive(contractId) 
        nonReentrant 
    {
        ForwardContract storage fc = forwardContracts[contractId];
        require(msg.sender == fc.seller, "Only seller can deposit");
        
        uint256 notionalValue = fc.amount * fc.strikePrice / 1e18;
        uint256 requiredCollateral = notionalValue * MIN_COLLATERAL_RATIO / 10000;
        
        require(msg.value >= requiredCollateral, "Insufficient collateral");
        
        fc.sellerCollateral = msg.value;
        
        emit CollateralDeposited(contractId, msg.sender, msg.value);
    }
    
    /**
     * @dev Execute forward contract at expiry
     * @param contractId The contract ID
     * @param currentPrice Current market price of the underlying
     */
    function executeContract(uint256 contractId, uint256 currentPrice) 
        external 
        contractExists(contractId) 
        contractActive(contractId) 
        onlyContractParty(contractId) 
        nonReentrant 
    {
        ForwardContract storage fc = forwardContracts[contractId];
        require(block.timestamp >= fc.expiryTime, "Contract not yet expired");
        require(currentPrice > 0, "Invalid current price");
        
        // Calculate settlement amount
        int256 priceDiff = int256(currentPrice) - int256(fc.strikePrice);
        uint256 settlementAmount = 0;
        
        if (priceDiff > 0) {
            // Buyer profits
            settlementAmount = uint256(priceDiff) * fc.amount / 1e18;
        } else if (priceDiff < 0) {
            // Seller profits
            settlementAmount = uint256(-priceDiff) * fc.amount / 1e18;
        }
        
        fc.settlementAmount = settlementAmount;
        fc.status = ContractStatus.Executed;
        
        // Calculate platform fee
        uint256 fee = settlementAmount * platformFeeRate / 10000;
        uint256 netSettlement = settlementAmount - fee;
        
        // Transfer settlements
        if (priceDiff > 0 && settlementAmount > 0) {
            // Pay buyer from seller's collateral
            require(fc.sellerCollateral >= settlementAmount, "Insufficient seller collateral");
            payable(fc.buyer).transfer(netSettlement);
            payable(feeRecipient).transfer(fee);
            
            // Return remaining collateral
            if (fc.sellerCollateral > settlementAmount) {
                payable(fc.seller).transfer(fc.sellerCollateral - settlementAmount);
            }
            payable(fc.buyer).transfer(fc.buyerCollateral);
            
        } else if (priceDiff < 0 && settlementAmount > 0) {
            // Pay seller from buyer's collateral
            require(fc.buyerCollateral >= settlementAmount, "Insufficient buyer collateral");
            payable(fc.seller).transfer(netSettlement);
            payable(feeRecipient).transfer(fee);
            
            // Return remaining collateral
            if (fc.buyerCollateral > settlementAmount) {
                payable(fc.buyer).transfer(fc.buyerCollateral - settlementAmount);
            }
            payable(fc.seller).transfer(fc.sellerCollateral);
            
        } else {
            // No settlement, return collaterals
            payable(fc.buyer).transfer(fc.buyerCollateral);
            if (fc.sellerCollateral > 0) {
                payable(fc.seller).transfer(fc.sellerCollateral);
            }
        }
        
        emit ForwardExecuted(contractId, msg.sender, settlementAmount);
    }
    
    /**
     * @dev Cancel contract (only before seller deposits collateral)
     * @param contractId The contract ID
     */
    function cancelContract(uint256 contractId) 
        external 
        contractExists(contractId) 
        contractActive(contractId) 
        onlyContractParty(contractId) 
        nonReentrant 
    {
        ForwardContract storage fc = forwardContracts[contractId];
        require(fc.sellerCollateral == 0, "Cannot cancel after seller deposit");
        
        fc.status = ContractStatus.Cancelled;
        
        // Return buyer's collateral
        payable(fc.buyer).transfer(fc.buyerCollateral);
        
        emit ForwardCancelled(contractId, "Cancelled by party");
    }
    
    /**
     * @dev Mark expired contracts
     * @param contractId The contract ID
     */
    function markExpired(uint256 contractId) 
        external 
        contractExists(contractId) 
        contractActive(contractId) 
    {
        ForwardContract storage fc = forwardContracts[contractId];
        require(block.timestamp > fc.expiryTime + 1 days, "Grace period not ended");
        
        fc.status = ContractStatus.Expired;
        
        // Return collaterals
        payable(fc.buyer).transfer(fc.buyerCollateral);
        if (fc.sellerCollateral > 0) {
            payable(fc.seller).transfer(fc.sellerCollateral);
        }
        
        emit ForwardCancelled(contractId, "Expired");
    }
    
    // View functions
    function getContract(uint256 contractId) 
        external 
        view 
        returns (ForwardContract memory) 
    {
        return forwardContracts[contractId];
    }
    
    function getUserContracts(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userContracts[user];
    }
    
    function getActiveContracts(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory allContracts = userContracts[user];
        uint256 activeCount = 0;
        
        // Count active contracts
        for (uint256 i = 0; i < allContracts.length; i++) {
            if (forwardContracts[allContracts[i]].status == ContractStatus.Active) {
                activeCount++;
            }
        }
        
        // Create array of active contracts
        uint256[] memory activeContracts = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allContracts.length; i++) {
            if (forwardContracts[allContracts[i]].status == ContractStatus.Active) {
                activeContracts[index] = allContracts[i];
                index++;
            }
        }
        
        return activeContracts;
    }
    
    // Admin functions
    function setPlatformFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= MAX_FEE_RATE, "Fee rate too high");
        platformFeeRate = newFeeRate;
    }
    
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
    }
    
    function pauseContracts() external onlyOwner {
        contractsPaused = true;
    }
    
    function unpauseContracts() external onlyOwner {
        contractsPaused = false;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Fallback functions
    receive() external payable {
        revert("Direct payments not allowed");
    }
    
    fallback() external payable {
        revert("Function not found");
    }
}
