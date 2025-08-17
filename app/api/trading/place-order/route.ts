import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { tradingOrders, shareTokens, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { userOperations } from '@/lib/db-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      shareToken,
      amount,
      price,
      isBuyOrder,
      expiration,
      targetChain
    } = body;

    // Validate required fields
    if (!userId || !shareToken || !amount || !price || expiration === undefined) {
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

    // Validate share token exists
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

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create trading order
    const newOrder = await db
      .insert(tradingOrders)
      .values({
        orderId,
        shareTokenId: shareTokenRecord[0].id,
        userId: dbUserId,
        amount,
        price,
        isBuyOrder,
        sourceChain: 11155111, // Sepolia for now
        targetChain: targetChain || 11155111,
        status: 'pending',
        filledAmount: '0',
        expiration: new Date(expiration * 1000),
        createdAt: new Date()
      })
      .returning();

    // TODO: In a real implementation, this would:
    // 1. Validate user has sufficient balance/allowance
    // 2. Escrow tokens/funds
    // 3. Send cross-chain message via LayerZero if needed
    // 4. Update order book and matching engine

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        shareToken,
        amount,
        price,
        isBuyOrder,
        status: 'pending',
        timestamp: Date.now(),
        expiration
      },
      message: 'Trading order placed successfully'
    });

  } catch (error) {
    console.error('Error placing trading order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to place trading order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType'); // 'buy' or 'sell'

    const { db } = getConnection();

    // Apply filters
    const conditions = [];
    
    if (shareToken) {
      conditions.push(eq(shareTokens.contractAddress, shareToken));
    }
    
    if (status) {
      conditions.push(eq(tradingOrders.status, status));
    }
    
    if (orderType) {
      conditions.push(eq(tradingOrders.isBuyOrder, orderType === 'buy'));
    }

    const orders = await db
      .select({
        orderId: tradingOrders.orderId,
        amount: tradingOrders.amount,
        price: tradingOrders.price,
        isBuyOrder: tradingOrders.isBuyOrder,
        status: tradingOrders.status,
        filledAmount: tradingOrders.filledAmount,
        expiration: tradingOrders.expiration,
        createdAt: tradingOrders.createdAt,
        shareToken: {
          symbol: shareTokens.symbol,
          contractAddress: shareTokens.contractAddress
        }
      })
      .from(tradingOrders)
      .leftJoin(shareTokens, eq(tradingOrders.shareTokenId, shareTokens.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(tradingOrders.createdAt)
      .limit(100);

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        orderId: order.orderId,
        shareToken: order.shareToken?.contractAddress,
        symbol: order.shareToken?.symbol,
        amount: order.amount,
        price: order.price,
        isBuyOrder: order.isBuyOrder,
        status: order.status,
        filledAmount: order.filledAmount,
        expiration: order.expiration?.getTime() / 1000,
        timestamp: order.createdAt?.getTime() / 1000
      }))
    });

  } catch (error) {
    console.error('Error fetching trading orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trading orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
