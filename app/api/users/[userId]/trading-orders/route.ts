import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { tradingOrders, shareTokens, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { userOperations } from '@/lib/db-utils';

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
        // Return empty orders for non-existent users
        return NextResponse.json({
          success: true,
          orders: []
        });
      }
      dbUserId = user.id;
    }

    // Get user's trading orders
    const userOrders = await db
      .select({
        id: tradingOrders.id,
        orderId: tradingOrders.orderId,
        amount: tradingOrders.amount,
        price: tradingOrders.price,
        isBuyOrder: tradingOrders.isBuyOrder,
        status: tradingOrders.status,
        filledAmount: tradingOrders.filledAmount,
        expiration: tradingOrders.expiration,
        createdAt: tradingOrders.createdAt,
        shareToken: {
          contractAddress: shareTokens.contractAddress,
          symbol: shareTokens.symbol,
          name: shareTokens.name
        }
      })
      .from(tradingOrders)
      .leftJoin(shareTokens, eq(tradingOrders.shareTokenId, shareTokens.id))
      .where(eq(tradingOrders.userId, dbUserId))
      .orderBy(tradingOrders.createdAt);

    // Transform data for frontend
    const transformedOrders = userOrders.map(order => ({
      orderId: order.orderId,
      shareToken: order.shareToken?.contractAddress || '',
      amount: order.amount,
      price: order.price,
      isBuyOrder: order.isBuyOrder,
      status: order.status,
      filledAmount: order.filledAmount,
      timestamp: order.createdAt?.getTime() ? Math.floor(order.createdAt.getTime() / 1000) : 0,
      expiration: order.expiration?.getTime() ? Math.floor(order.expiration.getTime() / 1000) : 0
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders
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
