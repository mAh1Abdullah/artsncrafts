"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface ThermalReceiptDialogProps {
  pos: PosWorkspaceController;
}

export function ThermalReceiptDialog({ pos }: ThermalReceiptDialogProps) {
  const {
    tenantName,
    lastInvoice,
    setLastInvoice,
    selectedSaleDetail,
    setSelectedSaleDetail,
    receiptPaperSize,
    setReceiptPaperSize,
  } = pos;

  const invoice = lastInvoice || selectedSaleDetail;
  if (!invoice) return null;

  const closeModal = () => {
    setLastInvoice(null);
    setSelectedSaleDetail(null);
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={closeModal}>
      <DialogContent
        className={`${
          receiptPaperSize === "58mm" ? "sm:max-w-[320px]" : "sm:max-w-[400px]"
        } font-mono text-xs p-6 bg-white border border-slate-300 shadow-2xl rounded-lg`}
      >
        <div className="space-y-3">
          {/* Paper Width Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 print:hidden text-[11px]">
            <span className="text-slate-500 font-sans font-medium">Thermal Size:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setReceiptPaperSize("80mm")}
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                  receiptPaperSize === "80mm"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                80mm Standard
              </button>
              <button
                type="button"
                onClick={() => setReceiptPaperSize("58mm")}
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                  receiptPaperSize === "58mm"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                58mm Compact
              </button>
            </div>
          </div>

          {/* Printable Thermal Receipt Card */}
          <div className="text-center space-y-1">
            <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {tenantName}
            </h3>
            <p className="text-[10px] text-slate-500">Zindabazar Commercial Area, Sylhet - 3100</p>
            <p className="text-[10px] text-slate-500 font-mono">BIN / Mushak: 002918471-0101</p>
            <p className="text-[10px] text-slate-500">Tel: +880 1711-000000 • www.waw-pos.bd</p>
            <div className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-700 mt-1">
              Tax Invoice / Customer Copy
            </div>
          </div>

          <div className="border-y border-dashed border-slate-300 py-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>
                Invoice #: <strong className="text-slate-900">{invoice.invoiceNo}</strong>
              </span>
              <span>{invoice.date}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                Outlet: <strong>{invoice.storeId}</strong>
              </span>
              <span className="capitalize">
                Pay: <strong className="text-slate-900">{invoice.paymentMethod}</strong>
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                Cashier: <strong>{invoice.cashierName.split(" ")[0]}</strong>
              </span>
              <span className="text-emerald-700 font-bold uppercase">PAID</span>
            </div>
            {invoice.customerName && (
              <div className="text-slate-700 pt-1 border-t border-dotted border-slate-200">
                Customer: <strong>{invoice.customerName}</strong>{" "}
                {invoice.customerPhone && `(${invoice.customerPhone})`}
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1 text-[10px] uppercase">
              <span>Item / Description</span>
              <span>Amount</span>
            </div>
            {invoice.items.map((item) => (
              <div key={item.product.id} className="flex justify-between py-0.5">
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-900">{item.product.name}</span>
                  <span className="text-slate-500 text-[10px] block">
                    {item.quantity} × ${item.product.price.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono text-slate-900 font-medium">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial summary breakdown */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-${invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT / Govt Tax (5%):</span>
              <span className="font-mono">${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t-2 border-slate-900">
              <span>TOTAL PAID:</span>
              <span className="font-mono">${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-dotted border-slate-200 space-y-1 text-[10px] text-slate-400">
            <div className="font-mono tracking-widest text-[9px] text-slate-500">
              ||| | ||||| || |||| ||| |||| | |||||
            </div>
            <p className="font-mono text-[9px] text-slate-400">
              AUTH: {invoice.invoiceNo}-NBR-BD
            </p>
            <p className="text-slate-500 pt-1 font-sans">Thank you for shopping with us!</p>
            <p className="text-[9px] text-slate-400 font-sans">
              Goods once sold can be exchanged within 7 days with this invoice.
            </p>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between pt-2 border-t border-slate-100 print:hidden">
            <Button variant="ghost" onClick={closeModal} className="text-xs">
              Close
            </Button>
            <Button
              onClick={() => window.print()}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Receipt ({receiptPaperSize})
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
