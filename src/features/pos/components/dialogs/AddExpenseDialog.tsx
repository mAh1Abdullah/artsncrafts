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

interface AddExpenseDialogProps {
  pos: PosWorkspaceController;
}

export function AddExpenseDialog({ pos }: AddExpenseDialogProps) {
  const { isAddExpenseOpen, setIsAddExpenseOpen, handleAddExpense } = pos;

  return (
    <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleAddExpense}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Record Business Expense</DialogTitle>
            <DialogDescription className="text-xs">
              Log operational expenses, rent, packaging, logistics, or staff costs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 text-xs">
            <div>
              <Label htmlFor="exp-category" className="text-xs font-medium">
                Category *
              </Label>
              <select
                id="exp-category"
                name="category"
                required
                className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
              >
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Packaging & Supplies">Packaging & Supplies</option>
                <option value="Logistics & Delivery">Logistics & Delivery</option>
                <option value="Store Refreshments">Store Refreshments</option>
                <option value="Maintenance & Cleaning">Maintenance & Cleaning</option>
                <option value="Marketing & Print">Marketing & Print</option>
                <option value="Staff Daily Allowance">Staff Daily Allowance</option>
              </select>
            </div>

            <div>
              <Label htmlFor="exp-amount" className="text-xs font-medium">
                Amount ($) *
              </Label>
              <Input
                id="exp-amount"
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="exp-desc" className="text-xs font-medium">
                Description / Payee Note *
              </Label>
              <Input
                id="exp-desc"
                name="description"
                required
                placeholder="e.g. Monthly electricity bill"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="exp-pay" className="text-xs font-medium">
                Payment Method
              </Label>
              <select
                id="exp-pay"
                name="paymentMethod"
                className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
              >
                <option value="Cash Drawer">Cash Drawer</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="bKash / Mobile Wallet">bKash / Mobile Wallet</option>
                <option value="Petty Cash">Petty Cash</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddExpenseOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" className="text-xs bg-slate-900 text-white">
              Record Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
