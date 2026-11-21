import { NextRequest } from 'next/server';
import { ok, problem } from '@/lib/api/response';
import {
  DEFAULT_STORE,
  DEFAULT_TENANT,
  getProducts,
  updateProduct,
} from '@/lib/db/products';

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
    const {
      platform = 'shopify',
      orderNumber,
      lineItems = [],
      totalAmount,
      paymentMethod = 'external',
    } = body;

    const currentProducts = await getProducts(tenantId);
    const affectedProducts = [];

    for (const item of lineItems) {
      const match = currentProducts.find(
        (p) =>
          p.sku === item.sku ||
          p.barcode === item.barcode ||
          p.externalEcommerceId === item.externalId
      );
      if (match) {
        const qty = Number(item.quantity) || 1;
        const remaining = Math.max(0, (match.currentStock ?? 0) - qty);
        await updateProduct(match.id, { currentStock: remaining });
        affectedProducts.push({
          sku: match.sku,
          previousStock: match.currentStock,
          newStock: remaining,
        });
      }
    }

    return ok(req, {
      orderNumber: orderNumber || `EXT-${Date.now()}`,
      platform,
      tenantId,
      storeId: DEFAULT_STORE.id,
      totalAmount,
      paymentMethod,
      affectedInventory: affectedProducts,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Webhook Processing Failed',
      detail: (error as Error).message,
      code: 'ORDER_WEBHOOK_ERROR',
    });
  }
}
