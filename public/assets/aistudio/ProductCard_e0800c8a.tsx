import React from 'react';
import { Product } from '../types';
import { formatPrice } from '../utils/cuid';
import { Heart, Star, Sparkles, MapPin, Sliders, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product, e: React.MouseEvent) => void;
  onSelectVendor?: (vendorId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
  onSelectVendor
}) => {
  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-[#2E2A25]/15 hover:border-[#2E2A25]/40 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-0.5"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#F4EBE1]">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Etsy Floating Favorite Wishlist Button */}
        <button
          onClick={(e) => onToggleWishlist(product.id, e)}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-[#C85A32] text-white'
              : 'bg-white/90 hover:bg-white text-[#2E2A25] hover:text-[#C85A32]'
          }`}
          title={isWishlisted ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Etsy's Pick / Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.isTrending && (
            <span className="bg-white/95 text-[#2E2A25] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-[#2E2A25]/10">
              <Sparkles className="w-2.5 h-2.5 text-[#C85A32]" />
              Artisans' Pick
            </span>
          )}
          {product.isCustomizable && (
            <span className="bg-[#2E2A25]/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              <Sliders className="w-2.5 h-2.5 text-amber-300" />
              Customizable
            </span>
          )}
        </div>

        {/* Location Tag */}
        <div className="absolute bottom-2 left-2.5 text-white text-[10px] font-medium flex items-center gap-1 drop-shadow-md">
          <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="truncate">{product.vendorLocation}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 bg-white">
        <div>
          {/* Vendor Name & Star Seller */}
          <div 
            onClick={(e) => {
              if (onSelectVendor) {
                e.stopPropagation();
                onSelectVendor(product.vendorProfileId);
              }
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-[#C85A32] cursor-pointer truncate"
          >
            <span className="truncate hover:underline">{product.vendorName}</span>
            <CheckCircle2 className="w-3 h-3 text-[#5F7464] shrink-0" title="Star Seller" />
          </div>

          {/* Product Title */}
          <h3 className="font-sans font-normal text-sm text-[#2E2A25] line-clamp-2 mt-0.5 group-hover:text-[#C85A32] transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Etsy Ratings Display */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#2E2A25]">
            <div className="flex items-center text-[#2E2A25] font-bold gap-0.5">
              <Star className="w-3.5 h-3.5 fill-[#C85A32] text-[#C85A32]" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-stone-500 font-normal">({product.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Footer: Price & Free Shipping tag / Add Button */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#2E2A25] text-base">
                {formatPrice(product.priceCents)}
              </span>
              {product.compareAtPriceCents && (
                <span className="text-xs text-stone-400 line-through">
                  {formatPrice(product.compareAtPriceCents)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#5F7464] font-semibold">FREE shipping</p>
          </div>

          <button
            onClick={(e) => onQuickAddToCart(product, e)}
            className="px-3 py-1.5 bg-[#2E2A25] hover:bg-[#C85A32] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
          >
            {product.isCustomizable ? 'Customize' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
};


