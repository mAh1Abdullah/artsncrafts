import { NextRequest, NextResponse } from 'next/server';
import { getSales, recordSale, DEFAULT_TENANT, DEFAULT_STORE } from '@/lib/db/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;
    const sales = await getSales(storeId);
    return NextResponse.json({ success: true, count: sales.length, sales });
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
    const {
      invoiceNumber,
      items,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      totalAmount,
      paymentMethod = 'cash',
      customerName,
      notes,
      storeId = DEFAULT_STORE.id,
      tenantId = DEFAULT_TENANT.id,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sales items array is required' },
        { status: 400 }
      );
    }

    const sale = await recordSale({
      tenantId,
      storeId,
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      subtotal: Number(subtotal) || 0,
      discountAmount: Number(discountAmount) || 0,
      taxAmount: Number(taxAmount) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod,
      customerName,
      notes,
      items,
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
