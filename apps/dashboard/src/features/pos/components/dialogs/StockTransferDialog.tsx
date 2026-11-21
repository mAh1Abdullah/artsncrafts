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
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface StockTransferDialogProps {
  pos: PosWorkspaceController;
}

export function StockTransferDialog({ pos }: StockTransferDialogProps) {
  const {
    isTransferOpen,
    setIsTransferOpen,
    handleStockTransfer,
    storesList,
    selectedStore,
    transferTargetStore,
    setTransferTargetStore,
    transferProductId,
    setTransferProductId,
    products,
    transferQty,
    setTransferQty,
  } = pos;

  return (
    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleStockTransfer}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Inter-Branch Stock Transfer</DialogTitle>
            <DialogDescription className="text-xs">
              Move physical stock between store locations and update branch balances.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 text-xs">
            <div>
              <Label className="text-xs font-medium">Source Outlet (Current)</Label>
              <div className="p-2 bg-slate-100 rounded-md text-xs font-medium text-slate-800 mt-1">
                {storesList.find((s) => s.id === selectedStore)?.name} ({selectedStore})
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Target Outlet *</Label>
              <select
                value={transferTargetStore}
                onChange={(e) => setTransferTargetStore(e.target.value)}
                className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
              >
                {storesList
                  .filter((s) => s.id !== selectedStore)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-medium">Select Product *</Label>
              <select
                value={transferProductId}
                onChange={(e) => setTransferProductId(e.target.value)}
                required
                className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Avail in {selectedStore}: {p.storeStocks[selectedStore] ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-medium">Transfer Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                required
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" className="text-xs bg-slate-900 text-white">
              Dispatch Stock Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
