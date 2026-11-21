import { NextRequest } from 'next/server';
import { BDT_PER_USD, UpdateProductRequestSchema } from '@waw/contracts';
import {
  noContent,
  ok,
  problem,
  validationProblem,
} from '@/lib/api/response';
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from '@/lib/db/products';
import {
  appendAdminAuditLog,
  mapDbProductToDTO,
  setProductMetadataOverride,
} from '@/lib/db/marketplace';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await getProductById(id);
    if (!row) {
      return problem(req, {
        status: 404,
        title: 'Product Not Found',
        detail: `No product found with identifier "${id}".`,
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    return ok(req, mapDbProductToDTO(row), {
      cacheControl: 'public, max-age=15, stale-while-revalidate=30',
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Product',
      detail: (error as Error).message,
      code: 'PRODUCT_FETCH_ERROR',
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getProductById(id);
    if (!existing) {
      return problem(req, {
        status: 404,
        title: 'Product Not Found',
        detail: `No product found with identifier "${id}".`,
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = UpdateProductRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const input = parsed.data;
    const sellingPriceUsd =
      input.priceBdt && input.sellingPrice === undefined
        ? Number((input.priceBdt / BDT_PER_USD).toFixed(2))
        : input.sellingPrice;

    const updated = await updateProduct(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.vendorId !== undefined ? { vendorId: input.vendorId } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.unitCost !== undefined ? { unitCost: String(input.unitCost), unitPrice: String(input.unitCost) } : {}),
      ...(sellingPriceUsd !== undefined ? { sellingPrice: String(sellingPriceUsd) } : {}),
      ...(input.currentStock !== undefined ? { currentStock: input.currentStock } : {}),
      ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
      ...(input.isSyncedToEcommerce !== undefined ? { isSyncedToEcommerce: input.isSyncedToEcommerce } : {}),
    });

    setProductMetadataOverride(id, {
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.isCustomizable !== undefined ? { isCustomizable: input.isCustomizable } : {}),
      ...(input.craftTimeDays !== undefined ? { craftTimeDays: input.craftTimeDays } : {}),
      ...(input.materialsUsed !== undefined ? { materialsUsed: input.materialsUsed } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.moderationStatus !== undefined ? { moderationStatus: input.moderationStatus } : {}),
      ...(input.rejectionReason !== undefined ? { rejectionReason: input.rejectionReason } : {}),
    });

    if (input.moderationStatus) {
      appendAdminAuditLog({
        actorName: 'Marketplace Admin',
        actorRole: 'admin',
        action: `product.${input.moderationStatus}`,
        entityType: 'product',
        entityId: id,
        reason: input.rejectionReason || `Product moderation updated to ${input.moderationStatus}`,
      });
    }

    return ok(req, mapDbProductToDTO(updated ?? existing));
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Product',
      detail: (error as Error).message,
      code: 'PRODUCT_UPDATE_ERROR',
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getProductById(id);
    if (!existing) {
      return problem(req, {
        status: 404,
        title: 'Product Not Found',
        detail: `No product found with identifier "${id}".`,
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    await deleteProduct(id);
    return noContent(req);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Delete Product',
      detail: (error as Error).message,
      code: 'PRODUCT_DELETE_ERROR',
    });
  }
}
