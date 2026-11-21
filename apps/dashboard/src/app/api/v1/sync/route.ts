import { NextRequest } from 'next/server';
import {
  checkIdempotency,
  ok,
  problem,
  saveIdempotency,
} from '@/lib/api/response';
import {
  adjustProductStock,
  DEFAULT_STORE,
  DEFAULT_TENANT,
  getProducts,
  type Product,
  recordExpense,
  recordSale,
} from '@/lib/db/products';

interface SyncPayloadSale {
  id: string;
  invoiceNumber: string;
  storeId?: string;
  tenantId?: string;
  cashierName?: string;
  paymentMethod?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  customerName?: string;
  notes?: string;
  createdAt?: string;
}

interface SyncPayloadInventory {
  id: string;
  productId: string;
  storeId?: string;
  tenantId?: string;
  changeAmount?: number;
  newStock?: number;
  reason: string;
  adjustmentType:
    | 'restock'
    | 'damage_waste'
    | 'physical_count'
    | 'return_restock'
    | 'theft_loss'
    | 'correction';
  userId?: string;
  userName?: string;
  userRole?: string;
  notes?: string;
}

interface SyncPayloadExpense {
  id: string;
  storeId?: string;
  tenantId?: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  expenseDate?: string;
}

export async function POST(req: NextRequest) {
  try {
    const replayed = checkIdempotency(req, 'POST:/api/v1/sync');
    if (replayed) return replayed;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid Sync Payload',
        detail: 'Sync body must be a JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const {
      sales = [],
      inventory = [],
      expenses = [],
      tenantId = DEFAULT_TENANT.id,
      storeId = DEFAULT_STORE.id,
    } = body;

    const syncedSales: { id: string; invoiceNumber: string; serverId: string }[] = [];
    const syncedInventory: { id: string; productId: string; newStock: number }[] = [];
    const syncedExpenses: { id: string; serverId: string }[] = [];
    const errors: string[] = [];

    if (Array.isArray(sales)) {
      for (const sale of sales as SyncPayloadSale[]) {
        try {
          const recorded = await recordSale({
            tenantId: sale.tenantId || tenantId,
            storeId: sale.storeId || storeId,
            invoiceNumber: sale.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
            status: 'completed',
            subtotal: Number(sale.subtotal) || 0,
            discountAmount: Number(sale.discountAmount) || 0,
            taxAmount: Number(sale.taxAmount) || 0,
            totalAmount: Number(sale.totalAmount) || 0,
            paymentMethod: sale.paymentMethod || 'cash',
            customerName: sale.customerName,
            notes: sale.notes ? `${sale.notes} [Synced from Offline Queue]` : '[Offline-first Sync]',
            items: sale.items || [],
          });

          if (Array.isArray(sale.items)) {
            for (const item of sale.items) {
              if (item.productId && item.quantity > 0) {
                try {
                  await adjustProductStock({
                    productId: item.productId,
                    changeAmount: -Math.abs(item.quantity),
                    reason: `Sale ${recorded.invoiceNumber} (Offline Sync)`,
                    adjustmentType: 'correction',
                    userId: 'usr_offline_sync',
                    userName: sale.cashierName || 'Cashier',
                    userRole: 'Cashier',
                    notes: `Deducted ${item.quantity} unit(s) via offline sync`,
                  });
                } catch {
                  // Continue syncing remaining items
                }
              }
            }
          }

          syncedSales.push({
            id: sale.id,
            invoiceNumber: recorded.invoiceNumber,
            serverId: recorded.id,
          });
        } catch (err) {
          errors.push(`Sale ${sale.invoiceNumber || sale.id}: ${(err as Error).message}`);
        }
      }
    }

    if (Array.isArray(inventory)) {
      for (const inv of inventory as SyncPayloadInventory[]) {
        try {
          const adjusted = await adjustProductStock({
            productId: inv.productId,
            changeAmount: inv.changeAmount,
            newStock: inv.newStock,
            reason: inv.reason || 'Offline inventory stock count adjustment',
            adjustmentType: inv.adjustmentType || 'physical_count',
            userId: inv.userId || 'usr_offline_sync',
            userName: inv.userName || 'Store Manager',
            userRole: inv.userRole || 'Manager',
            notes: inv.notes,
          });

          syncedInventory.push({
            id: inv.id,
            productId: inv.productId,
            newStock: adjusted.product.currentStock ?? 0,
          });
        } catch (err) {
          errors.push(`Inventory item ${inv.productId}: ${(err as Error).message}`);
        }
      }
    }

    if (Array.isArray(expenses)) {
      for (const exp of expenses as SyncPayloadExpense[]) {
        try {
          const recorded = await recordExpense({
            tenantId: exp.tenantId || tenantId,
            storeId: exp.storeId || storeId,
            category: exp.category || 'General',
            amount: Number(exp.amount) || 0,
            description: exp.description || 'Offline recorded expense',
            recordedBy: exp.recordedBy || 'Cashier',
            expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
          });

          syncedExpenses.push({
            id: exp.id,
            serverId: recorded.id,
          });
        } catch (err) {
          errors.push(`Expense ${exp.category}: ${(err as Error).message}`);
        }
      }
    }

    const currentProducts: Product[] = await getProducts(tenantId);
    const response = ok(req, {
      syncedSales,
      syncedInventory,
      syncedExpenses,
      errors: errors.length > 0 ? errors : undefined,
      products: currentProducts,
    });
    const clonedBody = await response.clone().json();
    saveIdempotency(req, 'POST:/api/v1/sync', 200, clonedBody);
    return response;
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Offline Sync Failed',
      detail: (error as Error).message,
      code: 'SYNC_ERROR',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT.id;
    const products = await getProducts(tenantId);

    return ok(req, {
      status: 'ready',
      productsCount: products.length,
      products,
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Sync Status Check Failed',
      detail: (error as Error).message,
      code: 'SYNC_STATUS_ERROR',
    });
  }
}
