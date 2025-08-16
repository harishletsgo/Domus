import { NextRequest, NextResponse } from 'next/server';
import { propertyOperations, propertyImageOperations, propertyDocumentOperations } from '@/lib/db-utils';

// GET /api/properties - Get public properties with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') as 'price' | 'created' | 'featured' || 'created';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const propertyType = searchParams.get('type') !== 'all' ? searchParams.get('type') || undefined : undefined;
    const location = searchParams.get('location') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const search = searchParams.get('search');

    // Extract city and state from location if provided
    let city, state;
    if (location) {
      const locationParts = location.split(',');
      if (locationParts.length === 2) {
        city = locationParts[0].trim();
        state = locationParts[1].trim();
      } else {
        city = location;
      }
    }

    let result;

    if (search) {
      // If search term provided, use search function
      const properties = await propertyOperations.searchProperties(search, { limit, offset });
      result = { properties, total: properties.length };
    } else {
      // Otherwise use filtered query
      result = await propertyOperations.getPublicProperties({
        limit,
        offset,
        sortBy,
        sortOrder,
        propertyType,
        city,
        state,
        minPrice,
        maxPrice,
      });
    }

    // For each property, get images and format for API response
    const propertiesWithImages = await Promise.all(
      result.properties.map(async (property) => {
        const images = await propertyImageOperations.getPropertyImages(property.id);
        const primaryImage = images.find(img => img.isPrimary) || images[0];
        
        // Format property to match existing API structure
        return {
          id: property.id,
          title: property.title,
          location: `${property.city}, ${property.state}`,
          price: `${property.priceEth} ETH`,
          priceUSD: property.priceUsd ? `$${Number(property.priceUsd).toLocaleString()}` : null,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
          sqft: property.squareFootage,
          type: property.propertyType,
          verified: property.isVerified,
          chain: getChainName(property.chainId),
          walrusHash: property.walrusHash,
          features: property.features as string[] || [],
          tokenId: property.tokenId,
          owner: property.contractAddress, // Using contract address as owner for now
          isListed: property.isListed,
          listedAt: property.listedAt?.getTime() || property.createdAt.getTime(),
          primaryImage: primaryImage?.imageUrl || null,
          imageCount: images.length,
        };
      })
    );

    const totalPages = Math.ceil(result.total / limit);

    const response = {
      properties: propertiesWithImages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        type: propertyType,
        minPrice: minPrice?.toString(),
        maxPrice: maxPrice?.toString(),
        location,
        verified: 'true', // All DB properties are considered for verification
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

function getChainName(chainId: number | null): string {
  const chains: { [key: number]: string } = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    11155111: 'Sepolia',
  };
  return chainId ? chains[chainId] || 'Unknown' : 'Unknown';
}

// POST /api/properties - Create a new property listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      property,
      images = [],
      documents = [],
      userId 
    } = body;

    if (!property || !userId) {
      return NextResponse.json(
        { error: 'Property data and user ID are required' },
        { status: 400 }
      );
    }

    // Create the property
    const newProperty = await propertyOperations.createProperty({
      ...property,
      ownerId: userId,
      listedAt: new Date(),
      priceUsd: property.priceEth ? Number(property.priceEth) * 3000 : null, // Mock USD conversion
    });

    // Add images if provided
    if (images.length > 0) {
      await propertyImageOperations.addPropertyImages(newProperty.id, images);
    }

    // Add documents if provided
    if (documents.length > 0) {
      await propertyDocumentOperations.addPropertyDocuments(newProperty.id, documents);
    }

    return NextResponse.json({ 
      success: true,
      property: newProperty,
      message: 'Property listed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
