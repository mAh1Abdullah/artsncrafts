import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import type { ProductDTO, ReviewDTO } from '@waw/contracts';
import { storefrontPath, wawApi } from '../lib/api';
import {
  addToCart,
  formatMoney,
  getStoreSnapshot,
  pushToast,
  setCartOpen,
  subscribeStore,
  toggleLocalWishlist,
  type CartSelection,
  type CurrencyCode,
} from '../lib/store';

interface ProductDetailIslandProps {
  product: ProductDTO;
  initialReviews: ReviewDTO[];
}

export function ProductDetailIsland({
  product,
  initialReviews,
}: ProductDetailIslandProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customNote, setCustomNote] = useState('');
  const [reviews, setReviews] = useState<ReviewDTO[]>(initialReviews);

  // Review submission state
  const [reviewerName, setReviewerName] = useState('Anika Rahman');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCurrency(snap.currency);
      setWishlistIds(snap.wishlistIds);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.currentStock > 0;

  const extraBdt = product.customizationOptions.reduce((sum, opt) => {
    const val = customValues[opt.id];
    if (val && val.trim()) {
      return sum + (opt.priceModifierBdt || 0);
    }
    return sum;
  }, 0);

  const effectiveUnitBdt = product.priceBdt + extraBdt;

  const handleAddToBag = () => {
    const selections: CartSelection[] = product.customizationOptions
      .filter((opt) => customValues[opt.id]?.trim())
      .map((opt) => ({
        optionLabel: opt.label,
        value: customValues[opt.id].trim(),
        priceModifierBdt: opt.priceModifierBdt || 0,
      }));
    addToCart(product, quantity, selections, customNote.trim() || undefined);
    setCartOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await wawApi.submitReview({
        productId: product.id,
        userId: 'buyer-anika',
        userName: reviewerName.trim() || 'Verified Collector',
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviews((prev) => [res.data, ...prev]);
      setReviewTitle('');
      setReviewComment('');
      pushToast('Thank you! Your review has been published.', 'success');
    } catch (err) {
      pushToast((err as Error).message || 'Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-7">
          <div className="aspect-[4/4] rounded-xl overflow-hidden bg-[#EFE9E0]">
            <img
              src={
                product.imageUrl ||
                '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div>
            <a
              href={storefrontPath(`/shops/${product.vendorSlug}`)}
              className="text-xs font-semibold uppercase tracking-widest text-[#B84A27] hover:underline"
            >
              {product.vendorName}
            </a>
            <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-[#221E1B] leading-tight">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#6E6359]">
              <span className="inline-flex items-center gap-1 font-mono text-[#221E1B]">
                <Star className="h-3.5 w-3.5 fill-[#B84A27] text-[#B84A27]" />
                {product.rating.toFixed(1)} ({reviews.length || product.reviewCount} reviews)
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {product.vendorLocation}
              </span>
              <span className="font-mono">SKU {product.sku}</span>
            </div>
          </div>

          <div className="py-4 border-y border-[#E5DDD2] flex items-baseline justify-between">
            <div>
              <span className="font-mono text-3xl font-semibold tabular-nums text-[#221E1B]">
                {formatMoney(effectiveUnitBdt, currency)}
              </span>
              {product.compareAtPriceBdt &&
                product.compareAtPriceBdt > product.priceBdt && (
                  <span className="ml-2.5 font-mono text-sm line-through text-[#9A8E82]">
                    {formatMoney(product.compareAtPriceBdt, currency)}
                  </span>
                )}
            </div>
            <span
              className={`text-xs font-medium ${
                inStock ? 'text-[#4D6B59]' : 'text-rose-700'
              }`}
            >
              {inStock
                ? `${product.currentStock} available in workshop`
                : 'Currently out of stock'}
            </span>
          </div>

          <p className="text-sm text-[#4A413A] leading-relaxed">
            {product.description}
          </p>

          {/* Bespoke Customizer */}
          {product.isCustomizable && product.customizationOptions.length > 0 && (
            <div className="rounded-lg border border-[#E2D9CC] bg-[#F3EFE9]/70 p-4 space-y-3.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#221E1B]">
                Artisan Personalization
              </div>
              {product.customizationOptions.map((opt) => (
                <div key={opt.id}>
                  <label className="block text-xs font-medium text-[#574E46] mb-1">
                    {opt.label}
                    {opt.priceModifierBdt > 0 && (
                      <span className="ml-1.5 font-mono text-[#B84A27]">
                        (+{formatMoney(opt.priceModifierBdt, currency)})
                      </span>
                    )}
                  </label>
                  {opt.type === 'select' && opt.options ? (
                    <select
                      value={customValues[opt.id] ?? ''}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [opt.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Choose finish...</option>
                      {opt.options.map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customValues[opt.id] ?? ''}
                      onChange={(e) =>
                        setCustomValues((prev) => ({
                          ...prev,
                          [opt.id]: e.target.value,
                        }))
                      }
                      placeholder={opt.placeholder || 'Enter bespoke instruction'}
                      className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1">
                  Note for Master Artisan (optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Gift message or special handling note"
                  className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Quantity & Primary Purchase CTA */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-[#D8CFC3] rounded-lg bg-white h-12">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 h-full text-[#574E46] hover:text-[#221E1B]"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(Math.max(1, product.currentStock), q + 1)
                  )
                }
                className="px-3.5 h-full text-[#574E46] hover:text-[#221E1B]"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!inStock}
              onClick={handleAddToBag}
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Bag</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const added = toggleLocalWishlist(product.id);
                pushToast(
                  added ? 'Saved to wishlist.' : 'Removed from wishlist.',
                  'info'
                );
                await wawApi
                  .toggleWishlist('buyer-anika', product.id)
                  .catch(() => {});
              }}
              aria-label="Toggle wishlist"
              className={`h-12 w-12 rounded-lg border flex items-center justify-center transition-colors ${
                isWishlisted
                  ? 'border-[#B84A27] bg-[#B84A27] text-white'
                  : 'border-[#D8CFC3] bg-white text-[#221E1B] hover:border-[#221E1B]'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
              />
            </button>
          </div>

          {/* Provenance & Materials */}
          <div className="pt-4 border-t border-[#E5DDD2] space-y-2.5 text-xs text-[#574E46]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#B84A27] shrink-0" />
              <span>
                Craft lead time: {product.craftTimeDays} days directly from{' '}
                {product.vendorLocation}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#4D6B59] shrink-0" />
              <span>
                Materials: {product.materialsUsed.join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#4D6B59] shrink-0" />
              <span>
                Live inventory synced with WAW-POS · Insured Pathao & Steadfast
                delivery
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Collector Reviews */}
      <section className="pt-12 border-t border-[#E5DDD2] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="font-editorial text-2xl font-semibold text-[#221E1B]">
            Collector Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-[#6E6359]">
              Be the first collector to review this handcrafted piece.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-lg border border-[#E5DDD2] bg-white p-5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[#221E1B]">
                      {rev.title}
                    </span>
                    <span className="font-mono text-xs text-[#B84A27]">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-[#574E46] leading-relaxed">
                    {rev.comment}
                  </p>
                  <div className="text-xs text-[#8B7E71]">
                    {rev.userName} ·{' '}
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleReviewSubmit}
          className="lg:col-span-5 rounded-xl border border-[#E5DDD2] bg-[#F3EFE9]/70 p-6 space-y-4 self-start"
        >
          <h3 className="font-editorial text-lg font-semibold text-[#221E1B]">
            Write a Review
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#574E46] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#574E46] mb-1">
                Rating
              </label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
              >
                <option value={5}>5 Stars — Exceptional</option>
                <option value={4}>4 Stars — Great</option>
                <option value={3}>3 Stars — Good</option>
                <option value={2}>2 Stars — Fair</option>
                <option value={1}>1 Star — Poor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#574E46] mb-1">
              Review Headline
            </label>
            <input
              type="text"
              required
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Summarize your craftsmanship impression"
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#574E46] mb-1">
              Your Review
            </label>
            <textarea
              rows={3}
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share details on finish, packaging, and authenticity..."
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submittingReview}
            className="w-full py-2.5 rounded-lg bg-[#221E1B] hover:bg-[#B84A27] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submittingReview ? 'Submitting...' : 'Publish Review'}
          </button>
        </form>
      </section>
    </div>
  );
}
