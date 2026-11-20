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
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface BarcodeLabelsDialogProps {
  pos: PosWorkspaceController;
}

export function BarcodeLabelsDialog({ pos }: BarcodeLabelsDialogProps) {
  const {
    selectedLabelProduct,
    isLabelModalOpen,
    setIsLabelModalOpen,
    labelPrintCount,
    setLabelPrintCount,
  } = pos;

  if (!selectedLabelProduct) return null;

  return (
    <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Print Barcode Labels</DialogTitle>
          <DialogDescription className="text-xs">
            Generate printable Code128 shelf and item stickers for physical labeling.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <Label>Number of Stickers:</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 4, 8].map((count) => (
                <button
                  key={count}
                  onClick={() => setLabelPrintCount(count)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    labelPrintCount === count
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-lg border">
            {Array.from({ length: labelPrintCount }).map((_, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-300 rounded shadow-2xs text-center space-y-1 font-mono"
              >
                <div className="text-[9px] font-sans font-bold text-slate-800 truncate">
                  {selectedLabelProduct.name}
                </div>
                <div className="flex justify-center py-1">
                  <div className="flex items-end space-x-[2px] h-9">
                    {[2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                      <div
                        key={i}
                        className={`bg-slate-900 h-full ${
                          w === 1
                            ? "w-[1px]"
                            : w === 2
                            ? "w-[2px]"
                            : w === 3
                            ? "w-[3px]"
                            : "w-[4px]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 font-bold">
                  {selectedLabelProduct.barcode}
                </div>
                <div className="text-xs font-bold text-slate-900">
                  ${selectedLabelProduct.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsLabelModalOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button onClick={() => window.print()} className="text-xs bg-slate-900 text-white">
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Sticker Sheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
