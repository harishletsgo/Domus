// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FlareOracle
 * @dev Integration with Flare Time Series Oracle (FTSO) for property share token price feeds
 * Provides decentralized, reliable price data for fractional property shares
 */

// Interface for Flare Time Series Oracle
interface IFtsoV2FeedConsumer {
    function getFeedById(bytes21 feedId) external view returns (
        uint256 value,
        int8 decimals,
        uint64 timestamp
    );
}

// Interface for Flare Price Submitter
interface IPriceSubmitter {
    function submitPriceHashes(
        uint256 _epochId,
        bytes32[] memory _hashes
    ) external;
    
    function revealPrices(
        uint256 _epochId,
        uint256[] memory _prices,
        uint256[] memory _randoms
    ) external;
}

contract FlareOracle is Ownable, ReentrancyGuard {
    // Flare FTSO interfaces
    IFtsoV2FeedConsumer public immutable ftsoFeedConsumer;
    IPriceSubmitter public immutable priceSubmitter;
    
    // Price feed configuration
    struct PriceFeed {
        bytes21 feedId;
        string symbol;
        uint256 lastPrice;
        uint256 lastUpdateTime;
        int8 decimals;
        bool isActive;
        uint256 heartbeatInterval; // Max time between updates
        uint256 deviationThreshold; // Max price deviation % (basis points)
    }
    
    // Property share token price data
    struct ShareTokenPrice {
        address shareToken;
        uint256 price;          // Price in USD (with decimals)
        uint256 timestamp;
        uint256 volume24h;      // 24h trading volume
        uint256 marketCap;      // Market capitalization
        uint256 priceChange24h; // 24h price change (basis points)
        bool isValid;
    }
    
    // Price history for analytics
    struct PricePoint {
        uint256 timestamp;
        uint256 price;
        uint256 volume;
    }
    
    // State variables
    mapping(bytes21 => PriceFeed) public priceFeeds;
    mapping(address => ShareTokenPrice) public shareTokenPrices;
    mapping(address => PricePoint[]) public priceHistory;
    mapping(address => bool) public authorizedUpdaters;
    
    bytes21[] public activeFeedIds;
    address[] public trackedShareTokens;
    
    // Oracle configuration
    uint256 public maxPriceAge = 1 hours;
    uint256 public minUpdateInterval = 5 minutes;
    uint256 public maxDeviationBasisPoints = 1000; // 10%
    
    // Events
    event PriceFeedAdded(bytes21 indexed feedId, string symbol);
    event PriceFeedUpdated(bytes21 indexed feedId, uint256 price, uint256 timestamp);
    event ShareTokenPriceUpdated(
        address indexed shareToken,
        uint256 price,
        uint256 timestamp,
        uint256 volume24h
    );
    event PriceDeviationAlert(
        address indexed shareToken,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 deviation
    );
    event OracleConfigUpdated(
        uint256 maxPriceAge,
        uint256 minUpdateInterval,
        uint256 maxDeviationBasisPoints
    );
    
    constructor(
        address _ftsoFeedConsumer,
        address _priceSubmitter,
        address _owner
    ) Ownable(_owner) {
        ftsoFeedConsumer = IFtsoV2FeedConsumer(_ftsoFeedConsumer);
        priceSubmitter = IPriceSubmitter(_priceSubmitter);
    }
    
    /**
     * @dev Add a new price feed to track
     */
    function addPriceFeed(
        bytes21 feedId,
        string memory symbol,
        uint256 heartbeatInterval,
        uint256 deviationThreshold
    ) external onlyOwner {
        require(!priceFeeds[feedId].isActive, "Feed already exists");
        
        priceFeeds[feedId] = PriceFeed({
            feedId: feedId,
            symbol: symbol,
            lastPrice: 0,
            lastUpdateTime: 0,
            decimals: 0,
            isActive: true,
            heartbeatInterval: heartbeatInterval,
            deviationThreshold: deviationThreshold
        });
        
        activeFeedIds.push(feedId);
        
        emit PriceFeedAdded(feedId, symbol);
    }
    
    /**
     * @dev Update price feed from Flare FTSO
     */
    function updatePriceFeed(bytes21 feedId) external onlyAuthorizedUpdater {
        require(priceFeeds[feedId].isActive, "Feed not active");
        
        (uint256 value, int8 decimals, uint64 timestamp) = ftsoFeedConsumer.getFeedById(feedId);
        
        require(timestamp > priceFeeds[feedId].lastUpdateTime, "Price not newer");
        require(block.timestamp - timestamp <= maxPriceAge, "Price too old");
        
        PriceFeed storage feed = priceFeeds[feedId];
        feed.lastPrice = value;
        feed.lastUpdateTime = timestamp;
        feed.decimals = decimals;
        
        emit PriceFeedUpdated(feedId, value, timestamp);
    }
    
    /**
     * @dev Update share token price with volume and market data
     */
    function updateShareTokenPrice(
        address shareToken,
        uint256 price,
        uint256 volume24h,
        uint256 marketCap
    ) external onlyAuthorizedUpdater {
        require(shareToken != address(0), "Invalid share token");
        require(price > 0, "Invalid price");
        
        ShareTokenPrice storage tokenPrice = shareTokenPrices[shareToken];
        
        // Calculate price change if previous price exists
        uint256 priceChange24h = 0;
        if (tokenPrice.price > 0) {
            if (price > tokenPrice.price) {
                priceChange24h = ((price - tokenPrice.price) * 10000) / tokenPrice.price;
            } else {
                priceChange24h = ((tokenPrice.price - price) * 10000) / tokenPrice.price;
                priceChange24h = 10000 - priceChange24h; // Negative change representation
            }
            
            // Check for significant price deviation
            uint256 deviation = priceChange24h > 10000 ? priceChange24h - 10000 : 10000 - priceChange24h;
            if (deviation > maxDeviationBasisPoints) {
                emit PriceDeviationAlert(shareToken, tokenPrice.price, price, deviation);
            }
        }
        
        // Update price data
        tokenPrice.shareToken = shareToken;
        tokenPrice.price = price;
        tokenPrice.timestamp = block.timestamp;
        tokenPrice.volume24h = volume24h;
        tokenPrice.marketCap = marketCap;
        tokenPrice.priceChange24h = priceChange24h;
        tokenPrice.isValid = true;
        
        // Add to price history
        priceHistory[shareToken].push(PricePoint({
            timestamp: block.timestamp,
            price: price,
            volume: volume24h
        }));
        
        // Limit price history to last 1000 points
        if (priceHistory[shareToken].length > 1000) {
            // Shift array left (remove oldest)
            for (uint i = 0; i < priceHistory[shareToken].length - 1; i++) {
                priceHistory[shareToken][i] = priceHistory[shareToken][i + 1];
            }
            priceHistory[shareToken].pop();
        }
        
        // Add to tracked tokens if new
        bool isTracked = false;
        for (uint i = 0; i < trackedShareTokens.length; i++) {
            if (trackedShareTokens[i] == shareToken) {
                isTracked = true;
                break;
            }
        }
        if (!isTracked) {
            trackedShareTokens.push(shareToken);
        }
        
        emit ShareTokenPriceUpdated(shareToken, price, block.timestamp, volume24h);
    }
    
    /**
     * @dev Get latest price for a share token
     */
    function getShareTokenPrice(address shareToken) external view returns (
        uint256 price,
        uint256 timestamp,
        uint256 volume24h,
        uint256 marketCap,
        uint256 priceChange24h,
        bool isValid
    ) {
        ShareTokenPrice storage tokenPrice = shareTokenPrices[shareToken];
        return (
            tokenPrice.price,
            tokenPrice.timestamp,
            tokenPrice.volume24h,
            tokenPrice.marketCap,
            tokenPrice.priceChange24h,
            tokenPrice.isValid && (block.timestamp - tokenPrice.timestamp <= maxPriceAge)
        );
    }
    
    /**
     * @dev Get price feed value
     */
    function getPriceFeed(bytes21 feedId) external view returns (
        uint256 price,
        uint256 timestamp,
        int8 decimals,
        bool isValid
    ) {
        PriceFeed storage feed = priceFeeds[feedId];
        return (
            feed.lastPrice,
            feed.lastUpdateTime,
            feed.decimals,
            feed.isActive && (block.timestamp - feed.lastUpdateTime <= feed.heartbeatInterval)
        );
    }
    
    /**
     * @dev Get price history for a share token
     */
    function getPriceHistory(
        address shareToken,
        uint256 startIndex,
        uint256 count
    ) external view returns (PricePoint[] memory) {
        PricePoint[] storage history = priceHistory[shareToken];
        require(startIndex < history.length, "Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > history.length) {
            endIndex = history.length;
        }
        
        PricePoint[] memory result = new PricePoint[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = history[i];
        }
        
        return result;
    }
    
    /**
     * @dev Calculate time-weighted average price (TWAP)
     */
    function getTWAP(
        address shareToken,
        uint256 timeWindow
    ) external view returns (uint256) {
        PricePoint[] storage history = priceHistory[shareToken];
        if (history.length == 0) return 0;
        
        uint256 cutoffTime = block.timestamp - timeWindow;
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = history.length; i > 0; i--) {
            PricePoint storage point = history[i - 1];
            if (point.timestamp < cutoffTime) break;
            
            uint256 weight = point.volume > 0 ? point.volume : 1;
            weightedSum += point.price * weight;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    /**
     * @dev Get market statistics for a share token
     */
    function getMarketStats(address shareToken) external view returns (
        uint256 currentPrice,
        uint256 dayHigh,
        uint256 dayLow,
        uint256 volume24h,
        uint256 marketCap,
        uint256 priceChange24h
    ) {
        ShareTokenPrice storage tokenPrice = shareTokenPrices[shareToken];
        
        // Calculate day high/low from recent history
        PricePoint[] storage history = priceHistory[shareToken];
        uint256 cutoffTime = block.timestamp - 24 hours;
        
        dayHigh = tokenPrice.price;
        dayLow = tokenPrice.price;
        
        for (uint256 i = history.length; i > 0; i--) {
            PricePoint storage point = history[i - 1];
            if (point.timestamp < cutoffTime) break;
            
            if (point.price > dayHigh) dayHigh = point.price;
            if (point.price < dayLow) dayLow = point.price;
        }
        
        return (
            tokenPrice.price,
            dayHigh,
            dayLow,
            tokenPrice.volume24h,
            tokenPrice.marketCap,
            tokenPrice.priceChange24h
        );
    }
    
    /**
     * @dev Set authorized updater status
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
    }
    
    /**
     * @dev Update oracle configuration
     */
    function updateOracleConfig(
        uint256 _maxPriceAge,
        uint256 _minUpdateInterval,
        uint256 _maxDeviationBasisPoints
    ) external onlyOwner {
        maxPriceAge = _maxPriceAge;
        minUpdateInterval = _minUpdateInterval;
        maxDeviationBasisPoints = _maxDeviationBasisPoints;
        
        emit OracleConfigUpdated(_maxPriceAge, _minUpdateInterval, _maxDeviationBasisPoints);
    }
    
    /**
     * @dev Get all tracked share tokens
     */
    function getTrackedShareTokens() external view returns (address[] memory) {
        return trackedShareTokens;
    }
    
    /**
     * @dev Get all active feed IDs
     */
    function getActiveFeedIds() external view returns (bytes21[] memory) {
        return activeFeedIds;
    }
    
    /**
     * @dev Check if price is fresh
     */
    function isPriceFresh(address shareToken) external view returns (bool) {
        ShareTokenPrice storage tokenPrice = shareTokenPrices[shareToken];
        return tokenPrice.isValid && (block.timestamp - tokenPrice.timestamp <= maxPriceAge);
    }
    
    /**
     * @dev Batch update multiple share token prices
     */
    function batchUpdateShareTokenPrices(
        address[] memory shareTokens,
        uint256[] memory prices,
        uint256[] memory volumes,
        uint256[] memory marketCaps
    ) external onlyAuthorizedUpdater {
        require(
            shareTokens.length == prices.length &&
            prices.length == volumes.length &&
            volumes.length == marketCaps.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < shareTokens.length; i++) {
            this.updateShareTokenPrice(
                shareTokens[i],
                prices[i],
                volumes[i],
                marketCaps[i]
            );
        }
    }
    
    /**
     * @dev Modifier for authorized updaters
     */
    modifier onlyAuthorizedUpdater() {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "Not authorized updater"
        );
        _;
    }
    
    /**
     * @dev Emergency function to deactivate a price feed
     */
    function deactivatePriceFeed(bytes21 feedId) external onlyOwner {
        priceFeeds[feedId].isActive = false;
    }
    
    /**
     * @dev Emergency function to remove a share token from tracking
     */
    function removeShareToken(address shareToken) external onlyOwner {
        shareTokenPrices[shareToken].isValid = false;
        
        // Remove from tracked tokens array
        for (uint i = 0; i < trackedShareTokens.length; i++) {
            if (trackedShareTokens[i] == shareToken) {
                trackedShareTokens[i] = trackedShareTokens[trackedShareTokens.length - 1];
                trackedShareTokens.pop();
                break;
            }
        }
    }
}
