import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle> | null = null;

if (databaseUrl) {
  try {
    db = drizzle(databaseUrl);
  } catch (error) {
    console.warn('[AI Studio] Database connection initialization failed, fallback active:', error);
  }
} else {
  console.warn('[AI Studio] DATABASE_URL is not set — in-memory fallback active.');
}

export { db };

