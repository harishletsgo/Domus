import { ethers } from 'ethers';

// Contract ABIs - In production, these would be imported from build artifacts
export const PROPERTY_NFT_ABI = [
  // ERC721 Standard Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  
  // Custom Property Functions
  "function listProperty(uint256 price, string walrusHash, string[] documentHashes, uint8 propertyType, tuple(string country, string state, string city, string zipCode, string streetAddress, int256 latitude, int256 longitude) location) returns (uint256)",
  "function purchaseProperty(uint256 tokenId) payable",
  "function updatePropertyPrice(uint256 tokenId, uint256 newPrice)",
  "function updatePropertyDocuments(uint256 tokenId, string[] newDocumentHashes)",
  "function verifyProperty(uint256 tokenId)",
  "function toggleListing(uint256 tokenId)",
  "function getProperty(uint256 tokenId) view returns (tuple(uint256 tokenId, address owner, uint256 price, string walrusHash, string[] documentHashes, bool isListed, bool isVerified, uint256 listedAt, uint8 propertyType, tuple(string country, string state, string city, string zipCode, string streetAddress, int256 latitude, int256 longitude) location))",
  "function getOwnerProperties(address owner) view returns (uint256[])",
  "function getListedProperties(uint256 offset, uint256 limit) view returns (tuple(uint256 tokenId, address owner, uint256 price, string walrusHash, string[] documentHashes, bool isListed, bool isVerified, uint256 listedAt, uint8 propertyType, tuple(string country, string state, string city, string zipCode, string streetAddress, int256 latitude, int256 longitude) location)[])",
  
  // LayerZero Functions
  "function sendProperty(uint32 dstEid, address to, uint256 tokenId, bytes options) payable",
  "function quote(uint32 dstEid, bytes message, bytes options) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
  
  // Admin Functions
  "function addVerifiedBroker(address broker)",
  "function removeVerifiedBroker(address broker)",
  "function setPlatformFee(uint256 fee)",
  "function setFeeRecipient(address feeRecipient)",
  "function setMinimumListingPrice(uint256 price)",
  "function pause()",
  "function unpause()",
  
  // Events
  "event PropertyListed(uint256 indexed tokenId, address indexed owner, uint256 price, string walrusHash)",
  "event PropertySold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)",
  "event PropertyUpdated(uint256 indexed tokenId, string newWalrusHash)",
  "event CrossChainPropertyTransfer(uint256 indexed tokenId, uint32 indexed dstEid, address indexed to)",
  "event DocumentsUpdated(uint256 indexed tokenId, string[] documentHashes)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
];

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Mainnets
  1: { // Ethereum
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x1a44076050125825900e736c501f859c50fE728c',
  },
  137: { // Polygon
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x1a44076050125825900e736c501f859c50fE728c',
  },
  42161: { // Arbitrum
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x1a44076050125825900e736c501f859c50fE728c',
  },
  10: { // Optimism
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x1a44076050125825900e736c501f859c50fE728c',
  },
  
  // Testnets
  11155111: { // Sepolia
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  },
  80001: { // Mumbai
    propertyNFT: '0x0000000000000000000000000000000000000000', // Deploy address
    layerZeroEndpoint: '0x6EDCE65403992e310A62460808c4b910D972f10f',
  },
} as const;

// LayerZero Chain IDs
export const LAYERZERO_CHAIN_IDS = {
  ethereum: 30101,
  polygon: 30109,
  arbitrum: 30110,
  optimism: 30111,
  sepolia: 40161,
  mumbai: 40109,
} as const;

export interface PropertyLocation {
  country: string;
  state: string;
  city: string;
  zipCode: string;
  streetAddress: string;
  latitude: bigint;
  longitude: bigint;
}

export interface Property {
  tokenId: bigint;
  owner: string;
  price: bigint;
  walrusHash: string;
  documentHashes: string[];
  isListed: boolean;
  isVerified: boolean;
  listedAt: bigint;
  propertyType: number;
  location: PropertyLocation;
}

