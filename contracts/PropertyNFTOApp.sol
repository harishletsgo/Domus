// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PropertyNFTOApp
 * @dev LayerZero OApp for cross-chain property NFT management with Walrus storage integration
 */
contract PropertyNFTOApp is OApp, ERC721URIStorage, ReentrancyGuard, Pausable {
    
    // Events
    event PropertyListed(uint256 indexed tokenId, address indexed owner, uint256 price, string walrusHash);
    event PropertySold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event PropertyUpdated(uint256 indexed tokenId, string newWalrusHash);
    event CrossChainPropertyTransfer(uint256 indexed tokenId, uint32 indexed dstEid, address indexed to);
    event DocumentsUpdated(uint256 indexed tokenId, string[] documentHashes);
    
    // Structs
    struct Property {
        uint256 tokenId;
        address owner;
        uint256 price;
        string walrusHash; // Hash for property data stored in Walrus
        string[] documentHashes; // Array of document hashes in Walrus
        bool isListed;
        bool isVerified;
        uint256 listedAt;
        PropertyType propertyType;
        Location location;
    }
    
    struct Location {
        string country;
        string state;
        string city;
        string zipCode;
        string streetAddress;
        int256 latitude;
        int256 longitude;
    }
    
    enum PropertyType {
        RESIDENTIAL,
        COMMERCIAL,
        INDUSTRIAL,
        LAND,
        MIXED_USE
    }
    
    // State variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => Property) public properties;
    mapping(address => uint256[]) public ownerProperties;
    mapping(string => uint256) public walrusHashToTokenId;
    mapping(address => bool) public verifiedBrokers;
    mapping(uint256 => address) public propertyBrokers;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;
    
    // Minimum listing price
    uint256 public minimumListingPrice = 0.01 ether;
    
    modifier onlyPropertyOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not property owner");
        _;
    }
    
    modifier onlyVerifiedBroker() {
        require(verifiedBrokers[msg.sender], "Not verified broker");
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }
    
    constructor(
        address _endpoint,
        address _owner,
        address _feeRecipient
    ) OApp(_endpoint, _owner) ERC721("Domus Property NFT", "DPNFT") Ownable(_owner) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev List a new property as an NFT
     */
    function listProperty(
        uint256 price,
        string memory walrusHash,
        string[] memory documentHashes,
        PropertyType propertyType,
        Location memory location
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(price >= minimumListingPrice, "Price below minimum");
        require(bytes(walrusHash).length > 0, "Walrus hash required");
        require(walrusHashToTokenId[walrusHash] == 0, "Property already exists");
        
        uint256 tokenId = ++_tokenIdCounter;
        
        // Mint NFT to the lister
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, walrusHash);
        
        // Create property record
        properties[tokenId] = Property({
            tokenId: tokenId,
            owner: msg.sender,
            price: price,
            walrusHash: walrusHash,
            documentHashes: documentHashes,
            isListed: true,
            isVerified: false,
            listedAt: block.timestamp,
            propertyType: propertyType,
            location: location
        });
        
        // Update mappings
        ownerProperties[msg.sender].push(tokenId);
        walrusHashToTokenId[walrusHash] = tokenId;
        
        emit PropertyListed(tokenId, msg.sender, price, walrusHash);
        emit DocumentsUpdated(tokenId, documentHashes);
        
        return tokenId;
    }
    
    /**
     * @dev Purchase a listed property
     */
    function purchaseProperty(uint256 tokenId) external payable nonReentrant whenNotPaused validTokenId(tokenId) {
        Property storage property = properties[tokenId];
        require(property.isListed, "Property not listed");
        require(msg.value >= property.price, "Insufficient payment");
        require(msg.sender != property.owner, "Cannot buy own property");
        
        address seller = property.owner;
        uint256 salePrice = property.price;
        
        // Calculate platform fee
        uint256 fee = (salePrice * platformFee) / 10000;
        uint256 sellerAmount = salePrice - fee;
        
        // Update property state
        property.owner = msg.sender;
        property.isListed = false;
        
        // Update owner mappings
        _removeFromOwnerProperties(seller, tokenId);
        ownerProperties[msg.sender].push(tokenId);
        
        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);
        
        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }
        
        emit PropertySold(tokenId, msg.sender, seller, salePrice);
    }
    
    /**
     * @dev Update property listing price
     */
    function updatePropertyPrice(uint256 tokenId, uint256 newPrice) 
        external 
        onlyPropertyOwner(tokenId) 
        validTokenId(tokenId) 
    {
        require(newPrice >= minimumListingPrice, "Price below minimum");
        properties[tokenId].price = newPrice;
    }
    
    /**
     * @dev Update property documents in Walrus storage
     */
    function updatePropertyDocuments(uint256 tokenId, string[] memory newDocumentHashes)
        external
        onlyPropertyOwner(tokenId)
        validTokenId(tokenId)
    {
        properties[tokenId].documentHashes = newDocumentHashes;
        emit DocumentsUpdated(tokenId, newDocumentHashes);
    }
    
    /**
     * @dev Verify property by authorized broker
     */
    function verifyProperty(uint256 tokenId) external onlyVerifiedBroker validTokenId(tokenId) {
        properties[tokenId].isVerified = true;
        propertyBrokers[tokenId] = msg.sender;
    }
    
    /**
     * @dev Toggle property listing status
     */
    function toggleListing(uint256 tokenId) external onlyPropertyOwner(tokenId) validTokenId(tokenId) {
        properties[tokenId].isListed = !properties[tokenId].isListed;
    }
    
    /**
     * @dev Cross-chain transfer property NFT
     */
    function sendProperty(
        uint32 _dstEid,
        address _to,
        uint256 _tokenId,
        bytes calldata _options
    ) external payable onlyPropertyOwner(_tokenId) {
        require(_to != address(0), "Invalid recipient");
        
        // Encode the message
        bytes memory _payload = abi.encode(_to, _tokenId, properties[_tokenId]);
        
        // Send cross-chain message
        _lzSend(_dstEid, _payload, _options, MessagingFee(msg.value, 0), payable(msg.sender));
        
        emit CrossChainPropertyTransfer(_tokenId, _dstEid, _to);
    }
    
    /**
     * @dev Handle incoming cross-chain messages
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        (address to, uint256 tokenId, Property memory property) = abi.decode(_message, (address, uint256, Property));
        
        // Mint NFT on destination chain
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, property.walrusHash);
        
        // Set property data
        properties[tokenId] = property;
        properties[tokenId].owner = to;
        ownerProperties[to].push(tokenId);
        walrusHashToTokenId[property.walrusHash] = tokenId;
    }
    
    /**
     * @dev Get property details
     */
    function getProperty(uint256 tokenId) external view validTokenId(tokenId) returns (Property memory) {
        return properties[tokenId];
    }
    
    /**
     * @dev Get properties owned by an address
     */
    function getOwnerProperties(address owner) external view returns (uint256[] memory) {
        return ownerProperties[owner];
    }
    
    /**
     * @dev Get all listed properties (paginated)
     */
    function getListedProperties(uint256 offset, uint256 limit) 
        external 
        view 
        returns (Property[] memory listedProperties) 
    {
        uint256 totalListed = 0;
        
        // Count listed properties
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (properties[i].isListed) {
                totalListed++;
            }
        }
        
        require(offset < totalListed, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > totalListed) {
            end = totalListed;
        }
        
        listedProperties = new Property[](end - offset);
        uint256 currentIndex = 0;
        uint256 found = 0;
        
        for (uint256 i = 1; i <= _tokenIdCounter && found < end; i++) {
            if (properties[i].isListed) {
                if (found >= offset) {
                    listedProperties[currentIndex] = properties[i];
                    currentIndex++;
                }
                found++;
            }
        }
    }
    
    /**
     * @dev Admin functions
     */
    function addVerifiedBroker(address broker) external onlyOwner {
        verifiedBrokers[broker] = true;
    }
    
    function removeVerifiedBroker(address broker) external onlyOwner {
        verifiedBrokers[broker] = false;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    function setMinimumListingPrice(uint256 _price) external onlyOwner {
        minimumListingPrice = _price;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Internal helper to remove token from owner's property list
     */
    function _removeFromOwnerProperties(address owner, uint256 tokenId) internal {
        uint256[] storage properties = ownerProperties[owner];
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i] == tokenId) {
                properties[i] = properties[properties.length - 1];
                properties.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
