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

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type NewPropertyDocument = typeof propertyDocuments.$inferInsert;
