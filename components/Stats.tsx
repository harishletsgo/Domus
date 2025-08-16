'use client';

import { motion } from 'framer-motion';
import { DollarSign, Home, Users, Globe } from 'lucide-react';

export function Stats() {
  const stats = [
    {
      id: 1,
      name: 'Total Property Value',
      value: '$2.4B',
      icon: DollarSign,
      description: 'Worth of properties listed',
      change: '+12%',
    },
    {
      id: 2,
      name: 'Properties Listed',
      value: '15,847',
      icon: Home,
      description: 'NFT properties available',
      change: '+28%',
    },
    {
      id: 3,
      name: 'Active Users',
      value: '89,324',
      icon: Users,
      description: 'Verified users trading',
      change: '+18%',
    },
    {
      id: 4,
      name: 'Supported Chains',
      value: '12',
      icon: Globe,
      description: 'Blockchain networks',
      change: '+3',
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by thousands worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join the growing community of property owners, investors, and brokers 
            revolutionizing real estate through blockchain technology.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary-100 rounded-lg p-3">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                      {stat.change}
                    </div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {stat.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Real-time market data
              </h3>
              <p className="text-gray-600 mb-6">
                Get instant access to property valuations, market trends, and transaction 
                history across all supported blockchain networks.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
                  Live pricing
                </span>
                <span className="bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
                  Historical data
                </span>
                <span className="bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
                  Market analytics
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Average Property Value (24h)
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                2.847 ETH
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Floor Price</span>
                  <span className="font-medium">0.5 ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Volume (24h)</span>
                  <span className="font-medium">147.2 ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Supply</span>
                  <span className="font-medium">15,847 NFTs</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
