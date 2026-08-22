import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct, DEFAULT_TENANT } from '@/lib/db/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = req.headers.get('x-tenant-id') || searchParams.get('tenantId') || DEFAULT_TENANT.id;
    const productsList = await getProducts(tenantId);
    return NextResponse.json({
      success: true,
      tenantId,
      count: productsList.length,
      data: productsList,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = req.headers.get('x-tenant-id') || body.tenantId || DEFAULT_TENANT.id;

    if (!body.name || !body.sku || !body.sellingPrice) {
      return NextResponse.json(
        { success: false, error: 'name, sku, and sellingPrice are required fields' },
        { status: 400 }
      );
    }

    const created = await createProduct({
      tenantId,
      name: body.name,
      sku: body.sku,
      description: body.description ?? null,
      barcode: body.barcode ?? null,
      unitCost: body.unitCost ? String(body.unitCost) : '0.00',
      sellingPrice: String(body.sellingPrice),
      currentStock: Number(body.currentStock ?? 0),
      reorderLevel: Number(body.reorderLevel ?? 5),
      taxRatePercentage: body.taxRatePercentage ? String(body.taxRatePercentage) : '0.00',
      isTaxInclusive: Boolean(body.isTaxInclusive ?? false),
      isSyncedToEcommerce: Boolean(body.isSyncedToEcommerce ?? false),
      externalEcommerceId: body.externalEcommerceId ?? null,
    });

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
