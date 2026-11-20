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
import { Package, Trash2 } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface BulkInventoryDialogsProps {
  pos: PosWorkspaceController;
}

export function BulkInventoryDialogs({ pos }: BulkInventoryDialogsProps) {
  const {
    products,
    setProducts,
    selectedStore,
    storesList,
    selectedInventoryIds,
    setSelectedInventoryIds,
    isBulkStockModalOpen,
    setIsBulkStockModalOpen,
    bulkStockMode,
    setBulkStockMode,
    bulkStockValue,
    setBulkStockValue,
    isBulkDeleteModalOpen,
    setIsBulkDeleteModalOpen,
  } = pos;

  return (
    <>
      {/* Bulk Stock Level Modifier */}
      <Dialog open={isBulkStockModalOpen} onOpenChange={setIsBulkStockModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Stock ({selectedInventoryIds.size} Items)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Batch modify stock levels for{" "}
                  {storesList.find((s) => s.id === selectedStore)?.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Operation Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkStockMode("set")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "set"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Set Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStockMode("add")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "add"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStockMode("subtract")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "subtract"
                      ? "bg-amber-50 border-amber-400 text-amber-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {bulkStockMode === "set"
                  ? "New Stock Value (Units)"
                  : bulkStockMode === "add"
                  ? "Units to Add"
                  : "Units to Deduct"}
              </Label>
              <Input
                type="number"
                min="0"
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(Number(e.target.value) || 0)}
                className="font-mono text-sm h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setProducts((prev) =>
                  prev.map((p) => {
                    if (selectedInventoryIds.has(p.id)) {
                      const currentBranch = p.storeStocks[selectedStore] ?? p.stock;
                      let newBranchStock = currentBranch;
                      let newGlobalStock = p.stock;

                      if (bulkStockMode === "set") {
                        const delta = bulkStockValue - currentBranch;
                        newBranchStock = bulkStockValue;
                        newGlobalStock = Math.max(0, p.stock + delta);
                      } else if (bulkStockMode === "add") {
                        newBranchStock = currentBranch + bulkStockValue;
                        newGlobalStock = p.stock + bulkStockValue;
                      } else {
                        newBranchStock = Math.max(0, currentBranch - bulkStockValue);
                        newGlobalStock = Math.max(0, p.stock - bulkStockValue);
                      }

                      return {
                        ...p,
                        stock: newGlobalStock,
                        storeStocks: {
                          ...p.storeStocks,
                          [selectedStore]: newBranchStock,
                        },
                        status:
                          newGlobalStock <= 0
                            ? "Out of Stock"
                            : newGlobalStock <= p.minStock
                            ? "Low Stock"
                            : "In Stock",
                      };
                    }
                    return p;
                  })
                );
                setIsBulkStockModalOpen(false);
                setSelectedInventoryIds(new Set());
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Apply to {selectedInventoryIds.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete {selectedInventoryIds.size} Products?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete these products from catalog?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
              {Array.from(selectedInventoryIds).map((id) => {
                const prod = products.find((p) => p.id === id);
                if (!prod) return null;
                return (
                  <div
                    key={id}
                    className="text-xs flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-100"
                  >
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">
                      {prod.name}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{prod.sku}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setProducts((prev) => prev.filter((p) => !selectedInventoryIds.has(p.id)));
                setIsBulkDeleteModalOpen(false);
                setSelectedInventoryIds(new Set());
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Confirm Batch Delete ({selectedInventoryIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
