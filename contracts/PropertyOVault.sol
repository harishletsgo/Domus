// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/utils/RateLimiter.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PropertyShareToken.sol";

/**
 * @title PropertyOVault
 * @dev LayerZero OVault for fractionalizing property NFTs across chains
 * Locks original NFT and issues share tokens that can be traded cross-chain
 */
contract PropertyOVault is OApp, IERC721Receiver, ReentrancyGuard, Pausable {
    using RateLimiter for RateLimiter.RateLimit;
    
    // Vault configuration
    struct VaultConfig {
        uint256 minimumLockPeriod;     // Minimum time NFT must be locked
        uint256 fractionalizationFee;  // Fee for creating share tokens (basis points)
        uint256 redemptionThreshold;   // Minimum shares needed for redemption (basis points)
        bool redemptionEnabled;        // Whether redemption is allowed
    }
    
    // Fractionalized property info
    struct FractionalizedProperty {
        uint256 tokenId;
        address nftContract;
        address shareToken;
        address originalOwner;
        uint256 lockTimestamp;
        uint256 propertyValue;
        bool isActive;
        string title;
        string location;
    }
    
    // Cross-chain message types
    uint8 constant MSG_TYPE_TRANSFER_SHARES = 1;
    uint8 constant MSG_TYPE_SYNC_METADATA = 2;
    uint8 constant MSG_TYPE_DISTRIBUTE_DIVIDENDS = 3;
    
    // State variables
    VaultConfig public vaultConfig;
    address public feeRecipient;
    uint256 public nextVaultId;
    
    // Mappings
    mapping(uint256 => FractionalizedProperty) public fractionalizedProperties;
    mapping(address => mapping(uint256 => uint256)) public nftToVaultId; // nft contract => token id => vault id
    mapping(address => uint256[]) public ownerVaults;
    mapping(uint32 => RateLimiter.RateLimit) public rateLimits;
    
    // Events
    event PropertyFractionalized(
        uint256 indexed vaultId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address shareToken,
        address owner,
        uint256 propertyValue
    );
    
    event ShareTokensRedeemed(
        uint256 indexed vaultId,
        address indexed redeemer,
        uint256 sharesRedeemed,
        address nftRecipient
    );
    
    event PropertyMetadataUpdated(
        uint256 indexed vaultId,
        string title,
        string location,
        uint256 newValue
    );
    
    event CrossChainTransfer(
        uint256 indexed vaultId,
        uint32 indexed dstEid,
        address indexed recipient,
        uint256 amount
    );
    
    event DividendsDistributed(
        uint256 indexed vaultId,
        uint256 amount,
        uint32[] dstEids
    );
    
    event VaultConfigUpdated(
        uint256 minimumLockPeriod,
        uint256 fractionalizationFee,
        uint256 redemptionThreshold,
        bool redemptionEnabled
    );
    
    constructor(
        address _endpoint,
        address _owner,
        address _feeRecipient
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        feeRecipient = _feeRecipient;
        nextVaultId = 1;
        
        // Default vault configuration
        vaultConfig = VaultConfig({
            minimumLockPeriod: 30 days,
            fractionalizationFee: 100, // 1%
            redemptionThreshold: 8000,  // 80%
            redemptionEnabled: true
        });
    }
    
    /**
     * @dev Fractionalize a property NFT into share tokens
     */
    function fractionalizeProperty(
        address nftContract,
        uint256 tokenId,
        uint256 propertyValue,
        string memory title,
        string memory location,
        string memory shareTokenName,
        string memory shareTokenSymbol
    ) external payable nonReentrant whenNotPaused returns (uint256 vaultId, address shareToken) {
        require(propertyValue > 0, "Property value must be > 0");
        require(bytes(title).length > 0, "Title required");
        
        // Calculate fractionalization fee
        uint256 fee = (propertyValue * vaultConfig.fractionalizationFee) / 10000;
        require(msg.value >= fee, "Insufficient fee");
        
        // Transfer NFT to vault
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        vaultId = nextVaultId++;
        
        // Create share token
        PropertyShareToken newShareToken = new PropertyShareToken(
            shareTokenName,
            shareTokenSymbol,
            tokenId,
            nftContract,
            address(this),
            title,
            location,
            propertyValue,
            feeRecipient,
            msg.sender
        );
        
        shareToken = address(newShareToken);
        
        // Store fractionalized property info
        fractionalizedProperties[vaultId] = FractionalizedProperty({
            tokenId: tokenId,
            nftContract: nftContract,
            shareToken: shareToken,
            originalOwner: msg.sender,
            lockTimestamp: block.timestamp,
            propertyValue: propertyValue,
            isActive: true,
            title: title,
            location: location
        });
        
        nftToVaultId[nftContract][tokenId] = vaultId;
        ownerVaults[msg.sender].push(vaultId);
        
        // Send fee to recipient
        if (fee > 0) {
            (bool success, ) = payable(feeRecipient).call{value: fee}("");
            require(success, "Fee transfer failed");
        }
        
        // Refund excess
        if (msg.value > fee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - fee}("");
            require(success, "Refund failed");
        }
        
        emit PropertyFractionalized(
            vaultId,
            tokenId,
            nftContract,
            shareToken,
            msg.sender,
            propertyValue
        );
        
        return (vaultId, shareToken);
    }
    
    /**
     * @dev Redeem share tokens for the original NFT
     */
    function redeemProperty(uint256 vaultId) external nonReentrant whenNotPaused {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        require(property.isActive, "Vault not active");
        require(vaultConfig.redemptionEnabled, "Redemption disabled");
        require(
            block.timestamp >= property.lockTimestamp + vaultConfig.minimumLockPeriod,
            "Lock period not expired"
        );
        
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        uint256 totalShares = shareToken.TOTAL_SHARES();
        uint256 userShares = shareToken.balanceOf(msg.sender);
        uint256 requiredShares = (totalShares * vaultConfig.redemptionThreshold) / 10000;
        
        require(userShares >= requiredShares, "Insufficient shares for redemption");
        
        // Burn the shares
        shareToken.transferFrom(msg.sender, address(this), userShares);
        
        // Transfer NFT back
        IERC721(property.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            property.tokenId
        );
        
        // Mark vault as inactive
        property.isActive = false;
        
        emit ShareTokensRedeemed(vaultId, msg.sender, userShares, msg.sender);
    }
    
    /**
     * @dev Update property metadata and value
     */
    function updatePropertyMetadata(
        uint256 vaultId,
        string memory newTitle,
        string memory newLocation,
        uint256 newValue
    ) external {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        require(property.isActive, "Vault not active");
        require(
            msg.sender == property.originalOwner || msg.sender == owner(),
            "Not authorized"
        );
        
        property.title = newTitle;
        property.location = newLocation;
        property.propertyValue = newValue;
        
        // Update share token metadata
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        shareToken.updatePropertyMetadata(newTitle, newLocation, newValue);
        
        emit PropertyMetadataUpdated(vaultId, newTitle, newLocation, newValue);
    }
    
    /**
     * @dev Distribute dividends to share token holders
     */
    function distributeDividends(uint256 vaultId) external payable nonReentrant {
        require(msg.value > 0, "No dividends to distribute");
        
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        require(property.isActive, "Vault not active");
        
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        
        // Distribute dividends to share token
        (bool success, ) = payable(property.shareToken).call{value: msg.value}("");
        require(success, "Dividend distribution failed");
        
        // TODO: Implement cross-chain dividend distribution
        uint32[] memory dstEids = new uint32[](0); // Placeholder
        emit DividendsDistributed(vaultId, msg.value, dstEids);
    }
    
    /**
     * @dev Cross-chain share transfer (LayerZero)
     */
    function sendSharesTo(
        uint256 vaultId,
        uint32 dstEid,
        address recipient,
        uint256 amount,
        bytes calldata options
    ) external payable {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        require(property.isActive, "Vault not active");
        
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        require(shareToken.balanceOf(msg.sender) >= amount, "Insufficient shares");
        
        // Lock shares in this vault
        shareToken.transferFrom(msg.sender, address(this), amount);
        
        // Prepare cross-chain message
        bytes memory message = abi.encode(
            MSG_TYPE_TRANSFER_SHARES,
            vaultId,
            recipient,
            amount,
            msg.sender
        );
        
        // Send via LayerZero
        _lzSend(dstEid, message, options, MessagingFee(msg.value, 0), payable(msg.sender));
        
        emit CrossChainTransfer(vaultId, dstEid, recipient, amount);
    }
    
    /**
     * @dev Receive cross-chain messages
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address executor,
        bytes calldata extraData
    ) internal override {
        (uint8 msgType, uint256 vaultId, address recipient, uint256 amount, address sender) = 
            abi.decode(message, (uint8, uint256, address, uint256, address));
        
        if (msgType == MSG_TYPE_TRANSFER_SHARES) {
            // Mint shares to recipient on this chain
            FractionalizedProperty storage property = fractionalizedProperties[vaultId];
            if (property.isActive) {
                PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
                // Transfer from vault to recipient
                shareToken.transfer(recipient, amount);
            }
        }
        // TODO: Handle other message types (metadata sync, dividends)
    }
    
    /**
     * @dev Get property information
     */
    function getPropertyInfo(uint256 vaultId) external view returns (
        uint256 tokenId,
        address nftContract,
        address shareToken,
        address originalOwner,
        uint256 lockTimestamp,
        uint256 propertyValue,
        bool isActive,
        string memory title,
        string memory location
    ) {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        return (
            property.tokenId,
            property.nftContract,
            property.shareToken,
            property.originalOwner,
            property.lockTimestamp,
            property.propertyValue,
            property.isActive,
            property.title,
            property.location
        );
    }
    
    /**
     * @dev Get all vaults owned by an address
     */
    function getOwnerVaults(address owner) external view returns (uint256[] memory) {
        return ownerVaults[owner];
    }
    
    /**
     * @dev Update vault configuration (only owner)
     */
    function updateVaultConfig(
        uint256 _minimumLockPeriod,
        uint256 _fractionalizationFee,
        uint256 _redemptionThreshold,
        bool _redemptionEnabled
    ) external onlyOwner {
        require(_fractionalizationFee <= 1000, "Fee too high"); // Max 10%
        require(_redemptionThreshold <= 10000, "Threshold too high");
        
        vaultConfig = VaultConfig({
            minimumLockPeriod: _minimumLockPeriod,
            fractionalizationFee: _fractionalizationFee,
            redemptionThreshold: _redemptionThreshold,
            redemptionEnabled: _redemptionEnabled
        });
        
        emit VaultConfigUpdated(
            _minimumLockPeriod,
            _fractionalizationFee,
            _redemptionThreshold,
            _redemptionEnabled
        );
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
     * @dev Handle NFT transfers
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /**
     * @dev Emergency withdrawal for stuck tokens (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // ETH
            (bool success, ) = payable(owner()).call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            // ERC20
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev Calculate shares needed for redemption
     */
    function getRedemptionRequirement(uint256 vaultId) external view returns (uint256) {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        if (!property.isActive) return 0;
        
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        uint256 totalShares = shareToken.TOTAL_SHARES();
        return (totalShares * vaultConfig.redemptionThreshold) / 10000;
    }
    
    /**
     * @dev Check if property can be redeemed
     */
    function canRedeem(uint256 vaultId, address user) external view returns (bool) {
        FractionalizedProperty storage property = fractionalizedProperties[vaultId];
        if (!property.isActive || !vaultConfig.redemptionEnabled) return false;
        
        if (block.timestamp < property.lockTimestamp + vaultConfig.minimumLockPeriod) {
            return false;
        }
        
        PropertyShareToken shareToken = PropertyShareToken(property.shareToken);
        uint256 userShares = shareToken.balanceOf(user);
        uint256 requiredShares = (shareToken.TOTAL_SHARES() * vaultConfig.redemptionThreshold) / 10000;
        
        return userShares >= requiredShares;
    }
}
