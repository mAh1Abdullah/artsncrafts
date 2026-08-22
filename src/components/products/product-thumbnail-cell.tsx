'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/db/products';
import { Badge } from '@/components/ui/badge';
import { Package, Eye } from 'lucide-react';

interface ProductThumbnailCellProps {
  product: Product;
  categoryName?: string;
}

export function ProductThumbnailCell({ product, categoryName }: ProductThumbnailCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const stock = product.currentStock ?? 0;
  const reorder = product.reorderLevel ?? 5;
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= reorder;

  // Placeholder fallback gradient based on product id
  const hasImage = Boolean(product.imageUrl) && !imageError;

  return (
    <div
      className="relative flex items-center gap-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail container */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs transition-transform duration-150 group-hover:scale-105">
        {hasImage ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            fill
            sizes="40px"
            className="object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
            <Package className="w-5 h-5 text-slate-400" />
          </div>
        )}
        {/* Visual indicator overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Eye className="w-3.5 h-3.5 text-white drop-shadow-sm" />
        </div>
      </div>

      {/* Product Name & SKU details */}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5 text-sm group-hover:text-blue-600 transition-colors">
          <span className="truncate">{product.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">
            {product.sku}
          </span>
          {product.barcode && (
            <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
              #{product.barcode}
            </span>
          )}
        </div>
      </div>

      {/* Hover Preview Popover */}
      {isHovered && (
        <div className="absolute left-0 bottom-full mb-2.5 z-50 w-72 p-3 bg-white rounded-xl shadow-xl border border-slate-200 animate-in fade-in-0 zoom-in-95 pointer-events-none transition-all">
          {/* Enlarged image preview */}
          <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-100 border border-slate-150 mb-2.5">
            {hasImage ? (
              <Image
                src={product.imageUrl!}
                alt={product.name}
                fill
                sizes="280px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-150 text-slate-400">
                <Package className="w-10 h-10 text-slate-300 mb-1" />
                <span className="text-xs text-slate-400">No Image Available</span>
              </div>
            )}

            {/* Floating Stock Badge on preview */}
            <div className="absolute top-2 right-2">
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-[11px] shadow-xs">
                  Out of Stock
                </Badge>
              ) : isLowStock ? (
                <Badge className="bg-amber-500 text-white text-[11px] border-none shadow-xs">
                  Low Stock ({stock})
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white text-[11px] border-none shadow-xs">
                  In Stock ({stock})
                </Badge>
              )}
            </div>
          </div>

          {/* Details header */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
              {product.name}
            </h4>
            {product.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing & Stock Specs */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Selling Price</span>
              <span className="font-bold text-emerald-600 text-sm">
                ৳{Number(product.sellingPrice).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Cost / Margin</span>
              <span className="font-medium text-slate-700">
                ৳{Number(product.unitCost || product.unitPrice || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">SKU / Barcode</span>
              <span className="font-mono text-[11px] text-slate-700 truncate block">
                {product.sku}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Category</span>
              <span className="text-slate-700 truncate block">
                {categoryName || 'Uncategorized'}
              </span>
            </div>
          </div>

          {/* Subtext tooltip arrow */}
          <div className="absolute top-full left-5 -mt-px w-2.5 h-2.5 bg-white border-b border-r border-slate-200 rotate-45" />
        </div>
      )}
    </div>
  );
}
