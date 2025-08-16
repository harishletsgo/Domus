import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment process...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  // LayerZero Endpoints by network
  const layerZeroEndpoints: { [key: string]: string } = {
    // Mainnets
    "1": "0x1a44076050125825900e736c501f859c50fE728c", // Ethereum
    "137": "0x1a44076050125825900e736c501f859c50fE728c", // Polygon
    "42161": "0x1a44076050125825900e736c501f859c50fE728c", // Arbitrum
    "10": "0x1a44076050125825900e736c501f859c50fE728c", // Optimism
    "56": "0x1a44076050125825900e736c501f859c50fE728c", // BSC
    
    // Testnets
    "11155111": "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia
    "80001": "0x6EDCE65403992e310A62460808c4b910D972f10f", // Mumbai
    "421614": "0x6EDCE65403992e310A62460808c4b910D972f10f", // Arbitrum Sepolia
    "11155420": "0x6EDCE65403992e310A62460808c4b910D972f10f", // Optimism Sepolia
  };

  const chainId = network.chainId.toString();
  const layerZeroEndpoint = layerZeroEndpoints[chainId];
  
  if (!layerZeroEndpoint) {
    throw new Error(`LayerZero endpoint not configured for chain ID: ${chainId}`);
  }

  console.log("LayerZero Endpoint:", layerZeroEndpoint);

  // Deploy PropertyNFTOApp
  console.log("\n📄 Deploying PropertyNFTOApp...");
  
  const PropertyNFTOAppFactory = await ethers.getContractFactory("PropertyNFTOApp");
  
  // Constructor parameters
  const endpoint = layerZeroEndpoint;
  const owner = deployer.address;
  const feeRecipient = deployer.address; // Can be changed later
  
  console.log("Constructor parameters:");
  console.log("- Endpoint:", endpoint);
  console.log("- Owner:", owner);
  console.log("- Fee Recipient:", feeRecipient);

  const propertyNFTOApp = await PropertyNFTOAppFactory.deploy(
    endpoint,
    owner,
    feeRecipient
  );

  await propertyNFTOApp.deployed();
  const contractAddress = propertyNFTOApp.address;

  console.log("✅ PropertyNFTOApp deployed to:", contractAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    const name = await propertyNFTOApp.name();
    const symbol = await propertyNFTOApp.symbol();
    const owner = await propertyNFTOApp.owner();
    const platformFee = await propertyNFTOApp.platformFee();
    const minimumListingPrice = await propertyNFTOApp.minimumListingPrice();
    
    console.log("Contract verification:");
    console.log("- Name:", name);
    console.log("- Symbol:", symbol);
    console.log("- Owner:", owner);
    console.log("- Platform Fee:", platformFee.toString(), "basis points");
    console.log("- Minimum Listing Price:", ethers.utils.formatEther(minimumListingPrice), "ETH");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
  }

  // Output deployment information
  console.log("\n📋 Deployment Summary:");
  console.log("=" + "=".repeat(50));
  console.log(`Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`PropertyNFTOApp: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`LayerZero Endpoint: ${layerZeroEndpoint}`);
  console.log(`Gas Used: ${ethers.utils.formatEther(await deployer.getBalance())} ETH remaining`);
  console.log("=" + "=".repeat(50));

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    propertyNFTOApp: contractAddress,
    layerZeroEndpoint: layerZeroEndpoint,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${network.name}-${chainId}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to deployments/${network.name}-${chainId}.json`);

  // Instructions for next steps
  console.log("\n📝 Next Steps:");
  console.log("1. Update CONTRACT_ADDRESSES in lib/contracts.ts with the deployed address");
  console.log("2. Verify the contract on block explorer (if on mainnet/testnet)");
  console.log("3. Add verified brokers using addVerifiedBroker()");
  console.log("4. Configure cross-chain peers if deploying on multiple networks");
  console.log("5. Test property listing and cross-chain functionality");

  // Optional: Set up cross-chain peers (if addresses are available)
  if (process.env.SETUP_PEERS === "true") {
    console.log("\n🔗 Setting up cross-chain peers...");
    // This would set up peer contracts on other chains
    // Implementation depends on which chains are deployed
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
