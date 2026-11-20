"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Package,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  ARTISAN_CATEGORIES,
  ARTISAN_HERO_IMAGE,
  ARTISAN_WORKSHOPS,
  formatArtisanPrice,
  mapBackendProductToArtisan,
  RawBackendProduct,
} from "@/features/artisans/data/artisans-catalog";
import {
  ArtisanCategoryId,
  ArtisanProduct,
  ArtisanWorkshop,
  StorefrontCartItem,
  StorefrontOrderRecord,
} from "../types";
import { ArtisansHeader } from "./ArtisansHeader";
import { ProductDetailModal } from "./ProductDetailModal";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { OrderTrackerModal } from "./OrderTrackerModal";
import { WorkshopDrawer } from "./WorkshopDrawer";

interface ArtisansStorefrontProps {
  initialProducts: RawBackendProduct[];
}

export function ArtisansStorefront({
  initialProducts,
}: ArtisansStorefrontProps) {
  const [products, setProducts] = useState<ArtisanProduct[]>(() =>
    initialProducts
      .filter((p) => p.isSyncedToEcommerce !== false)
      .map(mapBackendProductToArtisan)
  );
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const [activeCategory, setActiveCategory] =
    useState<ArtisanCategoryId>("all");
  const [activeWorkshopFilter, setActiveWorkshopFilter] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "featured" | "price_asc" | "price_desc" | "rating"
  >("featured");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<StorefrontCartItem[]>([]);

  // Active modals & drawers
  const [selectedProduct, setSelectedProduct] = useState<ArtisanProduct | null>(
    null
  );
  const [selectedWorkshop, setSelectedWorkshop] =
    useState<ArtisanWorkshop | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Hydrate live catalog from WAW-POS API and local cart/wishlist
  const refreshLiveProducts = async () => {
    try {
      const res = await fetch("/api/v1/products", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const synced = (data.data as RawBackendProduct[])
          .filter((p) => p.isSyncedToEcommerce !== false)
          .map(mapBackendProductToArtisan);
        if (synced.length > 0) {
          setProducts(synced);
        }
      }
    } catch {
      // Keep server-rendered products if offline
    }
  };

  useEffect(() => {
    refreshLiveProducts();
    try {
      const savedWishlist = localStorage.getItem("artisans_wishlist_v1");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const showToast = (message: string) => {
    setToastNotice(message);
    window.setTimeout(() => {
      setToastNotice((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem("artisans_wishlist_v1", JSON.stringify(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  };

  const handleAddToCart = (
    product: ArtisanProduct,
    quantity: number,
    selectedOptions: Record<string, string>,
    optionModifierUsd: number,
    customNote: string
  ) => {
    const optionSig = JSON.stringify(selectedOptions) + "|" + customNote;
    const cartKey = `${product.id}::${optionSig}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey
            ? {
                ...i,
                quantity: Math.min(product.stock, i.quantity + quantity),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          cartKey,
          product,
          quantity,
          selectedOptions,
          optionModifierUsd,
          customNote: customNote || undefined,
        },
      ];
    });

    showToast(`Added "${product.title}" to your bag.`);
    setCartOpen(true);
  };

  const handleQuickAdd = (product: ArtisanProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    if (product.isCustomizable) {
      setSelectedProduct(product);
      return;
    }
    handleAddToCart(product, 1, {}, 0, "");
  };

  const handleUpdateCartQuantity = (cartKey: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: nextQty } : i))
    );
  };

  const handleRemoveCartItem = (cartKey: string) => {
    setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  const handleOrderSuccess = (order: StorefrontOrderRecord) => {
    setCart([]);
    refreshLiveProducts();
    showToast(`Order ${order.orderNumber} synced to WAW-POS.`);
  };

  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) {
        return false;
      }
      if (activeWorkshopFilter && p.workshopId !== activeWorkshopFilter) {
        return false;
      }
      if (q) {
        const hay = `${p.title} ${p.workshopName} ${p.categoryLabel} ${p.sku} ${p.materials.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price_asc") return a.priceUsd - b.priceUsd;
      if (sortBy === "price_desc") return b.priceUsd - a.priceUsd;
      if (sortBy === "rating") return b.rating - a.rating;
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    });
  }, [products, activeCategory, activeWorkshopFilter, searchQuery, sortBy]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeWorkshopObj = activeWorkshopFilter
    ? ARTISAN_WORKSHOPS.find((w) => w.id === activeWorkshopFilter)
    : null;

  return (
    <div
      className="min-h-screen bg-[#FAFAF8] text-[#18181B]"
      style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
    >
      {/* Top 3-Zone Navigation Bar */}
      <ArtisansHeader
        cartCount={totalCartItems}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onScrollToSection={handleScrollToSection}
      />

      <main>
        {/* SECTION 1: Editorial Split Hero */}
        <section className="border-b border-[#E5E2DC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between gap-8">
                <div className="space-y-6">
                  <p className="text-xs font-medium text-[#71717A]">
                    Sylhet & Dhaka Heritage Guilds · Direct from Studio
                  </p>

                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-[#18181B] leading-[1.08] [text-wrap:balance]">
                    Heirloom craft, made by hand and built to endure.
                  </h1>

                  <p className="text-base text-[#52525B] leading-relaxed max-w-lg">
                    Artisans Market connects independent potters, Jamdani
                    weavers, silversmiths, and woodworkers directly with your
                    home—backed by real-time inventory, courier logistics, and
                    unified checkout from WAW-POS.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleScrollToSection("collection")}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#B84A27] hover:bg-[#9D3D1F] rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <Link
                      href="/pos"
                      className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[#18181B] hover:text-[#B84A27] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Open WAW-POS Backend</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Grounded Studio Metrics */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#E5E2DC]">
                  <div>
                    <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#18181B]">
                      {ARTISAN_WORKSHOPS.length}
                    </p>
                    <p className="text-xs text-[#71717A] mt-1">
                      Verified Guilds
                    </p>
                  </div>
                  <div>
                    <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#18181B]">
                      {products.reduce((s, p) => s + p.stock, 0)}
                    </p>
                    <p className="text-xs text-[#71717A] mt-1">
                      Pieces in Stock
                    </p>
                  </div>
                  <div>
                    <p className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#18181B]">
                      24–72h
                    </p>
                    <p className="text-xs text-[#71717A] mt-1">
                      Pathao Dispatch
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[500px] w-full rounded-xl overflow-hidden bg-[#F2F0EC] border border-[#E5E2DC]">
                  {!brokenImages["hero"] ? (
                    <Image
                      src={ARTISAN_HERO_IMAGE}
                      alt="Artisans Market workshop table featuring hand-thrown terracotta clay vessels, folded ivory Jamdani textile, and carved teak wood bowls"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, hero: true }))
                      }
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F2F0EC] text-[#52525B]">
                      <span className="font-serif text-xl">
                        Artisans Market Studio Collection
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Curated Handcrafted Collection (Live Synced with WAW-POS) */}
        <section
          id="collection"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E5E2DC]">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#71717A]">
                Curated Catalog · Live WAW-POS Inventory
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B]">
                Handcrafted Collection
              </h2>
            </div>

            {/* Search, Sort & Currency Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="h-4 w-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ceramics, Jamdani, SKU..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#B84A27]"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E2DC] rounded-md px-3 py-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#71717A]" />
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "featured"
                        | "price_asc"
                        | "price_desc"
                        | "rating"
                    )
                  }
                  className="text-xs font-medium text-[#18181B] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <div
                role="group"
                aria-label="Currency selector"
                className="inline-flex items-center p-0.5 bg-[#F2F0EC] border border-[#E5E2DC] rounded-md"
              >
                <button
                  type="button"
                  onClick={() => setCurrency("BDT")}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                    currency === "BDT"
                      ? "bg-white text-[#18181B] shadow-2xs"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  BDT (৳)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                    currency === "USD"
                      ? "bg-white text-[#18181B] shadow-2xs"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Category Filter Bar */}
          <div className="flex items-center justify-between gap-4 py-6 overflow-x-auto">
            <div className="flex items-center gap-1.5 p-1 bg-[#F2F0EC] rounded-lg shrink-0">
              {ARTISAN_CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? "bg-white text-[#18181B] shadow-2xs"
                        : "text-[#52525B] hover:text-[#18181B]"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {activeWorkshopObj && (
              <div className="flex items-center gap-2 text-xs text-[#52525B] shrink-0">
                <span>
                  Studio:{" "}
                  <strong className="text-[#18181B]">
                    {activeWorkshopObj.displayName}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveWorkshopFilter(null)}
                  className="text-[#B84A27] hover:underline font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Uniform 3-Column Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center border border-[#E5E2DC] rounded-xl bg-white space-y-3">
              <Package className="h-8 w-8 text-[#A1A1AA] mx-auto" />
              <p className="font-serif text-xl text-[#18181B]">
                No pieces match your current filter
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setActiveWorkshopFilter(null);
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-[#18181B] hover:bg-[#B84A27] rounded-md cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                const outOfStock = product.stock <= 0;

                return (
                  <motion.article
                    key={product.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelectedProduct(product)}
                    className="group bg-white border border-[#E5E2DC] hover:border-[#D4CFC7] rounded-xl overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-md"
                  >
                    {/* 4:3 Studio Product Photography */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2F0EC]">
                      {!brokenImages[product.id] ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [product.id]: true,
                            }))
                          }
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#F2F0EC] text-[#52525B] p-6 text-center">
                          <Package className="h-7 w-7 mb-2 opacity-60" />
                          <span className="text-xs font-medium">
                            {product.title}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(product.id);
                        }}
                        aria-label={
                          isWishlisted
                            ? `Remove ${product.title} from saved`
                            : `Save ${product.title}`
                        }
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors cursor-pointer ${
                          isWishlisted
                            ? "bg-[#18181B] text-white"
                            : "bg-white/90 text-[#18181B] hover:bg-white"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isWishlisted ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Clean Identical Field Order */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#71717A] truncate">
                          <span>{product.categoryLabel}</span>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const ws = ARTISAN_WORKSHOPS.find(
                                (w) => w.id === product.workshopId
                              );
                              if (ws) setSelectedWorkshop(ws);
                            }}
                            className="hover:text-[#B84A27] truncate cursor-pointer"
                          >
                            {product.workshopName}
                          </button>
                        </div>

                        <h3 className="text-base font-semibold text-[#18181B] leading-snug line-clamp-2 group-hover:text-[#B84A27] transition-colors">
                          {product.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-[#52525B] pt-0.5">
                          <span className="font-mono tabular-nums font-medium text-[#18181B]">
                            {product.rating.toFixed(1)}
                          </span>
                          <span>({product.reviewCount})</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              outOfStock
                                ? "text-rose-700"
                                : product.stock <= product.reorderLevel
                                ? "text-amber-700"
                                : "text-[#2F5241]"
                            }
                          >
                            {outOfStock
                              ? "Out of stock"
                              : product.isCustomizable
                              ? `Customizable · ${product.stock} left`
                              : `${product.stock} in stock`}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E5E2DC] flex items-center justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono tabular-nums text-[15px] font-semibold text-[#18181B]">
                            {formatArtisanPrice(product.priceUsd, currency)}
                          </span>
                          {product.compareAtPriceUsd &&
                            product.compareAtPriceUsd > product.priceUsd && (
                              <span className="font-mono tabular-nums text-xs text-[#A1A1AA] line-through">
                                {formatArtisanPrice(
                                  product.compareAtPriceUsd,
                                  currency
                                )}
                              </span>
                            )}
                        </div>

                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={(e) => handleQuickAdd(product, e)}
                          className="px-4 py-2 text-xs font-medium text-white bg-[#18181B] hover:bg-[#B84A27] disabled:bg-[#A1A1AA] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {outOfStock
                            ? "Sold Out"
                            : product.isCustomizable
                            ? "Customize"
                            : "Add to Bag"}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: Featured Master Workshops & Craftsmanship */}
        <section
          id="workshops"
          className="border-t border-[#E5E2DC] bg-[#F2F0EC]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-7 space-y-2">
                <p className="text-xs font-medium text-[#71717A]">
                  Verified Guild Provenance
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] [text-wrap:balance]">
                  Meet the studios behind every piece.
                </h2>
              </div>
              <p className="lg:col-span-5 text-sm text-[#52525B] leading-relaxed">
                Each workshop manages live inventory, workshop stock audits,
                and courier dispatch directly through WAW-POS—ensuring every
                listed item is authentic and ready to ship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ARTISAN_WORKSHOPS.slice(0, 4).map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => setSelectedWorkshop(ws)}
                  className="group text-left bg-[#FAFAF8] border border-[#E5E2DC] hover:border-[#18181B] rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E5E2DC]">
                    <Image
                      src={ws.coverImage}
                      alt={ws.displayName}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#71717A]">
                        {ws.location} · Est. {ws.establishedYear}
                      </p>
                      <h3 className="font-serif text-lg font-semibold text-[#18181B] group-hover:text-[#B84A27] transition-colors leading-snug">
                        {ws.displayName}
                      </h3>
                      <p className="text-xs text-[#52525B] line-clamp-2 leading-relaxed">
                        {ws.craftSpecialty}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#E5E2DC] flex items-center justify-between text-xs text-[#52525B]">
                      <span className="font-mono tabular-nums font-medium text-[#18181B]">
                        {ws.rating.toFixed(2)} / 5 ({ws.reviewCount})
                      </span>
                      <span className="text-[#B84A27] font-medium">
                        View Studio →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Craftsmanship & Unified WAW-POS Architecture Row */}
            <div
              id="craftsmanship"
              className="pt-10 border-t border-[#E5E2DC] grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  01. Single-Source Live Inventory
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">
                  Every online checkout immediately deducts stock in WAW-POS and
                  logs an audit entry—preventing overselling across physical
                  outlets and the storefront.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  02. Localized Payments & COD Protection
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">
                  Accepts bKash, Nagad, AmarPay, and verified Cash on Delivery
                  with automated risk scoring and advance balance tracking in
                  the backend.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  03. Direct Pathao & Steadfast Dispatch
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">
                  Storefront orders receive instant consignment tracking numbers
                  ready for pickup and reconciliation inside the WAW-POS
                  Logistics hub.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 4: Quiet Editorial Footer */}
      <footer className="bg-[#18181B] text-[#E4E4E7] border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#27272A]">
            <div className="space-y-3">
              <p className="font-serif text-xl font-semibold text-white">
                Artisans Market
              </p>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Curated Bangladeshi handcrafted goods from Sylhet, Dhamrai,
                Sonargaon, and Chittagong—operated on WAW-POS.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">Shop</h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                {ARTISAN_CATEGORIES.slice(1, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        handleScrollToSection("collection");
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">
                Customer Care
              </h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                <li>
                  <button
                    type="button"
                    onClick={() => setOrdersOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Track Your Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Shopping Bag ({totalCartItems})
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleScrollToSection("workshops")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Verified Craft Guilds
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-white">
                Operations & Backend
              </h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                <li>
                  <Link
                    href="/pos"
                    className="text-white hover:text-[#E5987E] transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <span>WAW-POS Backend Dashboard</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pos"
                    className="hover:text-white transition-colors"
                  >
                    Inventory, Sales & Logistics
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
            <p>
              © {new Date().getFullYear()} Artisans Market · Powered by WAW-POS
              Commerce Engine
            </p>
            <div className="flex items-center gap-4">
              <span>Sylhet Flagship · Dhaka · Nationwide Delivery</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Subtle Action Toast */}
      {toastNotice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#18181B] text-white text-xs font-medium rounded-md shadow-lg border border-white/10"
        >
          {toastNotice}
        </div>
      )}

      {/* Interactive Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        currency={currency}
        isWishlisted={
          selectedProduct ? wishlist.includes(selectedProduct.id) : false
        }
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onSelectWorkshop={(workshopId) => {
          const ws = ARTISAN_WORKSHOPS.find((w) => w.id === workshopId);
          if (ws) setSelectedWorkshop(ws);
        }}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        currency={currency}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        items={cart}
        currency={currency}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderTrackerModal
        open={ordersOpen}
        currency={currency}
        onClose={() => setOrdersOpen(false)}
      />

      <WorkshopDrawer
        workshop={selectedWorkshop}
        products={products}
        currency={currency}
        onClose={() => setSelectedWorkshop(null)}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
        onFilterByWorkshop={(workshopId) => {
          setActiveWorkshopFilter(workshopId);
          handleScrollToSection("collection");
        }}
      />
    </div>
  );
}
