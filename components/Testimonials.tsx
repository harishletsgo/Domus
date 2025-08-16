'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Real Estate Investor',
      company: 'Pacific Properties',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'Domus revolutionized how I manage my property portfolio. The cross-chain functionality and secure document storage give me peace of mind knowing my investments are protected.',
      highlight: 'Cross-chain functionality is game-changing',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      role: 'Licensed Broker',
      company: 'Rodriguez Realty',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'As a broker, I love how Domus streamlines the entire process. Clients trust the blockchain verification, and the document management system saves us hours of paperwork.',
      highlight: 'Streamlines the entire process',
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'Property Developer',
      company: 'Thompson Development',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'The ability to tokenize properties and trade them across different blockchains opened up new opportunities for international investors. Domus is the future of real estate.',
      highlight: 'Opened new international opportunities',
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Tech Entrepreneur',
      company: 'Blockchain Ventures',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'Finally, a platform that combines real estate with cutting-edge blockchain technology. The LayerZero integration and Walrus storage make this incredibly robust.',
      highlight: 'Cutting-edge blockchain technology',
    },
    {
      id: 5,
      name: 'Lisa Johnson',
      role: 'Investment Manager',
      company: 'Capital Growth Fund',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'The transparency and security offered by Domus are unmatched. We can verify property ownership and documents instantly, making due diligence much more efficient.',
      highlight: 'Unmatched transparency and security',
    },
    {
      id: 6,
      name: 'James Wilson',
      role: 'Property Owner',
      company: 'Private Investor',
      image: '/api/placeholder/80/80',
      rating: 5,
      text: 'Listing my property as an NFT was surprisingly simple. The platform guided me through every step, and I sold my property to an international buyer within weeks.',
      highlight: 'Surprisingly simple process',
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
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of property owners, investors, and brokers who are already 
            using Domus to revolutionize their real estate transactions.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-12 h-12 text-primary-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.text}"
              </blockquote>

              {/* Highlight */}
              <div className="bg-primary-50 border-l-4 border-primary-500 p-3 mb-6">
                <p className="text-primary-700 font-medium text-sm">
                  "{testimonial.highlight}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-primary-600 font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Proven Results
            </h3>
            <p className="text-gray-600 text-lg">
              Our platform delivers measurable improvements for all users
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                98%
              </div>
              <div className="text-gray-600 font-medium">
                Customer Satisfaction
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent-600 mb-2">
                67%
              </div>
              <div className="text-gray-600 font-medium">
                Faster Transactions
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary-600 mb-2">
                45%
              </div>
              <div className="text-gray-600 font-medium">
                Reduced Costs
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                24/7
              </div>
              <div className="text-gray-600 font-medium">
                Global Access
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to join them?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your Web3 real estate journey today and experience the future 
            of property transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary px-8 py-4 text-lg">
              Get Started Now
            </button>
            <button className="btn-secondary px-8 py-4 text-lg">
              Schedule a Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
