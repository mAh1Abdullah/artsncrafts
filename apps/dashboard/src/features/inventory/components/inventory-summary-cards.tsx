'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, XCircle, TrendingUp, Filter } from 'lucide-react';
import { Product } from '@/lib/db/products';

interface InventorySummaryCardsProps {
  products: Product[];
  activeStockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  onStockFilterSelect?: (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
}

export function InventorySummaryCards({
  products,
  activeStockFilter = 'all',
  onStockFilterSelect,
}: InventorySummaryCardsProps) {
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    products.forEach((p) => {
      const stock = Number(p.currentStock) || 0;
      const unitCost = Number(p.unitCost ?? p.unitPrice) || 0;
      const retailPrice = Number(p.sellingPrice) || 0;
      const reorderLevel = Number(p.reorderLevel) || 0;

      totalStockUnits += stock;
      totalCostValue += stock * unitCost;
      totalRetailValue += stock * retailPrice;

      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= reorderLevel) {
        lowStockCount += 1;
      } else {
        inStockCount += 1;
      }
    });

    const totalSkus = products.length;
    const potentialGrossProfit = Math.max(0, totalRetailValue - totalCostValue);

    return {
      totalSkus,
      totalStockUnits,
      totalCostValue,
      totalRetailValue,
      potentialGrossProfit,
      lowStockCount,
      outOfStockCount,
      inStockCount,
    };
  }, [products]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Number of Items Card */}
      <Card
        onClick={() => onStockFilterSelect?.('all')}
        className={`border transition-all rounded-xl overflow-hidden ${
          onStockFilterSelect ? 'cursor-pointer hover:border-indigo-300 hover:shadow-xs' : ''
        } ${
          activeStockFilter === 'all' && onStockFilterSelect
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white'
            : 'border-slate-200 bg-white shadow-2xs'
        }`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Items
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {stats.totalStockUnits.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">units</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span>Across <strong className="text-slate-800 font-semibold">{stats.totalSkus}</strong> unique products</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <Package className="h-5 w-5" />
            </div>
          </div>
          {onStockFilterSelect && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <strong className="text-slate-600 font-medium">{stats.inStockCount} healthy</strong></span>
              <span className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5">
                <Filter className="h-2.5 w-2.5" /> View all
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Total Inventory Value Card */}
      <Card className="border border-slate-200 shadow-2xs bg-white rounded-xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Inventory Value
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  ${stats.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 font-medium">cost</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Retail:{' '}
                <strong className="text-slate-800 font-semibold font-mono">
                  ${stats.totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <TrendingUp className="h-3 w-3" />
              Est. Profit: ${stats.potentialGrossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="font-mono text-slate-400">
              {stats.totalRetailValue > 0
                ? `${Math.round(((stats.totalRetailValue - stats.totalCostValue) / stats.totalRetailValue) * 100)}% margin`
                : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Low Stock Items Card */}
      <Card
        onClick={() => onStockFilterSelect?.('low_stock')}
        className={`border transition-all rounded-xl overflow-hidden ${
          onStockFilterSelect ? 'cursor-pointer hover:border-amber-300 hover:shadow-xs' : ''
        } ${
          activeStockFilter === 'low_stock' && onStockFilterSelect
            ? 'border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/20'
            : 'border-slate-200 bg-white shadow-2xs'
        }`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Low Stock Items
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'
                  }`}
                >
                  {stats.lowStockCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">products</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                At or below reorder threshold
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                stats.lowStockCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          {onStockFilterSelect && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className={stats.lowStockCount > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}>
                {stats.lowStockCount > 0 ? 'Requires restocking' : 'All thresholds met'}
              </span>
              <span className="text-amber-700 font-medium hover:underline flex items-center gap-0.5">
                <Filter className="h-2.5 w-2.5" /> {activeStockFilter === 'low_stock' ? 'Filtering' : 'Filter list'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Out of Stock Items Card */}
      <Card
        onClick={() => onStockFilterSelect?.('out_of_stock')}
        className={`border transition-all rounded-xl overflow-hidden ${
          onStockFilterSelect ? 'cursor-pointer hover:border-rose-300 hover:shadow-xs' : ''
        } ${
          activeStockFilter === 'out_of_stock' && onStockFilterSelect
            ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/20'
            : 'border-slate-200 bg-white shadow-2xs'
        }`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Out of Stock
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    stats.outOfStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {stats.outOfStockCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">products</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Zero available inventory
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                stats.outOfStockCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}
            >
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          {onStockFilterSelect && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className={stats.outOfStockCount > 0 ? 'text-rose-700 font-medium' : 'text-emerald-600 font-medium'}>
                {stats.outOfStockCount > 0 ? 'Urgent attention' : 'No stockouts'}
              </span>
              <span className="text-rose-700 font-medium hover:underline flex items-center gap-0.5">
                <Filter className="h-2.5 w-2.5" /> {activeStockFilter === 'out_of_stock' ? 'Filtering' : 'Filter list'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InventorySummaryCards;

