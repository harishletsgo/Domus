import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - in production, this would come from a database
const mockProperties = [
  {
    id: 1,
    title: 'Modern Oceanfront Villa',
    location: 'Malibu, California',
    price: '4.2 ETH',
    priceUSD: '$12,650,000',
    bedrooms: 6,
    bathrooms: 8,
    sqft: 8500,
    type: 'RESIDENTIAL',
    verified: true,
    chain: 'Ethereum',
    walrusHash: 'QmX1Y2Z3a4B5C6d7E8f9G0h1I2j3K4l5M6n7O8p9Q0r1S2t',
    features: ['Ocean View', 'Private Beach', 'Pool', 'Garage'],
    tokenId: 1,
    owner: '0x1234567890123456789012345678901234567890',
    isListed: true,
    listedAt: Date.now() - 86400000, // 1 day ago
  },
  {
    id: 2,
    title: 'Downtown Commercial Complex',
    location: 'Manhattan, New York',
    price: '15.8 ETH',
    priceUSD: '$47,850,000',
    bedrooms: null,
    bathrooms: 25,
    sqft: 125000,
    type: 'COMMERCIAL',
    verified: true,
    chain: 'Polygon',
    walrusHash: 'QmA1B2C3d4E5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w',
    features: ['Prime Location', 'High Traffic', 'Parking', 'Elevator'],
    tokenId: 2,
    owner: '0x2345678901234567890123456789012345678901',
    isListed: true,
    listedAt: Date.now() - 172800000, // 2 days ago
  },
  {
    id: 3,
    title: 'Luxury Mountain Retreat',
    location: 'Aspen, Colorado',
    price: '2.1 ETH',
    priceUSD: '$6,350,000',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 6200,
    type: 'RESIDENTIAL',
    verified: true,
    chain: 'Arbitrum',
    walrusHash: 'QmP1Q2R3s4T5U6v7W8x9Y0z1A2b3C4d5E6f7G8h9I0j1K2l',
    features: ['Mountain View', 'Ski Access', 'Fireplace', 'Hot Tub'],
    tokenId: 3,
    owner: '0x3456789012345678901234567890123456789012',
    isListed: true,
    listedAt: Date.now() - 259200000, // 3 days ago
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const chain = searchParams.get('chain');
    const verified = searchParams.get('verified');

    let filteredProperties = [...mockProperties];

    // Apply filters
    if (type && type !== 'all') {
      filteredProperties = filteredProperties.filter(p => p.type === type.toUpperCase());
    }

    if (location) {
      filteredProperties = filteredProperties.filter(p => 
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (chain && chain !== 'all') {
      filteredProperties = filteredProperties.filter(p => p.chain === chain);
    }

    if (verified === 'true') {
      filteredProperties = filteredProperties.filter(p => p.verified);
    }

    // Price filtering would require converting ETH prices to numbers
    // This is simplified for demo purposes

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    const response = {
      properties: paginatedProperties,
      pagination: {
        page,
        limit,
        total: filteredProperties.length,
        totalPages: Math.ceil(filteredProperties.length / limit),
        hasNext: endIndex < filteredProperties.length,
        hasPrev: page > 1,
      },
      filters: {
        type,
        minPrice,
        maxPrice,
        location,
        chain,
        verified,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real implementation, this would:
    // 1. Validate the property data
    // 2. Verify the user is authenticated
    // 3. Store the property in a database
    // 4. Trigger smart contract interaction
    // 5. Store documents in Walrus
    
    const newProperty = {
      id: mockProperties.length + 1,
      ...body,
      tokenId: mockProperties.length + 1,
      isListed: true,
      verified: false, // Would be verified by a broker
      listedAt: Date.now(),
    };

    // Mock response for successful property creation
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
