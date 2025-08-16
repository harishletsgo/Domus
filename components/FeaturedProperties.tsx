'use client';

import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Square, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function FeaturedProperties() {
  // Mock data - in real app, this would come from API
  const properties = [
    {
      id: 1,
      title: 'Modern Oceanfront Villa',
      location: 'Malibu, California',
      price: '4.2 ETH',
      priceUSD: '$12,650,000',
      image: '/api/placeholder/400/300',
      bedrooms: 6,
      bathrooms: 8,
      sqft: 8500,
      type: 'RESIDENTIAL',
      verified: true,
      chain: 'Ethereum',
      walrusHash: 'QmX1Y2Z3...',
      features: ['Ocean View', 'Private Beach', 'Pool', 'Garage'],
    },
    {
      id: 2,
      title: 'Downtown Commercial Complex',
      location: 'Manhattan, New York',
      price: '15.8 ETH',
      priceUSD: '$47,850,000',
      image: '/api/placeholder/400/300',
      bedrooms: null,
      bathrooms: 25,
      sqft: 125000,
      type: 'COMMERCIAL',
      verified: true,
      chain: 'Polygon',
      walrusHash: 'QmA1B2C3...',
      features: ['Prime Location', 'High Traffic', 'Parking', 'Elevator'],
    },
    {
      id: 3,
      title: 'Luxury Mountain Retreat',
      location: 'Aspen, Colorado',
      price: '2.1 ETH',
      priceUSD: '$6,350,000',
      image: '/api/placeholder/400/300',
      bedrooms: 5,
      bathrooms: 6,
      sqft: 6200,
      type: 'RESIDENTIAL',
      verified: true,
      chain: 'Arbitrum',
      walrusHash: 'QmP1Q2R3...',
      features: ['Mountain View', 'Ski Access', 'Fireplace', 'Hot Tub'],
    },
  ];

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case 'RESIDENTIAL':
        return 'property-residential';
      case 'COMMERCIAL':
        return 'property-commercial';
      case 'INDUSTRIAL':
        return 'property-industrial';
      case 'LAND':
        return 'property-land';
      default:
        return 'property-mixed';
    }
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'Ethereum':
        return 'bg-blue-100 text-blue-800';
      case 'Polygon':
        return 'bg-purple-100 text-purple-800';
      case 'Arbitrum':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Properties
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover premium real estate NFTs verified and secured on the blockchain. 
            Each property comes with complete documentation stored on Walrus.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400"></div>
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {property.verified && (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getChainColor(property.chain)}`}>
                    {property.chain}
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPropertyTypeColor(property.type)}`}>
                    {property.type}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" />
                      {property.bedrooms} bed
                    </div>
                  )}
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms} bath
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    {property.sqft.toLocaleString()} sqft
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {property.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {property.features.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        +{property.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {property.price}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.priceUSD}
                    </div>
                  </div>
                  <Link
                    href={`/property/${property.id}`}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                {/* Blockchain Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      Token ID: #{property.id.toString().padStart(4, '0')}
                    </div>
                    <div className="font-mono">
                      {property.walrusHash.slice(0, 10)}...
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/properties"
            className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Properties
            <ExternalLink className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
