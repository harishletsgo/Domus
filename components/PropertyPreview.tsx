'use client';

import { PropertyFormData } from '@/app/list-property/page';
import { ArrowLeft, MapPin, Home, DollarSign, FileText, Image, CheckCircle } from 'lucide-react';

interface PropertyPreviewProps {
  data: PropertyFormData;
  onConfirm: () => void;
  onBack: () => void;
}

export function PropertyPreview({ data, onConfirm, onBack }: PropertyPreviewProps) {
  const formatPrice = (price: string) => {
    const ethPrice = parseFloat(price);
    // Mock USD conversion rate - in production, you'd fetch real rates
    const usdPrice = ethPrice * 3000; // Approximate ETH to USD
    return {
      eth: `${ethPrice} ETH`,
      usd: `$${usdPrice.toLocaleString()}`
    };
  };

  const getPropertyTypeLabel = (type: string) => {
    const types = {
      'RESIDENTIAL': 'Residential',
      'COMMERCIAL': 'Commercial',
      'INDUSTRIAL': 'Industrial',
      'LAND': 'Land',
      'MIXED_USE': 'Mixed Use'
    };
    return types[type as keyof typeof types] || type;
  };

  const getDocumentTypeLabel = (type: string) => {
    const types = {
      'deed': 'Property Deed',
      'survey': 'Survey Report',
      'inspection': 'Inspection Report',
      'appraisal': 'Appraisal Report',
      'insurance': 'Insurance Documents',
      'tax': 'Tax Records',
      'other': 'Other Documents'
    };
    return types[type as keyof typeof types] || type;
  };

  const price = formatPrice(data.price);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
              <div className="flex items-center text-primary-100">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{data.location.streetAddress}, {data.location.city}, {data.location.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{price.eth}</div>
              <div className="text-primary-100">{price.usd}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Property Images */}
          {data.images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Property Images ({data.images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.images.slice(0, 8).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {index === 7 && data.images.length > 8 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{data.images.length - 8} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Property Details
                </h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-600">Type</span>
                      <div className="font-medium">{getPropertyTypeLabel(data.propertyType)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Square Feet</span>
                      <div className="font-medium">{data.specifications.squareFootage.toLocaleString()}</div>
                    </div>
                    {data.specifications.bedrooms && (
                      <div>
                        <span className="text-sm text-gray-600">Bedrooms</span>
                        <div className="font-medium">{data.specifications.bedrooms}</div>
                      </div>
                    )}
                    {data.specifications.bathrooms && (
                      <div>
                        <span className="text-sm text-gray-600">Bathrooms</span>
                        <div className="font-medium">{data.specifications.bathrooms}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600">Year Built</span>
                      <div className="font-medium">{data.specifications.yearBuilt}</div>
                    </div>
                    {data.specifications.lotSize && (
                      <div>
                        <span className="text-sm text-gray-600">Lot Size</span>
                        <div className="font-medium">{data.specifications.lotSize.toLocaleString()} sq ft</div>
                      </div>
                    )}
                    {data.specifications.parkingSpaces && (
                      <div>
                        <span className="text-sm text-gray-600">Parking</span>
                        <div className="font-medium">{data.specifications.parkingSpaces} spaces</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Description</span>
                    <p className="text-gray-900 mt-1">{data.description}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              {data.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Full Address</span>
                      <div className="font-medium">
                        {data.location.streetAddress}<br />
                        {data.location.city}, {data.location.state} {data.location.zipCode}<br />
                        {data.location.country}
                      </div>
                    </div>
                    {(data.location.latitude || data.location.longitude) && (
                      <div>
                        <span className="text-sm text-gray-600">Coordinates</span>
                        <div className="font-medium font-mono text-sm">
                          {data.location.latitude}, {data.location.longitude}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Information</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Parcel ID</span>
                      <div className="font-medium">{data.legalInfo.parcelId}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Deed Number</span>
                      <div className="font-medium">{data.legalInfo.deedNumber}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Zoning</span>
                      <div className="font-medium">{data.legalInfo.zoning}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tax Assessment</span>
                      <div className="font-medium">${data.legalInfo.taxAssessment.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Utilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(data.utilities).map(([utility, available]) => (
                    <div
                      key={utility}
                      className={`flex items-center space-x-2 p-2 rounded-lg ${
                        available ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 ${available ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm capitalize">{utility}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">List Price</span>
                    <span className="font-bold text-xl">{price.eth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Equivalent</span>
                    <span className="font-medium">{price.usd}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee (2.5%)</span>
                    <span className="font-medium">{(parseFloat(data.price) * 0.025).toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gas Fee</span>
                    <span className="font-medium">~0.01 ETH</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {data.documents.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Documents ({data.documents.length})
                  </h3>
                  <div className="space-y-3">
                    {data.documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">{getDocumentTypeLabel(doc.type)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blockchain Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-medium">Sepolia Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Standard</span>
                    <span className="font-medium">ERC-721 (ONFT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium">Walrus (Sui)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cross-Chain</span>
                    <span className="font-medium">LayerZero V2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Edit</span>
            </button>

            <button
              onClick={onConfirm}
              className="btn-primary px-8 py-3 text-lg"
            >
              Mint Property NFT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
