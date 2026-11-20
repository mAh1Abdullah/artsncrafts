"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Package,
  MapPin,
} from "lucide-react";
import { ArtisanProduct } from "../types";
import { formatArtisanPrice } from "@/features/artisans/data/artisans-catalog";

interface ProductDetailModalProps {
  product: ArtisanProduct | null;
  currency: "BDT" | "USD";
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (
    product: ArtisanProduct,
    quantity: number,
    selectedOptions: Record<string, string>,
    optionModifierUsd: number,
    customNote: string
  ) => void;
  onSelectWorkshop: (workshopId: string) => void;
}

export function ProductDetailModal({
  product,
  currency,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onSelectWorkshop,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {}
  );
  const [customNote, setCustomNote] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setCustomNote("");
    setImgError(false);
    const defaults: Record<string, string> = {};
    product.customizationOptions?.forEach((opt) => {
      if (opt.type === "select" && opt.options && opt.options.length > 0) {
        defaults[opt.id] = opt.options[0];
      } else {
        defaults[opt.id] = "";
      }
    });
    setSelectedOptions(defaults);
  }, [product]);

  if (!product) return null;

  const optionModifierUsd = (product.customizationOptions || []).reduce(
    (sum, opt) => {
      const val = selectedOptions[opt.id];
      if (opt.type === "text" && val && val.trim().length > 0) {
        return sum + opt.priceModifierUsd;
      }
      return sum;
    },
    0
  );

  const unitPriceUsd = product.priceUsd + optionModifierUsd;
  const maxStock = Math.max(0, product.stock);
  const outOfStock = maxStock === 0;

  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart(
      product,
      quantity,
      selectedOptions,
      optionModifierUsd,
      customNote.trim()
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FAFAF8] border border-[#E5E2DC] rounded-xl shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="absolute top-4 right-4 z-10 p-2 bg-[#FAFAF8]/90 hover:bg-[#F2F0EC] text-[#18181B] rounded-full border border-[#E5E2DC] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Gallery & Provenance Column */}
            <div className="lg:col-span-6 p-6 sm:p-8 bg-[#F2F0EC] flex flex-col justify-between gap-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#E5E2DC]">
                {!imgError ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 450px"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#E5E2DC] text-[#52525B] p-6 text-center">
                    <Package className="h-8 w-8 mb-2 opacity-60" />
                    <span className="text-sm font-medium">{product.title}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2 border-t border-[#E5E2DC]">
                <div>
                  <p className="text-xs font-medium text-[#71717A] mb-1.5">
                    Materials & Provenance
                  </p>
                  <p className="text-sm text-[#18181B] leading-relaxed">
                    {product.materials.join(" · ")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52525B]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#71717A]" />
                    {product.workshopLocation}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>SKU {product.sku}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Crafted in {product.craftTimeDays}{" "}
                    {product.craftTimeDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Contiguous Purchase Module */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="space-y-2 pr-8">
                  <div className="flex items-center gap-2 text-xs text-[#71717A]">
                    <span>{product.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectWorkshop(product.workshopId);
                      }}
                      className="text-[#B84A27] hover:underline cursor-pointer font-medium"
                    >
                      {product.workshopName}
                    </button>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18181B] leading-tight">
                    {product.title}
                  </h2>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="font-mono tabular-nums text-2xl font-semibold text-[#18181B]">
                      {formatArtisanPrice(unitPriceUsd, currency)}
                    </span>
                    {product.compareAtPriceUsd &&
                      product.compareAtPriceUsd > product.priceUsd && (
                        <span className="font-mono tabular-nums text-sm text-[#71717A] line-through">
                          {formatArtisanPrice(
                            product.compareAtPriceUsd,
                            currency
                          )}
                        </span>
                      )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#52525B]">
                    <span className="font-mono tabular-nums font-semibold text-[#18181B]">
                      {product.rating.toFixed(1)} / 5
                    </span>
                    <span>({product.reviewCount} verified reviews)</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        outOfStock
                          ? "text-rose-700 font-medium"
                          : product.stock <= product.reorderLevel
                          ? "text-amber-700 font-medium"
                          : "text-[#2F5241] font-medium"
                      }
                    >
                      {outOfStock
                        ? "Out of stock"
                        : `${product.stock} in stock at WAW-POS`}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[#52525B] leading-relaxed">
                  {product.description}
                </p>

                {/* Customization Options */}
                {product.customizationOptions &&
                  product.customizationOptions.length > 0 && (
                    <div className="space-y-4 pt-3 border-t border-[#E5E2DC]">
                      {product.customizationOptions.map((opt) => (
                        <div key={opt.id} className="space-y-1.5">
                          <label className="flex items-center justify-between text-xs font-medium text-[#18181B]">
                            <span>{opt.label}</span>
                            {opt.priceModifierUsd > 0 && (
                              <span className="font-mono tabular-nums text-[#71717A]">
                                +
                                {formatArtisanPrice(
                                  opt.priceModifierUsd,
                                  currency
                                )}
                              </span>
                            )}
                          </label>

                          {opt.type === "select" && opt.options ? (
                            <div className="flex flex-wrap gap-2">
                              {opt.options.map((choice) => {
                                const active =
                                  selectedOptions[opt.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() =>
                                      setSelectedOptions((prev) => ({
                                        ...prev,
                                        [opt.id]: choice,
                                      }))
                                    }
                                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                                      active
                                        ? "bg-[#18181B] text-white border-[#18181B]"
                                        : "bg-white text-[#18181B] border-[#E5E2DC] hover:border-[#18181B]"
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={selectedOptions[opt.id] || ""}
                              onChange={(e) =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [opt.id]: e.target.value,
                                }))
                              }
                              placeholder={opt.placeholder || "Enter text"}
                              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#B84A27]"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Gift or Studio Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#18181B]">
                    Note for the Workshop (Optional)
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Gift wrap message or special delivery instruction"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#B84A27]"
                  />
                </div>
              </div>

              {/* Quantity & Purchase CTA */}
              <div className="space-y-3 pt-4 border-t border-[#E5E2DC]">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-[#E5E2DC] rounded-md bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || outOfStock}
                      aria-label="Decrease quantity"
                      className="p-2.5 text-[#18181B] hover:bg-[#F2F0EC] disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono tabular-nums text-sm font-medium text-[#18181B]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(maxStock, q + 1))
                      }
                      disabled={quantity >= maxStock || outOfStock}
                      aria-label="Increase quantity"
                      className="p-2.5 text-[#18181B] hover:bg-[#F2F0EC] disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={handleAdd}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#B84A27] hover:bg-[#9D3D1F] disabled:bg-[#A1A1AA] rounded-md transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {outOfStock
                        ? "Out of Stock"
                        : `Add to Bag — ${formatArtisanPrice(
                            unitPriceUsd * quantity,
                            currency
                          )}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={
                      isWishlisted ? "Remove from saved" : "Save piece"
                    }
                    className={`p-2.5 rounded-md border transition-colors cursor-pointer ${
                      isWishlisted
                        ? "bg-[#18181B] text-white border-[#18181B]"
                        : "bg-white text-[#18181B] border-[#E5E2DC] hover:border-[#18181B]"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isWishlisted ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52525B]">
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-[#2F5241]" />
                    Cash on Delivery & bKash / Nagad accepted
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Pathao & Steadfast Courier tracking</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
