'use client';

import { useState } from 'react';
import ProductTable from '@/components/products/product-table';
import ProductForm from '@/components/products/product-form';
import { InventorySummaryCards } from '@/components/products/inventory-summary-cards';
import { Product } from '@/lib/db/products';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface InventoryClientProps {
  products: Product[];
}

export default function InventoryClient({ products: initialProducts }: InventoryClientProps) {
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleNewProductClick = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards Top Section */}
      <InventorySummaryCards products={initialProducts} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Product Catalog</h2>
            <p className="text-xs text-slate-500">Manage all registered products, variants, and stock thresholds.</p>
          </div>
          <Button onClick={handleNewProductClick} className="bg-slate-900 text-white hover:bg-slate-800 text-xs flex items-center">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Button>
        </div>
        <ProductTable products={initialProducts} onEdit={handleEdit} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm initialData={editingProduct} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
