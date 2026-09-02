import { NextRequest, NextResponse } from 'next/server';
import {
  getProducts,
  recordSale,
  adjustProductStock,
  recordExpense,
  DEFAULT_TENANT,
  DEFAULT_STORE,
  Product,
} from '@/lib/db/products';

interface SyncPayloadSale {
  id: string; // offline ID
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
  adjustmentType: 'restock' | 'damage_waste' | 'physical_count' | 'return_restock' | 'theft_loss' | 'correction';
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
    const body = await req.json();
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

    // 1. Process Batch Offline Sales
    if (Array.isArray(sales) && sales.length > 0) {
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

          // Decrement stock for each item in the sale
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
                } catch (stockErr) {
                  console.warn(`Could not adjust stock for item ${item.productId}:`, stockErr);
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

    // 2. Process Batch Inventory Mutations
    if (Array.isArray(inventory) && inventory.length > 0) {
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

    // 3. Process Batch Expenses
    if (Array.isArray(expenses) && expenses.length > 0) {
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

    // Fetch refreshed product catalog to update the client's offline cache
    const currentProducts: Product[] = await getProducts(tenantId);

    return NextResponse.json({
      success: errors.length === 0 || syncedSales.length > 0 || syncedInventory.length > 0 || syncedExpenses.length > 0,
      syncedSales,
      syncedInventory,
      syncedExpenses,
      errors: errors.length > 0 ? errors : undefined,
      products: currentProducts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT.id;
    const products = await getProducts(tenantId);

    return NextResponse.json({
      success: true,
      status: 'ready',
      productsCount: products.length,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
