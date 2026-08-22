'use client';

import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Product } from '@/lib/db/products';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  Barcode,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Grid,
} from 'lucide-react';

interface BarcodeLabelPrinterDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type LabelSheetFormat = 'avery_5160' | 'avery_5163' | 'thermal_50x30' | 'thermal_40x25' | 'shelf_talker';

interface LabelConfig {
  format: LabelSheetFormat;
  storeName: string;
  showStoreName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showSku: boolean;
  showBarcodeText: boolean;
  showBorder: boolean;
  currencySymbol: string;
  copiesMode: 'custom' | 'match_stock' | 'single';
  customCopies: number;
}

const SHEET_FORMATS: Record<LabelSheetFormat, { name: string; description: string; cols: number; rows: number; widthMm: number; heightMm: number; type: 'sheet' | 'thermal' }> = {
  avery_5160: {
    name: 'Avery 5160 Standard Sheet (30 labels/page)',
    description: '3 columns × 10 rows on standard Letter/A4 paper',
    cols: 3,
    rows: 10,
    widthMm: 66.7,
    heightMm: 25.4,
    type: 'sheet',
  },
  avery_5163: {
    name: 'Avery 5163 Shipping / Large (10 labels/page)',
    description: '2 columns × 5 rows on Letter/A4 paper',
    cols: 2,
    rows: 5,
    widthMm: 101.6,
    heightMm: 50.8,
    type: 'sheet',
  },
  thermal_50x30: {
    name: 'Thermal Label Roll (50mm × 30mm)',
    description: 'Standard retail roll for Zebra / Xprinter / Dymo',
    cols: 1,
    rows: 1,
    widthMm: 50,
    heightMm: 30,
    type: 'thermal',
  },
  thermal_40x25: {
    name: 'Compact Thermal Tag (40mm × 25mm)',
    description: 'Compact jewelry / accessory retail tag',
    cols: 1,
    rows: 1,
    widthMm: 40,
    heightMm: 25,
    type: 'thermal',
  },
  shelf_talker: {
    name: 'Shelf Talker / Price Tag (70mm × 45mm)',
    description: 'Supermarket & boutique shelf edge label with large price',
    cols: 2,
    rows: 4,
    widthMm: 70,
    heightMm: 45,
    type: 'sheet',
  },
};

