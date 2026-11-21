import { NextRequest } from 'next/server';
import { ok, problem } from '@/lib/api/response';
import {
  DEFAULT_TENANT,
  getExpenses,
  getProducts,
  getSales,
} from '@/lib/db/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT.id;

    const [products, sales, expenses] = await Promise.all([
      getProducts(tenantId),
      getSales(storeId),
      getExpenses(storeId),
    ]);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCOGS = sales.reduce((sum, s) => {
      const saleCost = s.items.reduce((c, i) => c + (i.unitCost || 0) * i.quantity, 0);
      return sum + saleCost;
    }, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const inventoryValuationCost = products.reduce(
      (sum, p) => sum + (Number(p.unitCost) || 0) * (p.currentStock || 0),
      0
    );
    const inventoryValuationRetail = products.reduce(
      (sum, p) => sum + (Number(p.sellingPrice) || 0) * (p.currentStock || 0),
      0
    );

    const lowStockItems = products.filter(
      (p) => (p.currentStock ?? 0) <= (p.reorderLevel ?? 5)
    );

    return ok(req, {
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCOGS: Number(totalCOGS.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossProfitMargin:
          totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        totalTransactions: sales.length,
        averageOrderValue:
          sales.length > 0 ? Number((totalRevenue / sales.length).toFixed(2)) : 0,
        inventoryValuationCost: Number(inventoryValuationCost.toFixed(2)),
        inventoryValuationRetail: Number(inventoryValuationRetail.toFixed(2)),
        totalSKUs: products.length,
        lowStockAlertsCount: lowStockItems.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Generate Financial Report',
      detail: (error as Error).message,
      code: 'REPORTS_GENERATION_ERROR',
    });
  }
}
