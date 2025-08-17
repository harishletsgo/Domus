-- Fix numeric precision for share token trading
-- Change from wei-like precision to normal token precision

-- Update trading orders table
ALTER TABLE "trading_orders" 
ALTER COLUMN "amount" TYPE decimal(18, 6);

ALTER TABLE "trading_orders" 
ALTER COLUMN "filled_amount" TYPE decimal(18, 6);

-- Update share tokens table for more reasonable precision
ALTER TABLE "share_tokens" 
ALTER COLUMN "total_supply" TYPE decimal(18, 6);

ALTER TABLE "share_tokens" 
ALTER COLUMN "user_balance" TYPE decimal(18, 6);

-- Update liquidity pools table
ALTER TABLE "liquidity_pools" 
ALTER COLUMN "share_reserves" TYPE decimal(18, 6);

ALTER TABLE "liquidity_pools" 
ALTER COLUMN "usd_reserves" TYPE decimal(18, 6);

ALTER TABLE "liquidity_pools" 
ALTER COLUMN "total_liquidity" TYPE decimal(18, 6);

ALTER TABLE "liquidity_pools" 
ALTER COLUMN "user_liquidity" TYPE decimal(18, 6);

ALTER TABLE "liquidity_pools" 
ALTER COLUMN "volume_24h" TYPE decimal(18, 6);

ALTER TABLE "liquidity_pools" 
ALTER COLUMN "fees_24h" TYPE decimal(18, 6);

-- Update price oracle data table
ALTER TABLE "price_oracle_data" 
ALTER COLUMN "volume_24h" TYPE decimal(18, 6);

ALTER TABLE "price_oracle_data" 
ALTER COLUMN "market_cap" TYPE decimal(18, 6);

-- Update dividend distributions table
ALTER TABLE "dividend_distributions" 
ALTER COLUMN "total_amount" TYPE decimal(18, 6);

ALTER TABLE "dividend_distributions" 
ALTER COLUMN "amount_per_share" TYPE decimal(18, 6);
