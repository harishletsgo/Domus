'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { PropertyFormData, MintingResult } from '@/app/list-property/page';
import { PropertyMetadata, WalrusStorage } from '@/lib/walrus';
import { createPropertyNFTContract, getContractAddress, formatPropertyForContract, PropertyType } from '@/lib/contracts';
import { ethers } from 'ethers';
import { CheckCircle, Clock, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface MintingProgressProps {
  propertyData: PropertyFormData;
  onComplete: (result: MintingResult) => void;
  onBack: () => void;
}

type MintingStep = 
  | 'preparing'
  | 'uploading-documents'
  | 'uploading-metadata'
  | 'minting-nft'
  | 'confirming'
  | 'completed'
  | 'error';

interface StepStatus {
  step: MintingStep;
  status: 'pending' | 'active' | 'completed' | 'error';
  message: string;
  txHash?: string;
  error?: string;
}

export function MintingProgress({ propertyData, onComplete, onBack }: MintingProgressProps) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [currentStep, setCurrentStep] = useState<MintingStep>('preparing');
  const [steps, setSteps] = useState<StepStatus[]>([
    { step: 'preparing', status: 'active', message: 'Preparing property data...' },
    { step: 'uploading-documents', status: 'pending', message: 'Uploading documents to Walrus...' },
    { step: 'uploading-metadata', status: 'pending', message: 'Storing metadata on Walrus...' },
    { step: 'minting-nft', status: 'pending', message: 'Minting property NFT...' },
    { step: 'confirming', status: 'pending', message: 'Confirming transaction...' },
  ]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateStepStatus = (step: MintingStep, status: 'pending' | 'active' | 'completed' | 'error', message: string, txHash?: string, error?: string) => {
    setSteps(prev => prev.map(s => 
      s.step === step ? { ...s, status, message, txHash, error } : s
    ));
  };

  const moveToNextStep = (nextStep: MintingStep) => {
    setCurrentStep(nextStep);
    updateStepStatus(currentStep, 'completed', steps.find(s => s.step === currentStep)?.message || '');
    updateStepStatus(nextStep, 'active', steps.find(s => s.step === nextStep)?.message || '');
  };

  const handleError = (step: MintingStep, errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('error');
    updateStepStatus(step, 'error', 'Failed', undefined, errorMessage);
    toast.error(errorMessage);
  };

  const startMinting = async () => {
    try {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      updateStepStatus('preparing', 'active', 'Checking network connection...');

      // Get ethers provider and signer
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network
      const network = await provider.getNetwork();
      console.log('Current network:', network);
      
      updateStepStatus('preparing', 'active', `Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Ensure we're on Sepolia testnet
      if (network.chainId !== 11155111) {
        // Try to request network switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
          });
          
          // Wait a moment for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Re-check the network
          const newNetwork = await provider.getNetwork();
          if (newNetwork.chainId !== 11155111) {
            throw new Error('Failed to switch to Sepolia testnet. Please manually switch your wallet to Sepolia testnet.');
          }
          
          updateStepStatus('preparing', 'active', 'Successfully switched to Sepolia testnet');
        } catch (switchError: any) {
          // If the switch fails, try to add the network
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'SEP',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                }],
              });
              
              updateStepStatus('preparing', 'active', 'Added and switched to Sepolia testnet');
            } catch (addError) {
              throw new Error('Please manually add and switch to Sepolia testnet in your wallet. Chain ID: 11155111 (0xaa36a7)');
            }
          } else {
            throw new Error(`Please manually switch to Sepolia testnet. Current network: ${network.name} (${network.chainId}). Required: Sepolia (11155111)`);
          }
        }
      } else {
        updateStepStatus('preparing', 'active', 'Already connected to Sepolia testnet ✓');
      }

      setProgress(10);
      
      // Step 1: Upload documents to Walrus
      moveToNextStep('uploading-documents');
      const walrusStorage = new WalrusStorage('testnet');
      
      updateStepStatus('uploading-documents', 'active', 'Uploading documents to Walrus storage...');
      const documentPromises = propertyData.documents.map(async (doc) => {
        const blobId = await walrusStorage.storeDocument(doc.file);
        return {
          id: blobId,
          name: doc.name,
          type: doc.type,
          walrusHash: blobId,
          uploadedAt: new Date().toISOString(),
          size: doc.file.size,
          mimeType: doc.file.type,
        };
      });

      const storedDocuments = await Promise.all(documentPromises);
      setProgress(30);

      // Step 2: Upload images and create metadata
      moveToNextStep('uploading-metadata');
      updateStepStatus('uploading-metadata', 'active', 'Storing property metadata...');

      // Upload images
      const imagePromises = propertyData.images.map(async (image) => {
        return await walrusStorage.storeDocument(image);
      });
      const imageHashes = await Promise.all(imagePromises);

      // Create property metadata
      const propertyMetadata: PropertyMetadata = {
        title: propertyData.title,
        description: propertyData.description,
        propertyType: propertyData.propertyType,
        location: {
          country: propertyData.location.country,
          state: propertyData.location.state,
          city: propertyData.location.city,
          zipCode: propertyData.location.zipCode,
          streetAddress: propertyData.location.streetAddress,
          latitude: propertyData.location.latitude || 0,
          longitude: propertyData.location.longitude || 0,
        },
        specifications: {
          squareFootage: propertyData.specifications.squareFootage,
          bedrooms: propertyData.specifications.bedrooms,
          bathrooms: propertyData.specifications.bathrooms,
          yearBuilt: propertyData.specifications.yearBuilt,
          lotSize: propertyData.specifications.lotSize,
          parkingSpaces: propertyData.specifications.parkingSpaces,
        },
        features: propertyData.features,
        images: imageHashes,
        documents: storedDocuments,
        legalInfo: {
          parcelId: propertyData.legalInfo.parcelId,
          deedNumber: propertyData.legalInfo.deedNumber,
          zoning: propertyData.legalInfo.zoning,
          taxAssessment: propertyData.legalInfo.taxAssessment,
        },
        valuation: {
          estimatedValue: parseFloat(propertyData.price) * 3000, // Mock ETH to USD conversion
          lastAppraisal: new Date().toISOString().split('T')[0],
          priceHistory: [{
            date: new Date().toISOString().split('T')[0],
            price: parseFloat(propertyData.price) * 3000,
            event: 'listing' as const,
          }],
        },
        utilities: propertyData.utilities,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store metadata on Walrus
      const metadataBlobId = await walrusStorage.storePropertyMetadata(propertyMetadata);
      setProgress(50);

      // Step 3: Mint NFT
      moveToNextStep('minting-nft');
      updateStepStatus('minting-nft', 'active', 'Minting property NFT on blockchain...');

      // Get contract instance
      const contractAddress = getContractAddress(11155111, 'propertyNFT'); // Sepolia
      
      // Check if contract is deployed (for demo purposes, we'll simulate this)
      if (contractAddress === '0x5fbdb2315678afecb367f032d93f642f64180aa3') {
        // This is our mock address - simulate the minting process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const mockTokenId = Math.floor(Math.random() * 1000).toString();
        
        // Save property to database
        try {
          const response = await fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.id, // This should be the database user ID
              property: {
                title: propertyData.title,
                description: propertyData.description,
                propertyType: propertyData.propertyType,
                country: propertyData.location.country,
                state: propertyData.location.state,
                city: propertyData.location.city,
                zipCode: propertyData.location.zipCode,
                streetAddress: propertyData.location.streetAddress,
                latitude: propertyData.location.latitude?.toString(),
                longitude: propertyData.location.longitude?.toString(),
                squareFootage: propertyData.specifications.squareFootage,
                bedrooms: propertyData.specifications.bedrooms,
                bathrooms: propertyData.specifications.bathrooms,
                yearBuilt: propertyData.specifications.yearBuilt,
                lotSize: propertyData.specifications.lotSize,
                parkingSpaces: propertyData.specifications.parkingSpaces,
                priceEth: propertyData.price,
                parcelId: propertyData.legalInfo.parcelId,
                deedNumber: propertyData.legalInfo.deedNumber,
                zoning: propertyData.legalInfo.zoning,
                taxAssessment: propertyData.legalInfo.taxAssessment,
                utilities: propertyData.utilities,
                features: propertyData.features,
                chainId: 11155111,
                tokenId: mockTokenId,
                transactionHash: mockTxHash,
                walrusHash: metadataBlobId,
                isListed: true,
                isVerified: false,
                isPublic: true,
              },
              images: imageHashes.map((hash, index) => ({
                imageUrl: `https://walrus-storage.com/${hash}`, // Mock URL
                walrusHash: hash,
                isPrimary: index === 0,
                sortOrder: index,
              })),
              documents: storedDocuments.map(doc => ({
                fileName: doc.name,
                fileType: doc.type,
                walrusHash: doc.walrusHash,
                fileSize: doc.size,
                mimeType: doc.mimeType,
                isPublic: false,
              })),
            }),
          });

          if (!response.ok) {
            console.warn('Failed to save property to database:', await response.text());
          } else {
            console.log('Property saved to database successfully');
          }
        } catch (dbError) {
          console.warn('Database save error (non-critical):', dbError);
        }

        const result: MintingResult = {
          tokenId: mockTokenId,
          transactionHash: mockTxHash,
          walrusHash: metadataBlobId,
          documentHashes: storedDocuments.map(doc => doc.walrusHash),
          chainId: 11155111,
        };

        setProgress(100);
        updateStepStatus('confirming', 'completed', 'Mock transaction completed successfully!', mockTxHash);
        
        setTimeout(() => {
          onComplete(result);
        }, 1500);
        
        toast.success('Property NFT minted successfully! (Demo Mode)');
        return;
      }
      
      const contract = createPropertyNFTContract(contractAddress, signer);

      // Format property data for contract
      const contractPropertyData = formatPropertyForContract({
        price: propertyData.price,
        walrusHash: metadataBlobId,
        documentHashes: storedDocuments.map(doc => doc.walrusHash),
        propertyType: PropertyType[propertyData.propertyType as keyof typeof PropertyType],
        location: propertyData.location,
      });

      // Call the contract
      updateStepStatus('minting-nft', 'active', 'Sending transaction to blockchain...');
      const tx = await contract.listProperty(
        contractPropertyData.price,
        contractPropertyData.walrusHash,
        contractPropertyData.documentHashes,
        contractPropertyData.propertyType,
        contractPropertyData.location
      );

      setProgress(70);
      
      // Step 4: Wait for confirmation
      moveToNextStep('confirming');
      updateStepStatus('confirming', 'active', `Confirming transaction: ${tx.hash}`, tx.hash);

      const receipt = await tx.wait();
      setProgress(90);

      // Extract token ID from events
      const propertyListedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'PropertyListed';
        } catch {
          return false;
        }
      });

      let tokenId = '1'; // Fallback
      if (propertyListedEvent) {
        const parsed = contract.interface.parseLog(propertyListedEvent);
        tokenId = parsed?.args?.tokenId?.toString() || '1';
      }

      // Complete the process
      setProgress(100);
      updateStepStatus('confirming', 'completed', 'Transaction confirmed successfully!', tx.hash);

      const result: MintingResult = {
        tokenId,
        transactionHash: tx.hash,
        walrusHash: metadataBlobId,
        documentHashes: storedDocuments.map(doc => doc.walrusHash),
        chainId: 11155111,
      };

      setTimeout(() => {
        onComplete(result);
      }, 1500);

      toast.success('Property NFT minted successfully!');

    } catch (error: any) {
      console.error('Minting error:', error);
      handleError(currentStep, error.message || 'An unexpected error occurred during minting');
    }
  };

  useEffect(() => {
    // Start minting process automatically
    const timer = setTimeout(() => {
      startMinting();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStepIcon = (status: 'pending' | 'active' | 'completed' | 'error') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-primary-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (currentStep === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Minting Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button onClick={onBack} className="btn-secondary">
              Go Back
            </button>
            <button onClick={startMinting} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minting Property NFT</h1>
          <p className="text-gray-600">
            Your property is being converted into a blockchain-based NFT with LayerZero technology
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-center space-x-4 p-4 rounded-lg border ${
                step.status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : step.status === 'active'
                  ? 'bg-primary-50 border-primary-200'
                  : step.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {getStepIcon(step.status)}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{step.message}</div>
                {step.txHash && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-700"
                    >
                      View on Etherscan
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
                {step.error && (
                  <div className="text-sm text-red-600 mt-1">{step.error}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Property Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Property Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Title</span>
              <div className="font-medium truncate">{propertyData.title}</div>
            </div>
            <div>
              <span className="text-gray-600">Type</span>
              <div className="font-medium">{propertyData.propertyType}</div>
            </div>
            <div>
              <span className="text-gray-600">Price</span>
              <div className="font-medium">{propertyData.price} ETH</div>
            </div>
            <div>
              <span className="text-gray-600">Documents</span>
              <div className="font-medium">{propertyData.documents.length} files</div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={onBack}
            disabled={currentStep !== 'preparing'}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel and Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
