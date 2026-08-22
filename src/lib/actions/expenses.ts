'use server';

import { revalidatePath } from 'next/cache';
import { getExpenses, recordExpense, StoredExpense } from '@/lib/db/products';

export async function fetchExpenses(storeId?: string): Promise<StoredExpense[]> {
  return getExpenses(storeId);
}

export async function createExpenseAction(expenseData: Omit<StoredExpense, 'id' | 'createdAt'>) {
  try {
    const expense = await recordExpense(expenseData);
    revalidatePath('/');
    return {
      success: true,
      expense,
    };
  } catch (error) {
    console.error('Failed to log expense:', error);
    return {
      success: false,
      message: 'Database Error: Failed to log expense.',
    };
  }
}
