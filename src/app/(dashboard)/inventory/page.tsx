import { fetchProducts, fetchCategories, fetchStockAuditLogs } from '@/lib/actions/products';
import InventoryClient from './inventory-client';

export default async function InventoryPage() {
  const [products, categories, auditLogs] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchStockAuditLogs({ limit: 100 }),
  ]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <InventoryClient products={products} categories={categories} initialLogs={auditLogs} />
    </div>
  );
}
