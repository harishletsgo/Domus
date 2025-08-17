import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy-loaded database connection
let _db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePostgres> | null = null;
let _sql: ReturnType<typeof neon> | ReturnType<typeof postgres> | null = null;

function getConnection() {
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }

  // Detect if this is a Neon database URL or local PostgreSQL
  const isNeonDatabase = connectionString.includes('neon.tech') || connectionString.includes('neon.database');
  
  if (isNeonDatabase) {
    // Use Neon serverless for cloud databases
    console.log('🌐 Using Neon serverless database connection');
    if (!_sql) {
      _sql = neon(connectionString);
    }
    if (!_db) {
      _db = drizzleNeon(_sql as ReturnType<typeof neon>, { schema });
    }
  } else {
    // Use regular postgres for local databases
    console.log('🏠 Using local PostgreSQL database connection');
    if (!_sql) {
      _sql = postgres(connectionString);
    }
    if (!_db) {
      _db = drizzlePostgres(_sql as ReturnType<typeof postgres>, { schema });
    }
  }

  return { db: _db, sql: _sql };
}

// Export lazy-loaded database instance
export const db = new Proxy({} as ReturnType<typeof drizzleNeon>, {
  get(target, prop) {
    const { db } = getConnection();
    return db[prop as keyof typeof db];
  }
});

// Export lazy-loaded SQL client
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(target, prop) {
    const { sql } = getConnection();
    return sql[prop as keyof typeof sql];
  }
});
