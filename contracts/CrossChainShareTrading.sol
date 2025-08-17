// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PropertyShareToken.sol";
import "./FlareOracle.sol";

/**
 * @title CrossChainShareTrading
 * @dev Enables cross-chain trading of property share tokens across multiple networks
 * Integrates with DEXs and provides automated market making
 */
contract CrossChainShareTrading is OApp, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Trading configuration
    struct TradingConfig {
        uint256 minTradeAmount;      // Minimum trade amount
        uint256 maxTradeAmount;      // Maximum trade amount per transaction
        uint256 tradingFee;          // Trading fee in basis points
        uint256 slippageTolerance;   // Maximum slippage in basis points
        bool tradingEnabled;         // Whether trading is enabled
    }
    
    // Cross-chain order
    struct CrossChainOrder {
        uint256 orderId;
        address trader;
        address shareToken;
        uint256 amount;
        uint256 price;              // Price per share in USD (18 decimals)
        uint32 sourceChain;
        uint32 targetChain;
        bool isBuyOrder;           // true for buy, false for sell
        uint256 expiration;
        OrderStatus status;
        uint256 filledAmount;
        uint256 timestamp;
    }
    
    enum OrderStatus {
        Pending,
        PartiallyFilled,
        Filled,
        Cancelled,
        Expired
    }
    
    // Liquidity pool for each share token
    struct LiquidityPool {
        address shareToken;
        uint256 shareReserves;
        uint256 usdReserves;        // In stablecoin
        uint256 totalLiquidity;
        uint256 lastPrice;
        bool isActive;
    }
    
    // DEX integration
    struct DEXConfig {
        address dexRouter;
        address[] supportedTokens;  // Supported stablecoins/trading pairs
        uint256 minLiquidity;
        bool isActive;
    }
    
    // State variables
    FlareOracle public immutable flareOracle;
    address public immutable stablecoin; // USDC/USDT for pricing
    
    TradingConfig public tradingConfig;
    uint256 public nextOrderId;
    address public feeRecipient;
    
    // Mappings
    mapping(uint256 => CrossChainOrder) public orders;
    mapping(address => LiquidityPool) public liquidityPools;
    mapping(uint32 => DEXConfig) public dexConfigs;
    mapping(address => uint256[]) public userOrders;
    mapping(address => bool) public authorizedMarketMakers;
    
    // Cross-chain message types
    uint8 constant MSG_TYPE_PLACE_ORDER = 1;
    uint8 constant MSG_TYPE_FILL_ORDER = 2;
    uint8 constant MSG_TYPE_CANCEL_ORDER = 3;
    uint8 constant MSG_TYPE_SYNC_LIQUIDITY = 4;
    
    // Events
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        address indexed shareToken,
        uint256 amount,
        uint256 price,
        bool isBuyOrder,
        uint32 targetChain
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed filler,
        uint256 filledAmount,
        uint256 executionPrice
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    
    event LiquidityAdded(
        address indexed shareToken,
        address indexed provider,
        uint256 shareAmount,
        uint256 usdAmount,
        uint256 liquidityTokens
    );
    
    event LiquidityRemoved(
        address indexed shareToken,
        address indexed provider,
        uint256 shareAmount,
        uint256 usdAmount,
        uint256 liquidityTokens
    );
    
    event DEXTradeExecuted(
        address indexed shareToken,
        uint256 amountIn,
        uint256 amountOut,
        bool isShareToUSD,
        uint32 dstChain
    );
    
    constructor(
        address _endpoint,
        address _owner,
        address _flareOracle,
        address _stablecoin,
        address _feeRecipient
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        flareOracle = FlareOracle(_flareOracle);
        stablecoin = _stablecoin;
        feeRecipient = _feeRecipient;
        nextOrderId = 1;
        
        // Default trading configuration
        tradingConfig = TradingConfig({
            minTradeAmount: 100 * 10**18,      // 100 shares minimum
            maxTradeAmount: 100000 * 10**18,   // 100k shares maximum
            tradingFee: 30,                     // 0.3%
            slippageTolerance: 200,             // 2%
            tradingEnabled: true
        });
    }
    
    /**
     * @dev Place a cross-chain order
     */
    function placeOrder(
        address shareToken,
        uint256 amount,
        uint256 pricePerShare,
        uint32 targetChain,
        bool isBuyOrder,
        uint256 expiration
    ) external payable nonReentrant whenNotPaused returns (uint256 orderId) {
        require(tradingConfig.tradingEnabled, "Trading disabled");
        require(amount >= tradingConfig.minTradeAmount, "Amount too small");
        require(amount <= tradingConfig.maxTradeAmount, "Amount too large");
        require(expiration > block.timestamp, "Invalid expiration");
        require(pricePerShare > 0, "Invalid price");
        
        orderId = nextOrderId++;
        
        // Validate share token
        PropertyShareToken token = PropertyShareToken(shareToken);
        require(token.TOTAL_SHARES() > 0, "Invalid share token");
        
        // For buy orders, escrow stablecoin
        if (isBuyOrder) {
            uint256 totalCost = (amount * pricePerShare) / 10**18;
            uint256 fee = (totalCost * tradingConfig.tradingFee) / 10000;
            
            IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), totalCost + fee);
        } else {
            // For sell orders, escrow share tokens
            IERC20(shareToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Create order
        orders[orderId] = CrossChainOrder({
            orderId: orderId,
            trader: msg.sender,
            shareToken: shareToken,
            amount: amount,
            price: pricePerShare,
            sourceChain: uint32(block.chainid),
            targetChain: targetChain,
            isBuyOrder: isBuyOrder,
            expiration: expiration,
            status: OrderStatus.Pending,
            filledAmount: 0,
            timestamp: block.timestamp
        });
        
        userOrders[msg.sender].push(orderId);
        
        // Send cross-chain message if different chain
        if (targetChain != block.chainid) {
            bytes memory message = abi.encode(
                MSG_TYPE_PLACE_ORDER,
                orderId,
                msg.sender,
                shareToken,
                amount,
                pricePerShare,
                isBuyOrder,
                expiration
            );
            
            _lzSend(targetChain, message, "", MessagingFee(msg.value, 0), payable(msg.sender));
        }
        
        emit OrderPlaced(orderId, msg.sender, shareToken, amount, pricePerShare, isBuyOrder, targetChain);
        
        return orderId;
    }
    
    /**
     * @dev Fill an existing order
     */
    function fillOrder(
        uint256 orderId,
        uint256 fillAmount
    ) external nonReentrant whenNotPaused {
        CrossChainOrder storage order = orders[orderId];
        require(order.orderId == orderId, "Order not found");
        require(order.status == OrderStatus.Pending || order.status == OrderStatus.PartiallyFilled, "Order not fillable");
        require(block.timestamp <= order.expiration, "Order expired");
        require(fillAmount > 0 && fillAmount <= (order.amount - order.filledAmount), "Invalid fill amount");
        
        // Get current price from oracle
        (uint256 currentPrice,,,,,bool isValid) = flareOracle.getShareTokenPrice(order.shareToken);
        require(isValid, "Price not available");
        
        // Check slippage tolerance
        uint256 priceDeviation = currentPrice > order.price ? 
            ((currentPrice - order.price) * 10000) / order.price :
            ((order.price - currentPrice) * 10000) / order.price;
        require(priceDeviation <= tradingConfig.slippageTolerance, "Price slippage too high");
        
        uint256 executionPrice = order.price; // Use order price for execution
        uint256 totalValue = (fillAmount * executionPrice) / 10**18;
        uint256 fee = (totalValue * tradingConfig.tradingFee) / 10000;
        
        if (order.isBuyOrder) {
            // Buyer wants shares, filler provides shares
            IERC20(order.shareToken).safeTransferFrom(msg.sender, order.trader, fillAmount);
            IERC20(stablecoin).safeTransfer(msg.sender, totalValue - fee);
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
        } else {
            // Seller wants USD, filler provides USD
            IERC20(stablecoin).safeTransferFrom(msg.sender, order.trader, totalValue - fee);
            IERC20(order.shareToken).safeTransfer(msg.sender, fillAmount);
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
        }
        
        // Update order
        order.filledAmount += fillAmount;
        if (order.filledAmount == order.amount) {
            order.status = OrderStatus.Filled;
        } else {
            order.status = OrderStatus.PartiallyFilled;
        }
        
        emit OrderFilled(orderId, msg.sender, fillAmount, executionPrice);
    }
    
    /**
     * @dev Cancel an order
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        CrossChainOrder storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.Pending || order.status == OrderStatus.PartiallyFilled, "Order not cancellable");
        
        uint256 remainingAmount = order.amount - order.filledAmount;
        
        if (order.isBuyOrder) {
            // Refund escrowed stablecoin
            uint256 refundAmount = (remainingAmount * order.price) / 10**18;
            IERC20(stablecoin).safeTransfer(order.trader, refundAmount);
        } else {
            // Refund escrowed shares
            IERC20(order.shareToken).safeTransfer(order.trader, remainingAmount);
        }
        
        order.status = OrderStatus.Cancelled;
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @dev Add liquidity to a share token pool
     */
    function addLiquidity(
        address shareToken,
        uint256 shareAmount,
        uint256 usdAmount
    ) external nonReentrant whenNotPaused returns (uint256 liquidityTokens) {
        require(shareAmount > 0 && usdAmount > 0, "Invalid amounts");
        
        LiquidityPool storage pool = liquidityPools[shareToken];
        
        // Transfer tokens
        IERC20(shareToken).safeTransferFrom(msg.sender, address(this), shareAmount);
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), usdAmount);
        
        if (pool.totalLiquidity == 0) {
            // First liquidity provider
            liquidityTokens = shareAmount; // 1:1 ratio initially
            pool.shareToken = shareToken;
            pool.isActive = true;
        } else {
            // Calculate proportional liquidity tokens
            liquidityTokens = (shareAmount * pool.totalLiquidity) / pool.shareReserves;
        }
        
        // Update pool
        pool.shareReserves += shareAmount;
        pool.usdReserves += usdAmount;
        pool.totalLiquidity += liquidityTokens;
        pool.lastPrice = (pool.usdReserves * 10**18) / pool.shareReserves;
        
        emit LiquidityAdded(shareToken, msg.sender, shareAmount, usdAmount, liquidityTokens);
        
        return liquidityTokens;
    }
    
    /**
     * @dev Get trading quote for a share token
     */
    function getQuote(
        address shareToken,
        uint256 amountIn,
        bool isShareToUSD
    ) external view returns (uint256 amountOut, uint256 priceImpact) {
        LiquidityPool storage pool = liquidityPools[shareToken];
        require(pool.isActive, "Pool not active");
        
        if (isShareToUSD) {
            // Selling shares for USD
            uint256 newShareReserves = pool.shareReserves + amountIn;
            uint256 newUsdReserves = (pool.shareReserves * pool.usdReserves) / newShareReserves;
            amountOut = pool.usdReserves - newUsdReserves;
            
            // Calculate price impact
            uint256 newPrice = (newUsdReserves * 10**18) / newShareReserves;
            priceImpact = pool.lastPrice > newPrice ?
                ((pool.lastPrice - newPrice) * 10000) / pool.lastPrice :
                ((newPrice - pool.lastPrice) * 10000) / pool.lastPrice;
        } else {
            // Buying shares with USD
            uint256 newUsdReserves = pool.usdReserves + amountIn;
            uint256 newShareReserves = (pool.shareReserves * pool.usdReserves) / newUsdReserves;
            amountOut = pool.shareReserves - newShareReserves;
            
            // Calculate price impact
            uint256 newPrice = (newUsdReserves * 10**18) / newShareReserves;
            priceImpact = pool.lastPrice > newPrice ?
                ((pool.lastPrice - newPrice) * 10000) / pool.lastPrice :
                ((newPrice - pool.lastPrice) * 10000) / pool.lastPrice;
        }
    }
    
    /**
     * @dev Execute DEX trade
     */
    function executeSwap(
        address shareToken,
        uint256 amountIn,
        uint256 minAmountOut,
        bool isShareToUSD
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        LiquidityPool storage pool = liquidityPools[shareToken];
        require(pool.isActive, "Pool not active");
        
        (uint256 expectedOut, uint256 priceImpact) = this.getQuote(shareToken, amountIn, isShareToUSD);
        require(expectedOut >= minAmountOut, "Slippage too high");
        require(priceImpact <= tradingConfig.slippageTolerance, "Price impact too high");
        
        uint256 fee = (expectedOut * tradingConfig.tradingFee) / 10000;
        amountOut = expectedOut - fee;
        
        if (isShareToUSD) {
            // Selling shares for USD
            IERC20(shareToken).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(stablecoin).safeTransfer(msg.sender, amountOut);
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
            
            pool.shareReserves += amountIn;
            pool.usdReserves -= expectedOut;
        } else {
            // Buying shares with USD
            IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amountIn);
            IERC20(shareToken).safeTransfer(msg.sender, amountOut);
            
            pool.usdReserves += amountIn;
            pool.shareReserves -= expectedOut;
        }
        
        // Update pool price
        pool.lastPrice = (pool.usdReserves * 10**18) / pool.shareReserves;
        
        emit DEXTradeExecuted(shareToken, amountIn, amountOut, isShareToUSD, uint32(block.chainid));
        
        return amountOut;
    }
    
    /**
     * @dev Handle cross-chain messages
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address executor,
        bytes calldata extraData
    ) internal override {
        (uint8 msgType) = abi.decode(message, (uint8));
        
        if (msgType == MSG_TYPE_PLACE_ORDER) {
            _handleCrossChainOrder(message);
        } else if (msgType == MSG_TYPE_FILL_ORDER) {
            _handleOrderFill(message);
        } else if (msgType == MSG_TYPE_CANCEL_ORDER) {
            _handleOrderCancel(message);
        }
    }
    
    /**
     * @dev Handle cross-chain order placement
     */
    function _handleCrossChainOrder(bytes memory message) internal {
        (,uint256 orderId, address trader, address shareToken, uint256 amount, 
         uint256 price, bool isBuyOrder, uint256 expiration) = 
            abi.decode(message, (uint8, uint256, address, address, uint256, uint256, bool, uint256));
        
        // Store cross-chain order locally
        orders[orderId] = CrossChainOrder({
            orderId: orderId,
            trader: trader,
            shareToken: shareToken,
            amount: amount,
            price: price,
            sourceChain: uint32(block.chainid), // Will be overridden by actual source
            targetChain: uint32(block.chainid),
            isBuyOrder: isBuyOrder,
            expiration: expiration,
            status: OrderStatus.Pending,
            filledAmount: 0,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @dev Handle order fill notification
     */
    function _handleOrderFill(bytes memory message) internal {
        (,uint256 orderId, uint256 fillAmount, uint256 price) = 
            abi.decode(message, (uint8, uint256, uint256, uint256));
        
        CrossChainOrder storage order = orders[orderId];
        if (order.orderId == orderId) {
            order.filledAmount += fillAmount;
            if (order.filledAmount >= order.amount) {
                order.status = OrderStatus.Filled;
            } else {
                order.status = OrderStatus.PartiallyFilled;
            }
        }
    }
    
    /**
     * @dev Handle order cancellation
     */
    function _handleOrderCancel(bytes memory message) internal {
        (,uint256 orderId) = abi.decode(message, (uint8, uint256));
        
        CrossChainOrder storage order = orders[orderId];
        if (order.orderId == orderId) {
            order.status = OrderStatus.Cancelled;
        }
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 orderId) external view returns (CrossChainOrder memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Get user orders
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    /**
     * @dev Get liquidity pool info
     */
    function getLiquidityPool(address shareToken) external view returns (LiquidityPool memory) {
        return liquidityPools[shareToken];
    }
    
    /**
     * @dev Update trading configuration (only owner)
     */
    function updateTradingConfig(
        uint256 _minTradeAmount,
        uint256 _maxTradeAmount,
        uint256 _tradingFee,
        uint256 _slippageTolerance,
        bool _tradingEnabled
    ) external onlyOwner {
        require(_tradingFee <= 1000, "Fee too high"); // Max 10%
        require(_slippageTolerance <= 2000, "Slippage too high"); // Max 20%
        
        tradingConfig = TradingConfig({
            minTradeAmount: _minTradeAmount,
            maxTradeAmount: _maxTradeAmount,
            tradingFee: _tradingFee,
            slippageTolerance: _slippageTolerance,
            tradingEnabled: _tradingEnabled
        });
    }
    
    /**
     * @dev Set fee recipient (only owner)
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Emergency pause (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
