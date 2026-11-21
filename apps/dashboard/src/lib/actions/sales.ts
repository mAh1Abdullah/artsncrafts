'use server';

import { revalidatePath } from 'next/cache';
import { getSales, recordSale, StoredSale } from '@/lib/db/products';

export async function fetchSales(storeId?: string): Promise<StoredSale[]> {
  return getSales(storeId);
}

export async function createSaleAction(saleData: Omit<StoredSale, 'id' | 'createdAt'>) {
  try {
    const sale = await recordSale(saleData);
    revalidatePath('/');
    return {
      success: true,
      sale,
    };
  } catch (error) {
    console.error('Failed to create sale:', error);
    return {
      success: false,
      message: 'Database Error: Failed to record sale.',
    };
  }
}
