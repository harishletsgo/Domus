import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { shareTokens, properties, liquidityPools } from '@/lib/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { db } = getConnection();

    // Get all share tokens with their property information and liquidity data
    const marketplaceTokens = await db
      .select({
        // Share token info
        id: shareTokens.id,
        contractAddress: shareTokens.contractAddress,
        symbol: shareTokens.symbol,
        name: shareTokens.name,
        totalSupply: shareTokens.totalSupply,
        currentPrice: shareTokens.currentPrice,
        priceChange24h: shareTokens.priceChange24h,
        volume24h: shareTokens.volume24h,
        marketCap: shareTokens.marketCap,
        isListed: shareTokens.isListed,
        canRedeem: shareTokens.canRedeem,
        createdAt: shareTokens.createdAt,
        
        // Property info
        property: {
          id: properties.id,
          title: properties.title,
          city: properties.city,
          state: properties.state,
          priceEth: properties.priceEth
        },
        
        // Liquidity info
        liquidity: {
          shareReserves: liquidityPools.shareReserves,
          usdReserves: liquidityPools.usdReserves,
          totalLiquidity: liquidityPools.totalLiquidity,
          isActive: liquidityPools.isActive
        }
      })
      .from(shareTokens)
      .leftJoin(properties, eq(shareTokens.propertyId, properties.id))
      .leftJoin(liquidityPools, and(
        eq(liquidityPools.shareTokenId, shareTokens.id),
        eq(liquidityPools.isActive, true)
      ))
      .where(eq(shareTokens.isListed, true));

    // Transform data for frontend
    const transformedTokens = marketplaceTokens.map(token => {
      const totalSupplyNum = parseFloat(token.totalSupply);
      const liquidityShares = token.liquidity?.shareReserves ? parseFloat(token.liquidity.shareReserves) : 0;
      const availableSupply = Math.max(0, totalSupplyNum - liquidityShares);
      
      return {
        address: token.contractAddress,
        symbol: token.symbol,
        name: token.name,
        propertyTitle: token.property?.title || 'Unknown Property',
        propertyLocation: `${token.property?.city || 'Unknown'}, ${token.property?.state || 'Unknown'}`,
        currentPrice: token.currentPrice,
        priceChange24h: parseFloat(token.priceChange24h || '0'),
        volume24h: token.volume24h || '0',
        marketCap: token.marketCap || '0',
        totalSupply: token.totalSupply,
        availableSupply: availableSupply.toString(),
        liquidity: token.liquidity?.usdReserves || '0',
        isActive: token.liquidity?.isActive || false,
        createdAt: token.createdAt
      };
    });

    // Sort by volume descending
    transformedTokens.sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h));

    return NextResponse.json({
      success: true,
      tokens: transformedTokens,
      totalTokens: transformedTokens.length,
      totalVolume: transformedTokens.reduce((sum, token) => sum + parseFloat(token.volume24h), 0),
      totalMarketCap: transformedTokens.reduce((sum, token) => sum + parseFloat(token.marketCap), 0)
    });

  } catch (error) {
    console.error('Error fetching marketplace tokens:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch marketplace tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareTokenId, isListed } = body;

    const { db } = getConnection();

    // Update the listing status of a share token
    const updatedToken = await db
      .update(shareTokens)
      .set({
        isListed,
        updatedAt: new Date()
      })
      .where(eq(shareTokens.id, shareTokenId))
      .returning();

    return NextResponse.json({
      success: true,
      token: updatedToken[0],
      message: `Share token ${isListed ? 'listed' : 'unlisted'} successfully`
    });

  } catch (error) {
    console.error('Error updating marketplace listing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update marketplace listing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
