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
import {
  Barcode,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ShoppingBag,
  Zap,
} from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface CheckoutTenderDialogProps {
  pos: PosWorkspaceController;
}

export function CheckoutTenderDialog({ pos }: CheckoutTenderDialogProps) {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartTotal,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    tenderedAmount,
    setTenderedAmount,
    handleCompleteSale,
  } = pos;

  return (
    <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Complete Sale & Tender</DialogTitle>
          <DialogDescription className="text-xs">
            Select customer payment method and confirm tender balance.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border text-center space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Total Due</span>
            <div className="text-3xl font-bold font-mono text-slate-900">
              ${cartTotal.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="checkout-cust-name" className="text-xs font-semibold">
                Customer Name
              </Label>
              <Input
                id="checkout-cust-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional Name"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="checkout-cust-phone" className="text-xs font-semibold">
                Phone (+880)
              </Label>
              <Input
                id="checkout-cust-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+880 17XX-XXXXXX"
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Channel & MFS</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === "cash"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                <span>Cash Drawer</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === "card"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Debit / Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("mobile_banking")}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === "mobile_banking"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Zap className="h-4 w-4 text-pink-500" />
                <span>bKash / Nagad</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === "upi"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Barcode className="h-4 w-4 text-indigo-500" />
                <span>AmarPay / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className="p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <ShoppingBag className="h-4 w-4 text-blue-500" />
                <span>UddoktaPay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className="p-2 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center space-y-1 bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <Clock className="h-4 w-4 text-amber-500" />
                <span>COD / Advance</span>
              </button>
            </div>
          </div>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="tendered" className="text-xs font-semibold">
                  Cash Received ($)
                </Label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Due: ${cartTotal.toFixed(2)}
                </span>
              </div>
              <Input
                id="tendered"
                type="number"
                step="0.01"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value)}
                className="font-mono text-sm"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTenderedAmount(cartTotal.toFixed(2))}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-mono font-semibold"
                >
                  Exact (${cartTotal.toFixed(2)})
                </button>
                {[20, 50, 100, 200, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTenderedAmount(val.toString())}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                      Number(tenderedAmount) === val
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {Number(tenderedAmount) >= cartTotal && (
                <div className="text-xs text-emerald-600 font-semibold pt-1 flex justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span>Change Due to Customer:</span>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    ${(Number(tenderedAmount) - cartTotal).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleCompleteSale}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Complete Sale & Issue Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
