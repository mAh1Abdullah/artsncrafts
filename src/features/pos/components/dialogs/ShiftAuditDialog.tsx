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

interface ShiftAuditDialogProps {
  pos: PosWorkspaceController;
}

export function ShiftAuditDialog({ pos }: ShiftAuditDialogProps) {
  const {
    isShiftAuditOpen,
    setIsShiftAuditOpen,
    shiftOpeningCash,
    shiftCashSales,
    expectedDrawerCash,
    shiftCountedCash,
    setShiftCountedCash,
    setShiftAuditResult,
    notify,
  } = pos;

  const variance = Number(shiftCountedCash) - expectedDrawerCash;

  return (
    <Dialog open={isShiftAuditOpen} onOpenChange={setIsShiftAuditOpen}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Register Shift Cash Audit</DialogTitle>
          <DialogDescription className="text-xs">
            Reconcile physical cash drawer with expected POS shift ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Opening Cash Float:</span>
              <span className="font-mono font-medium">${shiftOpeningCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shift Cash Sales Accumulated:</span>
              <span className="font-mono font-medium text-emerald-600">
                +${shiftCashSales.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Expected Drawer Total:</span>
              <span className="font-mono text-sm">${expectedDrawerCash.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="counted-cash" className="text-xs font-semibold">
              Actual Physical Cash Counted ($) *
            </Label>
            <Input
              id="counted-cash"
              type="number"
              step="0.01"
              placeholder="Count all physical bills and coins..."
              value={shiftCountedCash}
              onChange={(e) => setShiftCountedCash(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {shiftCountedCash && (
            <div
              className={`p-2.5 rounded-lg border text-xs font-semibold flex justify-between ${
                variance === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : variance > 0
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <span>Drawer Variance:</span>
              <span className="font-mono">
                {variance >= 0 ? "+" : ""}
                {variance.toFixed(2)} (
                {variance === 0 ? "Balanced Perfectly" : variance > 0 ? "Surplus" : "Shortage"})
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsShiftAuditOpen(false)}
            className="text-xs"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              if (!shiftCountedCash) return;
              const counted = Number(shiftCountedCash);
              setShiftAuditResult({
                expected: expectedDrawerCash,
                counted,
                difference: counted - expectedDrawerCash,
              });
              notify(
                `Shift Audit Logged — Expected: $${expectedDrawerCash.toFixed(2)} | Counted: $${counted.toFixed(2)} | Variance: $${(counted - expectedDrawerCash).toFixed(2)}`,
                "success"
              );
              setIsShiftAuditOpen(false);
            }}
            className="text-xs bg-slate-900 text-white"
          >
            Confirm Shift Audit & Close Drawer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
