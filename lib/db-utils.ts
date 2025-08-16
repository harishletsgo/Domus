import { eq, and, desc, asc, like, ilike, or, count, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  properties, 
  propertyImages, 
  propertyDocuments, 
  userFavorites,
  propertyViews,
  searchHistory,
  type User, 
  type NewUser, 
  type Property, 
  type NewProperty,
  type PropertyImage,
  type NewPropertyImage,
  type PropertyDocument,
  type NewPropertyDocument
} from './schema';

// User operations
export const userOperations = {
  // Create or update user from Privy data
  async upsertUser(privyUser: {
    id: string;
    email?: { address: string } | null;
    wallet?: { address: string } | null;
    google?: { email: string; name?: string } | null;
    twitter?: { username: string } | null;
    discord?: { username: string } | null;
  }): Promise<User> {
    const userData: NewUser = {
      privyId: privyUser.id,
      email: privyUser.email?.address || privyUser.google?.email || null,
      walletAddress: privyUser.wallet?.address || null,
      displayName: privyUser.google?.name || privyUser.twitter?.username || privyUser.discord?.username || null,
      authMethod: privyUser.wallet ? 'wallet' : privyUser.google ? 'google' : privyUser.twitter ? 'twitter' : privyUser.discord ? 'discord' : 'email',
      updatedAt: new Date(),
    };

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.privyId, privyUser.id))
      .limit(1);

    if (existingUsers.length > 0) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.privyId, privyUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  },

  async getUserByPrivyId(privyId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.privyId, privyId))
      .limit(1);
    return result[0] || null;
  },

  async getUserByWalletAddress(address: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, address))
      .limit(1);
    return result[0] || null;
  },

  async updateUser(userId: string, updates: Partial<NewUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },
};

