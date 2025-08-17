'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PropertyFormData } from '@/app/list-property/page';
import { Plus, X, Upload, MapPin, Home, DollarSign, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PropertyListingFormProps {
  onSubmit: (data: PropertyFormData) => void;
}

export function PropertyListingForm({ onSubmit }: PropertyListingFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Array<{
    file: File;
    type: 'deed' | 'survey' | 'inspection' | 'appraisal' | 'insurance' | 'tax' | 'other';
    name: string;
  }>>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<PropertyFormData>();

  const sections = [
    { title: 'Basic Information', icon: Home, description: 'Property type, title, and description' },
    { title: 'Location Details', icon: MapPin, description: 'Address and geographic information' },
    { title: 'Specifications', icon: Zap, description: 'Size, rooms, and property features' },
    { title: 'Pricing & Legal', icon: DollarSign, description: 'Price, legal info, and utilities' },
    { title: 'Media & Documents', icon: FileText, description: 'Photos and legal documents' },
  ];

  const propertyTypes = [
    { value: 'RESIDENTIAL', label: 'Residential', description: 'Houses, apartments, condos' },
    { value: 'COMMERCIAL', label: 'Commercial', description: 'Offices, retail, restaurants' },
    { value: 'INDUSTRIAL', label: 'Industrial', description: 'Warehouses, factories, plants' },
    { value: 'LAND', label: 'Land', description: 'Vacant lots, acreage, farmland' },
    { value: 'MIXED_USE', label: 'Mixed Use', description: 'Combination of property types' },
  ];

  const documentTypes = [
    { value: 'deed', label: 'Property Deed' },
    { value: 'survey', label: 'Survey Report' },
    { value: 'inspection', label: 'Inspection Report' },
    { value: 'appraisal', label: 'Appraisal Report' },
    { value: 'insurance', label: 'Insurance Documents' },
    { value: 'tax', label: 'Tax Records' },
    { value: 'other', label: 'Other Documents' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipping file ${file.name} - invalid type: ${file.type}`);
        return false;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`Skipping file ${file.name} - too large: ${file.size} bytes`);
        return false;
      }
      
      return true;
    });
    
    const newDocs = validFiles.map(file => ({
      file,
      type: 'other' as const,
      name: file.name,
    }));
    setSelectedDocuments(prev => [...prev, ...newDocs]);
    
    // Show warning if some files were rejected
    if (validFiles.length !== files.length) {
      const rejectedCount = files.length - validFiles.length;
      console.warn(`${rejectedCount} file(s) were rejected due to invalid type or size.`);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const updateDocumentType = (index: number, type: string) => {
    setSelectedDocuments(prev => 
      prev.map((doc, i) => 
        i === index ? { ...doc, type: type as any } : doc
      )
    );
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(prev => prev.filter(f => f !== feature));
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const onFormSubmit = (data: any) => {
    const formData: PropertyFormData = {
      ...data,
      features,
      images: selectedImages,
      documents: selectedDocuments,
    };
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Section Navigation */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 overflow-x-auto">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = index === currentSection;
                const isCompleted = index < currentSection;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentSection(index)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-sm text-gray-500 ml-4">
              {currentSection + 1} of {sections.length}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {sections[currentSection].title}
              </h2>
              <p className="text-gray-600">{sections[currentSection].description}</p>
            </div>

            {/* Section 0: Basic Information */}
            {currentSection === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Property Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {propertyTypes.map((type) => {
                      const isSelected = watch('propertyType') === type.value;
                      return (
                        <label
                          key={type.value}
                          className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 border-2 ${
                            isSelected
                              ? 'bg-primary-50 border-primary-500 shadow-md'
                              : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            {...register('propertyType', { required: 'Property type is required' })}
                            value={type.value}
                            className="sr-only"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                                {type.label}
                              </span>
                              {isSelected && (
                                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                              {type.description}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.propertyType && (
                    <p className="mt-1 text-sm text-red-600">{errors.propertyType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Property title is required' })}
                    className="form-input"
                    placeholder="e.g., Modern 3-bedroom house with ocean view"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Description *
                  </label>
                  <textarea
                    {...register('description', { required: 'Property description is required' })}
                    rows={4}
                    className="form-textarea"
                    placeholder="Describe the property, its features, and what makes it special..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Location Details */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      {...register('location.streetAddress', { required: 'Street address is required' })}
                      className="form-input"
                      placeholder="123 Main Street"
                    />
                    {errors.location?.streetAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.streetAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register('location.city', { required: 'City is required' })}
                      className="form-input"
                      placeholder="San Francisco"
                    />
                    {errors.location?.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      {...register('location.state', { required: 'State is required' })}
                      className="form-input"
                      placeholder="California"
                    />
                    {errors.location?.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      {...register('location.zipCode', { required: 'ZIP code is required' })}
                      className="form-input"
                      placeholder="94101"
                    />
                    {errors.location?.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.zipCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      {...register('location.country', { required: 'Country is required' })}
                      className="form-input"
                      placeholder="United States"
                    />
                    {errors.location?.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register('location.latitude', { valueAsNumber: true })}
                      className="form-input"
                      placeholder="37.7749"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      {...register('location.longitude', { valueAsNumber: true })}
                      className="form-input"
                      placeholder="-122.4194"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Specifications */}
            {currentSection === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Footage *
                    </label>
                    <input
                      type="number"
                      {...register('specifications.squareFootage', { 
                        required: 'Square footage is required',
                        valueAsNumber: true,
                        min: { value: 1, message: 'Must be greater than 0' }
                      })}
                      className="form-input"
                      placeholder="2500"
                    />
                    {errors.specifications?.squareFootage && (
                      <p className="mt-1 text-sm text-red-600">{errors.specifications.squareFootage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      {...register('specifications.bedrooms', { valueAsNumber: true, min: 0 })}
                      className="form-input"
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('specifications.bathrooms', { valueAsNumber: true, min: 0 })}
                      className="form-input"
                      placeholder="2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Built *
                    </label>
                    <input
                      type="number"
                      {...register('specifications.yearBuilt', {
                        required: 'Year built is required',
                        valueAsNumber: true,
                        min: { value: 1800, message: 'Year must be after 1800' },
                        max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                      })}
                      className="form-input"
                      placeholder="2020"
                    />
                    {errors.specifications?.yearBuilt && (
                      <p className="mt-1 text-sm text-red-600">{errors.specifications.yearBuilt.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lot Size (sq ft)
                    </label>
                    <input
                      type="number"
                      {...register('specifications.lotSize', { valueAsNumber: true, min: 0 })}
                      className="form-input"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parking Spaces
                    </label>
                    <input
                      type="number"
                      {...register('specifications.parkingSpaces', { valueAsNumber: true, min: 0 })}
                      className="form-input"
                      placeholder="2"
                    />
                  </div>
                </div>

                {/* Features Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features & Amenities
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="form-input flex-1"
                      placeholder="Add a feature (e.g., Hardwood floors, Pool, Garden)"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Pricing & Legal */}
            {currentSection === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    {...register('price', { 
                      required: 'Price is required',
                      min: { value: 0.001, message: 'Price must be at least 0.001 ETH' }
                    })}
                    className="form-input"
                    placeholder="2.5"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Legal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parcel ID *
                    </label>
                    <input
                      type="text"
                      {...register('legalInfo.parcelId', { required: 'Parcel ID is required' })}
                      className="form-input"
                      placeholder="123-456-789"
                    />
                    {errors.legalInfo?.parcelId && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.parcelId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deed Number *
                    </label>
                    <input
                      type="text"
                      {...register('legalInfo.deedNumber', { required: 'Deed number is required' })}
                      className="form-input"
                      placeholder="DEED-2024-001"
                    />
                    {errors.legalInfo?.deedNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.deedNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zoning *
                    </label>
                    <input
                      type="text"
                      {...register('legalInfo.zoning', { required: 'Zoning is required' })}
                      className="form-input"
                      placeholder="R1-Residential"
                    />
                    {errors.legalInfo?.zoning && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.zoning.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Assessment ($) *
                    </label>
                    <input
                      type="number"
                      {...register('legalInfo.taxAssessment', { 
                        required: 'Tax assessment is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Must be a positive number' }
                      })}
                      className="form-input"
                      placeholder="500000"
                    />
                    {errors.legalInfo?.taxAssessment && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.taxAssessment.message}</p>
                    )}
                  </div>
                </div>

                {/* Utilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Utilities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('utilities.electricity')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Electricity</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('utilities.water')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Water</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('utilities.gas')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Gas</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('utilities.internet')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Internet</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('utilities.sewer')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Sewer</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Media & Documents */}
            {currentSection === 4 && (
              <div className="space-y-6">
                {/* Images Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Property Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors duration-200">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload property images</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn-secondary cursor-pointer"
                    >
                      Choose Images
                    </label>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Legal Documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors duration-200">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Upload legal documents (PDF, JPG, PNG only)</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="btn-secondary cursor-pointer"
                    >
                      Choose Documents
                    </label>
                  </div>

                  {selectedDocuments.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {selectedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <select
                              value={doc.type}
                              onChange={(e) => updateDocumentType(index, e.target.value)}
                              className="form-select text-sm"
                            >
                              {documentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevSection}
              disabled={currentSection === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="btn-primary"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
