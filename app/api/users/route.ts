import { NextRequest, NextResponse } from 'next/server';
import { userOperations } from '@/lib/db-utils';

// GET /api/users - Get user by Privy ID or wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyId = searchParams.get('privyId');
    const walletAddress = searchParams.get('walletAddress');

    if (!privyId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either privyId or walletAddress is required' },
        { status: 400 }
      );
    }

    let user;
    if (privyId) {
      user = await userOperations.getUserByPrivyId(privyId);
    } else if (walletAddress) {
      user = await userOperations.getUserByWalletAddress(walletAddress);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create or update user from Privy data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyUser } = body;

    if (!privyUser || !privyUser.id) {
      return NextResponse.json(
        { error: 'Valid Privy user data is required' },
        { status: 400 }
      );
    }

    const user = await userOperations.upsertUser(privyUser);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await userOperations.updateUser(userId, updates);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
