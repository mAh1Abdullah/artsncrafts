import React from 'react';
import { CartItem } from '../types';
import { formatPrice } from '../utils/cuid';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const subtotalCents = cart.reduce((sum, item) => {
    const customMods = item.customSelections?.reduce((s, c) => s + c.priceModifierCents, 0) || 0;
    return sum + (item.unitPriceCents + customMods) * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between text-stone-800 animate-in slide-in-from-right duration-300">
        
        {/* Cart Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#2E2A25]/15 flex items-center justify-between bg-[#F4EBE1]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C85A32]" />
            <h2 className="font-serif text-lg font-bold text-[#2E2A25]">Your Craft Cart ({cart.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-stone-700 font-serif text-base font-semibold">Your cart is empty</p>
              <p className="text-xs text-stone-500 max-w-xs">
                Explore handcrafted pottery, Jamdani sarees, teakwood carvings, or raw materials.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemCustomMods = item.customSelections?.reduce((s, c) => s + c.priceModifierCents, 0) || 0;
              const effectiveUnitPriceCents = item.unitPriceCents + itemCustomMods;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 flex gap-3 shadow-xs"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                  />

                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-amber-900 tracking-wider">
                          {item.vendorName}
                        </span>
                        <h4 className="font-serif font-bold text-stone-900 line-clamp-1">
                          {item.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Custom selections badge display */}
                    {item.customSelections && item.customSelections.length > 0 && (
                      <div className="space-y-0.5 pt-0.5">
                        {item.customSelections.map((sel, idx) => (
                          <p key={idx} className="text-[10px] text-amber-950 font-medium bg-amber-100/70 px-1.5 py-0.2 rounded inline-block mr-1">
                            {sel.optionLabel}: "{sel.value}"
                          </p>
                        ))}
                      </div>
                    )}

                    {item.customNote && (
                      <p className="text-[10px] text-stone-500 italic truncate">
                        Note: "{item.customNote}"
                      </p>
                    )}

                    {/* Price & Quantity Controls */}
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-stone-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-serif font-bold text-stone-900 text-sm">
                        {formatPrice(effectiveUnitPriceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#2E2A25]/15 bg-[#F4EBE1] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#2E2A25]/80">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#2E2A25]">{formatPrice(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-[#2E2A25]/80">
                <span>Estimated Courier Delivery</span>
                <span className="text-[#5F7464] font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-[#2E2A25] font-bold text-sm pt-2 border-t border-[#2E2A25]/15">
                <span>Total Amount</span>
                <span className="font-serif text-[#C85A32] text-base">{formatPrice(subtotalCents)}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 bg-[#C85A32] hover:bg-[#A84825] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5F7464]" />
              <span>Immutable Order Snapshots • Cash on Delivery & bKash</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
