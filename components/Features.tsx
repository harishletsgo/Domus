'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Globe, 
  Database, 
  Zap, 
  Users, 
  FileText,
  Lock,
  TrendingUp,
  Smartphone
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'All transactions are secured by smart contracts and verified on multiple blockchain networks.',
      color: 'from-green-400 to-emerald-600',
    },
    {
      icon: Globe,
      title: 'Cross-Chain Trading',
      description: 'Trade properties across Ethereum, Polygon, Arbitrum, and other major networks seamlessly.',
      color: 'from-blue-400 to-cyan-600',
    },
    {
      icon: Database,
      title: 'Decentralized Storage',
      description: 'Property documents and metadata stored securely on Walrus decentralized storage network.',
      color: 'from-purple-400 to-violet-600',
    },
    {
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Fast and efficient property transfers with LayerZero\'s omnichain technology.',
      color: 'from-yellow-400 to-orange-600',
    },
    {
      icon: Users,
      title: 'Verified Brokers',
      description: 'Work with certified real estate professionals who understand blockchain technology.',
      color: 'from-pink-400 to-rose-600',
    },
    {
      icon: FileText,
      title: 'Smart Documentation',
      description: 'All legal documents are digitized, verified, and stored immutably on the blockchain.',
      color: 'from-indigo-400 to-blue-600',
    },
    {
      icon: Lock,
      title: 'Ownership Proof',
      description: 'NFTs provide immutable proof of ownership that can\'t be forged or duplicated.',
      color: 'from-red-400 to-pink-600',
    },
    {
      icon: TrendingUp,
      title: 'Market Analytics',
      description: 'Real-time market data, price history, and investment insights for informed decisions.',
      color: 'from-emerald-400 to-teal-600',
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Complete property management from your mobile device with our responsive design.',
      color: 'from-orange-400 to-red-600',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Revolutionary Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of real estate with cutting-edge Web3 technology 
            that makes property transactions secure, transparent, and efficient.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300`}></div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-50 to-accent-50 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Technology Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Built on Leading Technology</h3>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                Domus leverages the most advanced blockchain and decentralized technologies 
                to provide unmatched security and performance.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-white/10 rounded-2xl p-6 mb-4 group-hover:bg-white/20 transition-colors duration-300">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3"></div>
                  <h4 className="font-semibold">LayerZero</h4>
                  <p className="text-sm text-gray-400">Omnichain Protocol</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white/10 rounded-2xl p-6 mb-4 group-hover:bg-white/20 transition-colors duration-300">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3"></div>
                  <h4 className="font-semibold">Walrus</h4>
                  <p className="text-sm text-gray-400">Decentralized Storage</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white/10 rounded-2xl p-6 mb-4 group-hover:bg-white/20 transition-colors duration-300">
                  <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3"></div>
                  <h4 className="font-semibold">Sui</h4>
                  <p className="text-sm text-gray-400">Blockchain Network</p>
                </div>
              </div>

              <div className="text-center group">
                <div className="bg-white/10 rounded-2xl p-6 mb-4 group-hover:bg-white/20 transition-colors duration-300">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg mx-auto mb-3"></div>
                  <h4 className="font-semibold">IPFS</h4>
                  <p className="text-sm text-gray-400">Content Addressing</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