// Property operations
export const propertyOperations = {
  // Create a new property listing
  async createProperty(propertyData: NewProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(propertyData)
      .returning();
    return newProperty;
  },

  // Get all public properties (for general listings)
  async getPublicProperties(options: {
    limit?: number;
    offset?: number;
    sortBy?: 'price' | 'created' | 'featured';
    sortOrder?: 'asc' | 'desc';
    propertyType?: string;
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<{ properties: Property[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'created',
      sortOrder = 'desc',
      propertyType,
      city,
      state,
      minPrice,
      maxPrice,
    } = options;

    let query = db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isPublic, true),
          eq(properties.isListed, true)
        )
      );

    const conditions = [
      eq(properties.isPublic, true),
      eq(properties.isListed, true),
    ];

    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }
    if (city) {
      conditions.push(ilike(properties.city, `%${city}%`));
    }
    if (state) {
      conditions.push(ilike(properties.state, `%${state}%`));
    }
    if (minPrice !== undefined) {
      conditions.push(sql`${properties.priceEth} >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      conditions.push(sql`${properties.priceEth} <= ${maxPrice}`);
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(properties)
      .where(whereClause);

    // Sort options
    let orderBy;
    switch (sortBy) {
      case 'price':
        orderBy = sortOrder === 'asc' ? asc(properties.priceEth) : desc(properties.priceEth);
        break;
      case 'featured':
        orderBy = desc(properties.isFeatured);
        break;
      default:
        orderBy = sortOrder === 'asc' ? asc(properties.createdAt) : desc(properties.createdAt);
    }

    const propertiesResult = await db
      .select()
      .from(properties)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      properties: propertiesResult,
      total: Number(total),
    };
  },

  // Get properties owned by a user
  async getUserProperties(userId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId))
      .orderBy(desc(properties.createdAt));
  },

  // Get a single property by ID
  async getPropertyById(propertyId: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
    return result[0] || null;
  },

  // Get property by token ID
  async getPropertyByTokenId(tokenId: string): Promise<Property | null> {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.tokenId, tokenId))
      .limit(1);
    return result[0] || null;
  },

  // Update property
  async updateProperty(propertyId: string, updates: Partial<NewProperty>): Promise<Property> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, propertyId))
      .returning();
    return updatedProperty;
  },

  // Search properties
  async searchProperties(searchTerm: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Property[]> {
    const { limit = 20, offset = 0 } = options;

    return await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isPublic, true),
          eq(properties.isListed, true),
          or(
            ilike(properties.title, `%${searchTerm}%`),
            ilike(properties.description, `%${searchTerm}%`),
            ilike(properties.city, `%${searchTerm}%`),
            ilike(properties.state, `%${searchTerm}%`),
            ilike(properties.streetAddress, `%${searchTerm}%`)
          )
        )
      )
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);
  },
};

// Property images operations
export const propertyImageOperations = {
  async addPropertyImages(propertyId: string, images: NewPropertyImage[]): Promise<PropertyImage[]> {
    const imagesWithPropertyId = images.map(image => ({
      ...image,
      propertyId,
    }));

    return await db
      .insert(propertyImages)
      .values(imagesWithPropertyId)
      .returning();
  },

  async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    return await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(desc(propertyImages.isPrimary), asc(propertyImages.sortOrder));
  },

  async deletePropertyImage(imageId: string): Promise<void> {
    await db
      .delete(propertyImages)
      .where(eq(propertyImages.id, imageId));
  },
};

// Property documents operations
export const propertyDocumentOperations = {
  async addPropertyDocuments(propertyId: string, documents: NewPropertyDocument[]): Promise<PropertyDocument[]> {
    const documentsWithPropertyId = documents.map(doc => ({
      ...doc,
      propertyId,
    }));

    return await db
      .insert(propertyDocuments)
      .values(documentsWithPropertyId)
      .returning();
  },

  async getPropertyDocuments(propertyId: string, includePrivate = false): Promise<PropertyDocument[]> {
    const conditions = [eq(propertyDocuments.propertyId, propertyId)];
    
    if (!includePrivate) {
      conditions.push(eq(propertyDocuments.isPublic, true));
    }

    return await db
      .select()
      .from(propertyDocuments)
      .where(and(...conditions))
      .orderBy(asc(propertyDocuments.createdAt));
  },
};

// User favorites operations
export const favoriteOperations = {
  async addFavorite(userId: string, propertyId: string): Promise<void> {
    await db
      .insert(userFavorites)
      .values({ userId, propertyId })
      .onConflictDoNothing();
  },

  async removeFavorite(userId: string, propertyId: string): Promise<void> {
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.propertyId, propertyId)
        )
      );
  },

  async getUserFavorites(userId: string): Promise<Property[]> {
    return await db
      .select({
        id: properties.id,
        tokenId: properties.tokenId,
        ownerId: properties.ownerId,
        title: properties.title,
        description: properties.description,
        propertyType: properties.propertyType,
        country: properties.country,
        state: properties.state,
        city: properties.city,
        zipCode: properties.zipCode,
        streetAddress: properties.streetAddress,
        latitude: properties.latitude,
        longitude: properties.longitude,
        squareFootage: properties.squareFootage,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        yearBuilt: properties.yearBuilt,
        lotSize: properties.lotSize,
        parkingSpaces: properties.parkingSpaces,
        priceEth: properties.priceEth,
        priceUsd: properties.priceUsd,
        parcelId: properties.parcelId,
        deedNumber: properties.deedNumber,
        zoning: properties.zoning,
        taxAssessment: properties.taxAssessment,
        utilities: properties.utilities,
        features: properties.features,
        chainId: properties.chainId,
        contractAddress: properties.contractAddress,
        transactionHash: properties.transactionHash,
        walrusHash: properties.walrusHash,
        isListed: properties.isListed,
        isVerified: properties.isVerified,
        isPublic: properties.isPublic,
        isFeatured: properties.isFeatured,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        listedAt: properties.listedAt,
      })
      .from(userFavorites)
      .innerJoin(properties, eq(userFavorites.propertyId, properties.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  },

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.propertyId, propertyId)
        )
      )
      .limit(1);
    return result.length > 0;
  },
};

// Analytics operations
export const analyticsOperations = {
  async recordPropertyView(propertyId: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await db
      .insert(propertyViews)
      .values({
        propertyId,
        userId: userId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
  },

  async getPropertyViewCount(propertyId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(propertyViews)
      .where(eq(propertyViews.propertyId, propertyId));
    return Number(total);
  },

  async recordSearch(userId: string | null, searchQuery: string, filters: any, resultsCount: number): Promise<void> {
    await db
      .insert(searchHistory)
      .values({
        userId,
        searchQuery,
        filters,
        resultsCount,
      });
  },
};
