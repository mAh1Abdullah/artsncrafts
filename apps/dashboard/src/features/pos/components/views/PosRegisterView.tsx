"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Barcode,
  Clock,
  DollarSign,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { InventorySalesSummary } from "../shared/inventory-sales-summary";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosRegisterViewProps {
  pos: PosWorkspaceController;
}

export function PosRegisterView({ pos }: PosRegisterViewProps) {
  const {
    products,
    salesList,
    selectedStore,
    storesList,
    setActiveTab,
    activeCashier,
    shiftOpeningCash,
    expectedDrawerCash,
    setIsShiftAuditOpen,
    barcodeInput,
    setBarcodeInput,
    handleBarcodeSubmit,
    posSearchTerm,
    setPosSearchTerm,
    categories,
    selectedCategory,
    setSelectedCategory,
    posFilteredProducts,
    addToCart,
    cart,
    clearCart,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    discountPercent,
    setDiscountPercent,
    discountAmount,
    cartTax,
    cartTotal,
    setTenderedAmount,
    setIsCheckoutOpen,
  } = pos;

  return (
    <div className="space-y-4">
      <InventorySalesSummary
        products={products}
        salesList={salesList}
        selectedStore={selectedStore}
        storesList={storesList}
        onNavigateToInventory={() => setActiveTab("inventory")}
        onNavigateToSales={() => setActiveTab("sales")}
      />

      {/* Shift Bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">{activeCashier}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Shift Float: ${shiftOpeningCash.toFixed(2)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cash Drawer Est: ${expectedDrawerCash.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShiftAuditOpen(true)}
            className="h-7 text-xs border-slate-200 hover:bg-slate-100"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Cash Drawer Audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Product Selection Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="barcode-scanner-input"
                  placeholder="Scan barcode or enter SKU and press Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-9 bg-slate-50 text-sm font-mono"
                />
              </div>
              <Button type="submit" variant="secondary" className="px-4 text-xs font-semibold">
                <Zap className="h-4 w-4 mr-1.5 text-amber-500" />
                Scan
              </Button>
            </form>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Quick search products..."
                  value={posSearchTerm}
                  onChange={(e) => setPosSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-[280px]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap capitalize transition-colors ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white font-medium"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {posFilteredProducts.map((product) => {
              const currentStoreStock = product.storeStocks[selectedStore] ?? product.stock;
              const isOutOfStock = currentStoreStock <= 0;
              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-150 relative flex flex-col justify-between h-32 ${
                    isOutOfStock
                      ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                      : "bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs active:scale-[0.98]"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700"
                            : currentStoreStock <= product.minStock
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {currentStoreStock} in stock
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mt-1">
                      {product.name}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="text-[11px] text-slate-500">{product.category}</span>
                    <span className="text-sm font-bold text-slate-900">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* POS Cart Column */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 text-sm">Active Order</h3>
              <Badge variant="secondary" className="text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </Badge>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </button>
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <Input
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-7 text-xs bg-white"
            />
            <Input
              placeholder="Customer Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-7 text-xs bg-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <ShoppingCart className="h-12 w-12 stroke-1 mb-2 text-slate-300" />
                <p className="text-sm font-medium">Register Cart Empty</p>
                <p className="text-xs text-slate-400 mt-1">
                  Scan barcode or click catalog items to build ticket
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1 pr-3">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ${item.product.price.toFixed(2)} × {item.quantity} = $
                      {(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="h-6 w-6 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="h-6 w-6 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-medium">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <div className="flex items-center space-x-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        discountPercent === pct
                          ? "bg-slate-900 text-white"
                          : "bg-white border text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Est. Tax (5%)</span>
                <span className="font-mono font-medium">${cartTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              id="btn-checkout"
              disabled={cart.length === 0}
              onClick={() => {
                setTenderedAmount(cartTotal.toFixed(2));
                setIsCheckoutOpen(true);
              }}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center space-x-2"
            >
              <DollarSign className="h-4 w-4" />
              <span>Tender & Checkout (${cartTotal.toFixed(2)})</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
