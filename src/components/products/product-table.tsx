'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category, DEFAULT_CATEGORIES } from '@/lib/db/products';
import {
  batchDeleteProducts,
  batchSetStock,
  batchAdjustStock,
  batchUpdateReorderLevel,
} from '@/lib/actions/products';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trash2,
  Package,
  ChevronDown,
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  Edit2,
  TrendingUp,
  Plus,
  Minus,
  Sliders,
  Barcode,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  FilterX,
  Download,
  XCircle,
  ScanLine,
  History,
  Printer,
} from 'lucide-react';
import { BarcodeLookupDialog } from '@/components/products/barcode-lookup-dialog';
import { ProductThumbnailCell } from '@/components/products/product-thumbnail-cell';
import { StockHistoryModal } from '@/components/products/stock-history-modal';
import { BarcodeLabelPrinterDialog } from '@/components/products/barcode-label-printer-dialog';

export type StockFilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type SortOptionType =
  | 'name_asc'
  | 'name_desc'
  | 'sku_asc'
  | 'sku_desc'
  | 'category_asc'
  | 'category_desc'
  | 'cost_asc'
  | 'cost_desc'
  | 'price_desc'
  | 'price_asc'
  | 'stock_desc'
  | 'stock_asc'
  | 'reorder_asc'
  | 'reorder_desc'
  | 'status_asc'
  | 'status_desc';

interface ProductTableProps {
  products: Product[];
  categories?: Category[];
  onEdit: (product: Product) => void;
  stockFilter?: StockFilterType;
  onStockFilterChange?: (filter: StockFilterType) => void;
}

