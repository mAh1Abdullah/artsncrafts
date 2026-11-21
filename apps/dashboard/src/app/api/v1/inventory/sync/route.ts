import { NextRequest } from 'next/server';
import { ok, problem } from '@/lib/api/response';
import { DEFAULT_TENANT, getProducts, updateProduct } from '@/lib/db/products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const tenantId = req.headers.get('x-tenant-id') || body.tenantId || DEFAULT_TENANT.id;
    const { platform, items } = body;

    if (!items || !Array.isArray(items)) {
      return problem(req, {
        status: 422,
        title: 'Invalid Inventory Sync Items',
        detail: 'Expected an "items" array with { sku, stockDelta | newStock }.',
        code: 'INVALID_SYNC_ITEMS',
      });
    }

    const currentProducts = await getProducts(tenantId);
    const updatedItems = [];

    for (const item of items) {
      const match = currentProducts.find(
        (p) =>
          p.sku === item.sku ||
          p.barcode === item.barcode ||
          p.externalEcommerceId === item.externalId
      );
      if (match) {
        let newStock = match.currentStock ?? 0;
        if (item.newStock !== undefined) {
          newStock = Number(item.newStock);
        } else if (item.stockDelta !== undefined) {
          newStock = Math.max(0, (match.currentStock ?? 0) + Number(item.stockDelta));
        }

        const updated = await updateProduct(match.id, {
          currentStock: newStock,
          isSyncedToEcommerce: true,
          externalEcommerceId: item.externalId || match.externalEcommerceId,
        });

        updatedItems.push(updated);
      }
    }

    return ok(req, {
      platform: platform || 'custom_webhook',
      syncedCount: updatedItems.length,
      updatedProducts: updatedItems,
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Inventory Sync Failed',
      detail: (error as Error).message,
      code: 'INVENTORY_SYNC_ERROR',
    });
  }
}