export function BarcodeLabelPrinterDialog({
  products,
  open,
  onOpenChange,
}: BarcodeLabelPrinterDialogProps) {
  const [config, setConfig] = useState<LabelConfig>({
    format: 'avery_5160',
    storeName: 'Sylhet Artisans & Crafts',
    showStoreName: true,
    showProductName: true,
    showPrice: true,
    showSku: true,
    showBarcodeText: true,
    showBorder: true,
    currencySymbol: '৳',
    copiesMode: 'single',
    customCopies: 1,
  });

  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Compute the list of labels to render
  const labelItems = products.flatMap((product) => {
    let count = 1;
    if (config.copiesMode === 'match_stock') {
      count = Math.max(1, product.currentStock ?? 1);
    } else if (config.copiesMode === 'custom') {
      count = Math.max(1, config.customCopies);
    }
    return Array.from({ length: count }, (_, idx) => ({
      product,
      index: idx,
      uniqueKey: `${product.id}-${idx}`,
    }));
  });

  const handlePrint = () => {
    window.print();
  };

  const currentFormatMeta = SHEET_FORMATS[config.format];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[950px] max-h-[92vh] flex flex-col p-0 overflow-hidden print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:h-full">
        {/* Header (Hidden when printing) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Print Barcode Labels
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Generate high-resolution printable barcode labels for {products.length} product(s) ({labelItems.length} total labels).
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print Barcode Sheet
            </Button>
          </div>
        </div>

        {/* Workspace: 2-column layout (Settings on Left, Live Sheet Preview on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 print:block print:overflow-visible">
          {/* Settings Sidebar (Hidden on Print) */}
          <div className="md:col-span-4 p-4 border-r border-slate-200 bg-white overflow-y-auto space-y-4 text-xs print:hidden">
            {/* Label Template Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Label Sheet & Size Format</Label>
              <Select
                value={config.format}
                onValueChange={(val) => setConfig({ ...config, format: val as LabelSheetFormat })}
              >
                <SelectTrigger className="text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Select label format" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHEET_FORMATS).map(([key, meta]) => (
                    <SelectItem key={key} value={key} className="text-xs py-2">
                      <div className="font-semibold text-slate-800">{meta.name}</div>
                      <div className="text-[10px] text-slate-400">{meta.description}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Copies Per Product */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold text-slate-700">Print Quantity / Copies</Label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, copiesMode: 'single' })}
                  className={`py-1.5 px-2 rounded-md font-medium text-xs transition-all ${
                    config.copiesMode === 'single'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1 per Item
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, copiesMode: 'match_stock' })}
                  className={`py-1.5 px-2 rounded-md font-medium text-xs transition-all ${
                    config.copiesMode === 'match_stock'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Match Stock
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, copiesMode: 'custom' })}
                  className={`py-1.5 px-2 rounded-md font-medium text-xs transition-all ${
                    config.copiesMode === 'custom'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom
                </button>
              </div>

              {config.copiesMode === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-slate-500">Copies each:</span>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={config.customCopies}
                    onChange={(e) =>
                      setConfig({ ...config, customCopies: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    className="w-20 text-xs font-bold"
                  />
                </div>
              )}
            </div>

            {/* Label Elements Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold text-slate-700 block">Label Field Customization</Label>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showStoreName}
                    onCheckedChange={(checked) => setConfig({ ...config, showStoreName: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">Store / Brand Header</span>
                </label>

                {config.showStoreName && (
                  <Input
                    value={config.storeName}
                    onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                    placeholder="Store Name"
                    className="text-xs h-7 ml-6"
                  />
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showProductName}
                    onCheckedChange={(checked) => setConfig({ ...config, showProductName: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">Product Name</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showPrice}
                    onCheckedChange={(checked) => setConfig({ ...config, showPrice: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">Retail Price (৳)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showSku}
                    onCheckedChange={(checked) => setConfig({ ...config, showSku: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">SKU Code</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showBarcodeText}
                    onCheckedChange={(checked) => setConfig({ ...config, showBarcodeText: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">Human-Readable Barcode Value</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={config.showBorder}
                    onCheckedChange={(checked) => setConfig({ ...config, showBorder: Boolean(checked) })}
                  />
                  <span className="text-xs text-slate-700">Dotted Label Trim Border</span>
                </label>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1 text-slate-700">
              <div className="font-semibold text-blue-900 flex items-center justify-between">
                <span>Total Labels:</span>
                <span className="text-sm font-bold">{labelItems.length}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ready for thermal roll or standard office laser/inkjet label sheets.
              </p>
            </div>
          </div>

          {/* Right Area: Interactive Preview & Print Container */}
          <div className="md:col-span-8 bg-slate-100 p-4 overflow-y-auto flex flex-col items-center print:p-0 print:bg-white print:overflow-visible">
            {/* Zoom & Preview Controls (Hidden on Print) */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Grid className="w-4 h-4 text-slate-400" />
                <span>Live Sheet Preview ({currentFormatMeta.name})</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}
                  disabled={previewZoom <= 50}
                  className="h-7 px-2 text-xs"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-mono w-10 text-center font-bold text-slate-700">
                  {previewZoom}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewZoom(Math.min(150, previewZoom + 10))}
                  disabled={previewZoom >= 150}
                  className="h-7 px-2 text-xs"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Printable Paper / Sheet Container */}
            <div
              ref={printContainerRef}
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
              }}
              className="bg-white shadow-md rounded-sm p-4 print:shadow-none print:p-0 print:m-0 print:transform-none transition-transform duration-100 max-w-full"
            >
              {/* Render Labels in grid */}
              <div
                className={`grid gap-2.5 print:gap-1 ${
                  config.format === 'avery_5160'
                    ? 'grid-cols-3'
                    : config.format === 'avery_5163' || config.format === 'shelf_talker'
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {labelItems.map(({ product, uniqueKey }) => (
                  <SingleBarcodeLabel
                    key={uniqueKey}
                    product={product}
                    config={config}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Hidden on Print) */}
        <DialogFooter className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between sm:justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Compatible with standard Code128 / EAN scanner hardware
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Printer className="w-4 h-4" /> Print Labels
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Single Barcode Label Renderer with JsBarcode SVG
function SingleBarcodeLabel({ product, config }: { product: Product; config: LabelConfig }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [barcodeError, setBarcodeError] = useState(false);

  const barcodeValue = product.barcode?.trim() || product.sku?.trim() || product.id;

  useEffect(() => {
    if (svgRef.current && barcodeValue) {
      try {
        setBarcodeError(false);
        JsBarcode(svgRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.3,
          height: config.format === 'thermal_40x25' ? 22 : 30,
          displayValue: false, // We render our own text styling
          margin: 2,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('Barcode generation warning:', err);
        setBarcodeError(true);
      }
    }
  }, [barcodeValue, config.format]);

  const isShelf = config.format === 'shelf_talker';

  return (
    <div
      className={`relative bg-white text-black p-2 flex flex-col justify-between items-center text-center overflow-hidden transition-all ${
        config.showBorder ? 'border border-dashed border-slate-300 print:border-slate-400' : 'border-none'
      } ${
        config.format === 'avery_5160'
          ? 'w-[200px] h-[95px]'
          : config.format === 'avery_5163'
          ? 'w-[280px] h-[140px]'
          : config.format === 'thermal_50x30'
          ? 'w-[190px] h-[115px]'
          : config.format === 'thermal_40x25'
          ? 'w-[160px] h-[95px]'
          : 'w-[250px] h-[140px]'
      }`}
      style={{ pageBreakInside: 'avoid' }}
    >
      {/* Top Header: Brand or Store Name */}
      {config.showStoreName && (
        <div className="text-[9px] font-bold tracking-wider uppercase text-slate-800 line-clamp-1 w-full border-b border-slate-100 pb-0.5 mb-0.5">
          {config.storeName}
        </div>
      )}

      {/* Product Name */}
      {config.showProductName && (
        <div
          className={`font-bold text-slate-900 leading-tight w-full truncate ${
            isShelf ? 'text-xs' : 'text-[11px]'
          }`}
        >
          {product.name}
        </div>
      )}

      {/* SVG Barcode Graphic */}
      <div className="w-full flex flex-col items-center justify-center my-0.5">
        {barcodeError ? (
          <div className="text-[10px] text-rose-500 font-mono py-1">Barcode Format Error</div>
        ) : (
          <svg ref={svgRef} className="max-w-full max-h-[36px]" />
        )}
        {config.showBarcodeText && !barcodeError && (
          <div className="font-mono text-[9px] tracking-widest text-slate-800 font-semibold -mt-0.5">
            {barcodeValue}
          </div>
        )}
      </div>

      {/* Bottom Info Bar: SKU & Price */}
      <div className="w-full flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-100">
        {config.showSku && (
          <span className="font-mono font-bold text-slate-700 truncate max-w-[90px]">
            {product.sku}
          </span>
        )}

        {config.showPrice && (
          <span
            className={`font-black text-slate-950 ml-auto ${
              isShelf ? 'text-sm text-emerald-800' : 'text-[11px]'
            }`}
          >
            {config.currencySymbol}{Number(product.sellingPrice).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
