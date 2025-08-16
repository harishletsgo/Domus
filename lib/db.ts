import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy-loaded database connection
let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof neon> | null = null;

function getConnection() {
  // Make sure to add your Neon database URL to your .env.local file
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }

  if (!_sql) {
    _sql = neon(connectionString);
  }

  if (!_db) {
    _db = drizzle(_sql, { schema });
  }

  return { db: _db, sql: _sql };
}

// Export lazy-loaded database instance
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
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
