# Domus - Web3 Real Estate Platform

Welcome to **Domus**, a revolutionary Web3 real estate platform that introduces property NFTs with cross-chain functionality using LayerZero and decentralized storage through Walrus on the Sui blockchain.

## 🏗️ Architecture Overview

Domus combines cutting-edge blockchain technologies to create a seamless real estate trading experience:

- **🔗 LayerZero OApp**: Enables cross-chain property NFT transfers
- **🗄️ Walrus Storage**: Decentralized document storage on Sui blockchain
- **🎨 NFT Properties**: ERC-721 tokens representing real estate ownership
- **🌐 Multi-Chain**: Trade across Ethereum, Polygon, Arbitrum, Optimism, and more

## 🚀 Features

### For Property Owners
- **NFT Minting**: Convert real estate into tradeable NFTs
- **Document Storage**: Secure, immutable document storage on Walrus
- **Cross-Chain Trading**: List properties on multiple blockchains
- **Ownership Verification**: Blockchain-based proof of ownership
- **Global Marketplace**: Access to international buyers

### For Investors
- **Portfolio Management**: Track property investments across chains
- **Real-Time Analytics**: Market data and price history
- **Fractional Ownership**: Potential for property tokenization
- **Instant Transfers**: Fast, secure property transfers
- **Due Diligence**: Verified documents and property history

### For Brokers
- **Verification System**: Become a verified broker on the platform
- **Commission Tracking**: Automated commission distribution
- **Client Management**: Tools for managing property transactions
- **Document Verification**: Streamlined verification process
- **Multi-Chain Operations**: Serve clients across different networks

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: Smart contract development
- **LayerZero V2**: Cross-chain messaging protocol
- **OpenZeppelin**: Security and standard implementations
- **Hardhat**: Development and testing framework

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **RainbowKit**: Wallet connection interface
- **Wagmi**: React hooks for Ethereum

### Storage
- **Walrus**: Decentralized storage on Sui
- **IPFS**: Content addressing and metadata
- **Sui Client**: Interaction with Sui blockchain

### Infrastructure
- **Vercel**: Frontend deployment
- **Alchemy**: Blockchain infrastructure
- **WalletConnect**: Multi-wallet support

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.0.0 or higher
- **npm/yarn**: Package manager
- **Git**: Version control
- **MetaMask**: Browser wallet for testing
- **Alchemy Account**: For blockchain RPC access
- **WalletConnect Project**: For wallet connections

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harishletsgo/domus.git
   cd domus
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   PRIVATE_KEY=your_private_key
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
   POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-key
   # ... other configuration
   ```

4. **Compile smart contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 🚀 Deployment

### Smart Contract Deployment

1. **Deploy to testnet** (recommended first)
   ```bash
   # Deploy to Sepolia
   npx hardhat run scripts/deploy.ts --network sepolia
   
   # Deploy to Mumbai
   npx hardhat run scripts/deploy.ts --network mumbai
   ```

2. **Deploy to mainnet**
   ```bash
   # Deploy to Ethereum
   npx hardhat run scripts/deploy.ts --network ethereum
   
   # Deploy to Polygon
   npx hardhat run scripts/deploy.ts --network polygon
   ```

3. **Update contract addresses**
   
   After deployment, update `lib/contracts.ts` with your deployed addresses:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     11155111: { // Sepolia
       propertyNFT: '0xYourDeployedAddress',
       // ...
     },
     // ... other networks
   };
   ```

### Frontend Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

## 📚 Usage Guide

### 1. Property Listing

```typescript
import { WalrusStorage } from '@/lib/walrus';
import { createPropertyNFTContract } from '@/lib/contracts';

// Initialize Walrus storage
const walrus = new WalrusStorage('testnet');

// Upload property documents
const documentHashes = await walrus.storeDocuments(files);

// Create property metadata
const metadata = {
  title: "Modern Villa",
  description: "Beautiful modern villa with ocean view",
  propertyType: "RESIDENTIAL",
  location: {
    country: "USA",
    state: "California",
    city: "Malibu",
    // ... other fields
  },
  // ... other metadata
};

// Store metadata in Walrus
const metadataHash = await walrus.storePropertyMetadata(metadata);

// List property as NFT
const contract = createPropertyNFTContract(address, signer);
await contract.listProperty(
  ethers.parseEther("2.5"), // Price in ETH
  metadataHash,
  documentHashes,
  PropertyType.RESIDENTIAL,
  location
);
```

### 2. Cross-Chain Transfer

```typescript
// Calculate transfer fee
const fee = await contract.quote(
  destinationChainId,
  encodedMessage,
  options
);

// Send property to another chain
await contract.sendProperty(
  destinationChainId,
  recipientAddress,
  tokenId,
  options,
  { value: fee.nativeFee }
);
```

### 3. Document Retrieval

```typescript
// Get property metadata from Walrus
const metadata = await walrus.getPropertyMetadata(walrusHash);

// Get specific document
const document = await walrus.getDocument(documentHash);
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Smart Contract Audits**: Audit contracts before mainnet deployment
- **Access Control**: Implement proper role-based access control
- **Input Validation**: Validate all user inputs on frontend and backend
- **Rate Limiting**: Implement rate limiting for API endpoints
- **HTTPS**: Always use HTTPS in production
- **Environment Variables**: Secure sensitive configuration

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/PropertyNFTOApp.test.ts
```

### Test Networks

The platform supports the following test networks:

- **Sepolia**: Ethereum testnet
- **Mumbai**: Polygon testnet
- **Arbitrum Sepolia**: Arbitrum testnet
- **Optimism Sepolia**: Optimism testnet

## 📖 API Documentation

### Smart Contract Events

```solidity
event PropertyListed(uint256 indexed tokenId, address indexed owner, uint256 price, string walrusHash);
event PropertySold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
event CrossChainPropertyTransfer(uint256 indexed tokenId, uint32 indexed dstEid, address indexed to);
```

### Property Structure

```typescript
interface Property {
  tokenId: bigint;
  owner: string;
  price: bigint;
  walrusHash: string;
  documentHashes: string[];
  isListed: boolean;
  isVerified: boolean;
  listedAt: bigint;
  propertyType: PropertyType;
  location: PropertyLocation;
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our detailed guides
- **GitHub Issues**: Report bugs and request features
- **Discord**: Join our community for real-time support
- **Email**: contact@domus.io

## 🗺️ Roadmap

- [x] Core platform development
- [x] LayerZero OApp integration
- [x] Walrus storage integration
- [ ] Mobile app development
- [ ] Fractional ownership features
- [ ] Advanced analytics dashboard
- [ ] Integration with traditional MLS systems
- [ ] Governance token launch
- [ ] DAO implementation

## 🙏 Acknowledgments

- **LayerZero**: For omnichain infrastructure
- **Walrus/Sui**: For decentralized storage solutions
- **OpenZeppelin**: For secure smart contract libraries
- **Next.js Team**: For the amazing React framework
- **Ethereum Foundation**: For the foundational technology

---

Built with ❤️ for the Web3 community by the Domus team.
