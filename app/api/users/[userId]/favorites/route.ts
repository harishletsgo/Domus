import { NextRequest, NextResponse } from 'next/server';
import { favoriteOperations, propertyImageOperations } from '@/lib/db-utils';

// GET /api/users/[userId]/favorites - Get user's favorite properties
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

    const favorites = await favoriteOperations.getUserFavorites(userId);

    // For each property, get images
    const favoritesWithImages = await Promise.all(
      favorites.map(async (property) => {
        const images = await propertyImageOperations.getPropertyImages(property.id);
        const primaryImage = images.find(img => img.isPrimary) || images[0];
        
        return {
          ...property,
          primaryImage: primaryImage?.imageUrl || null,
          imageCount: images.length,
        };
      })
    );

    return NextResponse.json({ favorites: favoritesWithImages });
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/favorites - Add property to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { propertyId } = await request.json();

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'User ID and property ID are required' },
        { status: 400 }
      );
    }

    await favoriteOperations.addFavorite(userId, propertyId);

    return NextResponse.json({ 
      message: 'Property added to favorites',
      success: true 
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/favorites - Remove property from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'User ID and property ID are required' },
        { status: 400 }
      );
    }

    await favoriteOperations.removeFavorite(userId, propertyId);

    return NextResponse.json({ 
      message: 'Property removed from favorites',
      success: true 
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
