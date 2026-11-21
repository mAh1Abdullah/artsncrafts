import { NextRequest } from 'next/server';
import { list, paginateArray, parsePagination } from '@/lib/api/response';
import { getAdminAuditLogs } from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { page, limit } = parsePagination(req, { limit: 30, maxLimit: 100 });
  const logs = getAdminAuditLogs();
  const { slice, pagination } = paginateArray(logs, page, limit);
  return list(req, slice, pagination);
}
