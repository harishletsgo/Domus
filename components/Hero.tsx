'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Globe, Database } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              Powered by LayerZero & Walrus
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Real Estate
              </span>{' '}
              is Here
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Trade property NFTs across multiple blockchains with LayerZero's seamless 
              cross-chain technology. Store documents securely on Walrus decentralized storage. 
              Welcome to Web3 real estate.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/properties"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Explore Properties
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <Link
                href="/list-property"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                List Your Property
              </Link>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-md">
                <Shield className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Secure & Verified</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-md">
                <Globe className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Cross-Chain</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-md">
                <Database className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Decentralized Storage</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="aspect-w-16 aspect-h-10">
                <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 rounded-lg px-3 py-1">
                        <span className="text-white text-sm font-medium">Property NFT</span>
                      </div>
                      <div className="bg-green-400 rounded-full p-1">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                      <h3 className="font-semibold text-gray-900">Modern Villa</h3>
                      <p className="text-gray-600 text-sm">Beverly Hills, CA</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-primary-600 font-bold">2.5 ETH</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Verified
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
                        <div className="text-white text-xs">Chain</div>
                        <div className="text-white font-medium text-sm">Ethereum</div>
                      </div>
                      <div className="flex-1 bg-white/20 rounded-lg p-2 text-center">
                        <div className="text-white text-xs">Storage</div>
                        <div className="text-white font-medium text-sm">Walrus</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute -top-4 -right-4 bg-secondary-400 rounded-xl p-4 shadow-lg"
            >
              <Database className="w-6 h-6 text-white" />
            </motion.div>

            <motion.div
              animate={{
                y: [0, 15, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1,
              }}
              className="absolute -bottom-4 -left-4 bg-accent-500 rounded-xl p-4 shadow-lg"
            >
              <Globe className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
