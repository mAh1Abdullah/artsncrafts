import type React from 'react';
import {
  CheckCircle2,
  Heart,
  MapPin,
  Sliders,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ProductDTO } from '@waw/contracts';
import { storefrontPath } from '../lib/api';
import { formatMoney, type CurrencyCode } from '../lib/store';

interface ProductCardProps {
  product: ProductDTO;
  currency: CurrencyCode;
  isWishlisted: boolean;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onSelectProduct: (product: ProductDTO) => void;
  onQuickAddToCart: (product: ProductDTO, e: React.MouseEvent) => void;
}

export function ProductCard({
  product,
  currency,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
}: ProductCardProps) {
  const inStock = product.currentStock > 0;
  const imgSrc =
    product.imageUrl ||
    product.images?.[0] ||
    '/images/artisans/artisans_hero_workshop_1795181990328.jpg';

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-[#2E2A25]/15 hover:border-[#2E2A25]/40 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-0.5"
    >
      {/* Square Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#F4EBE1]">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Favorite Wishlist Button */}
        <button
          type="button"
          onClick={(e) => onToggleWishlist(product.id, e)}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-[#C85A32] text-white'
              : 'bg-white/90 hover:bg-white text-[#2E2A25] hover:text-[#C85A32]'
          }`}
          aria-label={isWishlisted ? 'Remove from favorites' : 'Add to favorites'}
          title={isWishlisted ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Artisans' Pick / Customizable Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.featured && (
            <span className="bg-white/95 text-[#2E2A25] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-[#2E2A25]/10">
              <Sparkles className="w-2.5 h-2.5 text-[#C85A32]" />
              Artisans&apos; Pick
            </span>
          )}
          {product.isCustomizable && (
            <span className="bg-[#2E2A25]/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              <Sliders className="w-2.5 h-2.5 text-amber-300" />
              Customizable
            </span>
          )}
        </div>

        {/* Location Tag / Sold Out */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-2.5 pb-2 pt-6 flex items-center justify-between gap-2">
          <div className="text-white text-[10px] font-medium flex items-center gap-1 drop-shadow-sm truncate">
            <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="truncate">{product.vendorLocation}</span>
          </div>
          {!inStock && (
            <span className="bg-[#2E2A25]/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 bg-white">
        <div>
          {/* Vendor Name & Star Seller */}
          <a
            href={storefrontPath(`/shops/${product.vendorSlug}`)}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-[#C85A32] truncate"
          >
            <span className="truncate hover:underline">{product.vendorName}</span>
            <CheckCircle2
              className="w-3 h-3 text-[#5F7464] shrink-0"
              aria-label="Verified Star Seller"
            />
          </a>

          {/* Product Title */}
          <h3 className="font-sans font-medium text-sm text-[#2E2A25] line-clamp-2 mt-0.5 group-hover:text-[#C85A32] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Ratings Display */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#2E2A25]">
            <div className="flex items-center text-[#2E2A25] font-bold gap-0.5 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-[#C85A32] text-[#C85A32]" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-stone-500 font-normal">
                ({product.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Price & Free Shipping / Action CTA */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#2E2A25] text-base tabular-nums">
                {formatMoney(product.priceBdt, currency)}
              </span>
              {product.compareAtPriceBdt &&
                product.compareAtPriceBdt > product.priceBdt && (
                  <span className="text-xs text-stone-400 line-through tabular-nums">
                    {formatMoney(product.compareAtPriceBdt, currency)}
                  </span>
                )}
            </div>
            <p className="text-[10px] text-[#5F7464] font-semibold">
              {product.priceBdt >= 3000 ? 'FREE shipping' : 'Insured delivery'}
            </p>
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              if (product.isCustomizable) {
                onSelectProduct(product);
              } else {
                onQuickAddToCart(product, e);
              }
            }}
            className="px-3 py-1.5 bg-[#2E2A25] hover:bg-[#C85A32] disabled:opacity-40 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer shrink-0"
          >
            {product.isCustomizable ? 'Customize' : '+ Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
