import { NextRequest } from 'next/server';
import { list, paginateArray, parsePagination } from '@/lib/api/response';
import { listSettlements } from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorProfileId = searchParams.get('vendorId')?.trim();
  const status = searchParams.get('status')?.trim();
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

  let settlements = listSettlements();
  if (vendorProfileId) {
    settlements = settlements.filter((s) => s.vendorProfileId === vendorProfileId);
  }
  if (status && status !== 'all') {
    settlements = settlements.filter((s) => s.status === status);
  }

  const { slice, pagination } = paginateArray(settlements, page, limit);
  return list(req, slice, pagination);
}
