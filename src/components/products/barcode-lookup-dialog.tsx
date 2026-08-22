'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/lib/db/products';
import { batchAdjustStock } from '@/lib/actions/products';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Edit2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface BarcodeLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  categories?: Category[];
  onEditProduct?: (product: Product) => void;
  onSelectProductInTable?: (product: Product) => void;
}

export function BarcodeLookupDialog({
  open,
  onOpenChange,
  products,
  categories = [],
  onEditProduct,
  onSelectProductInTable,
}: BarcodeLookupDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentScans, setRecentScans] = useState<Product[]>([]);

  // Focus input automatically when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setFeedbackMessage(null);
    }
  }, [open]);

  // Web Audio API POS Beep Synthesizer
  const playBeep = (type: 'success' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Execute lookup function
  const handleLookup = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setHasSearched(true);
    // Find matching product by exact barcode, SKU, or ID
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.trim().toLowerCase() === cleanCode.toLowerCase()) ||
        p.sku.trim().toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setMatchedProduct(found);
      playBeep('success');
      setFeedbackMessage({ type: 'success', text: `Found "${found.name}" (SKU: ${found.sku})` });

      // Add to recent scans list without duplicates
      setRecentScans((prev) => {
        const filtered = prev.filter((p) => p.id !== found.id);
        return [found, ...filtered].slice(0, 4);
      });
    } else {
      setMatchedProduct(null);
      playBeep('error');
      setFeedbackMessage({ type: 'error', text: `No product found matching barcode "${cleanCode}".` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(barcodeInput);
    }
  };

  // Quick Stock Adjustment for matched item
  const handleAdjustMatchedStock = async (delta: number) => {
    if (!matchedProduct) return;
    setIsAdjustingStock(true);
    try {
      const res = await batchAdjustStock([matchedProduct.id], delta);
      if (res.success) {
        const newStock = Math.max(0, (matchedProduct.currentStock ?? 0) + delta);
        const updated = { ...matchedProduct, currentStock: newStock };
        setMatchedProduct(updated);
        playBeep('success');
        setFeedbackMessage({
          type: 'success',
          text: `Stock updated: ${delta > 0 ? `+${delta}` : delta} (New stock: ${newStock} units)`,
        });
        router.refresh();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Failed to update stock.' });
      }
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error adjusting stock.',
      });
    } finally {
      setIsAdjustingStock(false);
    }
  };

  // Resolve category name
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'General';
    const cat = categories.find((c) => c.id === categoryId || c.slug === categoryId);
    return cat ? cat.name : 'General';
  };

  // Sample products with barcodes for quick demo
  const sampleBarcodeProducts = products.filter((p) => p.barcode).slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/40 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Barcode className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  Barcode Scanner & Lookup
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  Scan with hardware scanner or enter barcode for instant lookup.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Mute scanner beep' : 'Enable scanner beep'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Barcode Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Scan Barcode or Enter SKU / EAN:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  ref={inputRef}
                  id="barcode-scanner-input"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan or type barcode (e.g. 8901234567890)..."
                  className="pl-10 pr-9 h-11 text-sm font-mono bg-slate-50 border-slate-300 focus:bg-white"
                  autoComplete="off"
                />
                {barcodeInput && (
                  <button
                    onClick={() => {
                      setBarcodeInput('');
                      setMatchedProduct(null);
                      setHasSearched(false);
                      setFeedbackMessage(null);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button
                type="button"
                onClick={() => handleLookup(barcodeInput)}
                className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Search className="h-4 w-4 mr-1.5" />
                Lookup
              </Button>
            </div>
          </div>

          {/* Quick preset chips to easily test existing barcodes */}
          {sampleBarcodeProducts.length > 0 && !matchedProduct && (
            <div className="pt-1">
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Quick test sample barcodes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleBarcodeProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setBarcodeInput(p.barcode || p.sku);
                      handleLookup(p.barcode || p.sku);
                    }}
                    className="text-xs font-mono bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-md px-2 py-1 transition-colors text-slate-700 truncate max-w-[200px]"
                    title={`Scan ${p.name}`}
                  >
                    {p.barcode} ({p.name})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {feedbackMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedbackMessage.text}</span>
            </div>
          )}

          {/* Matched Product Result Card */}
          {matchedProduct && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs mt-0.5">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-tight">
                      {matchedProduct.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-xs text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                        SKU: {matchedProduct.sku}
                      </span>
                      {matchedProduct.barcode && (
                        <span className="font-mono text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          {matchedProduct.barcode}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[11px] font-medium bg-white">
                        {getCategoryName(matchedProduct.categoryId)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-lg font-bold text-slate-900">
                    ${parseFloat(String(matchedProduct.sellingPrice)).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Cost: ${parseFloat(String(matchedProduct.unitCost ?? matchedProduct.unitPrice ?? '0')).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stock Status Bar */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Available Stock:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {matchedProduct.currentStock ?? 0}
                    </span>
                    <span className="text-xs text-slate-500">units</span>

                    {(matchedProduct.currentStock ?? 0) <= 0 ? (
                      <Badge variant="destructive" className="text-[10px] ml-1">
                        Out of Stock
                      </Badge>
                    ) : (matchedProduct.currentStock ?? 0) <= (matchedProduct.reorderLevel ?? 5) ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] ml-1">
                        Low Stock (Alert ≤ {matchedProduct.reorderLevel})
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] ml-1">
                        In Stock
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Stock Modifiers */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Quick Adjust:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isAdjustingStock || (matchedProduct.currentStock ?? 0) <= 0}
                    onClick={() => handleAdjustMatchedStock(-1)}
                    className="h-8 w-8 p-0 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                    title="Deduct 1 unit"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isAdjustingStock}
                    onClick={() => handleAdjustMatchedStock(1)}
                    className="h-8 w-8 p-0 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Add 1 unit"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isAdjustingStock}
                    onClick={() => handleAdjustMatchedStock(5)}
                    className="h-8 px-2 text-xs font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Add 5 units"
                  >
                    +5
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {onSelectProductInTable && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onSelectProductInTable(matchedProduct);
                      onOpenChange(false);
                    }}
                    className="text-xs h-8 gap-1 text-slate-700"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Filter in Table
                  </Button>
                )}

                {onEditProduct && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onEditProduct(matchedProduct);
                    }}
                    className="text-xs h-8 gap-1 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Not Found State */}
          {hasSearched && !matchedProduct && (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-200">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">Product not found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No catalog item matched the scanned code. Ensure the barcode exists or add it as a new product.
              </p>
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 1 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Recent Scans:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {recentScans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setMatchedProduct(p);
                      setBarcodeInput(p.barcode || p.sku);
                      setFeedbackMessage(null);
                    }}
                    className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">{p.sku}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 shrink-0">
                      {p.currentStock} in stock
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BarcodeLookupDialog;
