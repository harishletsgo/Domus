'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Home, MapPin, DollarSign, FileText, ExternalLink, Plus, Wallet, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Property {
  id: string;
  tokenId: string;
  title: string;
  propertyType: string;
  priceEth: string;
  priceUsd: string | null;
  location: string;
  squareFootage: number;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number;
  isListed: boolean;
  isVerified: boolean;
  primaryImage: string | null;
  listedAt: number;
  transactionHash: string | null;
  walrusHash: string | null;
  chainId: number | null;
}

export default function DashboardPage() {
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated && user && wallets.length > 0) {
      loadUserProperties();
    }
  }, [authenticated, user, wallets]);

  const loadUserProperties = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch properties from database API
      const response = await fetch(`/api/users/${user.id}/properties`);
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched user properties:', data);
      
      // Transform the data to match the expected format
      const transformedProperties = data.properties.map((p: any) => ({
        id: p.id,
        tokenId: p.tokenId,
        title: p.title,
        propertyType: p.propertyType,
        priceEth: p.priceEth,
        priceUsd: p.priceUsd ? `$${Number(p.priceUsd).toLocaleString()}` : null,
        location: `${p.city}, ${p.state}`,
        squareFootage: p.squareFootage,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        yearBuilt: p.yearBuilt,
        isListed: p.isListed,
        isVerified: p.isVerified,
        primaryImage: p.primaryImage,
        listedAt: new Date(p.listedAt).getTime(),
        transactionHash: p.transactionHash,
        walrusHash: p.walrusHash,
        chainId: p.chainId,
      }));

      setProperties(transformedProperties);
    } catch (error: any) {
      console.error('Error loading properties:', error);
      setError(error.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'RESIDENTIAL': 'bg-blue-100 text-blue-800',
      'COMMERCIAL': 'bg-purple-100 text-purple-800',
      'INDUSTRIAL': 'bg-gray-100 text-gray-800',
      'LAND': 'bg-green-100 text-green-800',
      'MIXED_USE': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPropertyTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'RESIDENTIAL': 'Residential',
      'COMMERCIAL': 'Commercial',
      'INDUSTRIAL': 'Industrial',
      'LAND': 'Land',
      'MIXED_USE': 'Mixed Use',
    };
    return names[type] || 'Unknown';
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your property dashboard.
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage your tokenized real estate portfolio
              </p>
            </div>
            <Link
              href="/list-property"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>List New Property</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.reduce((sum, p) => sum + parseFloat(p.priceEth), 0).toFixed(2)} ETH
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Listed Properties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.filter(p => p.isListed).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Properties</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadUserProperties}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't listed any properties as NFTs yet. Get started by listing your first property!
            </p>
            <Link
              href="/list-property"
              className="btn-primary"
            >
              List Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <motion.div
                key={property.tokenId.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Property Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary-400 to-accent-400 relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <Home className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPropertyTypeColor(property.propertyType)}`}>
                      {getPropertyTypeName(property.propertyType)}
                    </span>
                    {property.isVerified && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  {property.isListed && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Listed
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-sm opacity-75">Token ID</div>
                    <div className="font-bold">#{property.tokenId.toString()}</div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Property #{property.tokenId.toString()}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>
                        {property.location}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-lg">
                        {parseFloat(property.priceEth).toFixed(3)} ETH
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Listed</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        property.isListed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.isListed ? 'Active' : 'Not Listed'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Documents</span>
                      <span className="text-gray-900 font-medium">
                        0 files
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button className="flex-1 btn-secondary text-sm">
                      View Details
                    </button>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${property.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Walrus Hash */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      <span>Walrus Hash: </span>
                      <span className="font-mono">{property.walrusHash ? property.walrusHash.slice(0, 16) + '...' : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
