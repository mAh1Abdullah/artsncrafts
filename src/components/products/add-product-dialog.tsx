'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Package,
  Barcode,
  Sparkles,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { addProduct } from '@/lib/actions/products';
import { useRouter } from 'next/navigation';

const PRESET_CATEGORIES = [
  'Handicrafts',
  'Electronics',
  'Accessories',
  'Apparel',
  'Groceries',
  'Stationery',
  'Home & Living',
  'General',
];

interface AddProductDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddProductDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: AddProductDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(val);
    } else {
      setInternalOpen(val);
    }
  };

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Handicrafts');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [description, setDescription] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate SKU & Barcode helper
  const handleGenerateSkuAndBarcode = () => {
    const prefix = (category.substring(0, 3) || 'PRD').toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `${prefix}-${randomNum}`;
    setSku(generatedSku);

    // 13-digit synthetic EAN barcode
    const randomBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setBarcode(randomBarcode);

    if (errors.sku) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.sku;
        return next;
      });
    }
  };

  // Margin calculation
  const costNum = parseFloat(unitPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const profitMargin =
    sellNum > 0 && sellNum >= costNum
      ? Math.round(((sellNum - costNum) / sellNum) * 100)
      : null;

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!sku.trim()) errs.sku = 'SKU is required (click generate if needed)';
    if (!unitPrice || parseFloat(unitPrice) < 0) errs.unitPrice = 'Enter a valid cost price';
    if (!sellingPrice || parseFloat(sellingPrice) < 0) errs.sellingPrice = 'Enter a valid selling price';
    if (parseFloat(sellingPrice) < parseFloat(unitPrice)) {
      errs.sellingPrice = 'Selling price is below wholesale cost';
    }
    if (!currentStock || parseInt(currentStock, 10) < 0) errs.currentStock = 'Enter valid initial stock';
    if (!reorderLevel || parseInt(reorderLevel, 10) < 0) errs.reorderLevel = 'Enter valid reorder level';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setName('');
    setCategory('Handicrafts');
    setSku('');
    setBarcode('');
    setUnitPrice('');
    setSellingPrice('');
    setCurrentStock('10');
    setReorderLevel('5');
    setDescription('');
    setErrors({});
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Map category name to categoryId slug
      const catSlug = category.toLowerCase().replace(/\s+/g, '-');
      const catId = `cat-${catSlug}`;

      const res = await addProduct({
        name: name.trim(),
        categoryId: catId,
        description: description.trim() || undefined,
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        unitPrice: String(costNum),
        sellingPrice: String(sellNum),
        currentStock: parseInt(currentStock, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 0,
      });

      if (res && typeof res === 'object' && 'success' in res && res.success === false) {
        setErrors({ form: (res as { message?: string }).message || 'Failed to create product' });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`"${name}" added successfully!`);
      setTimeout(() => {
        setIsSubmitting(false);
        resetForm();
        setIsOpen(false);
        onSuccess?.();
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      console.error('Failed to create product:', err);
      setErrors({ form: err instanceof Error ? err.message : 'Failed to create product' });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            id="add-product-dialog-trigger"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 h-9 px-3.5 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        id="add-product-dialog-content"
        className="sm:max-w-xl p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl"
      >
        {/* Dialog Header with icon and background accent */}
        <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-100">
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                  Add New Product
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Register a new item with pricing, SKU barcode, and inventory threshold limits.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name" className="text-xs font-semibold text-slate-700">
                Product Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="prod-name"
                placeholder="e.g. Nakshi Kantha Blanket"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className="h-9 text-xs"
              />
              {errors.name && <p className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-category" className="text-xs font-semibold text-slate-700">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="prod-category" className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {PRESET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SKU & Barcode with auto-generation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-sku" className="text-xs font-semibold text-slate-700">
                  SKU Identifier <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateSkuAndBarcode}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Auto-generate
                </button>
              </div>
              <Input
                id="prod-sku"
                placeholder="e.g. NAK-1042"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value.toUpperCase());
                  if (errors.sku) setErrors((prev) => ({ ...prev, sku: '' }));
                }}
                className="h-9 text-xs font-mono"
              />
              {errors.sku && <p className="text-[11px] text-rose-600 font-medium">{errors.sku}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-barcode" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Barcode className="h-3.5 w-3.5 text-slate-400" />
                Barcode / EAN
              </Label>
              <Input
                id="prod-barcode"
                placeholder="e.g. 8901234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Pricing: Cost & Retail with live Gross Margin */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Pricing & Margins
              </span>
              {profitMargin !== null && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold border ${
                    profitMargin >= 30
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : profitMargin > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {profitMargin}% Gross Margin
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prod-cost" className="text-xs text-slate-600 font-medium">
                  Wholesale Cost ($) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="prod-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => {
                    setUnitPrice(e.target.value);
                    if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: '' }));
                  }}
                  className="h-9 text-xs font-mono bg-white"
                />
                {errors.unitPrice && <p className="text-[11px] text-rose-600">{errors.unitPrice}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="prod-selling" className="text-xs text-slate-600 font-medium">
                  Retail Selling Price ($) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="prod-selling"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => {
                    setSellingPrice(e.target.value);
                    if (errors.sellingPrice) setErrors((prev) => ({ ...prev, sellingPrice: '' }));
                  }}
                  className="h-9 text-xs font-mono bg-white"
                />
                {errors.sellingPrice && <p className="text-[11px] text-rose-600">{errors.sellingPrice}</p>}
              </div>
            </div>
          </div>

          {/* Stock Levels & Reorder Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-stock" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Initial Stock Units <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="prod-stock"
                type="number"
                min="0"
                placeholder="10"
                value={currentStock}
                onChange={(e) => {
                  setCurrentStock(e.target.value);
                  if (errors.currentStock) setErrors((prev) => ({ ...prev, currentStock: '' }));
                }}
                className="h-9 text-xs font-mono"
              />
              {errors.currentStock && <p className="text-[11px] text-rose-600">{errors.currentStock}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-reorder" className="text-xs font-semibold text-slate-700">
                Low Stock Reorder Alert Level <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="prod-reorder"
                type="number"
                min="0"
                placeholder="5"
                value={reorderLevel}
                onChange={(e) => {
                  setReorderLevel(e.target.value);
                  if (errors.reorderLevel) setErrors((prev) => ({ ...prev, reorderLevel: '' }));
                }}
                className="h-9 text-xs font-mono"
              />
              {errors.reorderLevel && <p className="text-[11px] text-rose-600">{errors.reorderLevel}</p>}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-desc" className="text-xs font-semibold text-slate-700">
              Description & Notes (Optional)
            </Label>
            <Textarea
              id="prod-desc"
              rows={2}
              placeholder="Material, supplier info, dimensions or variants..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Footer with Action Buttons */}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={isSubmitting}
              className="h-9 text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4"
            >
              {isSubmitting ? (
                <>Saving Product...</>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Save to Inventory</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddProductDialog;
