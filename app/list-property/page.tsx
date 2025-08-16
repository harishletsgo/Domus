'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { PropertyListingForm } from '@/components/PropertyListingForm';
import { PropertyPreview } from '@/components/PropertyPreview';
import { MintingProgress } from '@/components/MintingProgress';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PropertyMetadata } from '@/lib/walrus';

export type ListingStep = 'form' | 'preview' | 'minting' | 'success';

export interface PropertyFormData {
  // Basic Info
  title: string;
  description: string;
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'LAND' | 'MIXED_USE';
  
  // Location
  location: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
    streetAddress: string;
    latitude: number;
    longitude: number;
  };
  
  // Specifications
  specifications: {
    squareFootage: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt: number;
    lotSize?: number;
    parkingSpaces?: number;
  };
  
  // Features & Amenities
  features: string[];
  
  // Pricing
  price: string; // in ETH
  
  // Images
  images: File[];
  
  // Documents
  documents: Array<{
    file: File;
    type: 'deed' | 'survey' | 'inspection' | 'appraisal' | 'insurance' | 'tax' | 'other';
    name: string;
  }>;
  
  // Legal Info
  legalInfo: {
    parcelId: string;
    deedNumber: string;
    zoning: string;
    taxAssessment: number;
  };
  
  // Utilities
  utilities: {
    electricity: boolean;
    water: boolean;
    gas: boolean;
    internet: boolean;
    sewer: boolean;
  };
}

export interface MintingResult {
  tokenId: string;
  transactionHash: string;
  walrusHash: string;
  documentHashes: string[];
  chainId: number;
}

export default function ListPropertyPage() {
  const { authenticated, login } = usePrivy();
  const [currentStep, setCurrentStep] = useState<ListingStep>('form');
  const [propertyData, setPropertyData] = useState<PropertyFormData | null>(null);
  const [mintingResult, setMintingResult] = useState<MintingResult | null>(null);

  // Redirect to login if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to list a property as an NFT on the Domus platform.
          </p>
          <button
            onClick={login}
            className="btn-primary w-full"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const handleFormSubmit = (data: PropertyFormData) => {
    setPropertyData(data);
    setCurrentStep('preview');
  };

  const handlePreviewConfirm = () => {
    setCurrentStep('minting');
  };

  const handleMintingComplete = (result: MintingResult) => {
    setMintingResult(result);
    setCurrentStep('success');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const handleBackToPreview = () => {
    setCurrentStep('preview');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">List Property as NFT</h1>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-md">
              {[
                { key: 'form', label: 'Property Details', number: 1 },
                { key: 'preview', label: 'Preview & Confirm', number: 2 },
                { key: 'minting', label: 'Minting NFT', number: 3 },
                { key: 'success', label: 'Complete', number: 4 },
              ].map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = ['form', 'preview', 'minting', 'success'].indexOf(currentStep) > 
                                  ['form', 'preview', 'minting', 'success'].indexOf(step.key);
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : step.number}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 3 && (
                      <div
                        className={`w-12 h-px mx-4 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Network Switcher - Show on form and preview steps */}
        {(currentStep === 'form' || currentStep === 'preview') && (
          <div className="mb-6">
            <NetworkSwitcher 
              targetChainId={11155111} 
              targetChainName="Sepolia Testnet" 
            />
          </div>
        )}
        
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'form' && (
            <PropertyListingForm onSubmit={handleFormSubmit} />
          )}
          
          {currentStep === 'preview' && propertyData && (
            <PropertyPreview
              data={propertyData}
              onConfirm={handlePreviewConfirm}
              onBack={handleBackToForm}
            />
          )}
          
          {currentStep === 'minting' && propertyData && (
            <MintingProgress
              propertyData={propertyData}
              onComplete={handleMintingComplete}
              onBack={handleBackToPreview}
            />
          )}
          
          {currentStep === 'success' && mintingResult && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Property NFT Minted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your property has been successfully minted as an NFT and is now live on the blockchain.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Token ID:</span>
                    <div className="font-mono font-medium">#{mintingResult.tokenId}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction:</span>
                    <div className="font-mono font-medium text-primary-600 truncate">
                      {mintingResult.transactionHash.slice(0, 10)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Chain:</span>
                    <div className="font-medium">
                      {mintingResult.chainId === 11155111 ? 'Sepolia Testnet' : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Documents:</span>
                    <div className="font-medium">{mintingResult.documentHashes.length} files</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="btn-primary"
                >
                  View in Dashboard
                </Link>
                <Link
                  href="/list-property"
                  className="btn-secondary"
                  onClick={() => {
                    setCurrentStep('form');
                    setPropertyData(null);
                    setMintingResult(null);
                  }}
                >
                  List Another Property
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
