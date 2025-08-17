-- Add fractional ownership tables
-- Generated with Drizzle Kit

-- Share tokens table - fractional ownership tokens for properties
CREATE TABLE IF NOT EXISTS "share_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
  "owner_id" uuid NOT NULL REFERENCES "users"("id"),
  "contract_address" varchar(42) NOT NULL,
  "symbol" varchar(10) NOT NULL,
  "name" varchar(100) NOT NULL,
  "total_supply" numeric(30, 18) NOT NULL,
  "user_balance" numeric(30, 18) NOT NULL,
  "current_price" numeric(20, 8) NOT NULL,
  "price_change_24h" numeric(10, 4),
  "volume_24h" numeric(20, 8),
  "market_cap" numeric(25, 8),
  "is_listed" boolean DEFAULT false,
  "can_redeem" boolean DEFAULT true,
  "redemption_threshold" numeric(5, 2) DEFAULT '80.00',
  "chain_id" integer,
  "vault_id" varchar(100),
  "layerzero_endpoint" varchar(42),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Trading orders table - cross-chain trading orders
CREATE TABLE IF NOT EXISTS "trading_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" varchar(100) UNIQUE NOT NULL,
  "share_token_id" uuid NOT NULL REFERENCES "share_tokens"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "amount" numeric(30, 18) NOT NULL,
  "price" numeric(20, 8) NOT NULL,
  "is_buy_order" boolean NOT NULL,
  "source_chain" integer NOT NULL,
  "target_chain" integer NOT NULL,
  "status" varchar(20) NOT NULL,
  "filled_amount" numeric(30, 18) DEFAULT '0',
  "expiration" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Liquidity pools table - DEX liquidity pools for share tokens
CREATE TABLE IF NOT EXISTS "liquidity_pools" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_token_id" uuid NOT NULL REFERENCES "share_tokens"("id") ON DELETE CASCADE,
  "share_reserves" numeric(30, 18) NOT NULL,
  "usd_reserves" numeric(30, 18) NOT NULL,
  "total_liquidity" numeric(30, 18) NOT NULL,
  "user_id" uuid REFERENCES "users"("id"),
  "user_liquidity" numeric(30, 18) DEFAULT '0',
  "apr" numeric(8, 4) DEFAULT '0',
  "volume_24h" numeric(30, 18) DEFAULT '0',
  "fees_24h" numeric(30, 18) DEFAULT '0',
  "is_active" boolean DEFAULT true,
  "chain_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Price oracle data table - Flare Oracle price feeds
CREATE TABLE IF NOT EXISTS "price_oracle_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_token_id" uuid NOT NULL REFERENCES "share_tokens"("id") ON DELETE CASCADE,
  "price" numeric(20, 8) NOT NULL,
  "volume_24h" numeric(30, 18),
  "market_cap" numeric(30, 18),
  "price_change_24h" numeric(10, 4),
  "feed_id" varchar(100),
  "oracle_source" varchar(50) NOT NULL,
  "confidence" numeric(5, 4),
  "timestamp" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Dividend distributions table - track dividend payments to shareholders
CREATE TABLE IF NOT EXISTS "dividend_distributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_token_id" uuid NOT NULL REFERENCES "share_tokens"("id") ON DELETE CASCADE,
  "total_amount" numeric(30, 18) NOT NULL,
  "amount_per_share" numeric(30, 18) NOT NULL,
  "currency" varchar(10) DEFAULT 'ETH',
  "distribution_type" varchar(20) NOT NULL,
  "description" text,
  "transaction_hash" varchar(66),
  "block_number" integer,
  "chain_id" integer,
  "distributed_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "share_tokens_property_id_idx" ON "share_tokens" ("property_id");
CREATE INDEX IF NOT EXISTS "share_tokens_owner_id_idx" ON "share_tokens" ("owner_id");
CREATE INDEX IF NOT EXISTS "share_tokens_contract_address_idx" ON "share_tokens" ("contract_address");
CREATE INDEX IF NOT EXISTS "share_tokens_symbol_idx" ON "share_tokens" ("symbol");
CREATE INDEX IF NOT EXISTS "share_tokens_is_listed_idx" ON "share_tokens" ("is_listed");

CREATE INDEX IF NOT EXISTS "trading_orders_order_id_idx" ON "trading_orders" ("order_id");
CREATE INDEX IF NOT EXISTS "trading_orders_share_token_id_idx" ON "trading_orders" ("share_token_id");
CREATE INDEX IF NOT EXISTS "trading_orders_user_id_idx" ON "trading_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "trading_orders_status_idx" ON "trading_orders" ("status");
CREATE INDEX IF NOT EXISTS "trading_orders_expiration_idx" ON "trading_orders" ("expiration");

CREATE INDEX IF NOT EXISTS "liquidity_pools_share_token_id_idx" ON "liquidity_pools" ("share_token_id");
CREATE INDEX IF NOT EXISTS "liquidity_pools_user_id_idx" ON "liquidity_pools" ("user_id");
CREATE INDEX IF NOT EXISTS "liquidity_pools_chain_id_idx" ON "liquidity_pools" ("chain_id");
CREATE INDEX IF NOT EXISTS "liquidity_pools_is_active_idx" ON "liquidity_pools" ("is_active");

CREATE INDEX IF NOT EXISTS "price_oracle_data_share_token_id_idx" ON "price_oracle_data" ("share_token_id");
CREATE INDEX IF NOT EXISTS "price_oracle_data_timestamp_idx" ON "price_oracle_data" ("timestamp");
CREATE INDEX IF NOT EXISTS "price_oracle_data_oracle_source_idx" ON "price_oracle_data" ("oracle_source");

CREATE INDEX IF NOT EXISTS "dividend_distributions_share_token_id_idx" ON "dividend_distributions" ("share_token_id");
CREATE INDEX IF NOT EXISTS "dividend_distributions_distributed_at_idx" ON "dividend_distributions" ("distributed_at");
CREATE INDEX IF NOT EXISTS "dividend_distributions_distribution_type_idx" ON "dividend_distributions" ("distribution_type");

-- Add some sample data for testing (optional)
-- This would typically be done through the application, but adding for demo purposes

-- Note: In a real deployment, you would run this migration with:
-- npm run db:migrate
-- or through your preferred database migration tool
