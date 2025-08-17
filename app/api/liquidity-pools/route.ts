import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { liquidityPools, shareTokens, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { userOperations } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const { db } = getConnection();

    // Resolve user ID if it's a Privy ID
    let dbUserId = userId;
    if (userId && userId.startsWith('did:privy:')) {
      const user = await userOperations.getUserByPrivyId(userId);
      if (!user) {
        // Return empty pools for non-existent users
        return NextResponse.json({
          success: true,
          pools: []
        });
      }
      dbUserId = user.id;
    }

    // Build where conditions
    const conditions = [eq(liquidityPools.isActive, true)];
    if (dbUserId) {
      conditions.push(eq(liquidityPools.userId, dbUserId));
    }

    const pools = await db
      .select({
        id: liquidityPools.id,
        shareReserves: liquidityPools.shareReserves,
        usdReserves: liquidityPools.usdReserves,
        totalLiquidity: liquidityPools.totalLiquidity,
        userLiquidity: liquidityPools.userLiquidity,
        apr: liquidityPools.apr,
        volume24h: liquidityPools.volume24h,
        fees24h: liquidityPools.fees24h,
        chainId: liquidityPools.chainId,
        isActive: liquidityPools.isActive,
        shareToken: {
          contractAddress: shareTokens.contractAddress,
          symbol: shareTokens.symbol,
          name: shareTokens.name,
          currentPrice: shareTokens.currentPrice
        },
        createdAt: liquidityPools.createdAt
      })
      .from(liquidityPools)
      .leftJoin(shareTokens, eq(liquidityPools.shareTokenId, shareTokens.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(liquidityPools.createdAt);

    // Transform data for frontend
    const transformedPools = pools.map(pool => ({
      shareToken: pool.shareToken?.contractAddress || '',
      shareReserves: pool.shareReserves,
      usdReserves: pool.usdReserves,
      totalLiquidity: pool.totalLiquidity,
      userLiquidity: pool.userLiquidity || '0',
      apr: parseFloat(pool.apr || '0'),
      volume24h: pool.volume24h || '0',
      fees24h: pool.fees24h || '0',
      symbol: pool.shareToken?.symbol || '',
      name: pool.shareToken?.name || '',
      currentPrice: pool.shareToken?.currentPrice || '0',
      chainId: pool.chainId,
      isActive: pool.isActive
    }));

    return NextResponse.json({
      success: true,
      pools: transformedPools
    });

  } catch (error) {
    console.error('Error fetching liquidity pools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch liquidity pools',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      shareToken,
      shareAmount,
      usdAmount
    } = body;

    // Validate required fields
    if (!userId || !shareToken || !shareAmount || !usdAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Find share token
    const shareTokenRecord = await db
      .select()
      .from(shareTokens)
      .where(eq(shareTokens.contractAddress, shareToken))
      .limit(1);

    if (shareTokenRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Share token not found' },
        { status: 404 }
      );
    }

    // Check if liquidity pool exists for this share token
    const existingPool = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.shareTokenId, shareTokenRecord[0].id))
      .limit(1);

    if (existingPool.length === 0) {
      // Create new liquidity pool
      const newPool = await db
        .insert(liquidityPools)
        .values({
          shareTokenId: shareTokenRecord[0].id,
          shareReserves: shareAmount,
          usdReserves: usdAmount,
          totalLiquidity: shareAmount, // 1:1 ratio for first LP
          userId: dbUserId,
          userLiquidity: shareAmount,
          apr: '12.5', // Default APR
          volume24h: '0',
          fees24h: '0',
          chainId: 11155111, // Sepolia for now
          isActive: true,
          createdAt: new Date()
        })
        .returning();

      return NextResponse.json({
        success: true,
        pool: newPool[0],
        liquidityTokens: shareAmount,
        message: 'Liquidity pool created and liquidity added successfully'
      });
    } else {
      // Add to existing pool
      const pool = existingPool[0];
      const currentShareReserves = parseFloat(pool.shareReserves);
      const currentTotalLiquidity = parseFloat(pool.totalLiquidity);
      
      // Calculate liquidity tokens to mint
      const liquidityTokens = currentTotalLiquidity > 0 
        ? (parseFloat(shareAmount) * currentTotalLiquidity) / currentShareReserves
        : parseFloat(shareAmount);

      // Update pool
      const updatedPool = await db
        .update(liquidityPools)
        .set({
          shareReserves: (currentShareReserves + parseFloat(shareAmount)).toString(),
          usdReserves: (parseFloat(pool.usdReserves) + parseFloat(usdAmount)).toString(),
          totalLiquidity: (currentTotalLiquidity + liquidityTokens).toString(),
          userLiquidity: (parseFloat(pool.userLiquidity || '0') + liquidityTokens).toString(),
          updatedAt: new Date()
        })
        .where(eq(liquidityPools.id, pool.id))
        .returning();

      return NextResponse.json({
        success: true,
        pool: updatedPool[0],
        liquidityTokens: liquidityTokens.toString(),
        message: 'Liquidity added successfully'
      });
    }

  } catch (error) {
    console.error('Error adding liquidity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add liquidity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
