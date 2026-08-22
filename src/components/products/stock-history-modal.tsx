'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { Product, StockAuditLog } from '@/lib/db/products';
import { fetchProductStockHistory, adjustProductStockAction } from '@/lib/actions/products';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface StockHistoryModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockUpdated?: (updatedProduct: Product) => void;
}

type AdjustmentType =
  | 'restock'
  | 'damage_waste'
  | 'physical_count'
  | 'return_restock'
  | 'theft_loss'
  | 'correction';

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, { label: string; color: string; icon: string }> = {
  restock: { label: 'Restock / Delivery', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '📥' },
  damage_waste: { label: 'Damaged / Expired', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: '🗑️' },
  physical_count: { label: 'Physical Count Reconciliation', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📋' },
  return_restock: { label: 'Customer Return Restock', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔄' },
  theft_loss: { label: 'Theft / Shrinkage Loss', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠️' },
  correction: { label: 'Manual Correction', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: '✏️' },
};

export function StockHistoryModal({
  product,
  open,
  onOpenChange,
  onStockUpdated,
}: StockHistoryModalProps) {
  const [logs, setLogs] = useState<StockAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Quick stock adjustment form state
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState<'delta' | 'exact'>('delta');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('restock');
  const [deltaValue, setDeltaValue] = useState<string>('10');
  const [exactStockValue, setExactStockValue] = useState<string>('0');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('Store Manager');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fetch stock logs when product changes or modal opens
  useEffect(() => {
    if (open && product) {
      setLoading(true);
      setFormError(null);
      setFormSuccess(null);
      setShowAdjustForm(false);
      setExactStockValue(String(product.currentStock ?? 0));

      fetchProductStockHistory(product.id)
        .then((data) => {
          setLogs(data);
        })
        .catch((err) => {
          console.error('Failed to load stock history:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, product]);

  if (!product) return null;

  const currentStock = product.currentStock ?? 0;
  const reorderLevel = product.reorderLevel ?? 5;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= reorderLevel;

  // Real-time calculation of new stock preview
  let computedNewStock = currentStock;
  let computedDelta = 0;

  if (adjustmentMode === 'exact') {
    const parsed = parseInt(exactStockValue, 10);
    computedNewStock = isNaN(parsed) ? currentStock : Math.max(0, parsed);
    computedDelta = computedNewStock - currentStock;
  } else {
    const parsed = parseInt(deltaValue, 10);
    const multiplier = adjustmentType === 'damage_waste' || adjustmentType === 'theft_loss' ? -1 : 1;
    const deltaAmount = isNaN(parsed) ? 0 : Math.abs(parsed) * multiplier;
    computedNewStock = Math.max(0, currentStock + deltaAmount);
    computedDelta = computedNewStock - currentStock;
  }

  // Stock Velocity Aggregations
  const totalAdditions = logs
    .filter((l) => l.changeAmount > 0)
    .reduce((acc, curr) => acc + curr.changeAmount, 0);

  const totalDeductions = logs
    .filter((l) => l.changeAmount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.changeAmount), 0);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const reason = reasonInput.trim() || getDefaultReason(adjustmentType);

    startTransition(async () => {
      const res = await adjustProductStockAction({
        productId: product.id,
        changeAmount: adjustmentMode === 'delta' ? computedDelta : undefined,
        newStock: adjustmentMode === 'exact' ? computedNewStock : undefined,
        reason,
        adjustmentType,
        userName: operatorName || 'Store Manager',
        userRole: 'Manager',
        notes: notesInput.trim() || undefined,
      });

      if (res.success && res.product && res.log) {
        setFormSuccess(`Stock successfully updated to ${res.product.currentStock} units.`);
        setLogs((prev) => [res.log!, ...prev]);
        setShowAdjustForm(false);
        setReasonInput('');
        setNotesInput('');
        onStockUpdated?.(res.product);
      } else {
        setFormError(res.message || 'Failed to adjust stock level.');
      }
    });
  };

  function getDefaultReason(type: AdjustmentType): string {
    switch (type) {
      case 'restock':
        return 'Vendor replenishment batch delivery';
      case 'damage_waste':
        return 'Damaged or defective units disposal';
      case 'physical_count':
        return 'Periodic physical audit count correction';
      case 'return_restock':
        return 'Customer return restocked to inventory';
      case 'theft_loss':
        return 'Inventory shrinkage loss recorded';
      case 'correction':
        return 'Manual inventory adjustment';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header with Product Summary */}
        <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {product.name}
                  </h3>
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="text-[11px]">
                      Out of Stock
                    </Badge>
                  ) : isLowStock ? (
                    <Badge className="bg-amber-500 text-white border-none text-[11px]">
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-600 text-white border-none text-[11px]">
                      In Stock
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">
                    SKU: {product.sku}
                  </span>
                  {product.barcode && (
                    <span className="font-mono text-slate-500">
                      Barcode: {product.barcode}
                    </span>
                  )}
                  <span className="text-emerald-700 font-semibold">
                    ৳{Number(product.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant={showAdjustForm ? 'outline' : 'default'}
              onClick={() => setShowAdjustForm(!showAdjustForm)}
              className="gap-1.5 shrink-0"
            >
              {showAdjustForm ? (
                <>Close Adjustment</>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Adjust Stock
                </>
              )}
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/60">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Current Stock
              </span>
              <span className={`text-lg font-black ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                {currentStock}{' '}
                <span className="text-xs font-normal text-slate-400">units</span>
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Reorder Threshold
              </span>
              <span className="text-lg font-black text-slate-800">
                {reorderLevel}{' '}
                <span className="text-xs font-normal text-slate-400">min</span>
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Additions
              </span>
              <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />+{totalAdditions}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Reductions
              </span>
              <span className="text-lg font-black text-rose-600 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />-{totalDeductions}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Notification Messages */}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Quick Adjustment Panel */}
          {showAdjustForm && (
            <form
              onSubmit={handleAdjustSubmit}
              className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3.5 animate-in fade-in-0 duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Manual Stock Adjustment Form
                </h4>
                <div className="flex items-center bg-blue-100 p-0.5 rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('delta')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      adjustmentMode === 'delta'
                        ? 'bg-white text-blue-900 shadow-2xs'
                        : 'text-blue-700 hover:text-blue-900'
                    }`}
                  >
                    Adjust by (+/-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('exact')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      adjustmentMode === 'exact'
                        ? 'bg-white text-blue-900 shadow-2xs'
                        : 'text-blue-700 hover:text-blue-900'
                    }`}
                  >
                    Set Exact Count
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Adjustment Reason / Category
                  </Label>
                  <Select
                    value={adjustmentType}
                    onValueChange={(val) => setAdjustmentType(val as AdjustmentType)}
                  >
                    <SelectTrigger className="bg-white text-xs mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([key, item]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {item.icon} {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {adjustmentMode === 'delta' ? (
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Units to{' '}
                      {adjustmentType === 'damage_waste' || adjustmentType === 'theft_loss'
                        ? 'Deduct (-)'
                        : 'Add (+)'}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 flex-1">
                        <span className="text-slate-400 font-bold text-xs mr-1">
                          {adjustmentType === 'damage_waste' || adjustmentType === 'theft_loss'
                            ? '-'
                            : '+'}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={deltaValue}
                          onChange={(e) => setDeltaValue(e.target.value)}
                          className="w-full text-xs font-bold focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      New Total Stock Count
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100000"
                      value={exactStockValue}
                      onChange={(e) => setExactStockValue(e.target.value)}
                      className="bg-white text-xs mt-1 font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Preview Pill */}
              <div className="p-2.5 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>Current: <strong>{currentStock}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-blue-900 font-bold">
                    Resulting Stock: {computedNewStock} units
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={computedDelta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}
                >
                  {computedDelta >= 0 ? `+${computedDelta}` : computedDelta} units
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-700">Detailed Reason / PO#</Label>
                  <Input
                    placeholder={getDefaultReason(adjustmentType)}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="bg-white text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-700">Logged By (User / Role)</Label>
                  <Input
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="bg-white text-xs mt-1"
                    placeholder="e.g. Farhan (Shift Lead)"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-700">Optional Notes / Reference</Label>
                <Input
                  placeholder="e.g., Box was damaged during transit from supplier..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="bg-white text-xs mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdjustForm(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  {isPending ? 'Saving Log...' : 'Confirm & Record Audit'}
                </Button>
              </div>
            </form>
          )}

          {/* Timeline of Stock Adjustments */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                Quantity Change History ({logs.length} entries)
              </h4>
              <span className="text-[11px] text-slate-400">Chronological Audit Log</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading stock history...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No stock adjustments recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Adjust stock levels above to create the initial audit trail.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {logs.map((log) => {
                  const typeMeta =
                    ADJUSTMENT_TYPE_LABELS[log.adjustmentType as AdjustmentType] ||
                    ADJUSTMENT_TYPE_LABELS.correction;
                  const isPositive = log.changeAmount > 0;
                  const logDate = new Date(log.createdAt);

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-medium ${typeMeta.color}`}
                          >
                            {typeMeta.icon} {typeMeta.label}
                          </Badge>
                          <span className="font-semibold text-slate-900">
                            {log.reason}
                          </span>
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-500 italic pl-1 border-l-2 border-slate-200">
                            &quot;{log.notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            {log.userName || 'Admin'} ({log.userRole || 'Staff'})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {logDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {logDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Delta and resulting stock badge */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-black text-sm font-mono px-2 py-0.5 rounded-md ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPositive ? `+${log.changeAmount}` : log.changeAmount}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span className="text-slate-400">{log.previousStock}</span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className="font-bold text-slate-800">{log.newStock} units</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sm:justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Audit trail immutable and timestamped
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
