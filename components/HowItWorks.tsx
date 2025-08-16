'use client';

import { motion } from 'framer-motion';
import { Wallet, Upload, Shield, ArrowRight, FileText, Globe } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      step: 1,
      icon: Wallet,
      title: 'Connect Your Wallet',
      description: 'Connect your Web3 wallet to get started. We support MetaMask, WalletConnect, and other popular wallets.',
      details: ['MetaMask integration', 'Multi-chain support', 'Secure authentication'],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: 2,
      icon: Upload,
      title: 'Upload Property Data',
      description: 'Upload your property documents, photos, and metadata. Everything is stored securely on Walrus.',
      details: ['Document verification', 'IPFS storage', 'Metadata validation'],
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: 3,
      icon: Shield,
      title: 'Mint Property NFT',
      description: 'Create an NFT representing your property with all legal documents attached and verified.',
      details: ['Smart contract minting', 'Legal verification', 'Ownership proof'],
      color: 'from-green-500 to-emerald-500',
    },
    {
      step: 4,
      icon: Globe,
      title: 'Trade Cross-Chain',
      description: 'List and trade your property NFT across multiple blockchain networks seamlessly.',
      details: ['LayerZero integration', 'Cross-chain transfers', 'Global marketplace'],
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started with Domus in four simple steps. From wallet connection to 
            cross-chain trading, we've made the process seamless and secure.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200 transform -translate-y-1/2"></div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {step.step}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details */}
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>

                    {/* Arrow for desktop */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 grid md:grid-cols-2 gap-8"
        >
          {/* Left Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-primary-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Document Security</h3>
            </div>
            <p className="text-gray-600 mb-4">
              All property documents are encrypted and stored on Walrus decentralized storage, 
              ensuring they're immutable and always accessible.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                End-to-end encryption
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                Immutable storage
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                Global accessibility
              </li>
            </ul>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <Globe className="w-6 h-6 text-primary-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Cross-Chain Trading</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Trade your property NFTs across multiple blockchain networks without 
              losing ownership or paying excessive bridge fees.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                LayerZero omnichain protocol
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                Low transaction fees
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                Instant settlements
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
