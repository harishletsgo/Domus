import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  varchar, 
  decimal, 
  integer, 
  boolean, 
  jsonb, 
  primaryKey,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - stores Privy user information
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  privyId: varchar('privy_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  walletAddress: varchar('wallet_address', { length: 42 }),
  displayName: varchar('display_name', { length: 100 }),
  profileImage: text('profile_image'),
  authMethod: varchar('auth_method', { length: 50 }), // 'wallet', 'email', 'google', 'twitter', etc.
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  privyIdIdx: index('privy_id_idx').on(table.privyId),
  walletAddressIdx: index('wallet_address_idx').on(table.walletAddress),
  emailIdx: index('email_idx').on(table.email),
}));

// Property types enum
export const propertyTypeEnum = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'MIXED_USE'] as const;

// Properties table - stores all property listings (both user-owned and general listings)
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: varchar('token_id', { length: 100 }),
  ownerId: uuid('owner_id').references(() => users.id),
  
  // Basic property information
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  propertyType: varchar('property_type', { length: 20 }).notNull(), // propertyTypeEnum
  
  // Location information
  country: varchar('country', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Property specifications
  squareFootage: integer('square_footage').notNull(),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  yearBuilt: integer('year_built').notNull(),
  lotSize: integer('lot_size'),
  parkingSpaces: integer('parking_spaces'),
  
  // Pricing information
  priceEth: decimal('price_eth', { precision: 20, scale: 8 }).notNull(),
  priceUsd: decimal('price_usd', { precision: 15, scale: 2 }),
  
  // Legal information
  parcelId: varchar('parcel_id', { length: 100 }).notNull(),
  deedNumber: varchar('deed_number', { length: 100 }).notNull(),
  zoning: varchar('zoning', { length: 100 }).notNull(),
  taxAssessment: decimal('tax_assessment', { precision: 15, scale: 2 }).notNull(),
  
  // Utilities (stored as JSON)
  utilities: jsonb('utilities'), // { electricity: true, water: true, ... }
  
  // Features and amenities
  features: jsonb('features'), // Array of feature strings
  
  // Blockchain information
  chainId: integer('chain_id'),
  contractAddress: varchar('contract_address', { length: 42 }),
  transactionHash: varchar('transaction_hash', { length: 66 }),
  walrusHash: varchar('walrus_hash', { length: 100 }),
  
  // Status and visibility
  isListed: boolean('is_listed').default(true),
  isVerified: boolean('is_verified').default(false),
  isPublic: boolean('is_public').default(true), // Whether to show in public listings
  isFeatured: boolean('is_featured').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  listedAt: timestamp('listed_at'),
}, (table) => ({
  ownerIdIdx: index('owner_id_idx').on(table.ownerId),
  tokenIdIdx: index('token_id_idx').on(table.tokenId),
  propertyTypeIdx: index('property_type_idx').on(table.propertyType),
  cityIdx: index('city_idx').on(table.city),
  stateIdx: index('state_idx').on(table.state),
  priceEthIdx: index('price_eth_idx').on(table.priceEth),
  isListedIdx: index('is_listed_idx').on(table.isListed),
  isPublicIdx: index('is_public_idx').on(table.isPublic),
  isFeaturedIdx: index('is_featured_idx').on(table.isFeatured),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// Property images table - stores property image URLs
export const propertyImages = pgTable('property_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url').notNull(),
  walrusHash: varchar('walrus_hash', { length: 100 }),
  alt: varchar('alt', { length: 255 }),
  isPrimary: boolean('is_primary').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('property_images_property_id_idx').on(table.propertyId),
  isPrimaryIdx: index('property_images_is_primary_idx').on(table.isPrimary),
}));

// Property documents table - stores legal and other documents
export const propertyDocuments = pgTable('property_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'deed', 'survey', 'inspection', etc.
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'),
  walrusHash: varchar('walrus_hash', { length: 100 }).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('property_documents_property_id_idx').on(table.propertyId),
  fileTypeIdx: index('property_documents_file_type_idx').on(table.fileType),
}));

// Property views table - track property views for analytics
export const propertyViews = pgTable('property_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('property_views_property_id_idx').on(table.propertyId),
  userIdIdx: index('property_views_user_id_idx').on(table.userId),
  viewedAtIdx: index('property_views_viewed_at_idx').on(table.viewedAt),
}));

// User favorites table - users can favorite properties
export const userFavorites = pgTable('user_favorites', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.propertyId] }),
  userIdIdx: index('user_favorites_user_id_idx').on(table.userId),
  propertyIdIdx: index('user_favorites_property_id_idx').on(table.propertyId),
}));

