'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft,
  Lock,
  Unlock,
  Share2,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Coins,
  Zap,
  Plus
} from 'lucide-react';
import { FractionalizePropertyModal } from './FractionalizePropertyModal';
import { ShareTokenMarketplace } from './ShareTokenMarketplace';
import toast from 'react-hot-toast';

interface ShareToken {
  address: string;
  symbol: string;
  name: string;
  propertyTokenId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyValue: string; // in ETH
  totalSupply: string;
  userBalance: string;
  ownershipPercentage: number;
  currentPrice: string; // in USD
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  isListed: boolean;
  canRedeem: boolean;
  redemptionThreshold: number;
}

interface TradingOrder {
  orderId: string;
  shareToken: string;
  amount: string;
  price: string;
  isBuyOrder: boolean;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  timestamp: number;
  expiration: number;
  filledAmount: string;
}

interface LiquidityPool {
  shareToken: string;
  shareReserves: string;
  usdReserves: string;
  totalLiquidity: string;
  userLiquidity: string;
  apr: number;
  volume24h: string;
}

export function FractionalOwnership() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([]);
  const [tradingOrders, setTradingOrders] = useState<TradingOrder[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [selectedToken, setSelectedToken] = useState<ShareToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'trading' | 'liquidity'>('portfolio');
  
  // Modal states
  const [showFractionalizeModal, setShowFractionalizeModal] = useState(false);
  
  // Trading form state
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [isBuyOrder, setIsBuyOrder] = useState(true);
  const [orderExpiration, setOrderExpiration] = useState('24'); // hours
  
  // Liquidity form state
  const [liquidityShareAmount, setLiquidityShareAmount] = useState('');
  const [liquidityUsdAmount, setLiquidityUsdAmount] = useState('');

  useEffect(() => {
    if (authenticated && user) {
      loadFractionalData();
    }
  }, [authenticated, user]);

  const loadFractionalData = async () => {
    try {
      setLoading(true);
      
      // Load user's share tokens
      const response = await fetch(`/api/users/${user?.id}/share-tokens`);
      if (response.ok) {
        const data = await response.json();
        setShareTokens(data.shareTokens || []);
      }

      // Load trading orders
      const ordersResponse = await fetch(`/api/users/${user?.id}/trading-orders`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setTradingOrders(ordersData.orders || []);
      }

      // Load liquidity pools
      const poolsResponse = await fetch(`/api/liquidity-pools`);
      if (poolsResponse.ok) {
        const poolsData = await poolsResponse.json();
        setLiquidityPools(poolsData.pools || []);
      }

    } catch (error) {
      console.error('Error loading fractional data:', error);
      toast.error('Failed to load fractional ownership data');
    } finally {
      setLoading(false);
    }
  };

  const placeTradingOrder = async () => {
    try {
      if (!selectedToken || !tradeAmount || !tradePrice) {
        toast.error('Please fill all trading fields');
        return;
      }

      const expiration = Math.floor(Date.now() / 1000) + (parseInt(orderExpiration) * 3600);
      
      const orderData = {
        userId: user?.id,
        shareToken: selectedToken.address,
        amount: ethers.utils.parseEther(tradeAmount).toString(),
        price: ethers.utils.parseEther(tradePrice).toString(),
        isBuyOrder,
        expiration,
        targetChain: 11155111 // Sepolia for now
      };

      const response = await fetch('/api/trading/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast.success('Order placed successfully!');
        setTradeAmount('');
        setTradePrice('');
        await loadFractionalData();
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place trading order');
    }
  };

  const addLiquidity = async () => {
    try {
      if (!selectedToken || !liquidityShareAmount || !liquidityUsdAmount) {
        toast.error('Please fill all liquidity fields');
        return;
      }

      const liquidityData = {
        userId: user?.id,
        shareToken: selectedToken.address,
        shareAmount: ethers.utils.parseEther(liquidityShareAmount).toString(),
        usdAmount: ethers.utils.parseEther(liquidityUsdAmount).toString()
      };

      const response = await fetch('/api/liquidity-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liquidityData)
      });

      if (response.ok) {
        toast.success('Liquidity added successfully!');
        setLiquidityShareAmount('');
        setLiquidityUsdAmount('');
        await loadFractionalData();
      } else {
        throw new Error('Failed to add liquidity');
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast.error('Failed to add liquidity');
    }
  };

  const formatCurrency = (amount: string, decimals: number = 2) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    }
    return `$${num.toFixed(decimals)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-xl">
        <Lock className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 text-center">
          Please connect your wallet to access fractional ownership features.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading fractional ownership data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fractional Ownership</h2>
            <p className="text-gray-600 mt-1">
              Trade property shares across multiple networks with LayerZero and Flare Oracle integration
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(shareTokens.reduce((sum, token) => 
                  sum + (parseFloat(token.userBalance) * parseFloat(token.currentPrice)), 0
                ).toString())}
              </p>
            </div>
            <PieChart className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'portfolio', label: 'Portfolio', icon: PieChart },
          { id: 'trading', label: 'Trading', icon: TrendingUp },
          { id: 'liquidity', label: 'Liquidity', icon: Coins }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {shareTokens.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fractional Properties</h3>
                <p className="text-gray-600 mb-6">
                  You don't own any fractional property shares yet. Start by fractionalizing one of your properties.
                </p>
                <button 
                  onClick={() => setShowFractionalizeModal(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Fractionalize Property
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Share Tokens</h3>
                  <button 
                    onClick={() => setShowFractionalizeModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Fractionalize Property
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {shareTokens.map((token) => (
                    <motion.div
                      key={token.address}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-primary-200 transition-colors"
                    >
                      {/* Property Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{token.propertyTitle}</h4>
                          <p className="text-sm text-gray-600">{token.propertyLocation}</p>
                          <p className="text-xs text-primary-600 mt-1">{token.symbol}</p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            token.priceChange24h >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {token.priceChange24h >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {formatPercentage(token.priceChange24h)}
                          </div>
                        </div>
                      </div>

                      {/* Ownership Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Your Ownership</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {token.ownershipPercentage.toFixed(2)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {parseFloat(token.userBalance).toLocaleString()} shares
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Share Value</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(token.currentPrice)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: {formatCurrency((parseFloat(token.userBalance) * parseFloat(token.currentPrice)).toString())}
                          </p>
                        </div>
                      </div>

                      {/* Market Data */}
                      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600">Market Cap</p>
                          <p className="text-sm font-medium">{formatCurrency(token.marketCap)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600">24h Volume</p>
                          <p className="text-sm font-medium">{formatCurrency(token.volume24h)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-600">Property Value</p>
                          <p className="text-sm font-medium">{parseFloat(token.propertyValue).toFixed(2)} ETH</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedToken(token)}
                          className="flex-1 btn-secondary text-sm"
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Trade
                        </button>
                        
                        {token.canRedeem && (
                          <button
                            className="flex-1 btn-primary text-sm"
                          >
                            <Unlock className="w-4 h-4 mr-1" />
                            Redeem NFT
                          </button>
                        )}
                        
                        <button className="btn-secondary p-2">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Redemption Progress */}
                      {token.redemptionThreshold > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Redemption Progress</span>
                            <span className="text-xs text-gray-600">
                              {token.ownershipPercentage.toFixed(1)}% / {token.redemptionThreshold}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                token.ownershipPercentage >= token.redemptionThreshold
                                  ? 'bg-green-500'
                                  : 'bg-primary-500'
                              }`}
                              style={{
                                width: `${Math.min((token.ownershipPercentage / token.redemptionThreshold) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Marketplace */}
            <ShareTokenMarketplace 
              onSelectToken={(token) => {
                setSelectedToken({
                  address: token.address,
                  symbol: token.symbol,
                  name: token.name,
                  propertyTokenId: '',
                  propertyTitle: token.propertyTitle,
                  propertyLocation: token.propertyLocation,
                  propertyValue: '0',
                  totalSupply: token.totalSupply,
                  userBalance: token.userBalance || '0',
                  ownershipPercentage: 0,
                  currentPrice: token.currentPrice,
                  priceChange24h: token.priceChange24h,
                  volume24h: token.volume24h,
                  marketCap: token.marketCap,
                  isListed: token.isActive,
                  canRedeem: false,
                  redemptionThreshold: 80
                });
              }}
              selectedToken={selectedToken ? {
                address: selectedToken.address,
                symbol: selectedToken.symbol,
                name: selectedToken.name,
                propertyTitle: selectedToken.propertyTitle,
                propertyLocation: selectedToken.propertyLocation,
                currentPrice: selectedToken.currentPrice,
                priceChange24h: selectedToken.priceChange24h,
                volume24h: selectedToken.volume24h,
                marketCap: selectedToken.marketCap,
                totalSupply: selectedToken.totalSupply,
                availableSupply: selectedToken.totalSupply,
                userBalance: selectedToken.userBalance,
                liquidity: '0',
                isActive: selectedToken.isListed
              } : null}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Form */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Place Order</h3>
              
                {/* Selected Token Display */}
                {selectedToken ? (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{selectedToken.symbol}</p>
                        <p className="text-sm text-gray-600">{selectedToken.propertyTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(selectedToken.currentPrice)}</p>
                        <p className={`text-sm ${selectedToken.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(selectedToken.priceChange24h)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">Select a token from the marketplace above to start trading</p>
                  </div>
                )}

                {/* Order Type */}
                <div className="mb-4">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setIsBuyOrder(true)}
                      className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        isBuyOrder
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 inline mr-1" />
                      Buy
                    </button>
                    <button
                      onClick={() => setIsBuyOrder(false)}
                      className={`flex-1 py-2 px-4 rounded-md transition-all ${
                        !isBuyOrder
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 inline mr-1" />
                      Sell
                    </button>
                  </div>
                </div>

                {/* Amount and Price */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (Shares)
                    </label>
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="0.0"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      value={tradePrice}
                      onChange={(e) => setTradePrice(e.target.value)}
                      placeholder="0.0"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Expiration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Expiration
                  </label>
                  <select
                    value={orderExpiration}
                    onChange={(e) => setOrderExpiration(e.target.value)}
                    className="form-select"
                  >
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours</option>
                    <option value="168">1 Week</option>
                    <option value="720">30 Days</option>
                  </select>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={placeTradingOrder}
                  disabled={!selectedToken || !tradeAmount || !tradePrice}
                  className="w-full btn-primary"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Place {isBuyOrder ? 'Buy' : 'Sell'} Order
                </button>

                {/* Current Price Info */}
                {selectedToken && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Price:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedToken.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Your Balance:</span>
                      <span className="text-sm font-medium">{parseFloat(selectedToken.userBalance).toLocaleString()} shares</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Orders</h3>
                
                {tradingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No active orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tradingOrders.map((order) => (
                      <div key={order.orderId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.isBuyOrder 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.isBuyOrder ? 'BUY' : 'SELL'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'filled' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {parseFloat(order.amount).toLocaleString()} shares @ {formatCurrency(order.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency((parseFloat(order.amount) * parseFloat(order.price)).toString())}
                            </p>
                            <p className="text-xs text-gray-600">
                              Filled: {((parseFloat(order.filledAmount) / parseFloat(order.amount)) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                          <div
                            className="bg-primary-500 h-1 rounded-full"
                            style={{
                              width: `${(parseFloat(order.filledAmount) / parseFloat(order.amount)) * 100}%`
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Expires: {new Date(order.expiration * 1000).toLocaleDateString()}</span>
                          {order.status === 'pending' && (
                            <button className="text-red-600 hover:text-red-800">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Add Liquidity Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Liquidity</h3>
              
              {/* Selected Token Display */}
              {selectedToken ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedToken.symbol}</p>
                      <p className="text-sm text-gray-600">{selectedToken.propertyTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(selectedToken.currentPrice)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">Select a token from the trading tab to add liquidity</p>
                </div>
              )}

              {/* Liquidity Amounts */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Amount
                  </label>
                  <input
                    type="number"
                    value={liquidityShareAmount}
                    onChange={(e) => setLiquidityShareAmount(e.target.value)}
                    placeholder="0.0"
                    className="form-input"
                  />
                  {selectedToken && (
                    <p className="text-xs text-gray-600 mt-1">
                      Balance: {parseFloat(selectedToken.userBalance).toLocaleString()} shares
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    USD Amount
                  </label>
                  <input
                    type="number"
                    value={liquidityUsdAmount}
                    onChange={(e) => setLiquidityUsdAmount(e.target.value)}
                    placeholder="0.0"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Add Liquidity Button */}
              <button
                onClick={addLiquidity}
                disabled={!selectedToken || !liquidityShareAmount || !liquidityUsdAmount}
                className="w-full btn-primary"
              >
                <Coins className="w-4 h-4 mr-2" />
                Add Liquidity
              </button>

              {/* Pool Info */}
              {selectedToken && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Pool Information:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Current Price:</span>
                      <span>{formatCurrency(selectedToken.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>24h Volume:</span>
                      <span>{formatCurrency(selectedToken.volume24h)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated APR:</span>
                      <span className="text-green-600">12.5%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liquidity Pools */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Liquidity</h3>
              
              {liquidityPools.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No liquidity positions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liquidityPools.map((pool, index) => (
                    <div key={pool.shareToken || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {shareTokens.find(t => t.address === pool.shareToken)?.symbol || 'Unknown'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {shareTokens.find(t => t.address === pool.shareToken)?.propertyTitle || 'Unknown Property'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +{pool.apr.toFixed(2)}% APR
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Your Liquidity</p>
                          <p className="font-medium">
                            {formatCurrency((parseFloat(pool.userLiquidity) * parseFloat(pool.totalLiquidity)).toString())}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pool Share</p>
                          <p className="font-medium">
                            {((parseFloat(pool.userLiquidity) / parseFloat(pool.totalLiquidity)) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex space-x-2">
                        <button className="flex-1 btn-secondary text-xs">
                          Remove Liquidity
                        </button>
                        <button className="flex-1 btn-primary text-xs">
                          Claim Rewards
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fractionalize Property Modal */}
      <FractionalizePropertyModal
        isOpen={showFractionalizeModal}
        onClose={() => setShowFractionalizeModal(false)}
        onSuccess={() => {
          loadFractionalData();
          toast.success('Property fractionalized successfully!');
        }}
      />
    </div>
  );
}
