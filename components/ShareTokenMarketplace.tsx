'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  DollarSign,
  BarChart3,
  Users,
  Zap,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketplaceToken {
  address: string;
  symbol: string;
  name: string;
  propertyTitle: string;
  propertyLocation: string;
  currentPrice: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  totalSupply: string;
  availableSupply: string;
  userBalance?: string;
  liquidity: string;
  isActive: boolean;
}

interface ShareTokenMarketplaceProps {
  onSelectToken: (token: MarketplaceToken) => void;
  selectedToken?: MarketplaceToken | null;
}

export function ShareTokenMarketplace({ onSelectToken, selectedToken }: ShareTokenMarketplaceProps) {
  const { user } = usePrivy();
  const [tokens, setTokens] = useState<MarketplaceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change' | 'marketCap'>('volume');
  const [filterType, setFilterType] = useState<'all' | 'owned' | 'trending'>('all');

  useEffect(() => {
    loadMarketplaceTokens();
  }, []);

  const loadMarketplaceTokens = async () => {
    try {
      setLoading(true);
      
      // Load all available share tokens from the marketplace
      const response = await fetch('/api/marketplace/share-tokens');
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Error loading marketplace tokens:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTokens = tokens
    .filter(token => {
      // Search filter
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.propertyLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      if (filterType === 'owned') {
        return matchesSearch && token.userBalance && parseFloat(token.userBalance) > 0;
      } else if (filterType === 'trending') {
        return matchesSearch && token.priceChange24h > 0;
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return parseFloat(b.volume24h) - parseFloat(a.volume24h);
        case 'price':
          return parseFloat(b.currentPrice) - parseFloat(a.currentPrice);
        case 'change':
          return b.priceChange24h - a.priceChange24h;
        case 'marketCap':
          return parseFloat(b.marketCap) - parseFloat(a.marketCap);
        default:
          return 0;
      }
    });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Share Token Marketplace</h3>
          <p className="text-gray-600">Browse and trade fractional property shares</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Tokens</option>
            <option value="owned">My Holdings</option>
            <option value="trending">Trending</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="volume">Volume</option>
            <option value="price">Price</option>
            <option value="change">24h Change</option>
            <option value="marketCap">Market Cap</option>
          </select>
        </div>
      </div>

      {/* Token List */}
      {filteredAndSortedTokens.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Tokens Found</h4>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'No share tokens are available in the marketplace yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedTokens.map((token) => (
            <motion.div
              key={token.address}
              whileHover={{ scale: 1.01 }}
              className={`bg-white border rounded-xl p-6 cursor-pointer transition-all ${
                selectedToken?.address === token.address
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => onSelectToken(token)}
            >
              <div className="flex items-start justify-between">
                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{token.symbol}</h4>
                      <p className="text-sm text-gray-600">{token.name}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{token.propertyTitle}</p>
                    <p className="text-sm text-gray-600">{token.propertyLocation}</p>
                  </div>
                  
                  {/* User Holdings */}
                  {token.userBalance && parseFloat(token.userBalance) > 0 && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                      <Users className="w-3 h-3 mr-1" />
                      You own {parseFloat(token.userBalance).toLocaleString()} shares
                    </div>
                  )}
                </div>
                
                {/* Price & Stats */}
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(token.currentPrice)}
                    </p>
                    <div className={`inline-flex items-center text-sm font-medium ${
                      token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {formatPercentage(token.priceChange24h)}
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <p>Volume 24h</p>
                      <p className="font-medium text-gray-900">{formatCurrency(token.volume24h)}</p>
                    </div>
                    <div>
                      <p>Market Cap</p>
                      <p className="font-medium text-gray-900">{formatCurrency(token.marketCap)}</p>
                    </div>
                    <div>
                      <p>Available</p>
                      <p className="font-medium text-gray-900">{parseFloat(token.availableSupply).toLocaleString()}</p>
                    </div>
                    <div>
                      <p>Liquidity</p>
                      <p className="font-medium text-gray-900">{formatCurrency(token.liquidity)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 btn-secondary text-sm py-2">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Buy
                </button>
                {token.userBalance && parseFloat(token.userBalance) > 0 && (
                  <button className="flex-1 btn-secondary text-sm py-2">
                    <ArrowDownLeft className="w-4 h-4 mr-1" />
                    Sell
                  </button>
                )}
                <button className="flex-1 btn-secondary text-sm py-2">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Chart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Market Stats Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Market Summary</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Tokens</p>
            <p className="text-lg font-semibold text-gray-900">{tokens.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Volume</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(tokens.reduce((sum, token) => sum + parseFloat(token.volume24h), 0).toString())}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Market Cap</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(tokens.reduce((sum, token) => sum + parseFloat(token.marketCap), 0).toString())}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Pairs</p>
            <p className="text-lg font-semibold text-gray-900">
              {tokens.filter(token => token.isActive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
