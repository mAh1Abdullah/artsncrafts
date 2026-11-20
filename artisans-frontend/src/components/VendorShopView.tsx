import React, { useState } from 'react';
import { VendorProfile, Product, ProductReview } from '../types';
import { ProductCard } from './ProductCard';
import { formatPrice } from '../utils/cuid';
import { 
  Star, MapPin, CheckCircle2, ShieldCheck, Heart, 
  Share2, MessageCircle, Search, ArrowLeft, Award, 
  Sparkles, Sliders, Calendar, Package, ThumbsUp, Store
} from 'lucide-react';

interface VendorShopViewProps {
  vendor: VendorProfile;
  products: Product[];
  reviews: ProductReview[];
  wishlist: string[];
  onToggleWishlist: (id: string, e?: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
  onOpenAdvisor: () => void;
  onBack: () => void;
  onShowToast?: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
}

export const VendorShopView: React.FC<VendorShopViewProps> = ({
  vendor,
  products,
  reviews,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
  onOpenAdvisor,
  onBack,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'about' | 'reviews'>('items');
  const [shopSearch, setShopSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFavorited, setIsFavorited] = useState(false);

  // Products belonging to this vendor
  const vendorProducts = products.filter(
    p => p.vendorProfileId === vendor.id || p.vendorName === vendor.displayName
  );

  // Filtered by search & category
  const filteredProducts = vendorProducts.filter(p => {
    const matchesSearch = !shopSearch || 
      p.title.toLowerCase().includes(shopSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(shopSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Unique categories for this vendor's items
  const categories: string[] = Array.from(new Set(vendorProducts.map(p => p.category)));

  // Shop reviews
  const shopReviews = reviews.filter(r => r.vendorProfileId === vendor.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    if (onShowToast) {
      onShowToast('Shop Link Copied', `Direct link to ${vendor.displayName} copied to clipboard!`, 'success');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (onShowToast) {
      onShowToast(
        !isFavorited ? 'Saved to Favorite Shops' : 'Removed from Favorites',
        !isFavorited ? `You will receive updates when ${vendor.displayName} posts new items.` : `Shop removed from saved list.`,
        'info'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-16">
      
      {/* Top Navigation Back Bar */}
      <div className="bg-white border-b border-[#2E2A25]/15 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-[#2E2A25] hover:text-[#C85A32] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isFavorited 
                  ? 'bg-[#C85A32] text-white border-[#C85A32]' 
                  : 'bg-white text-[#2E2A25] border-stone-300 hover:border-stone-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'Favorite Shop' : 'Follow Shop'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-[#F4EBE1] hover:bg-stone-200 text-[#2E2A25] transition-colors cursor-pointer"
              title="Share Shop"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Shop Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-stone-900 overflow-hidden">
        <img
          src={vendor.bannerUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=1200'}
          alt={vendor.displayName}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
      </div>

      {/* Shop Profile Header Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Avatar & Shop Name */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-stone-100 shrink-0">
                <img
                  src={vendor.avatarUrl || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=300'}
                  alt={vendor.displayName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                    {vendor.displayName}
                  </h1>
                  {vendor.verifiedArtisan && (
                    <span className="inline-flex items-center gap-1 bg-[#F4EBE1] text-[#C85A32] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#C85A32]/20">
                      <CheckCircle2 className="w-3 h-3 text-[#5F7464] fill-current" />
                      Star Seller
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#2E2A25]/80">
                  {vendor.craftSpecialty}
                </p>

                <div className="flex items-center gap-4 text-xs text-stone-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[#2E2A25]">
                    <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
                    {vendor.workshopLocation}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#2E2A25]">
                    <Star className="w-3.5 h-3.5 fill-[#C85A32] text-[#C85A32]" />
                    {vendor.rating.toFixed(1)}
                    <span className="font-normal text-stone-500">({vendor.reviewCount} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-[#5F7464]" />
                    {vendorProducts.length} Items
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Callouts */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={onOpenAdvisor}
                className="px-5 py-2.5 bg-[#2E2A25] hover:bg-[#C85A32] text-white text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-amber-300" />
                <span>Contact Maker / Bespoke Request</span>
              </button>
            </div>

          </div>

          {/* Description Bio */}
          <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <p className="md:col-span-8 text-xs sm:text-sm text-[#2E2A25] leading-relaxed">
              {vendor.description}
            </p>

            {/* Guarantee Pills */}
            <div className="md:col-span-4 bg-[#F4EBE1] p-4 rounded-2xl border border-[#E8DCCF] space-y-2 text-xs text-[#2E2A25]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5F7464]" />
                <span className="font-semibold text-[#2E2A25]">Buyer Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-[#2E2A25]/70">
                Direct trade, artisan-verified craftsmanship, and doorstep insured delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="border-b border-[#2E2A25]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-3 relative transition-colors cursor-pointer ${
                activeTab === 'items' ? 'text-[#2E2A25] font-bold' : 'text-stone-500 hover:text-[#2E2A25]'
              }`}
            >
              <span>Items ({vendorProducts.length})</span>
              {activeTab === 'items' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C85A32] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 relative transition-colors cursor-pointer ${
                activeTab === 'about' ? 'text-[#2E2A25] font-bold' : 'text-stone-500 hover:text-[#2E2A25]'
              }`}
            >
              <span>About the Maker</span>
              {activeTab === 'about' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C85A32] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 relative transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'text-[#2E2A25] font-bold' : 'text-stone-500 hover:text-[#2E2A25]'
              }`}
            >
              <span>Reviews ({vendor.reviewCount})</span>
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C85A32] rounded-full" />
              )}
            </button>
          </div>

          {/* Search inside shop */}
          {activeTab === 'items' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items in this shop..."
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F4EBE1] border border-stone-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
              />
            </div>
          )}

        </div>
      </div>

      {/* TAB CONTENT 1: ITEMS CATALOG */}
      {activeTab === 'items' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          
          {/* Category Chips Filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#2E2A25] text-white'
                    : 'bg-[#F4EBE1] text-[#2E2A25] hover:bg-stone-200'
                }`}
              >
                All Items ({vendorProducts.length})
              </button>

              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#C85A32] text-white'
                      : 'bg-[#F4EBE1] text-[#2E2A25] hover:bg-stone-200'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Store className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-stone-800 font-bold text-base">No items found in this shop</p>
              <p className="text-xs text-stone-500">Try clearing your search query.</p>
              <button
                onClick={() => { setShopSearch(''); setSelectedCategory('all'); }}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-full hover:bg-stone-800 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onSelectProduct={onSelectProduct}
                  onQuickAddToCart={onQuickAddToCart}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 2: ABOUT THE MAKER */}
      {activeTab === 'about' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6">
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              Meet the Master Artisan behind {vendor.displayName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-4/3 rounded-2xl overflow-hidden border border-stone-200">
                <img
                  src={vendor.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600'}
                  alt={vendor.displayName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  Heritage Master Craftsman
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Dedicated to preserving ancestral techniques
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Every product from {vendor.displayName} is hand-finished with utmost care. By purchasing directly from this workshop, you support local employment, sustain traditional artisanal heritage, and reduce mass industrial waste.
                </p>
                <div className="text-xs font-semibold text-stone-800 space-y-1">
                  <p>📍 Workshop: {vendor.workshopLocation}</p>
                  <p>✉️ Support: {vendor.supportEmail}</p>
                  <p>📞 Phone: {vendor.supportPhone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-2xl text-stone-900">
                  Shop Reviews & Feedback
                </h2>
                <p className="text-xs text-stone-500">
                  Verified customer ratings for {vendor.displayName}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-stone-900 flex items-center gap-1 justify-end">
                  <Star className="w-6 h-6 fill-[#F1641E] text-[#F1641E]" />
                  <span>{vendor.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-stone-500">{vendor.reviewCount} customer reviews</p>
              </div>
            </div>

            {shopReviews.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-600">No specific reviews written yet. Customers consistently rate this shop 5 stars!</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-stone-100">
                {shopReviews.map((rev) => (
                  <div key={rev.id} className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.userAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                          alt={rev.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-stone-900">{rev.userName}</span>
                      </div>
                      <div className="flex items-center text-[#F1641E] gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-stone-300'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900">{rev.title}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-stone-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
