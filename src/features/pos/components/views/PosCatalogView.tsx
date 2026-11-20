"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  Barcode,
  ChevronDown,
  DollarSign,
  Download,
  Globe,
  Lock,
  Minus,
  Package,
  Plus,
  Search,
  Sliders,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosCatalogViewProps {
  pos: PosWorkspaceController;
}

export function PosCatalogView({ pos }: PosCatalogViewProps) {
  const {
    products,
    setProducts,
    selectedStore,
    storesList,
    userRole,
    canPerform,
    checkAction,
    exportCSV,
    setIsTransferOpen,
    setIsAddProductOpen,
    inventorySearchTerm,
    setInventorySearchTerm,
    selectedInventoryIds,
    setSelectedInventoryIds,
    setBulkStockMode,
    setBulkStockValue,
    setIsBulkStockModalOpen,
    setIsBulkDeleteModalOpen,
    setSelectedLabelProduct,
    setIsLabelModalOpen,
  } = pos;

  let tabTotalStockUnits = 0;
  let tabTotalCostValue = 0;
  let tabTotalRetailValue = 0;
  let tabLowStockCount = 0;
  let tabOutOfStockCount = 0;

  products.forEach((prod) => {
    const branchStock = prod.storeStocks[selectedStore] ?? prod.stock;
    tabTotalStockUnits += branchStock;
    tabTotalCostValue += branchStock * prod.unitCost;
    tabTotalRetailValue += branchStock * prod.price;

    if (branchStock <= 0) {
      tabOutOfStockCount += 1;
    } else if (branchStock <= prod.minStock) {
      tabLowStockCount += 1;
    }
  });

  const visibleProds = products.filter(
    (p) =>
      p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
      p.barcode.includes(inventorySearchTerm)
  );
  const allSelected =
    visibleProds.length > 0 && visibleProds.every((p) => selectedInventoryIds.has(p.id));
  const someSelected =
    visibleProds.some((p) => selectedInventoryIds.has(p.id)) && !allSelected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Product Catalog & Multi-Store Stock</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product attributes, barcodes, retail margins, and multi-location inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pos/inventory"
            className="inline-flex items-center h-9 px-3 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <span>Stock Audit Console</span>
            <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV("inventory")}
            className="h-9 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkAction("inventory:stock_transfer", () => setIsTransferOpen(true));
            }}
            className={`h-9 text-xs flex items-center ${
              !canPerform("inventory:stock_transfer") ? "opacity-75" : ""
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            Transfer Stock
            {!canPerform("inventory:stock_transfer") && (
              <Lock className="h-3 w-3 text-amber-500 ml-1" />
            )}
          </Button>
          <Button
            onClick={() => {
              checkAction("inventory:create", () => setIsAddProductOpen(true));
            }}
            className={`h-9 text-xs bg-slate-900 text-white flex items-center ${
              !canPerform("inventory:create") ? "opacity-80" : ""
            }`}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Product
            {!canPerform("inventory:create") && (
              <Lock className="h-3 w-3 text-amber-400 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Inventory Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Items
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {tabTotalStockUnits.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">units</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across <strong className="text-slate-700 font-semibold">{products.length}</strong> unique SKUs
            </p>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  tabLowStockCount + tabOutOfStockCount > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {tabLowStockCount + tabOutOfStockCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">items</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-amber-700 font-medium">{tabLowStockCount} low stock</span>
              {" · "}
              <span className="text-rose-600 font-medium">{tabOutOfStockCount} out of stock</span>
            </p>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              tabLowStockCount + tabOutOfStockCount > 0
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-600"
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Inventory Value
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              {userRole === "cashier" ? (
                <span className="text-2xl font-bold font-mono text-slate-400">••••••</span>
              ) : (
                <span className="text-2xl font-bold font-mono text-slate-900">
                  $
                  {tabTotalCostValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">at cost</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Retail Value:{" "}
              <strong className="text-slate-800 font-semibold font-mono">
                $
                {tabTotalRetailValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Active Bulk Action Bar */}
      {selectedInventoryIds.size > 0 && (
        <div className="bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-700/80 font-mono text-xs font-bold text-indigo-100">
              {selectedInventoryIds.size}
            </div>
            <div>
              <span className="text-sm font-semibold text-white">
                {selectedInventoryIds.size} {selectedInventoryIds.size === 1 ? "item" : "items"} selected
              </span>
              <span className="text-xs text-indigo-200 ml-2 hidden sm:inline">
                for batch inventory operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden lg:flex items-center gap-1 bg-indigo-950/60 p-1 rounded-lg border border-indigo-700/50">
              <button
                onClick={() => {
                  setProducts((prev) =>
                    prev.map((p) => {
                      if (selectedInventoryIds.has(p.id)) {
                        const curr = p.storeStocks[selectedStore] ?? p.stock;
                        const updatedBranchStock = curr + 10;
                        const updatedGlobalStock = p.stock + 10;
                        return {
                          ...p,
                          stock: updatedGlobalStock,
                          storeStocks: { ...p.storeStocks, [selectedStore]: updatedBranchStock },
                          status:
                            updatedGlobalStock <= 0
                              ? "Out of Stock"
                              : updatedGlobalStock <= p.minStock
                              ? "Low Stock"
                              : "In Stock",
                        };
                      }
                      return p;
                    })
                  );
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                title="Add 10 units to current store stock"
              >
                +10 Stock
              </button>
              <button
                onClick={() => {
                  setProducts((prev) =>
                    prev.map((p) => {
                      if (selectedInventoryIds.has(p.id)) {
                        const curr = p.storeStocks[selectedStore] ?? p.stock;
                        const updatedBranchStock = Math.max(0, curr - 5);
                        const updatedGlobalStock = Math.max(0, p.stock - 5);
                        return {
                          ...p,
                          stock: updatedGlobalStock,
                          storeStocks: { ...p.storeStocks, [selectedStore]: updatedBranchStock },
                          status:
                            updatedGlobalStock <= 0
                              ? "Out of Stock"
                              : updatedGlobalStock <= p.minStock
                              ? "Low Stock"
                              : "In Stock",
                        };
                      }
                      return p;
                    })
                  );
                }}
                className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                title="Deduct 5 units from current store stock"
              >
                -5 Stock
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-indigo-950 hover:bg-indigo-50 font-semibold h-8 text-xs gap-1.5 shadow-xs"
                >
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  Bulk Actions
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuLabel className="text-xs text-slate-500 font-medium">
                  Apply to {selectedInventoryIds.size} Selected Items
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setBulkStockMode("set");
                    setBulkStockValue(50);
                    setIsBulkStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Package className="h-4 w-4 mr-2 text-indigo-600" />
                  Set Fixed Stock Level...
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setBulkStockMode("add");
                    setBulkStockValue(10);
                    setIsBulkStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Plus className="h-4 w-4 mr-2 text-emerald-600" />
                  Add Stock (+X Units)...
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setBulkStockMode("subtract");
                    setBulkStockValue(5);
                    setIsBulkStockModalOpen(true);
                  }}
                  className="text-xs cursor-pointer py-2"
                >
                  <Minus className="h-4 w-4 mr-2 text-amber-600" />
                  Deduct Stock (-X Units)...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    checkAction("inventory:delete", () => {
                      setIsBulkDeleteModalOpen(true);
                    });
                  }}
                  className="text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer py-2"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-rose-600" />
                  Delete Selected Items...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                checkAction("inventory:delete", () => {
                  setIsBulkDeleteModalOpen(true);
                });
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-8 text-xs gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span> ({selectedInventoryIds.size})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInventoryIds(new Set())}
              className="text-indigo-200 hover:text-white hover:bg-indigo-800 h-8 text-xs px-2.5"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search SKU, product name, barcode..."
            value={inventorySearchTerm}
            onChange={(e) => setInventorySearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Viewing stock for:{" "}
          <strong>{storesList.find((s) => s.id === selectedStore)?.name}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-12 px-3 py-3">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => {
                      const newSet = new Set(selectedInventoryIds);
                      if (allSelected) {
                        visibleProds.forEach((p) => newSet.delete(p.id));
                      } else {
                        visibleProds.forEach((p) => newSet.add(p.id));
                      }
                      setSelectedInventoryIds(newSet);
                    }}
                    aria-label="Select all products"
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs font-semibold">SKU & Barcode</TableHead>
              <TableHead className="text-xs font-semibold">Product Name</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold text-right">Cost</TableHead>
              <TableHead className="text-xs font-semibold text-right">Selling Price</TableHead>
              <TableHead className="text-xs font-semibold text-center">Current Store Stock</TableHead>
              <TableHead className="text-xs font-semibold text-center">Global Chain Stock</TableHead>
              <TableHead className="text-xs font-semibold text-center">E-Commerce Sync</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProds.map((prod) => {
              const branchStock = prod.storeStocks[selectedStore] ?? prod.stock;
              const isSelected = selectedInventoryIds.has(prod.id);
              return (
                <TableRow
                  key={prod.id}
                  className={
                    isSelected ? "bg-indigo-50/70 hover:bg-indigo-50/90" : "hover:bg-slate-50/70"
                  }
                >
                  <TableCell className="w-12 px-3 py-3">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => {
                          const newSet = new Set(selectedInventoryIds);
                          if (newSet.has(prod.id)) {
                            newSet.delete(prod.id);
                          } else {
                            newSet.add(prod.id);
                          }
                          setSelectedInventoryIds(newSet);
                        }}
                        aria-label={`Select ${prod.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-slate-800">{prod.sku}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center">
                      <Barcode className="h-3 w-3 mr-1 inline" />
                      {prod.barcode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-slate-900">{prod.name}</div>
                    {prod.externalId && (
                      <div className="text-[10px] text-indigo-600 font-mono">
                        Bridge: {prod.externalId}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{prod.category}</TableCell>
                  <TableCell className="text-xs text-right font-mono text-slate-500">
                    {userRole === "cashier" ? (
                      <span
                        className="text-slate-400 flex items-center justify-end"
                        title="Wholesale cost hidden from Cashier role"
                      >
                        <Lock className="h-3 w-3 mr-1 text-slate-300" />
                        ••••
                      </span>
                    ) : (
                      `$${prod.unitCost.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-semibold text-slate-900">
                    ${prod.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs text-center font-bold">{branchStock} units</TableCell>
                  <TableCell className="text-xs text-center text-slate-500">{prod.stock} units</TableCell>
                  <TableCell className="text-center">
                    {prod.syncedToEcommerce ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Local Only
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        branchStock === 0
                          ? "bg-red-100 text-red-800"
                          : branchStock <= prod.minStock
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {branchStock === 0
                        ? "Out of Stock"
                        : branchStock <= prod.minStock
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        checkAction("inventory:barcodes", () => {
                          setSelectedLabelProduct(prod);
                          setIsLabelModalOpen(true);
                        });
                      }}
                      className="h-7 text-[11px] text-slate-600 hover:text-slate-900"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Label
                      {!canPerform("inventory:barcodes") && (
                        <Lock className="h-2.5 w-2.5 text-amber-500 ml-0.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
