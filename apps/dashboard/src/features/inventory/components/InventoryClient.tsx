'use client';

import { useState } from 'react';
import ProductTable, { StockFilterType } from '@/features/inventory/components/product-table';
import ProductForm from '@/features/inventory/components/product-form';
import { InventorySummaryCards } from '@/features/inventory/components/inventory-summary-cards';
import { AddProductDialog } from '@/features/inventory/components/add-product-dialog';
import { StockAuditLogTable } from '@/features/inventory/components/stock-audit-log-table';
import { Product, Category, DEFAULT_CATEGORIES, StockAuditLog } from '@/lib/db/products';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, ShieldCheck } from 'lucide-react';

interface InventoryClientProps {
  products: Product[];
  categories?: Category[];
  initialLogs?: StockAuditLog[];
}

export default function InventoryClient({
  products: initialProducts,
  categories = DEFAULT_CATEGORIES,
  initialLogs = [],
}: InventoryClientProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'audit_logs'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all');

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards Top Section with interactive filtering */}
      <InventorySummaryCards
        products={initialProducts}
        activeStockFilter={stockFilter}
        onStockFilterSelect={(filter) => {
          setStockFilter(filter);
          setActiveTab('products');
        }}
      />

      {/* Main View Container */}
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Product Catalog</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'products' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {initialProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit_logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit_logs'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Stock Audit Trail</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'audit_logs' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {initialLogs.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <AddProductDialog />
          </div>
        </div>

        {/* Tab 1: Product Catalog Table */}
        {activeTab === 'products' && (
          <ProductTable
            products={initialProducts}
            categories={categories}
            onEdit={handleEdit}
            stockFilter={stockFilter}
            onStockFilterChange={setStockFilter}
          />
        )}

        {/* Tab 2: Stock Audit Logs Table */}
        {activeTab === 'audit_logs' && (
          <StockAuditLogTable
            logs={initialLogs}
            products={initialProducts}
          />
        )}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm initialData={editingProduct} categories={categories} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

