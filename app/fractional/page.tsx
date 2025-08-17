'use client';

import { motion } from 'framer-motion';
import { FractionalOwnership } from '@/components/FractionalOwnership';
import { 
  PieChart, 
  TrendingUp, 
  Zap, 
  Globe, 
  Shield, 
  Coins,
  BarChart3,
  Users,
  ArrowUpRight,
  CheckCircle
} from 'lucide-react';

export default function FractionalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-2 mb-6">
              <PieChart className="w-8 h-8" />
              <span className="text-lg font-medium">Fractional Ownership</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Own a Piece of<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Premium Real Estate
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
              Fractionalize property NFTs into 1M tradeable shares with LayerZero cross-chain technology 
              and Flare Oracle price feeds for global liquidity.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Start Trading Shares
              </button>
              <button className="btn-secondary border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Market Data
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Real Estate DeFi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of property investment with blockchain-powered fractional ownership, 
              cross-chain trading, and decentralized price oracles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: PieChart,
                title: 'Fractional Ownership',
                description: 'Transform property NFTs into 1,000,000 tradeable share tokens representing 100% ownership.',
                features: ['1M token supply', 'ERC-20 compatible', 'Dividend distribution', 'Redemption rights']
              },
              {
                icon: Globe,
                title: 'Cross-Chain Trading',
                description: 'Trade property shares across Ethereum, Arbitrum, Polygon, and other networks via LayerZero.',
                features: ['LayerZero OApp', 'Multi-chain DEX', 'Unified liquidity', 'Low fees']
              },
              {
                icon: BarChart3,
                title: 'Flare Oracle Integration',
                description: 'Reliable, decentralized price feeds powered by Flare Time Series Oracle (FTSO).',
                features: ['Real-time prices', 'High accuracy', 'Tamper-resistant', 'Multi-source data']
              },
              {
                icon: Shield,
                title: 'Secure Vaults',
                description: 'Original property NFTs are locked in LayerZero OVault smart contracts with redemption mechanisms.',
                features: ['Smart contract security', 'Redemption threshold', 'Emergency controls', 'Audited code']
              },
              {
                icon: Coins,
                title: 'Liquidity Provision',
                description: 'Earn fees by providing liquidity to property share token pools across multiple networks.',
                features: ['AMM pools', 'LP rewards', 'Yield farming', 'Fee sharing']
              },
              {
                icon: TrendingUp,
                title: 'Advanced Trading',
                description: 'Professional trading features including limit orders, market making, and analytics.',
                features: ['Order books', 'Price charts', 'Trading history', 'Portfolio tracking']
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 rounded-xl p-3 mr-4">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Fractional Ownership Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to fractionalize, trade, and earn from real estate
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Fractionalize Property',
                description: 'Lock your property NFT in LayerZero OVault and mint 1M share tokens',
                icon: PieChart
              },
              {
                step: '02',
                title: 'Enable Trading',
                description: 'List share tokens on DEXs across multiple networks with Flare Oracle prices',
                icon: Globe
              },
              {
                step: '03',
                title: 'Trade & Earn',
                description: 'Buy, sell, and provide liquidity for property shares with automated rewards',
                icon: Coins
              },
              {
                step: '04',
                title: 'Redeem or Hold',
                description: 'Collect dividends or accumulate shares to redeem the original property NFT',
                icon: ArrowUpRight
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="bg-primary-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '$2.5M+', label: 'Total Value Locked' },
              { value: '150+', label: 'Fractionalized Properties' },
              { value: '12+', label: 'Supported Networks' },
              { value: '99.9%', label: 'Oracle Uptime' }
            ].map((stat, index) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-100">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Interface */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Manage Your Fractional Portfolio
            </h2>
            <p className="text-xl text-gray-600">
              Trade, provide liquidity, and track your property share investments
            </p>
          </div>

          <FractionalOwnership />
        </div>
      </section>

      {/* Network Support */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Multi-Chain Infrastructure
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built on LayerZero for seamless cross-chain trading and Flare for reliable price oracles
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {[
              { name: 'Ethereum', logo: '🔷' },
              { name: 'Arbitrum', logo: '🟦' },
              { name: 'Polygon', logo: '🟣' },
              { name: 'Flare', logo: '🔥' },
              { name: 'LayerZero', logo: '⚡' },
              { name: 'Sui', logo: '💧' }
            ].map((network) => (
              <div key={network.name} className="text-center">
                <div className="text-4xl mb-3">{network.logo}</div>
                <div className="text-sm font-medium text-gray-300">{network.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Fractionalize Your Property?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join the future of real estate investment with blockchain-powered fractional ownership
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Users className="w-5 h-5 mr-2" />
                Get Started Now
              </button>
              <button className="btn-secondary border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
