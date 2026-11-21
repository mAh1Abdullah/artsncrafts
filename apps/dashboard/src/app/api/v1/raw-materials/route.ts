import { NextRequest } from 'next/server';
import { CreateRawMaterialSchema } from '@waw/contracts';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import {
  createRawMaterialListing,
  listRawMaterials,
} from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category')?.trim();
  const search = searchParams.get('search')?.toLowerCase().trim();
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

  let items = listRawMaterials();
  if (category && category !== 'all' && category !== 'All') {
    items = items.filter((m) => m.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    items = items.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.supplierName.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search)
    );
  }
  if (inStockOnly) {
    items = items.filter((m) => m.stockQuantity > 0 && m.status === 'active');
  }

  const { slice, pagination } = paginateArray(items, page, limit);
  return list(req, slice, pagination);
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

    const parsed = CreateRawMaterialSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const item = createRawMaterialListing(parsed.data);
    return created(req, item, `/api/v1/raw-materials/${item.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Create Raw Material Listing',
      detail: (error as Error).message,
      code: 'RAW_MATERIAL_CREATE_ERROR',
    });
  }
}
