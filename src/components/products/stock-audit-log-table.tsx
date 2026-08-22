'use client';

import { useState, useMemo } from 'react';
import { StockAuditLog, Product } from '@/lib/db/products';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  Search,
  Download,
  User,
  Clock,
  FilterX,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface StockAuditLogTableProps {
  logs: StockAuditLog[];
  products?: Product[];
  onOpenAdjustModal?: () => void;
}

type AdjustmentTypeFilter =
  | 'all'
  | 'restock'
  | 'damage_waste'
  | 'physical_count'
  | 'return_restock'
  | 'theft_loss'
  | 'correction';

type DateRangeFilter = 'all' | 'today' | '7days' | '30days';

const ADJUSTMENT_META: Record<string, { label: string; style: string; icon: string }> = {
  restock: { label: 'Restock Batch', style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '📥' },
  damage_waste: { label: 'Damaged / Expired', style: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🗑️' },
  physical_count: { label: 'Physical Count', style: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📋' },
  return_restock: { label: 'Customer Return', style: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔄' },
  theft_loss: { label: 'Theft / Loss', style: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠️' },
  correction: { label: 'Correction', style: 'bg-slate-50 text-slate-700 border-slate-200', icon: '✏️' },
};

export function StockAuditLogTable({
  logs,
}: StockAuditLogTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AdjustmentTypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();

    return logs.filter((log) => {
      // 1. Text Search
      if (q) {
        const prodName = log.productName.toLowerCase();
        const sku = log.sku.toLowerCase();
        const reason = log.reason.toLowerCase();
        const userName = (log.userName || '').toLowerCase();
        const userId = (log.userId || '').toLowerCase();
        const notes = (log.notes || '').toLowerCase();

        if (
          !prodName.includes(q) &&
          !sku.includes(q) &&
          !reason.includes(q) &&
          !userName.includes(q) &&
          !userId.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && log.adjustmentType !== typeFilter) {
        return false;
      }

      // 3. Date Range Filter
      if (dateFilter !== 'all') {
        const logTime = new Date(log.createdAt).getTime();
        if (dateFilter === 'today') {
          const oneDayAgo = now - 86400000;
          if (logTime < oneDayAgo) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = now - 86400000 * 7;
          if (logTime < sevenDaysAgo) return false;
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = now - 86400000 * 30;
          if (logTime < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, typeFilter, dateFilter]);

  // Aggregate stats
  const totalAdditions = useMemo(
    () =>
      filteredLogs
        .filter((l) => l.changeAmount > 0)
        .reduce((sum, l) => sum + l.changeAmount, 0),
    [filteredLogs]
  );

  const totalDeductions = useMemo(
    () =>
      filteredLogs
        .filter((l) => l.changeAmount < 0)
        .reduce((sum, l) => sum + Math.abs(l.changeAmount), 0),
    [filteredLogs]
  );

  const netFlow = totalAdditions - totalDeductions;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Audit ID',
      'Timestamp',
      'Product Name',
      'SKU',
      'Adjustment Type',
      'Previous Stock',
      'Change Delta',
      'New Stock',
      'Reason',
      'User Name',
      'User ID',
      'Notes',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      `"${l.productName.replace(/"/g, '""')}"`,
      l.sku,
      l.adjustmentType,
      l.previousStock,
      l.changeAmount,
      l.newStock,
      `"${l.reason.replace(/"/g, '""')}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      l.userId || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-stock-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || dateFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Velocity Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Logged Events
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-slate-900">{filteredLogs.length}</span>
            <span className="text-xs text-slate-400">audit records</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Restocked / Added
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              +{totalAdditions}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Reduced / Lost
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-rose-600 flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              -{totalDeductions}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Net Inventory Delta
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-2xl font-black ${
                netFlow > 0 ? 'text-emerald-600' : netFlow < 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {netFlow > 0 ? `+${netFlow}` : netFlow}
            </span>
            <span className="text-xs text-slate-400">net change</span>
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search audit logs by product, SKU, user, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Export Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val as AdjustmentTypeFilter)}
            >
              <SelectTrigger className="w-38 text-xs h-9">
                <SelectValue placeholder="All Adjustment Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="restock" className="text-xs">📥 Restock Delivery</SelectItem>
                <SelectItem value="physical_count" className="text-xs">📋 Physical Count</SelectItem>
                <SelectItem value="damage_waste" className="text-xs">🗑️ Damaged / Waste</SelectItem>
                <SelectItem value="return_restock" className="text-xs">🔄 Customer Return</SelectItem>
                <SelectItem value="theft_loss" className="text-xs">⚠️ Theft / Loss</SelectItem>
                <SelectItem value="correction" className="text-xs">✏️ Correction</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select
              value={dateFilter}
              onValueChange={(val) => setDateFilter(val as DateRangeFilter)}
            >
              <SelectTrigger className="w-34 text-xs h-9">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Time</SelectItem>
                <SelectItem value="today" className="text-xs">Today</SelectItem>
                <SelectItem value="7days" className="text-xs">Past 7 Days</SelectItem>
                <SelectItem value="30days" className="text-xs">Past 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setDateFilter('all');
                }}
                className="text-xs h-9 text-slate-500 gap-1"
              >
                <FilterX className="w-3.5 h-3.5" /> Clear
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs h-9 gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[180px] text-xs font-bold text-slate-700">Timestamp</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Product & SKU</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Adjustment Type</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 text-center">Stock Change</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Reason & Notes</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Operator (User)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mb-1.5 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No stock audit records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {hasActiveFilters
                        ? 'Try loosening your filter criteria'
                        : 'Adjustments made to stock will automatically appear here.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const typeMeta = ADJUSTMENT_META[log.adjustmentType] || ADJUSTMENT_META.correction;
                const isPositive = log.changeAmount > 0;
                const logDate = new Date(log.createdAt);

                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <TableCell className="text-xs py-3.5">
                      <div className="font-semibold text-slate-800">
                        {logDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {logDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </TableCell>

                    {/* Product & SKU */}
                    <TableCell className="text-xs py-3.5">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {log.productName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {log.sku}
                        </span>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell className="text-xs py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 font-medium ${typeMeta.style}`}
                      >
                        {typeMeta.icon} {typeMeta.label}
                      </Badge>
                    </TableCell>

                    {/* Stock Change (Previous -> Delta -> New) */}
                    <TableCell className="text-xs py-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? `+${log.changeAmount}` : log.changeAmount}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <span>{log.previousStock}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-slate-700">{log.newStock}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Reason & Notes */}
                    <TableCell className="text-xs py-3.5 max-w-[240px]">
                      <div className="font-medium text-slate-800 line-clamp-1">{log.reason}</div>
                      {log.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          &quot;{log.notes}&quot;
                        </div>
                      )}
                    </TableCell>

                    {/* Operator / User */}
                    <TableCell className="text-xs py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName || 'Admin'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono pl-5">
                        {log.userId || log.userRole || 'Manager'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
