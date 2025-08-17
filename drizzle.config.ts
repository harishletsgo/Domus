import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

// Detect if this is a Neon database URL or local PostgreSQL
const isNeonDatabase = connectionString.includes('neon.tech') || connectionString.includes('neon.database');

export default {
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
