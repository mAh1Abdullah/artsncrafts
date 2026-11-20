"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";

interface ArtisansHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export function ArtisansHeader({
  cartCount,
  onOpenCart,
  onOpenOrders,
  onScrollToSection,
}: ArtisansHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#E5E2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onScrollToSection("top")}
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A27] rounded-sm"
        >
          Artisans Market
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52525B]"
        >
          <button
            type="button"
            onClick={() => onScrollToSection("collection")}
            className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#18181B]"
          >
            Collection
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection("workshops")}
            className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#18181B]"
          >
            Workshops
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection("craftsmanship")}
            className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#18181B]"
          >
            Craftsmanship
          </button>
          <button
            type="button"
            onClick={onOpenOrders}
            className="hover:text-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b border-transparent hover:border-[#18181B]"
          >
            Orders
          </button>
          <Link
            href="/pos"
            className="text-[#18181B] hover:text-[#B84A27] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#B84A27]"
          >
            WAW-POS
          </Link>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#18181B] hover:bg-[#B84A27] rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A27] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Bag</span>
            <span className="font-mono tabular-nums text-xs opacity-90">
              ({cartCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-2 text-[#18181B] hover:bg-[#F2F0EC] rounded-md cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E2DC] bg-[#FAFAF8] px-4 py-4 flex flex-col gap-3 text-sm font-medium text-[#18181B]">
          <button
            type="button"
            onClick={() => {
              onScrollToSection("collection");
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 border-b border-[#E5E2DC]"
          >
            Collection
          </button>
          <button
            type="button"
            onClick={() => {
              onScrollToSection("workshops");
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 border-b border-[#E5E2DC]"
          >
            Workshops
          </button>
          <button
            type="button"
            onClick={() => {
              onScrollToSection("craftsmanship");
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 border-b border-[#E5E2DC]"
          >
            Craftsmanship
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenOrders();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 border-b border-[#E5E2DC]"
          >
            Orders
          </button>
          <Link
            href="/pos"
            className="text-left py-2 text-[#B84A27] font-semibold"
          >
            Open WAW-POS Backend
          </Link>
        </div>
      )}
    </header>
  );
}
