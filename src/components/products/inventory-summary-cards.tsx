'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, Layers } from 'lucide-react';
import { Product } from '@/lib/db/products';

interface InventorySummaryCardsProps {
  products: Product[];
}

export function InventorySummaryCards({ products }: InventorySummaryCardsProps) {
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = Number(p.currentStock) || 0;
      const unitCost = Number(p.unitPrice) || 0;
      const retailPrice = Number(p.sellingPrice) || 0;
      const reorderLevel = Number(p.reorderLevel) || 0;

      totalStockUnits += stock;
      totalCostValue += stock * unitCost;
      totalRetailValue += stock * retailPrice;

      if (stock === 0) {
        outOfStockCount += 1;
      } else if (stock <= reorderLevel) {
        lowStockCount += 1;
      }
    });

    const totalSkus = products.length;

    return {
      totalSkus,
      totalStockUnits,
      totalCostValue,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* 1. Total Items Card */}
      <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Items
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {stats.totalStockUnits.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">units</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>Across <strong className="text-slate-700 font-semibold">{stats.totalSkus}</strong> unique SKUs</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Low Stock Alerts Card */}
      <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Low Stock Alerts
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    stats.lowStockCount + stats.outOfStockCount > 0
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {stats.lowStockCount + stats.outOfStockCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">requiring attention</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="text-amber-700 font-medium">{stats.lowStockCount} low stock</span>
                {' · '}
                <span className="text-rose-600 font-medium">{stats.outOfStockCount} out of stock</span>
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                stats.lowStockCount + stats.outOfStockCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Inventory Value Card */}
      <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl overflow-hidden sm:col-span-2 lg:col-span-1">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Inventory Value
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  ${stats.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 font-medium">at cost</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Retail Value:{' '}
                <strong className="text-slate-800 font-semibold font-mono">
                  ${stats.totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InventorySummaryCards;