// Search history table - track user searches for better recommendations
export const searchHistory = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  searchQuery: text('search_query').notNull(),
  filters: jsonb('filters'), // Store search filters as JSON
  resultsCount: integer('results_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('search_history_user_id_idx').on(table.userId),
  createdAtIdx: index('search_history_created_at_idx').on(table.createdAt),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  favorites: many(userFavorites),
  views: many(propertyViews),
  searches: many(searchHistory),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  images: many(propertyImages),
  documents: many(propertyDocuments),
  views: many(propertyViews),
  favorites: many(userFavorites),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
}));

export const propertyViewsRelations = relations(propertyViews, ({ one }) => ({
  property: one(properties, {
    fields: [propertyViews.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [propertyViews.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [userFavorites.propertyId],
    references: [properties.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

// Share tokens table - fractional ownership tokens for properties
export const shareTokens = pgTable('share_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  
  // Token information
  contractAddress: varchar('contract_address', { length: 42 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  totalSupply: decimal('total_supply', { precision: 18, scale: 6 }).notNull(),
  
  // User holdings
  userBalance: decimal('user_balance', { precision: 18, scale: 6 }).notNull(),
  
  // Market data
  currentPrice: decimal('current_price', { precision: 20, scale: 8 }).notNull(), // Price in USD
  priceChange24h: decimal('price_change_24h', { precision: 10, scale: 4 }),
  volume24h: decimal('volume_24h', { precision: 20, scale: 8 }),
  marketCap: decimal('market_cap', { precision: 25, scale: 8 }),
  
  // Trading configuration
  isListed: boolean('is_listed').default(false),
  canRedeem: boolean('can_redeem').default(true),
  redemptionThreshold: decimal('redemption_threshold', { precision: 5, scale: 2 }).default('80.00'), // Percentage
  
  // Blockchain information
  chainId: integer('chain_id'),
  vaultId: varchar('vault_id', { length: 100 }),
  layerZeroEndpoint: varchar('layerzero_endpoint', { length: 42 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index('share_tokens_property_id_idx').on(table.propertyId),
  ownerIdIdx: index('share_tokens_owner_id_idx').on(table.ownerId),
  contractAddressIdx: index('share_tokens_contract_address_idx').on(table.contractAddress),
  symbolIdx: index('share_tokens_symbol_idx').on(table.symbol),
  isListedIdx: index('share_tokens_is_listed_idx').on(table.isListed),
}));

// Trading orders table - cross-chain trading orders
export const tradingOrders = pgTable('trading_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: varchar('order_id', { length: 100 }).unique().notNull(),
  shareTokenId: uuid('share_token_id').references(() => shareTokens.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Order details
  amount: decimal('amount', { precision: 18, scale: 6 }).notNull(),
  price: decimal('price', { precision: 20, scale: 8 }).notNull(), // Price per share in USD
  isBuyOrder: boolean('is_buy_order').notNull(),
  
  // Cross-chain information
  sourceChain: integer('source_chain').notNull(),
  targetChain: integer('target_chain').notNull(),
  
  // Order status
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'filled', 'cancelled', 'expired'
  filledAmount: decimal('filled_amount', { precision: 18, scale: 6 }).default('0'),
  
  // Timestamps
  expiration: timestamp('expiration').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('trading_orders_order_id_idx').on(table.orderId),
  shareTokenIdIdx: index('trading_orders_share_token_id_idx').on(table.shareTokenId),
  userIdIdx: index('trading_orders_user_id_idx').on(table.userId),
  statusIdx: index('trading_orders_status_idx').on(table.status),
  expirationIdx: index('trading_orders_expiration_idx').on(table.expiration),
}));

// Liquidity pools table - DEX liquidity pools for share tokens
export const liquidityPools = pgTable('liquidity_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  shareTokenId: uuid('share_token_id').references(() => shareTokens.id, { onDelete: 'cascade' }).notNull(),
  
  // Pool reserves
  shareReserves: decimal('share_reserves', { precision: 18, scale: 6 }).notNull(),
  usdReserves: decimal('usd_reserves', { precision: 18, scale: 6 }).notNull(),
  totalLiquidity: decimal('total_liquidity', { precision: 18, scale: 6 }).notNull(),
  
  // User liquidity positions
  userId: uuid('user_id').references(() => users.id),
  userLiquidity: decimal('user_liquidity', { precision: 18, scale: 6 }).default('0'),
  
  // Pool metrics
  apr: decimal('apr', { precision: 8, scale: 4 }).default('0'),
  volume24h: decimal('volume_24h', { precision: 18, scale: 6 }).default('0'),
  fees24h: decimal('fees_24h', { precision: 18, scale: 6 }).default('0'),
  
  // Pool configuration
  isActive: boolean('is_active').default(true),
  chainId: integer('chain_id').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  shareTokenIdIdx: index('liquidity_pools_share_token_id_idx').on(table.shareTokenId),
  userIdIdx: index('liquidity_pools_user_id_idx').on(table.userId),
  chainIdIdx: index('liquidity_pools_chain_id_idx').on(table.chainId),
  isActiveIdx: index('liquidity_pools_is_active_idx').on(table.isActive),
}));

// Price oracle data table - Flare Oracle price feeds
export const priceOracleData = pgTable('price_oracle_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  shareTokenId: uuid('share_token_id').references(() => shareTokens.id, { onDelete: 'cascade' }).notNull(),
  
  // Price data
  price: decimal('price', { precision: 20, scale: 8 }).notNull(),
  volume24h: decimal('volume_24h', { precision: 18, scale: 6 }),
  marketCap: decimal('market_cap', { precision: 18, scale: 6 }),
  priceChange24h: decimal('price_change_24h', { precision: 10, scale: 4 }),
  
  // Oracle metadata
  feedId: varchar('feed_id', { length: 100 }),
  oracleSource: varchar('oracle_source', { length: 50 }).notNull(), // 'flare', 'chainlink', 'manual'
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // Confidence score 0-1
  
  // Timestamps
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  shareTokenIdIdx: index('price_oracle_data_share_token_id_idx').on(table.shareTokenId),
  timestampIdx: index('price_oracle_data_timestamp_idx').on(table.timestamp),
  oracleSourceIdx: index('price_oracle_data_oracle_source_idx').on(table.oracleSource),
}));

// Dividend distributions table - track dividend payments to shareholders
export const dividendDistributions = pgTable('dividend_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  shareTokenId: uuid('share_token_id').references(() => shareTokens.id, { onDelete: 'cascade' }).notNull(),
  
  // Distribution details
  totalAmount: decimal('total_amount', { precision: 18, scale: 6 }).notNull(),
  amountPerShare: decimal('amount_per_share', { precision: 18, scale: 6 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('ETH'),
  
  // Distribution metadata
  distributionType: varchar('distribution_type', { length: 20 }).notNull(), // 'rental', 'sale', 'other'
  description: text('description'),
  
  // Blockchain information
  transactionHash: varchar('transaction_hash', { length: 66 }),
  blockNumber: integer('block_number'),
  chainId: integer('chain_id'),
  
  // Timestamps
  distributedAt: timestamp('distributed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  shareTokenIdIdx: index('dividend_distributions_share_token_id_idx').on(table.shareTokenId),
  distributedAtIdx: index('dividend_distributions_distributed_at_idx').on(table.distributedAt),
  distributionTypeIdx: index('dividend_distributions_distribution_type_idx').on(table.distributionType),
}));

// Add fractional ownership relations
export const shareTokensRelations = relations(shareTokens, ({ one, many }) => ({
  property: one(properties, {
    fields: [shareTokens.propertyId],
    references: [properties.id],
  }),
  owner: one(users, {
    fields: [shareTokens.ownerId],
    references: [users.id],
  }),
  tradingOrders: many(tradingOrders),
  liquidityPools: many(liquidityPools),
  priceOracleData: many(priceOracleData),
  dividendDistributions: many(dividendDistributions),
}));

export const tradingOrdersRelations = relations(tradingOrders, ({ one }) => ({
  shareToken: one(shareTokens, {
    fields: [tradingOrders.shareTokenId],
    references: [shareTokens.id],
  }),
  user: one(users, {
    fields: [tradingOrders.userId],
    references: [users.id],
  }),
}));

export const liquidityPoolsRelations = relations(liquidityPools, ({ one }) => ({
  shareToken: one(shareTokens, {
    fields: [liquidityPools.shareTokenId],
    references: [shareTokens.id],
  }),
  user: one(users, {
    fields: [liquidityPools.userId],
    references: [users.id],
  }),
}));

export const priceOracleDataRelations = relations(priceOracleData, ({ one }) => ({
  shareToken: one(shareTokens, {
    fields: [priceOracleData.shareTokenId],
    references: [shareTokens.id],
  }),
}));

export const dividendDistributionsRelations = relations(dividendDistributions, ({ one }) => ({
  shareToken: one(shareTokens, {
    fields: [dividendDistributions.shareTokenId],
    references: [shareTokens.id],
  }),
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type NewPropertyDocument = typeof propertyDocuments.$inferInsert;
export type ShareToken = typeof shareTokens.$inferSelect;
export type NewShareToken = typeof shareTokens.$inferInsert;
export type TradingOrder = typeof tradingOrders.$inferSelect;
export type NewTradingOrder = typeof tradingOrders.$inferInsert;
export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type NewLiquidityPool = typeof liquidityPools.$inferInsert;
export type PriceOracleData = typeof priceOracleData.$inferSelect;
export type NewPriceOracleData = typeof priceOracleData.$inferInsert;
export type DividendDistribution = typeof dividendDistributions.$inferSelect;
export type NewDividendDistribution = typeof dividendDistributions.$inferInsert;
