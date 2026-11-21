"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Download, Printer, TrendingUp } from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosReportsViewProps {
  pos: PosWorkspaceController;
}

export function PosReportsView({ pos }: PosReportsViewProps) {
  const {
    products,
    salesList,
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalExpensesAmount,
    netProfit,
    totalInventoryCost,
    totalInventoryRetail,
    exportCSV,
  } = pos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Executive Business Analytics & Financial Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time profit & loss calculations, inventory valuation, and sales velocity metrics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 text-xs bg-white"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print Report
          </Button>
          <Button
            size="sm"
            onClick={() => exportCSV("sales")}
            className="h-9 text-xs bg-slate-900 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export Financial Ledger
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">
              Gross Sales Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center mt-1">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              {salesList.length} transactions completed
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">
              Cost of Goods Sold (COGS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-700">
              ${totalCOGS.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Wholesale product acquisition cost</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Gross Margin Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-indigo-600">
              ${grossProfit.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% Gross Margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Net Business Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                netProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              ${netProfit.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              After deducting ${totalExpensesAmount.toFixed(2)} expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Valuation & Top Sellers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Total Inventory Valuation</h3>
            <Badge variant="outline" className="text-xs">
              {products.length} catalog items
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border">
              <span className="text-slate-500">Total Stock Value (at Cost)</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                ${totalInventoryCost.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border">
              <span className="text-slate-500">Total Potential Retail Value</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                ${totalInventoryRetail.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t text-xs space-y-2">
            <h4 className="font-semibold text-slate-800">Low Stock Reorder Alerts:</h4>
            {products
              .filter((p) => p.stock <= p.minStock)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium">{p.name}</span>
                    <span className="font-mono text-xs text-amber-700">({p.sku})</span>
                  </div>
                  <span className="font-bold text-xs">
                    {p.stock} left (Min: {p.minStock})
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Top Velocity Products</h3>
            <span className="text-xs text-slate-400 font-medium">Ranked by units sold</span>
          </div>
          <div className="space-y-3">
            {products.slice(0, 4).map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex h-6 w-6 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {p.category} • ${p.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-slate-900">
                    ${(p.price * 5).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">5 units sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
