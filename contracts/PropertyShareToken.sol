// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyShareToken
 * @dev ERC20 token representing fractional ownership of a real estate property NFT
 * Fixed supply of 1,000,000 tokens = 100% ownership
 * Supports cross-chain transfers via LayerZero
 */
contract PropertyShareToken is ERC20, ERC20Permit, Ownable, ReentrancyGuard, Pausable {
    // Constants
    uint256 public constant TOTAL_SHARES = 1_000_000 * 10**18; // 1M tokens with 18 decimals
    uint256 public constant BASIS_POINTS = 10_000; // 100% = 10,000 basis points
    
    // Property information
    uint256 public immutable propertyTokenId;
    address public immutable originalNFTContract;
    address public immutable ovaultContract;
    
    // Metadata
    string public propertyTitle;
    string public propertyLocation;
    uint256 public propertyValue; // In wei (ETH)
    
    // Trading and fees
    uint256 public tradingFeeRate = 25; // 0.25% = 25 basis points
    address public feeRecipient;
    uint256 public totalFeesCollected;
    
    // Dividend distribution
    mapping(address => uint256) public lastDividendClaim;
    uint256 public totalDividendsDistributed;
    uint256 public dividendPerShare;
    
    // Governance (for future upgrades)
    mapping(address => bool) public authorizedOperators;
    
    // Events
    event PropertyMetadataUpdated(string title, string location, uint256 value);
    event DividendsDistributed(uint256 totalAmount, uint256 perShare);
    event DividendsClaimed(address indexed shareholder, uint256 amount);
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event OperatorAuthorized(address indexed operator, bool authorized);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _propertyTokenId,
        address _originalNFTContract,
        address _ovaultContract,
        string memory _propertyTitle,
        string memory _propertyLocation,
        uint256 _propertyValue,
        address _feeRecipient,
        address _initialOwner
    ) ERC20(_name, _symbol) ERC20Permit(_name) Ownable(_initialOwner) {
        propertyTokenId = _propertyTokenId;
        originalNFTContract = _originalNFTContract;
        ovaultContract = _ovaultContract;
        propertyTitle = _propertyTitle;
        propertyLocation = _propertyLocation;
        propertyValue = _propertyValue;
        feeRecipient = _feeRecipient;
        
        // Mint all tokens to the OVault contract initially
        _mint(_ovaultContract, TOTAL_SHARES);
    }
    
    /**
     * @dev Update property metadata (only by authorized operators)
     */
    function updatePropertyMetadata(
        string memory _title,
        string memory _location,
        uint256 _value
    ) external onlyAuthorizedOperator {
        propertyTitle = _title;
        propertyLocation = _location;
        propertyValue = _value;
        
        emit PropertyMetadataUpdated(_title, _location, _value);
    }
    
    /**
     * @dev Distribute dividends to all shareholders
     */
    function distributeDividends() external payable nonReentrant {
        require(msg.value > 0, "No dividends to distribute");
        require(totalSupply() > 0, "No tokens in circulation");
        
        uint256 dividendAmount = msg.value;
        uint256 newDividendPerShare = (dividendAmount * 1e18) / totalSupply();
        
        dividendPerShare += newDividendPerShare;
        totalDividendsDistributed += dividendAmount;
        
        emit DividendsDistributed(dividendAmount, newDividendPerShare);
    }
    
    /**
     * @dev Claim dividends for a shareholder
     */
    function claimDividends(address shareholder) external nonReentrant returns (uint256) {
        uint256 shareholderBalance = balanceOf(shareholder);
        require(shareholderBalance > 0, "No shares owned");
        
        uint256 pendingDividends = calculatePendingDividends(shareholder);
        require(pendingDividends > 0, "No dividends to claim");
        
        lastDividendClaim[shareholder] = dividendPerShare;
        
        (bool success, ) = payable(shareholder).call{value: pendingDividends}("");
        require(success, "Dividend transfer failed");
        
        emit DividendsClaimed(shareholder, pendingDividends);
        return pendingDividends;
    }
    
    /**
     * @dev Calculate pending dividends for a shareholder
     */
    function calculatePendingDividends(address shareholder) public view returns (uint256) {
        uint256 shareholderBalance = balanceOf(shareholder);
        if (shareholderBalance == 0) return 0;
        
        uint256 dividendDiff = dividendPerShare - lastDividendClaim[shareholder];
        return (shareholderBalance * dividendDiff) / 1e18;
    }
    
    /**
     * @dev Get ownership percentage of a shareholder (in basis points)
     */
    function getOwnershipPercentage(address shareholder) external view returns (uint256) {
        uint256 shareholderBalance = balanceOf(shareholder);
        if (totalSupply() == 0) return 0;
        
        return (shareholderBalance * BASIS_POINTS) / totalSupply();
    }
    
    /**
     * @dev Calculate property value per share
     */
    function getValuePerShare() external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (propertyValue * 1e18) / totalSupply();
    }
    
    /**
     * @dev Transfer with trading fee (if enabled)
     */
    function transferWithFee(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 fee = (amount * tradingFeeRate) / BASIS_POINTS;
        uint256 transferAmount = amount - fee;
        
        if (fee > 0) {
            _transfer(msg.sender, feeRecipient, fee);
            totalFeesCollected += fee;
        }
        
        _transfer(msg.sender, to, transferAmount);
        return true;
    }
    
    /**
     * @dev Set trading fee rate (only owner)
     */
    function setTradingFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 500, "Fee too high (max 5%)"); // Max 5%
        uint256 oldFee = tradingFeeRate;
        tradingFeeRate = _feeRate;
        
        emit TradingFeeUpdated(oldFee, _feeRate);
    }
    
    /**
     * @dev Set fee recipient (only owner)
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Authorize/deauthorize operators (only owner)
     */
    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        authorizedOperators[operator] = authorized;
        emit OperatorAuthorized(operator, authorized);
    }
    
    /**
     * @dev Modifier for authorized operators
     */
    modifier onlyAuthorizedOperator() {
        require(
            authorizedOperators[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
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
     * @dev Override transfer to update dividend claims
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Update dividend claims for both parties
        if (from != address(0) && lastDividendClaim[from] == 0 && dividendPerShare > 0) {
            lastDividendClaim[from] = dividendPerShare;
        }
        if (to != address(0) && lastDividendClaim[to] == 0 && dividendPerShare > 0) {
            lastDividendClaim[to] = dividendPerShare;
        }
    }
    
    /**
     * @dev Override transfer to handle pausing
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(!paused(), "Token transfers paused");
        super._transfer(from, to, amount);
    }
    
    /**
     * @dev Get comprehensive property information
     */
    function getPropertyInfo() external view returns (
        uint256 tokenId,
        address nftContract,
        string memory title,
        string memory location,
        uint256 value,
        uint256 totalShares,
        uint256 sharesInCirculation
    ) {
        return (
            propertyTokenId,
            originalNFTContract,
            propertyTitle,
            propertyLocation,
            propertyValue,
            TOTAL_SHARES,
            totalSupply()
        );
    }
    
    /**
     * @dev Emergency withdrawal (only owner, for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Receive function to accept ETH for dividends
     */
    receive() external payable {
        if (msg.value > 0) {
            // Auto-distribute received ETH as dividends
            uint256 dividendAmount = msg.value;
            uint256 newDividendPerShare = (dividendAmount * 1e18) / totalSupply();
            
            dividendPerShare += newDividendPerShare;
            totalDividendsDistributed += dividendAmount;
            
            emit DividendsDistributed(dividendAmount, newDividendPerShare);
        }
    }
}
