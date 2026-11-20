"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Barcode, DollarSign, Layers, Package, Plus } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface AddProductDialogProps {
  pos: PosWorkspaceController;
}

export function AddProductDialog({ pos }: AddProductDialogProps) {
  const { isAddProductOpen, setIsAddProductOpen, handleAddProduct, storesList, selectedStore } = pos;

  return (
    <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl">
        <form onSubmit={handleAddProduct}>
          <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-100">
            <DialogHeader className="gap-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                    Add New Product
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    Register a new item with pricing, SKU barcode, and inventory threshold limits.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal-prod-name" className="text-xs font-semibold text-slate-700">
                  Product Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="modal-prod-name"
                  name="name"
                  required
                  placeholder="e.g. Handcrafted Shital Pati Mat"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-prod-cat" className="text-xs font-semibold text-slate-700">
                  Category
                </Label>
                <select
                  id="modal-prod-cat"
                  name="category"
                  defaultValue="Handicrafts"
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs text-slate-800"
                >
                  <option value="Handicrafts">Handicrafts</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Home & Living">Home & Living</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal-prod-sku" className="text-xs font-semibold text-slate-700">
                  SKU Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="modal-prod-sku"
                  name="sku"
                  required
                  placeholder="e.g. SPM-001"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-prod-barcode"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                >
                  <Barcode className="h-3.5 w-3.5 text-slate-400" />
                  Barcode (EAN-13 / Code128)
                </Label>
                <Input
                  id="modal-prod-barcode"
                  name="barcode"
                  placeholder="e.g. 8901234567895"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Pricing & Valuation
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="modal-prod-cost" className="text-xs text-slate-600 font-medium">
                    Unit Cost ($)
                  </Label>
                  <Input
                    id="modal-prod-cost"
                    name="unitCost"
                    type="number"
                    step="0.01"
                    defaultValue="10.00"
                    className="h-9 text-xs font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="modal-prod-price" className="text-xs text-slate-600 font-medium">
                    Selling Price ($) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="modal-prod-price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue="24.99"
                    required
                    className="h-9 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-prod-stock"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  Initial Stock (
                  {storesList.find((s) => s.id === selectedStore)?.name?.split(" ")[0] ||
                    selectedStore}
                  )
                </Label>
                <Input
                  id="modal-prod-stock"
                  name="stock"
                  type="number"
                  defaultValue="20"
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-prod-min" className="text-xs font-semibold text-slate-700">
                  Reorder Alert Threshold
                </Label>
                <Input
                  id="modal-prod-min"
                  name="minStock"
                  type="number"
                  defaultValue="5"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="syncedToEcommerce"
                name="syncedToEcommerce"
                defaultChecked
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label
                htmlFor="syncedToEcommerce"
                className="text-xs font-medium cursor-pointer text-slate-700"
              >
                Sync automatically to connected E-Commerce stores (Artisans Market / Shopify / WooCommerce)
              </Label>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddProductOpen(false)}
              className="h-9 text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4"
            >
              <Plus className="h-4 w-4" />
              <span>Save to Inventory</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
