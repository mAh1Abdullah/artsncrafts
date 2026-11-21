"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Receipt, Search } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosSalesViewProps {
  pos: PosWorkspaceController;
}

export function PosSalesView({ pos }: PosSalesViewProps) {
  const {
    salesList,
    salesSearchTerm,
    setSalesSearchTerm,
    salesPaymentFilter,
    setSalesPaymentFilter,
    setSelectedSaleDetail,
    exportCSV,
  } = pos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Sales Directory & Transaction Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review historical POS sales, reprint receipts, and inspect transactions across stores.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV("sales")}
            className="h-9 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoice number, customer..."
            value={salesSearchTerm}
            onChange={(e) => setSalesSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Payment Filter:</span>
          <select
            value={salesPaymentFilter}
            onChange={(e) => setSalesPaymentFilter(e.target.value)}
            className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_banking">bKash / Mobile</option>
            <option value="upi">UPI / QR</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-semibold">Invoice No</TableHead>
              <TableHead className="text-xs font-semibold">Timestamp</TableHead>
              <TableHead className="text-xs font-semibold">Store Outlet</TableHead>
              <TableHead className="text-xs font-semibold">Customer</TableHead>
              <TableHead className="text-xs font-semibold text-center">Items Sold</TableHead>
              <TableHead className="text-xs font-semibold text-right">Total Amount</TableHead>
              <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
              <TableHead className="text-xs font-semibold text-center">Source</TableHead>
              <TableHead className="text-xs font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesList
              .filter((s) => {
                const matchSearch =
                  s.invoiceNo.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
                  (s.customerName &&
                    s.customerName.toLowerCase().includes(salesSearchTerm.toLowerCase()));
                const matchMethod =
                  salesPaymentFilter === "all" || s.paymentMethod === salesPaymentFilter;
                return matchSearch && matchMethod;
              })
              .map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    {sale.invoiceNo}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{sale.date}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">{sale.storeId}</TableCell>
                  <TableCell className="text-xs text-slate-800">
                    {sale.customerName || (
                      <span className="text-slate-400 italic">Walk-in Customer</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-center font-medium">
                    {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold text-slate-900">
                    ${sale.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-medium uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {sale.paymentMethod.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {sale.source === "ecommerce_sync" ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        E-Commerce
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        POS
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSaleDetail(sale)}
                      className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Receipt className="h-3.5 w-3.5 mr-1" />
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
