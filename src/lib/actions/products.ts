'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductByBarcode,
  getProducts,
  getCategories,
  updateProduct,
  bulkDeleteProducts,
  bulkUpdateStock,
  bulkAdjustStock,
  bulkUpdateReorderLevel,
  getStockAuditLogs,
  getProductStockHistory,
  adjustProductStock,
  SingleStockAdjustmentParams,
} from '@/lib/db/products';
import { NewProduct, Product, Category, StockAuditLog } from '@/lib/db/products';

export async function fetchProducts(): Promise<Product[]> {
  return getProducts();
}

export async function fetchCategories(): Promise<Category[]> {
  return getCategories();
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  return getProductById(id);
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | undefined> {
  return getProductByBarcode(barcode);
}

export async function fetchStockAuditLogs(filters?: {
  tenantId?: string;
  productId?: string;
  adjustmentType?: string;
  limit?: number;
}): Promise<StockAuditLog[]> {
  return getStockAuditLogs(filters);
}

export async function fetchProductStockHistory(productId: string): Promise<StockAuditLog[]> {
  return getProductStockHistory(productId);
}

export async function adjustProductStockAction(params: SingleStockAdjustmentParams) {
  try {
    const result = await adjustProductStock(params);
    revalidatePath('/inventory');
    return { success: true, product: result.product, log: result.log };
  } catch (error) {
    console.error('Failed to adjust product stock:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to adjust stock',
    };
  }
}

export async function addProduct(product: NewProduct) {
  try {
    await createProduct(product);
  } catch (error) {
    console.error('Failed to add product:', error);
    return {
      success: false,
      message: 'Database Error: Failed to Create Product.',
    };
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}

export async function editProduct(id: string, product: Partial<NewProduct>) {
  try {
    await updateProduct(id, product);
  } catch (error) {
    console.error('Failed to edit product:', error);
    return {
      success: false,
      message: 'Database Error: Failed to Update Product.',
    };
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}

export async function removeProduct(id: string): Promise<void> {
  try {
    await deleteProduct(id);
    revalidatePath('/inventory');
  } catch (error) {
    console.error('Failed to remove product:', error);
    throw new Error('Database Error: Failed to Delete Product.');
  }
}

export async function batchDeleteProducts(ids: string[]) {
  try {
    const result = await bulkDeleteProducts(ids);
    revalidatePath('/inventory');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to batch delete products:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete selected products',
    };
  }
}

export async function batchSetStock(ids: string[], newStock: number) {
  try {
    const result = await bulkUpdateStock(ids, newStock);
    revalidatePath('/inventory');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to batch set stock:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update stock levels',
    };
  }
}

export async function batchAdjustStock(ids: string[], delta: number) {
  try {
    const result = await bulkAdjustStock(ids, delta);
    revalidatePath('/inventory');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to batch adjust stock:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to adjust stock levels',
    };
  }
}

export async function batchUpdateReorderLevel(ids: string[], reorderLevel: number) {
  try {
    const result = await bulkUpdateReorderLevel(ids, reorderLevel);
    revalidatePath('/inventory');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to batch update reorder level:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update reorder levels',
    };
  }
}
