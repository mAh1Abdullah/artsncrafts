import { NextRequest } from 'next/server';
import { CreateVendorApplicationSchema } from '@waw/contracts';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import { createVendorApplication, listVendors } from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status')?.trim();
  const search = searchParams.get('search')?.toLowerCase().trim();
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

  let vendors = listVendors();
  if (status && status !== 'all') {
    vendors = vendors.filter((v) => v.status === status);
  }
  if (search) {
    vendors = vendors.filter(
      (v) =>
        v.displayName.toLowerCase().includes(search) ||
        v.craftSpecialty.toLowerCase().includes(search) ||
        v.workshopLocation.toLowerCase().includes(search)
    );
  }

  const { slice, pagination } = paginateArray(vendors, page, limit);
  return list(req, slice, pagination, {
    cacheControl: 'public, max-age=30, stale-while-revalidate=60',
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = CreateVendorApplicationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const vendor = createVendorApplication(parsed.data);
    return created(req, vendor, `/api/v1/vendors/${vendor.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Submit Application',
      detail: (error as Error).message,
      code: 'VENDOR_APPLICATION_ERROR',
    });
  }
}
