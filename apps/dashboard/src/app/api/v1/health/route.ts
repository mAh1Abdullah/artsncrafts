import { NextRequest } from 'next/server';
import { ok } from '@/lib/api/response';
import { isDbOperational } from '@/lib/db/products';

export async function GET(req: NextRequest) {
  return ok(
    req,
    {
      status: 'healthy',
      service: 'waw-dashboard-api',
      framework: 'Next.js 16',
      database: isDbOperational() ? 'postgresql-connected' : 'in-memory-fallback',
      uptimeSeconds: Math.round(process.uptime()),
    },
    { cacheControl: 'no-store' }
  );
}
