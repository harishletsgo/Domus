import { NextRequest, NextResponse } from 'next/server';
import { propertyOperations, propertyImageOperations } from '@/lib/db-utils';

// GET /api/users/[userId]/properties - Get user's properties
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const properties = await propertyOperations.getUserProperties(userId);

    // For each property, get images
    const propertiesWithImages = await Promise.all(
      properties.map(async (property) => {
        const images = await propertyImageOperations.getPropertyImages(property.id);
        const primaryImage = images.find(img => img.isPrimary) || images[0];
        
        return {
          ...property,
          primaryImage: primaryImage?.imageUrl || null,
          imageCount: images.length,
        };
      })
    );

    return NextResponse.json({ properties: propertiesWithImages });
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
