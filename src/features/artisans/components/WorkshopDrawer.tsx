"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, MapPin, ArrowRight } from "lucide-react";
import { ArtisanProduct, ArtisanWorkshop } from "../types";
import { formatArtisanPrice } from "@/features/artisans/data/artisans-catalog";

interface WorkshopDrawerProps {
  workshop: ArtisanWorkshop | null;
  products: ArtisanProduct[];
  currency: "BDT" | "USD";
  onClose: () => void;
  onSelectProduct: (product: ArtisanProduct) => void;
  onFilterByWorkshop: (workshopId: string) => void;
}

export function WorkshopDrawer({
  workshop,
  products,
  currency,
  onClose,
  onSelectProduct,
  onFilterByWorkshop,
}: WorkshopDrawerProps) {
  if (!workshop) return null;

  const studioPieces = products.filter((p) => p.workshopId === workshop.id);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#FAFAF8] h-full flex flex-col border-l border-[#E5E2DC] shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#E5E2DC] bg-white flex items-center justify-between">
            <div>
              <p className="text-xs text-[#71717A]">Verified Master Workshop</p>
              <h2 className="font-serif text-xl font-semibold text-[#18181B]">
                {workshop.displayName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close workshop profile"
              className="p-2 text-[#18181B] hover:bg-[#F2F0EC] rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#F2F0EC] border border-[#E5E2DC]">
              <Image
                src={workshop.coverImage}
                alt={workshop.displayName}
                fill
                sizes="(max-width: 640px) 100vw, 460px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#71717A]" />
                  {workshop.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>Est. {workshop.establishedYear}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {workshop.artisanCount} craftspeople
                </span>
              </div>

              <p className="text-sm text-[#18181B] leading-relaxed">
                {workshop.description}
              </p>

              <div className="pt-3 border-t border-[#E5E2DC] grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[#71717A]">Signature Technique</p>
                  <p className="font-medium text-[#18181B] mt-0.5">
                    {workshop.signatureTechnique}
                  </p>
                </div>
                <div>
                  <p className="text-[#71717A]">Fulfillment & Rating</p>
                  <p className="font-medium text-[#18181B] mt-0.5 font-mono tabular-nums">
                    {workshop.rating.toFixed(2)} / 5 ({workshop.reviewCount}{" "}
                    reviews)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E5E2DC]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#18181B]">
                  Available Pieces ({studioPieces.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onFilterByWorkshop(workshop.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#B84A27] hover:underline cursor-pointer"
                >
                  <span>Filter catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {studioPieces.length === 0 ? (
                <p className="text-xs text-[#71717A] py-4">
                  New batch currently in production at the workshop.
                </p>
              ) : (
                <div className="space-y-3">
                  {studioPieces.map((piece) => (
                    <button
                      key={piece.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProduct(piece);
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-lg bg-white border border-[#E5E2DC] hover:border-[#18181B] text-left transition-colors cursor-pointer"
                    >
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-[#F2F0EC] shrink-0">
                        <Image
                          src={piece.image}
                          alt={piece.title}
                          fill
                          sizes="64px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#18181B] line-clamp-1">
                          {piece.title}
                        </p>
                        <p className="text-xs text-[#71717A] mt-0.5">
                          {piece.categoryLabel} · {piece.stock} in stock
                        </p>
                        <p className="font-mono tabular-nums text-xs font-semibold text-[#18181B] mt-1">
                          {formatArtisanPrice(piece.priceUsd, currency)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
