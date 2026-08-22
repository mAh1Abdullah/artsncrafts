import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, recordExpense, DEFAULT_TENANT, DEFAULT_STORE } from '@/lib/db/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;
    const expenses = await getExpenses(storeId);
    return NextResponse.json({ success: true, count: expenses.length, expenses });
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
      category,
      amount,
      description,
      recordedBy = 'Cashier',
      expenseDate,
      storeId = DEFAULT_STORE.id,
      tenantId = DEFAULT_TENANT.id,
    } = body;

    if (!category || !amount) {
      return NextResponse.json(
        { success: false, error: 'Category and amount are required' },
        { status: 400 }
      );
    }

    const expense = await recordExpense({
      tenantId,
      storeId,
      category,
      amount: Number(amount),
      description: description || '',
      recordedBy,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
