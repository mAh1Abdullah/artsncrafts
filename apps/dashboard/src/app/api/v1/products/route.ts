import { NextRequest } from 'next/server';
import {
  BDT_PER_USD,
  CreateProductRequestSchema,
  createCuid,
  type ProductDTO,
} from '@waw/contracts';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import {
  createProduct,
  DEFAULT_STORE,
  DEFAULT_TENANT,
  getProducts,
} from '@/lib/db/products';
import {
  getEnrichedProducts,
  mapDbProductToDTO,
  setProductMetadataOverride,
} from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT.id;
    const category = searchParams.get('category')?.toLowerCase().trim();
    const vendorId = searchParams.get('vendorId')?.trim();
    const search = searchParams.get('search')?.toLowerCase().trim();
    const featured = searchParams.get('featured');
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const moderationStatus = searchParams.get('moderationStatus');
    const syncedOnly = searchParams.get('syncedOnly') === 'true';
    const { page, limit, sort } = parsePagination(req, { limit: 24, maxLimit: 100, sort: '-createdAt' });

    let items: ProductDTO[] = await getEnrichedProducts(tenantId);

    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }
    if (vendorId) {
      items = items.filter((p) => p.vendorId === vendorId || p.vendorSlug === vendorId);
    }
    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          (p.description ?? '').toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.vendorName.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search))
      );
    }
    if (featured === 'true') {
      items = items.filter((p) => p.featured);
    }
    if (inStockOnly) {
      items = items.filter((p) => p.currentStock > 0);
    }
    if (syncedOnly) {
      items = items.filter((p) => p.isSyncedToEcommerce);
    }
    if (moderationStatus && moderationStatus !== 'all') {
      items = items.filter((p) => p.moderationStatus === moderationStatus);
    }

    // Sorting
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    items.sort((a, b) => {
      let cmp = 0;
      if (field === 'price' || field === 'priceBdt' || field === 'sellingPrice') {
        cmp = a.priceBdt - b.priceBdt;
      } else if (field === 'rating') {
        cmp = a.rating - b.rating;
      } else if (field === 'stock' || field === 'currentStock') {
        cmp = a.currentStock - b.currentStock;
      } else if (field === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return desc ? -cmp : cmp;
    });

    const { slice, pagination } = paginateArray(items, page, limit);
    return list(req, slice, pagination, {
      cacheControl: 'public, max-age=15, stale-while-revalidate=30',
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Products',
      detail: (error as Error).message,
      code: 'PRODUCTS_FETCH_ERROR',
    });
  }
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

    const parsed = CreateProductRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const input = parsed.data;
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT.id;
    const storeId = req.headers.get('x-store-id') || DEFAULT_STORE.id;

    // Enforce unique SKU per tenant
    const existing = await getProducts(tenantId);
    if (existing.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) {
      return problem(req, {
        status: 409,
        title: 'Duplicate SKU',
        detail: `A product with SKU "${input.sku}" already exists in this tenant catalog.`,
        code: 'DUPLICATE_SKU',
      });
    }

    const sellingPriceUsd =
      input.priceBdt && !rawBody.sellingPrice
        ? Number((input.priceBdt / BDT_PER_USD).toFixed(2))
        : input.sellingPrice;

    const productId = createCuid('art');
    const createdRow = await createProduct({
      id: productId,
      tenantId,
      storeId,
      vendorId: input.vendorId ?? 'v-dhamrai-clay',
      categoryId: input.categoryId ?? 'cat-handicrafts',
      brand: input.brand ?? 'Dhamrai Clay Heritage Studio',
      name: input.name,
      description: input.description ?? null,
      sku: input.sku,
      barcode: input.barcode ?? null,
      imageUrl: input.imageUrl ?? '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
      unitCost: String(input.unitCost),
      unitPrice: String(input.unitCost),
      sellingPrice: String(sellingPriceUsd),
      currentStock: input.currentStock,
      reorderLevel: input.reorderLevel,
      isSyncedToEcommerce: input.isSyncedToEcommerce,
    });

    setProductMetadataOverride(createdRow.id, {
      category: input.category ?? 'handicrafts',
      isCustomizable: input.isCustomizable,
      craftTimeDays: input.craftTimeDays,
      materialsUsed: input.materialsUsed ?? ['Locally Sourced Natural Craft Materials'],
      tags: input.tags ?? ['Handcrafted', 'Bangladesh'],
      moderationStatus: input.moderationStatus ?? 'pending',
    });

    const dto = mapDbProductToDTO(createdRow);
    return created(req, dto, `/api/v1/products/${dto.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Create Product',
      detail: (error as Error).message,
      code: 'PRODUCT_CREATE_ERROR',
    });
  }
}
