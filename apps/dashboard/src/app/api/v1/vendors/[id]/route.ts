import { NextRequest } from 'next/server';
import { UpdateVendorSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import {
  findVendorByIdOrSlug,
  getEnrichedProducts,
  updateVendorRecord,
} from '@/lib/db/marketplace';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendor = findVendorByIdOrSlug(id);
    if (!vendor) {
      return problem(req, {
        status: 404,
        title: 'Vendor Studio Not Found',
        detail: `No artisan studio found matching "${id}".`,
        code: 'VENDOR_NOT_FOUND',
      });
    }

    const allProducts = await getEnrichedProducts();
    const products = allProducts.filter(
      (p) => p.vendorId === vendor.id || p.vendorSlug === vendor.publicSlug
    );

    return ok(req, { ...vendor, products });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Vendor Studio',
      detail: (error as Error).message,
      code: 'VENDOR_FETCH_ERROR',
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = UpdateVendorSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateVendorRecord(id, parsed.data);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Vendor Studio Not Found',
        detail: `No artisan studio found matching "${id}".`,
        code: 'VENDOR_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Vendor',
      detail: (error as Error).message,
      code: 'VENDOR_UPDATE_ERROR',
    });
  }
}