export enum PropertyType {
  RESIDENTIAL = 0,
  COMMERCIAL = 1,
  INDUSTRIAL = 2,
  LAND = 3,
  MIXED_USE = 4,
}

/**
 * Get contract address for the current network
 */
export function getContractAddress(chainId: number, contract: 'propertyNFT' | 'layerZeroEndpoint'): string {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses[contract];
}

/**
 * Create a contract instance
 */
export function createPropertyNFTContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.providers.Provider
): ethers.Contract {
  return new ethers.Contract(address, PROPERTY_NFT_ABI, signerOrProvider);
}

/**
 * Get LayerZero chain ID from network chain ID
 */
export function getLayerZeroChainId(chainId: number): number {
  const mapping: Record<number, number> = {
    1: LAYERZERO_CHAIN_IDS.ethereum,
    137: LAYERZERO_CHAIN_IDS.polygon,
    42161: LAYERZERO_CHAIN_IDS.arbitrum,
    10: LAYERZERO_CHAIN_IDS.optimism,
    11155111: LAYERZERO_CHAIN_IDS.sepolia,
    80001: LAYERZERO_CHAIN_IDS.mumbai,
  };
  
  const lzChainId = mapping[chainId];
  if (!lzChainId) {
    throw new Error(`Unsupported chain ID for LayerZero: ${chainId}`);
  }
  return lzChainId;
}

/**
 * Format property data for contract call
 */
export function formatPropertyForContract(property: {
  price: string;
  walrusHash: string;
  documentHashes: string[];
  propertyType: PropertyType;
  location: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
    streetAddress: string;
    latitude: number;
    longitude: number;
  };
}) {
  return {
    price: ethers.utils.parseEther(property.price),
    walrusHash: property.walrusHash,
    documentHashes: property.documentHashes,
    propertyType: property.propertyType,
    location: {
      country: property.location.country,
      state: property.location.state,
      city: property.location.city,
      zipCode: property.location.zipCode,
      streetAddress: property.location.streetAddress,
      latitude: BigInt(Math.round(property.location.latitude * 1000000)), // Store as fixed point
      longitude: BigInt(Math.round(property.location.longitude * 1000000)), // Store as fixed point
    },
  };
}

/**
 * Parse property data from contract
 */
export function parsePropertyFromContract(contractProperty: any): Property {
  return {
    tokenId: contractProperty.tokenId,
    owner: contractProperty.owner,
    price: contractProperty.price,
    walrusHash: contractProperty.walrusHash,
    documentHashes: contractProperty.documentHashes,
    isListed: contractProperty.isListed,
    isVerified: contractProperty.isVerified,
    listedAt: contractProperty.listedAt,
    propertyType: contractProperty.propertyType,
    location: {
      country: contractProperty.location.country,
      state: contractProperty.location.state,
      city: contractProperty.location.city,
      zipCode: contractProperty.location.zipCode,
      streetAddress: contractProperty.location.streetAddress,
      latitude: contractProperty.location.latitude,
      longitude: contractProperty.location.longitude,
    },
  };
}

/**
 * Calculate cross-chain transfer fee
 */
export async function calculateCrossChainFee(
  contract: ethers.Contract,
  dstChainId: number,
  to: string,
  tokenId: bigint,
  property: Property,
  options: string = '0x'
): Promise<{ nativeFee: bigint; lzTokenFee: bigint }> {
  const message = ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256', 'tuple(uint256,address,uint256,string,string[],bool,bool,uint256,uint8,tuple(string,string,string,string,string,int256,int256))'],
    [to, tokenId, property]
  );
  
  const quote = await contract.quote(dstChainId, message, options);
  return {
    nativeFee: quote.nativeFee,
    lzTokenFee: quote.lzTokenFee,
  };
}

export default {
  PROPERTY_NFT_ABI,
  CONTRACT_ADDRESSES,
  LAYERZERO_CHAIN_IDS,
  PropertyType,
  getContractAddress,
  createPropertyNFTContract,
  getLayerZeroChainId,
  formatPropertyForContract,
  parsePropertyFromContract,
  calculateCrossChainFee,
};
