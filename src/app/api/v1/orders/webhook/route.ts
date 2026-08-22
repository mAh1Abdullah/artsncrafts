import { NextRequest, NextResponse } from 'next/server';
import { getProducts, updateProduct, DEFAULT_TENANT, DEFAULT_STORE } from '@/lib/db/products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = req.headers.get('x-tenant-id') || body.tenantId || DEFAULT_TENANT.id;
    const { platform = 'shopify', orderNumber, lineItems = [], totalAmount, paymentMethod = 'external' } = body;

    // Deduct stock for each line item sold externally
    const currentProducts = await getProducts(tenantId);
    const affectedProducts = [];

    for (const item of lineItems) {
      const match = currentProducts.find((p) => p.sku === item.sku || p.barcode === item.barcode || p.externalEcommerceId === item.externalId);
      if (match) {
        const qty = Number(item.quantity) || 1;
        const remaining = Math.max(0, (match.currentStock ?? 0) - qty);
        await updateProduct(match.id, {
          currentStock: remaining,
        });
        affectedProducts.push({ sku: match.sku, previousStock: match.currentStock, newStock: remaining });
      }
    }

    return NextResponse.json({
      success: true,
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
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
