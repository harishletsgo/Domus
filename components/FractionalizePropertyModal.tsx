'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, MapPin, DollarSign, Coins, Zap, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  title: string;
  location: string;
  priceEth: string;
  squareFootage: number;
  propertyType: string;
  images: string[];
  isFractionalized?: boolean;
}

interface FractionalizePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FractionalizePropertyModal({ isOpen, onClose, onSuccess }: FractionalizePropertyModalProps) {
  const { user } = usePrivy();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [fractionalizing, setFractionalizing] = useState(false);
  
  // Fractionalization form data
  const [shareTokenName, setShareTokenName] = useState('');
  const [shareTokenSymbol, setShareTokenSymbol] = useState('');
  const [fractionalizationFee, setFractionalizationFee] = useState('0.01'); // 1% default

  useEffect(() => {
    if (isOpen && user) {
      loadUserProperties();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedProperty) {
      // Auto-generate token name and symbol
      const cleanTitle = selectedProperty.title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      setShareTokenName(`${cleanTitle} Shares`);
      setShareTokenSymbol(`${cleanTitle.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6)}SH`);
    }
  }, [selectedProperty]);

  const loadUserProperties = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/${user?.id}/properties`);
      if (response.ok) {
        const data = await response.json();
        // Filter out already fractionalized properties
        const availableProperties = data.properties?.filter((p: any) => !p.isFractionalized) || [];
        setProperties(availableProperties.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: `${p.city}, ${p.state}`,
          priceEth: p.priceEth,
          squareFootage: p.squareFootage,
          propertyType: p.propertyType,
          images: p.images || [],
          isFractionalized: false
        })));
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleFractionalize = async () => {
    if (!selectedProperty || !shareTokenName || !shareTokenSymbol) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setFractionalizing(true);

      const response = await fetch(`/api/users/${user?.id}/share-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          shareTokenName,
          shareTokenSymbol,
          propertyValue: parseFloat(selectedProperty.priceEth),
          fractionalizationFee: parseFloat(fractionalizationFee)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Property successfully fractionalized!');
        onSuccess?.();
        onClose();
        
        // Reset form
        setSelectedProperty(null);
        setShareTokenName('');
        setShareTokenSymbol('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fractionalize property');
      }
    } catch (error) {
      console.error('Error fractionalizing property:', error);
      toast.error('Failed to fractionalize property');
    } finally {
      setFractionalizing(false);
    }
  };

  const calculateTokenValue = () => {
    if (!selectedProperty) return '0';
    const propertyValue = parseFloat(selectedProperty.priceEth);
    const totalTokens = 1000000;
    return (propertyValue / totalTokens).toFixed(8);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(4);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Fractionalize Property</h2>
                  <p className="text-gray-600 mt-1">Convert your property NFT into tradeable share tokens</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-100px)]">
                {/* Property Selection */}
                <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Property</h3>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-gray-600">Loading properties...</span>
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Properties Available</h4>
                      <p className="text-gray-600">
                        You don't have any properties that can be fractionalized, or all your properties are already fractionalized.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {properties.map((property) => (
                        <div
                          key={property.id}
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            selectedProperty?.id === property.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedProperty(property)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              {property.images.length > 0 ? (
                                <img 
                                  src={property.images[0]} 
                                  alt={property.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <Home className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{property.title}</h4>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {property.location}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center text-sm">
                                  <DollarSign className="w-3 h-3 mr-1 text-green-600" />
                                  <span className="font-medium">{formatCurrency(property.priceEth)} ETH</span>
                                </div>
                                <span className="text-xs text-gray-500">{property.squareFootage} sq ft</span>
                              </div>
                            </div>
                            
                            {selectedProperty?.id === property.id && (
                              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fractionalization Details */}
                <div className="lg:w-1/2 p-6 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fractionalization Details</h3>
                  
                  {selectedProperty ? (
                    <div className="space-y-6">
                      {/* Property Summary */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Selected Property</h4>
                        <p className="text-sm text-gray-600">{selectedProperty.title}</p>
                        <p className="text-sm text-gray-600">{selectedProperty.location}</p>
                        <p className="text-lg font-semibold text-gray-900 mt-2">
                          {formatCurrency(selectedProperty.priceEth)} ETH
                        </p>
                      </div>

                      {/* Token Configuration */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share Token Name
                          </label>
                          <input
                            type="text"
                            value={shareTokenName}
                            onChange={(e) => setShareTokenName(e.target.value)}
                            placeholder="e.g., Brooklyn Apartment Shares"
                            className="form-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share Token Symbol
                          </label>
                          <input
                            type="text"
                            value={shareTokenSymbol}
                            onChange={(e) => setShareTokenSymbol(e.target.value.toUpperCase())}
                            placeholder="e.g., BKSH"
                            maxLength={10}
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Tokenomics */}
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Coins className="w-4 h-4 mr-2 text-blue-600" />
                          Tokenomics
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Supply</p>
                            <p className="font-semibold">1,000,000 tokens</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Initial Price</p>
                            <p className="font-semibold">{calculateTokenValue()} ETH</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Your Ownership</p>
                            <p className="font-semibold">100%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Redemption Threshold</p>
                            <p className="font-semibold">80%</p>
                          </div>
                        </div>
                      </div>

                      {/* Fees */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fractionalization Fee (ETH)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={fractionalizationFee}
                          onChange={(e) => setFractionalizationFee(e.target.value)}
                          className="form-input"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Platform fee for creating share tokens
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Benefits</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Trade partial ownership instantly</li>
                          <li>• Access global liquidity markets</li>
                          <li>• Earn from trading fees and dividends</li>
                          <li>• Maintain option to redeem original NFT</li>
                        </ul>
                      </div>

                      {/* Fractionalize Button */}
                      <button
                        onClick={handleFractionalize}
                        disabled={fractionalizing || !shareTokenName || !shareTokenSymbol}
                        className="w-full btn-primary py-3 text-lg"
                      >
                        {fractionalizing ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Fractionalizing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Zap className="w-5 h-5 mr-2" />
                            Fractionalize Property
                          </div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h4>
                      <p className="text-gray-600">
                        Choose a property from the left to configure fractionalization
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