// Category color styling map
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'cat-handicrafts': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'cat-electronics': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'cat-furniture': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'cat-lighting': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'cat-accessories': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'cat-apparel': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'cat-groceries': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'cat-stationery': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'default': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function ProductTable({
  products,
  categories = DEFAULT_CATEGORIES,
  onEdit,
  stockFilter: externalStockFilter,
  onStockFilterChange,
}: ProductTableProps) {
  const router = useRouter();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [internalStockFilter, setInternalStockFilter] = useState<StockFilterType>('all');
  const [sortBy, setSortBy] = useState<SortOptionType>('name_asc');

  // Handle internal or external stock filter
  const currentStockFilter = externalStockFilter !== undefined ? externalStockFilter : internalStockFilter;
  const setStockFilter = (filter: StockFilterType) => {
    if (onStockFilterChange) {
      onStockFilterChange(filter);
    }
    setInternalStockFilter(filter);
  };

  // Barcode Lookup Modal
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  // UI notifications and modal states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk action modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);

  // Modal input values
  const [stockMode, setStockMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [stockValueInput, setStockValueInput] = useState('25');
  const [reorderValueInput, setReorderValueInput] = useState('10');

  // Single delete modal state
  const [singleDeleteProduct, setSingleDeleteProduct] = useState<Product | null>(null);

  // Stock History Modal state
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);
  const [stockHistoryModalOpen, setStockHistoryModalOpen] = useState(false);

  // Barcode Label Printer Modal state
  const [barcodePrinterProducts, setBarcodePrinterProducts] = useState<Product[]>([]);
  const [barcodePrinterModalOpen, setBarcodePrinterModalOpen] = useState(false);

  const handleOpenStockHistory = (prod: Product) => {
    setStockHistoryProduct(prod);
    setStockHistoryModalOpen(true);
  };

  const handleOpenBarcodePrinterForSingle = (prod: Product) => {
    setBarcodePrinterProducts([prod]);
    setBarcodePrinterModalOpen(true);
  };

  const handleOpenBarcodePrinterForSelected = () => {
    const selectedProds = products.filter((p) => selectedIds.has(p.id));
    if (selectedProds.length > 0) {
      setBarcodePrinterProducts(selectedProds);
      setBarcodePrinterModalOpen(true);
    }
  };

  const handleOpenBarcodePrinterForAllFiltered = () => {
    if (filteredProducts.length > 0) {
      setBarcodePrinterProducts(filteredProducts);
      setBarcodePrinterModalOpen(true);
    }
  };

  // Keyboard shortcut (Alt+B) for barcode lookup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'b') || e.key === 'F2') {
        e.preventDefault();
        setBarcodeModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map categoryId to Category Object
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => {
      map.set(cat.id, cat);
      map.set(cat.slug, cat);
    });
    return map;
  }, [categories]);

  // Helper to resolve product category details
  const getProductCategory = useCallback((product: Product): { name: string; id: string; style: { bg: string; text: string; border: string } } => {
    if (!product.categoryId) {
      return {
        name: 'Uncategorized',
        id: 'none',
        style: CATEGORY_STYLES.default,
      };
    }

    const cat = categoryMap.get(product.categoryId);
    if (cat) {
      const style = CATEGORY_STYLES[cat.id] || CATEGORY_STYLES.default;
      return { name: cat.name, id: cat.id, style };
    }

    // Fallback if categoryId is stored as a name or slug
    const normalized = product.categoryId.toLowerCase().replace(/\s+/g, '-');
    const matched = categories.find(
      (c) => c.slug === normalized || c.name.toLowerCase() === product.categoryId?.toLowerCase()
    );

    if (matched) {
      const style = CATEGORY_STYLES[matched.id] || CATEGORY_STYLES.default;
      return { name: matched.name, id: matched.id, style };
    }

    return {
      name: product.categoryId.replace(/^cat-/, '').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      id: product.categoryId,
      style: CATEGORY_STYLES.default,
    };
  }, [categoryMap, categories]);

  // Product counts per category for the filter pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      const cat = getProductCategory(p);
      counts[cat.id] = (counts[cat.id] || 0) + 1;
    });
    return counts;
  }, [products, getProductCategory]);

  // Stock counts for stock filter pills
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = p.currentStock ?? 0;
      const reorder = p.reorderLevel ?? 5;
      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= reorder) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { inStock, lowStock, outOfStock };
  }, [products]);

  // Main Filtered & Sorted Products computation
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products
      .filter((p) => {
        // 1. Text Search across name, sku, barcode, description, category
        if (q) {
          const nameMatch = p.name.toLowerCase().includes(q);
          const skuMatch = p.sku.toLowerCase().includes(q);
          const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
          const descMatch = p.description ? p.description.toLowerCase().includes(q) : false;
          const cat = getProductCategory(p);
          const catMatch = cat.name.toLowerCase().includes(q);

          if (!nameMatch && !skuMatch && !barcodeMatch && !descMatch && !catMatch) {
            return false;
          }
        }

        // 2. Category Filter
        if (selectedCategory !== 'all') {
          const cat = getProductCategory(p);
          if (cat.id !== selectedCategory && cat.name.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // 3. Stock Status Filter
        const stock = p.currentStock ?? 0;
        const reorder = p.reorderLevel ?? 5;

        if (currentStockFilter === 'out_of_stock') {
          if (stock > 0) return false;
        } else if (currentStockFilter === 'low_stock') {
          if (stock <= 0 || stock > reorder) return false;
        } else if (currentStockFilter === 'in_stock') {
          if (stock <= reorder) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 4. Multi-column Sorting Logic
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name_desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'sku_asc') {
          return a.sku.localeCompare(b.sku);
        }
        if (sortBy === 'sku_desc') {
          return b.sku.localeCompare(a.sku);
        }
        if (sortBy === 'category_asc') {
          const catA = getProductCategory(a).name;
          const catB = getProductCategory(b).name;
          return catA.localeCompare(catB);
        }
        if (sortBy === 'category_desc') {
          const catA = getProductCategory(a).name;
          const catB = getProductCategory(b).name;
          return catB.localeCompare(catA);
        }
        if (sortBy === 'cost_asc') {
          const cA = parseFloat(String(a.unitCost ?? a.unitPrice ?? 0));
          const cB = parseFloat(String(b.unitCost ?? b.unitPrice ?? 0));
          return cA - cB;
        }
        if (sortBy === 'cost_desc') {
          const cA = parseFloat(String(a.unitCost ?? a.unitPrice ?? 0));
          const cB = parseFloat(String(b.unitCost ?? b.unitPrice ?? 0));
          return cB - cA;
        }
        if (sortBy === 'price_asc') {
          const pA = parseFloat(String(a.sellingPrice || 0));
          const pB = parseFloat(String(b.sellingPrice || 0));
          return pA - pB;
        }
        if (sortBy === 'price_desc') {
          const pA = parseFloat(String(a.sellingPrice || 0));
          const pB = parseFloat(String(b.sellingPrice || 0));
          return pB - pA;
        }
        if (sortBy === 'stock_asc') {
          return (a.currentStock ?? 0) - (b.currentStock ?? 0);
        }
        if (sortBy === 'stock_desc') {
          return (b.currentStock ?? 0) - (a.currentStock ?? 0);
        }
        if (sortBy === 'reorder_asc') {
          return (a.reorderLevel ?? 5) - (b.reorderLevel ?? 5);
        }
        if (sortBy === 'reorder_desc') {
          return (b.reorderLevel ?? 5) - (a.reorderLevel ?? 5);
        }
        if (sortBy === 'status_asc') {
          // Out of stock (0) -> Low stock (1) -> In stock (2)
          const getStatusRank = (p: Product) => {
            const st = p.currentStock ?? 0;
            const re = p.reorderLevel ?? 5;
            if (st <= 0) return 0;
            if (st <= re) return 1;
            return 2;
          };
          return getStatusRank(a) - getStatusRank(b);
        }
        if (sortBy === 'status_desc') {
          const getStatusRank = (p: Product) => {
            const st = p.currentStock ?? 0;
            const re = p.reorderLevel ?? 5;
            if (st <= 0) return 0;
            if (st <= re) return 1;
            return 2;
          };
          return getStatusRank(b) - getStatusRank(a);
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, currentStockFilter, sortBy, getProductCategory]);

  // Check if any filters are active
  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    currentStockFilter !== 'all' ||
    sortBy !== 'name_asc';

  // Reset all filters in 1 click
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStockFilter('all');
    setSortBy('name_asc');
  };

  // Table Column Header Click Sort Handler
  const handleColumnSort = (column: 'name' | 'sku' | 'category' | 'cost' | 'price' | 'stock' | 'reorder' | 'status') => {
    if (column === 'name') {
      setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc');
    } else if (column === 'category') {
      setSortBy(sortBy === 'category_asc' ? 'category_desc' : 'category_asc');
    } else if (column === 'cost') {
      setSortBy(sortBy === 'cost_desc' ? 'cost_asc' : 'cost_desc');
    } else if (column === 'price') {
      setSortBy(sortBy === 'price_desc' ? 'price_asc' : 'price_desc');
    } else if (column === 'stock') {
      setSortBy(sortBy === 'stock_desc' ? 'stock_asc' : 'stock_desc');
    } else if (column === 'reorder') {
      setSortBy(sortBy === 'reorder_desc' ? 'reorder_asc' : 'reorder_desc');
    } else if (column === 'status') {
      setSortBy(sortBy === 'status_asc' ? 'status_desc' : 'status_asc');
    }
  };

  // Helper to render sort direction indicator on headers
  const renderSortIndicator = (
    ascKey: SortOptionType,
    descKey: SortOptionType
  ) => {
    if (sortBy === ascKey) {
      return <ArrowUp className="h-3.5 w-3.5 text-indigo-600 shrink-0 inline ml-1" />;
    }
    if (sortBy === descKey) {
      return <ArrowDown className="h-3.5 w-3.5 text-indigo-600 shrink-0 inline ml-1" />;
    }
    return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover/th:text-slate-500 shrink-0 inline ml-1 transition-colors" />;
  };

  // CSV Export Feature
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      showError('No products to export with current filter criteria.');
      return;
    }

    const headers = [
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Unit Cost ($)',
      'Selling Price ($)',
      'Profit Margin ($)',
      'Margin (%)',
      'Current Stock',
      'Reorder Level',
      'Stock Status',
      'Total Inventory Cost Value ($)',
      'Total Retail Value ($)',
    ];

    const escapeCSV = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredProducts.map((p) => {
      const cost = parseFloat(String(p.unitCost ?? p.unitPrice ?? '0')) || 0;
      const price = parseFloat(String(p.sellingPrice ?? '0')) || 0;
      const stock = Number(p.currentStock ?? 0);
      const reorder = Number(p.reorderLevel ?? 5);
      const marginDollar = price - cost;
      const marginPct = price > 0 ? ((marginDollar / price) * 100).toFixed(1) : '0.0';
      const catName = getProductCategory(p).name;
      const status = stock <= 0 ? 'Out of Stock' : stock <= reorder ? 'Low Stock' : 'In Stock';
      const totalCost = (stock * cost).toFixed(2);
      const totalRetail = (stock * price).toFixed(2);

      return [
        escapeCSV(p.name),
        escapeCSV(p.sku),
        escapeCSV(p.barcode || 'N/A'),
        escapeCSV(catName),
        cost.toFixed(2),
        price.toFixed(2),
        marginDollar.toFixed(2),
        `${marginPct}%`,
        stock,
        reorder,
        escapeCSV(status),
        totalCost,
        totalRetail,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-export-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(`Exported ${filteredProducts.length} product(s) to CSV successfully.`);
  };

  // Selection computations
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.id));

  const someVisibleSelected =
    filteredProducts.some((p) => selectedIds.has(p.id)) && !allVisibleSelected;

  const selectedCount = selectedIds.size;

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const newSelected = new Set(selectedIds);
      filteredProducts.forEach((p) => newSelected.delete(p.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      filteredProducts.forEach((p) => newSelected.add(p.id));
      setSelectedIds(newSelected);
    }
  };

  const handleToggleProduct = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Notification helpers
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  // Execute Batch Delete
  const handleConfirmBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await batchDeleteProducts(idsArray);
      if (res.success) {
        showSuccess(`Successfully deleted ${res.count || idsArray.length} product(s).`);
        setSelectedIds(new Set());
        setDeleteModalOpen(false);
        router.refresh();
      } else {
        showError(res.message || 'Failed to delete products.');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error deleting products.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteProduct) return;
    setIsProcessing(true);
    try {
      const res = await batchDeleteProducts([singleDeleteProduct.id]);
      if (res.success) {
        showSuccess(`Deleted "${singleDeleteProduct.name}".`);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(singleDeleteProduct.id);
          return next;
        });
        setSingleDeleteProduct(null);
        router.refresh();
      } else {
        showError(res.message || 'Failed to delete product.');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error deleting product.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Batch Stock Update
  const handleConfirmBatchStock = async () => {
    const num = parseInt(stockValueInput, 10);
    if (isNaN(num) || num < 0) {
      showError('Please enter a valid stock number (0 or greater).');
      return;
    }

    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      let res;

      if (stockMode === 'set') {
        res = await batchSetStock(idsArray, num);
      } else if (stockMode === 'add') {
        res = await batchAdjustStock(idsArray, num);
      } else {
        res = await batchAdjustStock(idsArray, -num);
      }

      if (res.success) {
        showSuccess(
          stockMode === 'set'
            ? `Set stock to ${num} units for ${idsArray.length} item(s).`
            : stockMode === 'add'
            ? `Added +${num} stock units to ${idsArray.length} item(s).`
            : `Subtracted -${num} stock units from ${idsArray.length} item(s).`
        );
        setSelectedIds(new Set());
        setStockModalOpen(false);
        router.refresh();
      } else {
        showError(res.message || 'Failed to update stock.');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error updating stock.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick stock adjustment helper from active selection bar
  const handleQuickAdjust = async (delta: number) => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await batchAdjustStock(idsArray, delta);
      if (res.success) {
        showSuccess(`Applied ${delta > 0 ? `+${delta}` : delta} stock to ${idsArray.length} item(s).`);
        router.refresh();
      } else {
        showError(res.message || 'Failed to adjust stock.');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error adjusting stock.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Batch Reorder Level Update
  const handleConfirmBatchReorder = async () => {
    const num = parseInt(reorderValueInput, 10);
    if (isNaN(num) || num < 0) {
      showError('Please enter a valid reorder threshold (0 or greater).');
      return;
    }

    setIsProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await batchUpdateReorderLevel(idsArray, num);
      if (res.success) {
        showSuccess(`Updated reorder alert threshold to ${num} for ${idsArray.length} item(s).`);
        setSelectedIds(new Set());
        setReorderModalOpen(false);
        router.refresh();
      } else {
        showError(res.message || 'Failed to update reorder levels.');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error updating reorder levels.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOW STOCK & OUT OF STOCK PROMINENT ALERT CALLOUT */}
      {/* ========================================================================= */}
      {(stockCounts.lowStock > 0 || stockCounts.outOfStock > 0) && currentStockFilter === 'all' && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Restock Alert Triggered
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                <strong className="font-semibold text-amber-950">{stockCounts.lowStock}</strong> item(s) are below reorder threshold
                {stockCounts.outOfStock > 0 && (
                  <> and <strong className="font-semibold text-rose-700">{stockCounts.outOfStock}</strong> item(s) are completely out of stock</>
                )}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              type="button"
              size="sm"
              onClick={() => setStockFilter('low_stock')}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              View Low Stock Items ({stockCounts.lowStock})
            </Button>
            {stockCounts.outOfStock > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setStockFilter('out_of_stock')}
                className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-100/70 font-semibold gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                View Out of Stock ({stockCounts.outOfStock})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEARCH & FILTER CONTROLS TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="inventory-search-input"
              placeholder="Search by product name, category, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-10 text-sm bg-slate-50/70 border-slate-200 focus:bg-white transition-colors rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Tools & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Barcode Scanner Tool Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setBarcodeModalOpen(true)}
              className="h-10 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border-slate-200 gap-1.5 shadow-2xs"
              title="Open Barcode Scanner Lookup (Alt+B)"
            >
              <ScanLine className="h-4 w-4 text-indigo-600" />
              <span>Scan Barcode</span>
            </Button>

            {/* Print Barcode Labels Tool Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenBarcodePrinterForAllFiltered}
              className="h-10 text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-slate-200 gap-1.5 shadow-2xs"
              title="Generate and print printable barcode labels for products"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              <span>Print Labels</span>
            </Button>

            {/* Export CSV Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="h-10 text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-slate-200 gap-1.5 shadow-2xs"
              title="Download filtered products as CSV file"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Export CSV</span>
            </Button>

            {/* Category Dropdown */}
            <div className="w-[170px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter-select" className="h-10 text-xs bg-slate-50/70 border-slate-200 font-medium">
                  <Tag className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent align="end" className="w-56">
                  <SelectItem value="all">
                    All Categories ({products.length})
                  </SelectItem>
                  {categories.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-[175px]">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOptionType)}>
                <SelectTrigger id="sort-by-select" className="h-10 text-xs bg-slate-50/70 border-slate-200 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="name_asc">Name (A → Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z → A)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="stock_desc">Stock (High to Low)</SelectItem>
                  <SelectItem value="stock_asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="sku_asc">SKU (A → Z)</SelectItem>
                  <SelectItem value="cost_desc">Cost (High to Low)</SelectItem>
                  <SelectItem value="cost_asc">Cost (Low to High)</SelectItem>
                  <SelectItem value="status_asc">Status (Out → Low → In)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock Filter Pills with Low Stock Toggle */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentStockFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('in_stock')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentStockFilter === 'in_stock'
                    ? 'bg-white text-emerald-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In ({stockCounts.inStock})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('low_stock')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  currentStockFilter === 'low_stock'
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Low ({stockCounts.lowStock})</span>
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('out_of_stock')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentStockFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                Out ({stockCounts.outOfStock})
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap border transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            All Categories ({products.length})
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips & Clear Action */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-medium">Active filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  Category: {categoryMap.get(selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-purple-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {currentStockFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  Stock: {currentStockFilter.replace('_', ' ')}
                  <button onClick={() => setStockFilter('all')} className="hover:text-amber-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {sortBy !== 'name_asc' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  Sort: {sortBy.replace('_', ' ')}
                  <button onClick={() => setSortBy('name_asc')} className="hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Found <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
              >
                <FilterX className="h-3 w-3 mr-1" />
                Reset All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BULK ACTIONS TOP BAR WHEN ITEMS ARE SELECTED */}
      {/* ========================================================================= */}
      {selectedCount > 0 && (
        <div className="bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-700/80 font-mono text-xs font-bold text-indigo-100">
              {selectedCount}
            </div>
            <div>
              <span className="text-sm font-semibold text-white">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
              <span className="text-xs text-indigo-200 ml-2 hidden sm:inline">
                from current inventory
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick stock adjustments */}
            <div className="hidden lg:flex items-center gap-1 bg-indigo-950/60 p-1 rounded-lg border border-indigo-700/50">
              <button
                disabled={isProcessing}
                onClick={() => handleQuickAdjust(5)}
                className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                title="Add 5 units to all selected items"
              >
                +5 Stock
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleQuickAdjust(10)}
                className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                title="Add 10 units to all selected items"
              >
                +10 Stock
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleQuickAdjust(-5)}
                className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                title="Subtract 5 units from all selected items"
              >
                -5 Stock
              </button>
            </div>

            {/* Bulk Action Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  className="bg-white text-indigo-950 hover:bg-indigo-50 font-semibold h-8 text-xs gap-1.5 shadow-xs"
                >
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Batch Edit Stock</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => {
                    setStockMode('set');
                    setStockValueInput('25');
                    setStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Package className="h-4 w-4 mr-2 text-indigo-600" />
                  Set Exact Stock Units...
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setStockMode('add');
                    setStockValueInput('10');
                    setStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Plus className="h-4 w-4 mr-2 text-emerald-600" />
                  Increase Stock (+X Units)...
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setStockMode('subtract');
                    setStockValueInput('5');
                    setStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Minus className="h-4 w-4 mr-2 text-amber-600" />
                  Decrease Stock (-X Units)...
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setReorderValueInput('10');
                    setReorderModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Sliders className="h-4 w-4 mr-2 text-blue-600" />
                  Set Low-Stock Alert Level...
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer py-2"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-rose-600" />
                  Delete Selected Products...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Print Labels for Selected Items */}
            <Button
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={handleOpenBarcodePrinterForSelected}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-medium h-8 text-xs gap-1.5 shadow-xs border border-indigo-500/50"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Labels</span> ({selectedCount})
            </Button>

            {/* Direct Delete Selected Button */}
            <Button
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={() => setDeleteModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-8 text-xs gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span> ({selectedCount})
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-indigo-200 hover:text-white hover:bg-indigo-800 h-8 text-xs px-2.5"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN PRODUCTS TABLE WITH INTERACTIVE HEADER COLUMN SORTING */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/90 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                {/* Header Checkbox */}
                <TableHead className="w-12 px-4 py-3.5">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all visible products"
                    />
                  </div>
                </TableHead>

                {/* Column 1: Product & SKU Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('name')}
                  className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by product name"
                >
                  <div className="flex items-center gap-1">
                    <span>Product & SKU</span>
                    {renderSortIndicator('name_asc', 'name_desc')}
                  </div>
                </TableHead>

                {/* Column 2: Category Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('category')}
                  className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by category"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    {renderSortIndicator('category_asc', 'category_desc')}
                  </div>
                </TableHead>

                {/* Column 3: Unit Cost Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('cost')}
                  className="text-right text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by unit cost"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unit Cost</span>
                    {renderSortIndicator('cost_asc', 'cost_desc')}
                  </div>
                </TableHead>

                {/* Column 4: Selling Price Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('price')}
                  className="text-right text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by selling price"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Selling Price</span>
                    {renderSortIndicator('price_asc', 'price_desc')}
                  </div>
                </TableHead>

                {/* Column 5: Stock Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('stock')}
                  className="text-center text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by stock quantity"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock</span>
                    {renderSortIndicator('stock_asc', 'stock_desc')}
                  </div>
                </TableHead>

                {/* Column 6: Reorder Level Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('reorder')}
                  className="text-center text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by reorder threshold"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Reorder Level</span>
                    {renderSortIndicator('reorder_asc', 'reorder_desc')}
                  </div>
                </TableHead>

                {/* Column 7: Status Sortable */}
                <TableHead
                  onClick={() => handleColumnSort('status')}
                  className="text-center text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 cursor-pointer select-none hover:text-indigo-600 transition-colors group/th"
                  title="Click to sort by stock status"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {renderSortIndicator('status_asc', 'status_desc')}
                  </div>
                </TableHead>

                {/* Actions Header */}
                <TableHead className="text-right text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="p-3.5 bg-slate-100 text-slate-400 rounded-full mb-3">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-800 text-base">No matching products found</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isFiltered
                          ? 'Try adjusting your search keywords, clearing category filters, or resetting stock filters.'
                          : 'Your inventory catalog is currently empty. Click "Add Product" to create your first item.'}
                      </p>
                      {isFiltered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-4 text-xs font-medium border-slate-300 gap-1.5"
                        >
                          <FilterX className="h-3.5 w-3.5 text-slate-500" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  const stock = product.currentStock ?? 0;
                  const reorderLevel = product.reorderLevel ?? 5;
                  const cost = parseFloat(String(product.unitCost ?? product.unitPrice ?? '0')) || 0;
                  const price = parseFloat(String(product.sellingPrice ?? '0')) || 0;
                  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

                  const isOutOfStock = stock <= 0;
                  const isLowStock = !isOutOfStock && stock <= reorderLevel;
                  const catInfo = getProductCategory(product);

                  return (
                    <TableRow
                      key={product.id}
                      className={`group transition-colors border-b border-slate-100 ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-50/90'
                          : isOutOfStock
                          ? 'bg-rose-50/20 hover:bg-rose-50/40'
                          : isLowStock
                          ? 'bg-amber-50/20 hover:bg-amber-50/40'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <TableCell className="w-12 px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleProduct(product.id)}
                            aria-label={`Select product ${product.name}`}
                          />
                        </div>
                      </TableCell>

                      {/* Product Thumbnail, Name, SKU & Barcode with hover preview */}
                      <TableCell className="py-3">
                        <ProductThumbnailCell product={product} categoryName={catInfo.name} />
                      </TableCell>

                      {/* Category Badge with quick-filter click */}
                      <TableCell className="py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(catInfo.id === 'none' ? 'all' : catInfo.id)}
                          className={`text-xs px-2.5 py-0.8 rounded-md font-medium border transition-colors inline-flex items-center gap-1 ${catInfo.style.bg} ${catInfo.style.text} ${catInfo.style.border} hover:opacity-80`}
                          title={`Filter by category "${catInfo.name}"`}
                        >
                          <Tag className="h-3 w-3 opacity-70" />
                          {catInfo.name}
                        </button>
                      </TableCell>

                      {/* Unit Cost */}
                      <TableCell className="text-right py-3 font-mono text-sm text-slate-600">
                        ৳{cost.toFixed(2)}
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell className="text-right py-3">
                        <div className="font-mono text-sm font-semibold text-slate-900">
                          ৳{price.toFixed(2)}
                        </div>
                        {marginPct > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                            {marginPct}% margin
                          </div>
                        )}
                      </TableCell>

                      {/* Current Stock with Low Stock Visual Highlight */}
                      <TableCell className="text-center py-3">
                        <span
                          className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md inline-block ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {stock}
                        </span>
                      </TableCell>

                      {/* Reorder Level */}
                      <TableCell className="text-center py-3 font-mono text-xs text-slate-500">
                        {reorderLevel}
                      </TableCell>

                      {/* Status Badge with Low Stock Alerts */}
                      <TableCell className="text-center py-3">
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold inline-flex items-center gap-1 shadow-2xs">
                            <XCircle className="h-3 w-3" />
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-0.5 font-semibold inline-flex items-center gap-1 shadow-2xs">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock (≤{reorderLevel})
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0.5 font-semibold inline-flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {/* Stock History Modal Trigger */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStockHistory(product)}
                            title="View Stock Change History & Audit Logs"
                            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                          >
                            <History className="h-3.5 w-3.5 mr-1" />
                            History
                          </Button>

                          {/* Print Single Barcode Label */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenBarcodePrinterForSingle(product)}
                            title="Print Barcode Label"
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                          >
                            <Barcode className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            Barcode
                          </Button>

                          {/* Edit Product */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(product)}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit product details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Product */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSingleDeleteProduct(product)}
                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> items
            </span>
            {selectedCount > 0 && (
              <span className="text-indigo-600 font-semibold">
                • {selectedCount} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              In Stock: {stockCounts.inStock}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Low Stock: {stockCounts.lowStock}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              Out of Stock: {stockCounts.outOfStock}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARCODE SCANNER LOOKUP MODAL */}
      {/* ========================================================================= */}
      <BarcodeLookupDialog
        open={barcodeModalOpen}
        onOpenChange={setBarcodeModalOpen}
        products={products}
        categories={categories}
        onEditProduct={onEdit}
        onSelectProductInTable={(p) => {
          setSearchQuery(p.sku);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 1: BATCH DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Delete {selectedCount} Selected Products?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  This action will remove the selected items from the catalog permanently.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3">
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
              {Array.from(selectedIds).map((id) => {
                const prod = products.find((p) => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} className="text-xs flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-100">
                    <span className="font-medium text-slate-800 truncate max-w-[240px]">{prod.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{prod.sku}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Warning: Deleted products cannot be restored.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmBatchDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isProcessing ? 'Deleting...' : `Confirm Delete (${selectedCount})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH STOCK UPDATE DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Update Stock for {selectedCount} Items
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Batch modify current available inventory units.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStockMode('set')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    stockMode === 'set'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Set Fixed Units
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode('add')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    stockMode === 'add'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode('subtract')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    stockMode === 'subtract'
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {stockMode === 'set'
                  ? 'New Stock Value (Units)'
                  : stockMode === 'add'
                  ? 'Units to Add to Each Item'
                  : 'Units to Deduct from Each Item'}
              </label>
              <Input
                type="number"
                min="0"
                value={stockValueInput}
                onChange={(e) => setStockValueInput(e.target.value)}
                className="font-mono text-sm h-10"
                placeholder="Enter unit count..."
              />
            </div>

            {/* Quick preset pills */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Quick Presets:</span>
              <div className="flex items-center gap-1.5">
                {[10, 25, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStockValueInput(String(preset))}
                    className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmBatchStock}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {isProcessing ? 'Updating...' : `Apply to ${selectedCount} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: BATCH REORDER LEVEL UPDATE DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={reorderModalOpen} onOpenChange={setReorderModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Set Reorder Alert Level
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Update the minimum low-stock threshold for {selectedCount} items.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                New Reorder Threshold (Units)
              </label>
              <Input
                type="number"
                min="0"
                value={reorderValueInput}
                onChange={(e) => setReorderValueInput(e.target.value)}
                className="font-mono text-sm h-10"
                placeholder="e.g. 10"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Items falling at or below this count will be flagged with a &quot;Low Stock&quot; alert.
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Common Thresholds:</span>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 20, 30].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReorderValueInput(String(preset))}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                  >
                    {preset} units
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setReorderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmBatchReorder}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isProcessing ? 'Updating...' : `Set Level for ${selectedCount} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: SINGLE PRODUCT DELETE DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={!!singleDeleteProduct}
        onOpenChange={(open) => !open && setSingleDeleteProduct(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete Product?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove &quot;{singleDeleteProduct?.name}&quot;?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-600">
            <p>SKU: <strong className="font-mono text-slate-800">{singleDeleteProduct?.sku}</strong></p>
            <p className="mt-1">Current Stock: <strong className="font-mono text-slate-800">{singleDeleteProduct?.currentStock} units</strong></p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => setSingleDeleteProduct(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={handleConfirmSingleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: STOCK AUDIT HISTORY & QUICK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      <StockHistoryModal
        open={stockHistoryModalOpen}
        onOpenChange={setStockHistoryModalOpen}
        product={stockHistoryProduct}
        onStockUpdated={() => {
          // Trigger refresh if needed
          router.refresh();
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: BARCODE LABEL GENERATOR & PRINTER DIALOG */}
      {/* ========================================================================= */}
      <BarcodeLabelPrinterDialog
        open={barcodePrinterModalOpen}
        onOpenChange={setBarcodePrinterModalOpen}
        products={barcodePrinterProducts}
      />
    </div>
  );
}
