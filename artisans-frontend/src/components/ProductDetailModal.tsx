import React, { useState } from 'react';
import { Product, ProductReview, CartCustomSelection } from '../types';
import { formatPrice } from '../utils/cuid';
import { 
  X, Star, Heart, Sliders, ShoppingBag, MapPin, 
  Check, Sparkles, MessageCircle, Clock, ShieldCheck 
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: ProductReview[];
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (
    product: Product, 
    quantity: number, 
    selections: CartCustomSelection[], 
    customNote: string
  ) => void;
  onAddReview: (productId: string, rating: number, title: string, comment: string) => void;
  onSelectVendor?: (vendorId: string) => void;
}

interface SelectionItem {
  value: string;
  priceModifierCents: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  reviews,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onAddReview,
  onSelectVendor
}) => {
  if (!product) return null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customSelections, setCustomSelections] = useState<Record<string, SelectionItem>>(() => {
    const initial: Record<string, SelectionItem> = {};
    if (product.customizationOptions) {
      product.customizationOptions.forEach(opt => {
        if (opt.type === 'select' && opt.options && opt.options.length > 0) {
          initial[opt.label] = { value: opt.options[0], priceModifierCents: opt.priceModifierCents };
        } else if (opt.type === 'text') {
          initial[opt.label] = { value: '', priceModifierCents: opt.priceModifierCents };
        }
      });
    }
    return initial;
  });
  const [customNote, setCustomNote] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Compute total unit price including customization option modifiers
  const customModifiersTotalCents = (Object.values(customSelections) as SelectionItem[]).reduce((sum, item) => {
    return item.value ? sum + item.priceModifierCents : sum;
  }, 0);

  const unitPriceCents = product.priceCents + customModifiersTotalCents;
  const totalPriceCents = unitPriceCents * quantity;

  const handleCustomTextChange = (label: string, value: string, priceModifierCents: number) => {
    setCustomSelections(prev => ({
      ...prev,
      [label]: { value, priceModifierCents }
    }));
  };

  const handleCustomSelectChange = (label: string, value: string, priceModifierCents: number) => {
    setCustomSelections(prev => ({
      ...prev,
      [label]: { value, priceModifierCents }
    }));
  };

  const handleAddToCartClick = () => {
    const selectionsArray: CartCustomSelection[] = (Object.entries(customSelections) as [string, SelectionItem][])
      .filter(([_, data]) => Boolean(data.value))
      .map(([label, data]) => ({
        optionLabel: label,
        value: data.value,
        priceModifierCents: data.priceModifierCents
      }));

    onAddToCart(product, quantity, selectionsArray, customNote);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle || !reviewComment) return;
    onAddReview(product.id, reviewRating, reviewTitle, reviewComment);
    setReviewSubmitted(true);
    setReviewTitle('');
    setReviewComment('');
  };

  const productReviews = reviews.filter(r => r.productId === product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 relative text-stone-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 relative shadow-inner">
              <img
                src={product.images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all cursor-pointer ${
                  isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-stone-700 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Selection */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx ? 'border-amber-900 ring-2 ring-amber-800/30' : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Artisan Workshop Trust Box */}
            <div className="p-4 rounded-2xl bg-[#F4EBE1] border border-[#E8DCCF] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#2E2A25] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#5F7464]" />
                <span>Verified Handcrafted Guarantee</span>
              </div>
              <p className="text-[#2E2A25]/80 leading-relaxed">
                Made directly by <strong>{product.vendorName}</strong> in <em>{product.vendorLocation}</em>. 100% authentic local craft, fair artisan pricing & eco-conscious packaging.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-[#2E2A25] pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5F7464]" />
                  {product.craftTimeDays} days handcraft time
                </span>
                <span>•</span>
                <span>In Stock: {product.inStockQuantity} units</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Customizations */}
          <div className="space-y-5">
            <div>
              <button
                onClick={() => {
                  if (onSelectVendor) {
                    onSelectVendor(product.vendorProfileId);
                    onClose();
                  }
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#C85A32] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>{product.vendorName}</span>
                <span className="text-[10px] font-normal lowercase text-stone-500">(Visit Shop &rarr;)</span>
              </button>
              <h1 className="font-serif text-2xl font-bold text-[#2E2A25] mt-1 leading-snug">
                {product.title}
              </h1>

              {/* Rating & Location */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center text-[#2E2A25] font-bold gap-1">
                  <Star className="w-4 h-4 fill-[#C85A32] text-[#C85A32]" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400 font-normal">({product.reviewCount} artisan reviews)</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="text-stone-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
                  {product.vendorLocation}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-xl bg-[#F4EBE1] border border-[#E8DCCF] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#2E2A25]/70 block">Unit Base Price</span>
                <span className="font-serif text-xl font-bold text-[#2E2A25]">
                  {formatPrice(unitPriceCents)}
                </span>
                {customModifiersTotalCents > 0 && (
                  <span className="text-[11px] text-[#C85A32] ml-2 font-medium">
                    (includes +{formatPrice(customModifiersTotalCents)} customizations)
                  </span>
                )}
              </div>
              <span className="text-xs text-[#5F7464] font-medium bg-white/80 px-2.5 py-1 rounded-full border border-[#5F7464]/20">
                COD Available
              </span>
            </div>

            {/* Product Story / Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                The Artisan's Story & Materials
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {product.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {product.materialsUsed.map((mat, i) => (
                  <span key={i} className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md border border-stone-200">
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            {/* Customization Options Section */}
            {product.isCustomizable && product.customizationOptions && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-amber-900/20 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-800" />
                    Handcrafted Customizations
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium">Made to Order</span>
                </div>

                {product.customizationOptions.map((opt) => (
                  <div key={opt.id} className="space-y-1">
                    <label className="text-xs font-semibold text-stone-800 flex justify-between">
                      <span>{opt.label}</span>
                      {opt.priceModifierCents > 0 && (
                        <span className="text-amber-800 font-normal">
                          +{formatPrice(opt.priceModifierCents)}
                        </span>
                      )}
                    </label>

                    {opt.type === 'text' && (
                      <input
                        type="text"
                        placeholder={opt.placeholder || 'Enter text to engrave / weave'}
                        value={customSelections[opt.label]?.value || ''}
                        onChange={(e) => handleCustomTextChange(opt.label, e.target.value, opt.priceModifierCents)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-800/30 focus:outline-none"
                      />
                    )}

                    {opt.type === 'select' && opt.options && (
                      <select
                        value={customSelections[opt.label]?.value || opt.options[0]}
                        onChange={(e) => handleCustomSelectChange(opt.label, e.target.value, opt.priceModifierCents)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-800/30 focus:outline-none"
                      >
                        {opt.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {/* Additional Special Note for Artisan */}
                <div className="pt-1">
                  <label className="text-xs font-semibold text-stone-800 block mb-1">
                    Custom Gift Note / Artisan Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g., 'Please pack in a wooden presentation box with a birthday greeting note for Anika.'"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-800/30 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 transition-colors text-sm font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-stone-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inStockQuantity, quantity + 1))}
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 transition-colors text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex-1">
                  <span className="text-[11px] text-stone-500 block">Total Item Amount</span>
                  <span className="font-serif text-2xl font-bold text-[#2E2A25]">
                    {formatPrice(totalPriceCents)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCartClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C85A32] hover:bg-[#A84825] text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                Add Handcrafted Item to Cart ({quantity})
              </button>
            </div>

            {/* Reviews Accordion Section */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-800" />
                Buyer Reviews ({productReviews.length})
              </h3>

              {productReviews.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No reviews yet. Be the first to leave a review after your purchase!</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">{rev.userName}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="font-medium text-stone-900">{rev.title}</p>
                      <p className="text-stone-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 space-y-2.5">
                <p className="text-xs font-bold text-stone-800">Write a Verified Buyer Review</p>
                {reviewSubmitted ? (
                  <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Thank you! Your review has been recorded.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star className={`w-4 h-4 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Review Headline"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                    />

                    <textarea
                      rows={2}
                      placeholder="Share your experience with the craftsmanship and finish..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
                    />

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
