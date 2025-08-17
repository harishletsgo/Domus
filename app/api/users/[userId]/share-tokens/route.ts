import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { users, properties, shareTokens } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { userOperations } from '@/lib/db-utils';
import { ethers } from 'ethers';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { db } = getConnection();

    // Resolve user ID if it's a Privy ID
    let dbUserId = userId;
    if (userId.startsWith('did:privy:')) {
      const user = await userOperations.getUserByPrivyId(userId);
      if (!user) {
        // Return empty tokens for non-existent users
        return NextResponse.json({
          success: true,
          shareTokens: []
        });
      }
      dbUserId = user.id;
    }

    // Get user's share tokens from database
    const userShareTokens = await db
      .select({
        id: shareTokens.id,
        contractAddress: shareTokens.contractAddress,
        symbol: shareTokens.symbol,
        name: shareTokens.name,
        propertyId: shareTokens.propertyId,
        totalSupply: shareTokens.totalSupply,
        userBalance: shareTokens.userBalance,
        currentPrice: shareTokens.currentPrice,
        priceChange24h: shareTokens.priceChange24h,
        volume24h: shareTokens.volume24h,
        marketCap: shareTokens.marketCap,
        isListed: shareTokens.isListed,
        canRedeem: shareTokens.canRedeem,
        redemptionThreshold: shareTokens.redemptionThreshold,
        property: {
          id: properties.id,
          title: properties.title,
          city: properties.city,
          state: properties.state,
          priceEth: properties.priceEth,
          tokenId: properties.tokenId
        }
      })
      .from(shareTokens)
      .leftJoin(properties, eq(shareTokens.propertyId, properties.id))
      .where(eq(shareTokens.ownerId, dbUserId));

    // Transform data for frontend
    const transformedTokens = userShareTokens.map(token => ({
      address: token.contractAddress,
      symbol: token.symbol,
      name: token.name,
      propertyTokenId: token.property?.tokenId || '',
      propertyTitle: token.property?.title || 'Unknown Property',
      propertyLocation: `${token.property?.city || 'Unknown'}, ${token.property?.state || 'Unknown'}`,
      propertyValue: token.property?.priceEth || '0',
      totalSupply: token.totalSupply,
      userBalance: token.userBalance,
      ownershipPercentage: calculateOwnershipPercentage(token.userBalance, token.totalSupply),
      currentPrice: token.currentPrice,
      priceChange24h: parseFloat(token.priceChange24h || '0'),
      volume24h: token.volume24h,
      marketCap: token.marketCap,
      isListed: token.isListed,
      canRedeem: token.canRedeem,
      redemptionThreshold: parseFloat(token.redemptionThreshold || '80')
    }));

    return NextResponse.json({
      success: true,
      shareTokens: transformedTokens
    });

  } catch (error) {
    console.error('Error fetching share tokens:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch share tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateOwnershipPercentage(userBalance: string, totalSupply: string): number {
  try {
    const balance = parseFloat(userBalance);
    const total = parseFloat(totalSupply);
    if (total === 0) return 0;
    return (balance / total) * 100;
  } catch (error) {
    console.error('Error calculating ownership percentage:', error);
    return 0;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const {
      propertyId,
      shareTokenName,
      shareTokenSymbol,
      propertyValue,
      fractionalizationFee
    } = body;

    const { db } = getConnection();

    // Resolve user ID if it's a Privy ID
    let dbUserId = userId;
    if (userId.startsWith('did:privy:')) {
      const user = await userOperations.getUserByPrivyId(userId);
      if (!user) {
        const newUser = await userOperations.upsertUser({
          id: userId,
          email: null,
          wallet: null
        });
        dbUserId = newUser.id;
      } else {
        dbUserId = user.id;
      }
    }

    // Validate property ownership
    const property = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, dbUserId)
      ))
      .limit(1);

    if (property.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property not found or not owned by user' },
        { status: 404 }
      );
    }

    // Check if property is already fractionalized
    const existingShareToken = await db
      .select()
      .from(shareTokens)
      .where(eq(shareTokens.propertyId, propertyId))
      .limit(1);

    if (existingShareToken.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Property is already fractionalized' },
        { status: 400 }
      );
    }

    // Create new share token record
    const totalSupply = '1000000.000000'; // 1M tokens with proper decimal format
    const newShareToken = await db
      .insert(shareTokens)
      .values({
        propertyId,
        ownerId: dbUserId,
        contractAddress: generateMockContractAddress(), // Will be replaced with actual deployment
        symbol: shareTokenSymbol,
        name: shareTokenName,
        totalSupply,
        userBalance: totalSupply, // Initially owner has all tokens
        currentPrice: calculateInitialPrice(propertyValue, totalSupply),
        priceChange24h: '0',
        volume24h: '0',
        marketCap: propertyValue,
        isListed: false,
        canRedeem: true,
        redemptionThreshold: '80',
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json({
      success: true,
      shareToken: newShareToken[0],
      message: 'Property successfully fractionalized'
    });

  } catch (error) {
    console.error('Error fractionalizing property:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fractionalize property',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateMockContractAddress(): string {
  // Generate a random Ethereum address for demo purposes
  // In production, this would be the actual deployed contract address
  return ethers.Wallet.createRandom().address;
}

function calculateInitialPrice(propertyValue: string, totalSupply: string): string {
  try {
    const value = parseFloat(propertyValue);
    const supply = parseFloat(totalSupply);
    const pricePerShare = value / supply;
    return pricePerShare.toFixed(6);
  } catch (error) {
    console.error('Error calculating initial price:', error);
    return '0';
  }
}
