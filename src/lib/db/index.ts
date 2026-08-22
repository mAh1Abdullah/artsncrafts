import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

let db: NeonHttpDatabase<typeof schema> | null = null;

if (databaseUrl) {
  try {
    const client: NeonQueryFunction<boolean, boolean> = neon(databaseUrl);
    db = drizzle({ client, schema });
  } catch (error) {
    console.warn('[WAW-POS Database] Failed to initialize Drizzle client from DATABASE_URL:', error);
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[WAW-POS Database] DATABASE_URL is not set. In-memory / mock storage fallback active.');
  }
}

export { db };
export * from './schema';
export default db;
