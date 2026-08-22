import { NextRequest, NextResponse } from 'next/server';
import { getProducts, updateProduct, DEFAULT_TENANT } from '@/lib/db/products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = req.headers.get('x-tenant-id') || body.tenantId || DEFAULT_TENANT.id;
    const { platform, items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Expected an "items" array with { sku, stockDelta | newStock }' },
        { status: 400 }
      );
    }

    const currentProducts = await getProducts(tenantId);
    const updatedItems = [];

    for (const item of items) {
      const match = currentProducts.find((p) => p.sku === item.sku || p.barcode === item.barcode || p.externalEcommerceId === item.externalId);
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

    return NextResponse.json({
      success: true,
      platform: platform || 'custom_webhook',
      syncedCount: updatedItems.length,
      updatedProducts: updatedItems,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
