import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Star,
  X,
} from 'lucide-react';
import type { ProductDTO, ReviewDTO } from '@waw/contracts';
import { storefrontPath, wawApi } from '../lib/api';
import {
  addToCart,
  formatMoney,
  getStoreSnapshot,
  openQuickView,
  pushToast,
  setCartOpen,
  subscribeStore,
  toggleLocalWishlist,
  type CartSelection,
  type CurrencyCode,
} from '../lib/store';

interface SelectionItem {
  value: string;
  priceModifierBdt: number;
}

export function ProductDetailModalIsland() {
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customSelections, setCustomSelections] = useState<
    Record<string, SelectionItem>
  >({});
  const [customNote, setCustomNote] = useState('');

  // Live reviews state
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setProduct(snap.quickViewProduct);
      setCurrency(snap.currency);
      setWishlistIds(snap.wishlistIds);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  // Reset modal form & fetch live reviews whenever selected product changes
  useEffect(() => {
    if (!product) return;

    setSelectedImageIndex(0);
    setQuantity(1);
    setCustomNote('');
    setReviewSubmitted(false);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');

    const initial: Record<string, SelectionItem> = {};
    if (product.customizationOptions) {
      product.customizationOptions.forEach((opt) => {
        if (opt.type === 'select' && opt.options && opt.options.length > 0) {
          initial[opt.label] = {
            value: opt.options[0],
            priceModifierBdt: opt.priceModifierBdt,
          };
        } else if (opt.type === 'text') {
          initial[opt.label] = {
            value: '',
            priceModifierBdt: opt.priceModifierBdt,
          };
        }
      });
    }
    setCustomSelections(initial);

    let active = true;
    setLoadingReviews(true);
    wawApi
      .getReviews({ productId: product.id, status: 'approved' })
      .then((res) => {
        if (active) setReviews(res.data);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openQuickView(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      active = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [product?.id]);

  if (!product) return null;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          product.imageUrl ||
            '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
        ];
  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.currentStock > 0;

  const customModifiersTotalBdt = Object.values(customSelections).reduce(
    (sum, item) => (item.value ? sum + item.priceModifierBdt : sum),
    0
  );
  const unitPriceBdt = product.priceBdt + customModifiersTotalBdt;
  const totalPriceBdt = unitPriceBdt * quantity;

  const handleToggleWishlist = async () => {
    const added = toggleLocalWishlist(product.id);
    pushToast(
      added ? 'Saved to your wishlist.' : 'Removed from wishlist.',
      'info'
    );
    try {
      await wawApi.toggleWishlist('buyer-anika', product.id);
    } catch {
      // Optimistic local state retained
    }
  };

  const handleAddToCartClick = () => {
    const selectionsArray: CartSelection[] = Object.entries(customSelections)
      .filter(([, data]) => Boolean(data.value))
      .map(([label, data]) => ({
        optionLabel: label,
        value: data.value,
        priceModifierBdt: data.priceModifierBdt,
      }));

    addToCart(product, quantity, selectionsArray, customNote.trim() || undefined);
    openQuickView(null);
    setCartOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await wawApi.submitReview({
        productId: product.id,
        userId: 'buyer-anika',
        userName: 'Anika Rahman',
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviews((prev) => [res.data, ...prev]);
      setReviewSubmitted(true);
      setReviewTitle('');
      setReviewComment('');
      pushToast('Thank you! Your verified review is now live.', 'success');
    } catch (err) {
      pushToast(
        (err as Error).message || 'Could not submit review right now.',
        'error'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={() => openQuickView(null)}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 relative text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => openQuickView(null)}
          aria-label="Close product quick view"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Left Column: Image Gallery & Workshop Trust Box */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 relative shadow-inner">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label="Toggle wishlist"
                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#C85A32] text-white'
                    : 'bg-white/90 text-stone-700 hover:text-[#C85A32]'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-[#C85A32] ring-2 ring-[#C85A32]/30'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
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
                Made directly by <strong>{product.vendorName}</strong> in{' '}
                <em>{product.vendorLocation}</em>. 100% authentic local craft,
                fair artisan pricing &amp; eco-conscious packaging.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-[#2E2A25] pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5F7464]" />
                  {product.craftTimeDays} days handcraft time
                </span>
                <span>•</span>
                <span>In Stock: {product.currentStock} units</span>
              </div>
            </div>

            {/* Direct Link to Full Product Page */}
            <a
              href={storefrontPath(`/products/${product.id}`)}
              className="w-full py-2.5 px-4 rounded-xl border border-[#2E2A25]/20 hover:border-[#2E2A25] bg-[#FAF9F6] hover:bg-[#F4EBE1] text-xs font-bold text-[#2E2A25] flex items-center justify-center gap-2 transition-colors"
            >
              <span>Open Full Product Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#C85A32]" />
            </a>
          </div>

          {/* Right Column: Details, Customizations & Reviews */}
          <div className="space-y-5">
            <div>
              <a
                href={storefrontPath(`/shops/${product.vendorSlug}`)}
                className="text-xs font-bold uppercase tracking-wider text-[#C85A32] hover:underline inline-flex items-center gap-1"
              >
                <span>{product.vendorName}</span>
                <span className="text-[10px] font-normal lowercase text-stone-500">
                  (Visit Shop →)
                </span>
              </a>
              <h2 className="font-editorial text-2xl font-bold text-[#2E2A25] mt-1 leading-snug">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center text-[#2E2A25] font-bold gap-1 tabular-nums">
                  <Star className="w-4 h-4 fill-[#C85A32] text-[#C85A32]" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400 font-normal">
                    ({Math.max(product.reviewCount, reviews.length)} reviews)
                  </span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="text-stone-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
                  {product.vendorLocation}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3.5 rounded-xl bg-[#F4EBE1] border border-[#E8DCCF] flex items-center justify-between gap-2">
              <div>
                <span className="text-xs text-[#2E2A25]/70 block">
                  Unit Price
                </span>
                <span className="font-editorial text-xl font-bold text-[#2E2A25] tabular-nums">
                  {formatMoney(unitPriceBdt, currency)}
                </span>
                {customModifiersTotalBdt > 0 && (
                  <span className="text-[11px] text-[#C85A32] ml-2 font-medium tabular-nums">
                    (+{formatMoney(customModifiersTotalBdt, currency)} custom)
                  </span>
                )}
              </div>
              <span className="text-xs text-[#5F7464] font-medium bg-white/85 px-2.5 py-1 rounded-full border border-[#5F7464]/20">
                COD Available
              </span>
            </div>

            {/* Product Story / Materials */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                The Artisan&apos;s Story &amp; Materials
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {product.description}
              </p>
              {product.materialsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {product.materialsUsed.map((mat, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md border border-stone-200"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Customization Options */}
            {product.isCustomizable &&
              product.customizationOptions.length > 0 && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-amber-900/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#C85A32]" />
                      Handcrafted Customizations
                    </span>
                    <span className="text-[11px] text-[#C85A32] font-medium">
                      Made to Order
                    </span>
                  </div>

                  {product.customizationOptions.map((opt) => (
                    <div key={opt.id} className="space-y-1">
                      <label className="text-xs font-semibold text-stone-800 flex justify-between">
                        <span>{opt.label}</span>
                        {opt.priceModifierBdt > 0 && (
                          <span className="text-[#C85A32] font-normal tabular-nums">
                            +{formatMoney(opt.priceModifierBdt, currency)}
                          </span>
                        )}
                      </label>

                      {opt.type === 'text' && (
                        <input
                          type="text"
                          placeholder={
                            opt.placeholder || 'Enter text to engrave / weave'
                          }
                          value={customSelections[opt.label]?.value || ''}
                          onChange={(e) =>
                            setCustomSelections((prev) => ({
                              ...prev,
                              [opt.label]: {
                                value: e.target.value,
                                priceModifierBdt: opt.priceModifierBdt,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#C85A32]/30 focus:outline-none"
                        />
                      )}

                      {opt.type === 'select' && opt.options && (
                        <select
                          value={
                            customSelections[opt.label]?.value || opt.options[0]
                          }
                          onChange={(e) =>
                            setCustomSelections((prev) => ({
                              ...prev,
                              [opt.label]: {
                                value: e.target.value,
                                priceModifierBdt: opt.priceModifierBdt,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#C85A32]/30 focus:outline-none"
                        >
                          {opt.options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}

                  <div className="pt-1">
                    <label className="text-xs font-semibold text-stone-800 block mb-1">
                      Custom Gift Note / Artisan Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="e.g., 'Please pack in a jute presentation box with a birthday note.'"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#C85A32]/30 focus:outline-none"
                    />
                  </div>
                </div>
              )}

            {/* Quantity & Add to Cart */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 transition-colors text-sm font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        Math.min(Math.max(1, product.currentStock), quantity + 1)
                      )
                    }
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 transition-colors text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right flex-1">
                  <span className="text-[11px] text-stone-500 block">
                    Total Item Amount
                  </span>
                  <span className="font-editorial text-2xl font-bold text-[#2E2A25] tabular-nums">
                    {formatMoney(totalPriceBdt, currency)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!inStock}
                onClick={handleAddToCartClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#C85A32] hover:bg-[#A84825] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-white" />
                {inStock
                  ? `Add Handcrafted Item to Cart (${quantity})`
                  : 'Currently Out of Stock'}
              </button>
            </div>

            {/* Live Buyer Reviews */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <h3 className="font-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#C85A32]" />
                Buyer Reviews ({reviews.length})
              </h3>

              {loadingReviews ? (
                <div className="flex items-center gap-2 text-xs text-stone-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading verified reviews...
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-stone-500 italic">
                  No reviews yet. Be the first to share your experience with
                  this artisan piece!
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">
                          {rev.userName}
                        </span>
                        <div className="flex text-[#C85A32]">
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
              <form
                onSubmit={handleReviewSubmit}
                className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 space-y-2.5"
              >
                <p className="text-xs font-bold text-stone-800">
                  Write a Verified Buyer Review
                </p>
                {reviewSubmitted ? (
                  <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Thank you! Your review has
                    been recorded.
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
                            <Star
                              className={`w-4 h-4 ${
                                star <= reviewRating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
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
                      disabled={reviewSubmitting}
                      className="px-4 py-1.5 bg-[#2E2A25] text-white rounded-lg text-xs font-medium hover:bg-[#C85A32] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
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
}
