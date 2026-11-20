"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { StorefrontCartItem } from "../types";
import { formatArtisanPrice } from "@/features/artisans/data/artisans-catalog";

interface CartDrawerProps {
  open: boolean;
  items: StorefrontCartItem[];
  currency: "BDT" | "USD";
  onClose: () => void;
  onUpdateQuantity: (cartKey: string, nextQty: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onProceedToCheckout: () => void;
}

const FREE_SHIPPING_THRESHOLD_USD = 50;

export function CartDrawer({
  open,
  items,
  currency,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  const subtotalUsd = items.reduce(
    (sum, item) =>
      sum + (item.product.priceUsd + item.optionModifierUsd) * item.quantity,
    0
  );
  const freeShippingRemaining = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_USD - subtotalUsd
  );
  const progressPct = Math.min(
    100,
    (subtotalUsd / FREE_SHIPPING_THRESHOLD_USD) * 100
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
          <div className="flex-1" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-[#FAFAF8] h-full flex flex-col border-l border-[#E5E2DC] shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E5E2DC] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                  Your Bag
                </h2>
                <p className="text-xs text-[#71717A] mt-0.5 font-mono tabular-nums">
                  {items.reduce((s, i) => s + i.quantity, 0)} item(s) selected
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shopping bag"
                className="p-2 text-[#18181B] hover:bg-[#F2F0EC] rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shipping Threshold */}
            <div className="px-6 py-3.5 bg-[#F2F0EC] border-b border-[#E5E2DC] space-y-2">
              <p className="text-xs text-[#18181B]">
                {freeShippingRemaining === 0 ? (
                  <span className="font-medium text-[#2F5241]">
                    Complimentary courier delivery unlocked across Bangladesh.
                  </span>
                ) : (
                  <>
                    Add{" "}
                    <span className="font-mono tabular-nums font-semibold">
                      {formatArtisanPrice(freeShippingRemaining, currency)}
                    </span>{" "}
                    more for complimentary Pathao / Steadfast shipping.
                  </>
                )}
              </p>
              <div className="h-1 w-full bg-[#E5E2DC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2F5241] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                  <ShoppingBag className="h-8 w-8 text-[#A1A1AA]" />
                  <p className="font-serif text-lg text-[#18181B]">
                    Your bag is empty
                  </p>
                  <p className="text-xs text-[#71717A] max-w-xs">
                    Explore ceramics, handloom Jamdani, and carved woodcraft
                    made in verified workshops.
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const unitPrice =
                    item.product.priceUsd + item.optionModifierUsd;
                  const optionEntries = Object.entries(
                    item.selectedOptions
                  ).filter(([, val]) => val && val.trim().length > 0);

                  return (
                    <div
                      key={item.cartKey}
                      className="flex gap-4 pb-5 border-b border-[#E5E2DC] last:border-b-0"
                    >
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[#F2F0EC] shrink-0 border border-[#E5E2DC]">
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          fill
                          sizes="80px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium text-[#18181B] leading-snug line-clamp-2">
                              {item.product.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.cartKey)}
                              aria-label={`Remove ${item.product.title}`}
                              className="p-1 text-[#71717A] hover:text-rose-700 cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-[#71717A] mt-0.5">
                            {item.product.workshopName}
                          </p>

                          {optionEntries.length > 0 && (
                            <p className="text-xs text-[#52525B] mt-1">
                              {optionEntries
                                .map(([, value]) => value)
                                .join(" · ")}
                            </p>
                          )}

                          {item.customNote && (
                            <p className="text-xs text-[#71717A] italic mt-0.5 truncate">
                              Note: {item.customNote}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3">
                          <div className="inline-flex items-center border border-[#E5E2DC] rounded-md bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.cartKey,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Decrease quantity"
                              className="px-2 py-1 text-[#18181B] hover:bg-[#F2F0EC] cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center font-mono tabular-nums text-xs text-[#18181B]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.cartKey,
                                  Math.min(
                                    item.product.stock,
                                    item.quantity + 1
                                  )
                                )
                              }
                              aria-label="Increase quantity"
                              className="px-2 py-1 text-[#18181B] hover:bg-[#F2F0EC] cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="font-mono tabular-nums text-sm font-semibold text-[#18181B]">
                            {formatArtisanPrice(
                              unitPrice * item.quantity,
                              currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-[#E5E2DC] bg-white space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-[#52525B]">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-[#18181B]">
                      {formatArtisanPrice(subtotalUsd, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#52525B]">
                    <span>Delivery</span>
                    <span className="font-mono tabular-nums text-[#18181B]">
                      {freeShippingRemaining === 0
                        ? "Free"
                        : formatArtisanPrice(3.0, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E2DC] font-semibold text-[#18181B]">
                    <span>Estimated Total</span>
                    <span className="font-mono tabular-nums text-base">
                      {formatArtisanPrice(
                        subtotalUsd + (freeShippingRemaining === 0 ? 0 : 3.0),
                        currency
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#B84A27] hover:bg-[#9D3D1F] rounded-md transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
