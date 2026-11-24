import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { ProductDTO } from '@waw/contracts';
import { wawApi } from '../lib/api';
import {
  addToCart,
  getStoreSnapshot,
  openQuickView,
  pushToast,
  setCartOpen,
  setSearchQuery,
  setSelectedCategory,
  subscribeStore,
  toggleLocalWishlist,
  type CurrencyCode,
} from '../lib/store';
import { ProductCard } from './ProductCard';

interface CatalogExplorerProps {
  initialProducts: ProductDTO[];
  fixedVendorSlug?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Crafts' },
  { id: 'pottery', label: 'Pottery' },
  { id: 'textiles', label: 'Textiles' },
  { id: 'woodwork', label: 'Woodwork' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'leatherwork', label: 'Leather' },
  { id: 'paintings', label: 'Folk Art' },
  { id: 'handicrafts', label: 'Cane & Reed' },
] as const;

export function CatalogExplorer({
  initialProducts,
  fixedVendorSlug,
}: CatalogExplorerProps) {
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [category, setCategoryState] = useState<string>('all');
  const [search, setSearchState] = useState('');
  const [sort, setSort] = useState<string>('-createdAt');
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Subscribe to shared storefront state (Header search bar + Hero category circles)
  useEffect(() => {
    if (typeof window !== 'undefined' && !fixedVendorSlug) {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) setSearchQuery(q);
    }

    const sync = () => {
      const snap = getStoreSnapshot();
      setCurrency(snap.currency);
      setWishlistIds(snap.wishlistIds);
      if (!fixedVendorSlug) {
        setCategoryState(snap.selectedCategory);
        setSearchState(snap.searchQuery);
      }
    };
    sync();
    return subscribeStore(sync);
  }, [fixedVendorSlug]);

  // Refresh live catalog from Next.js REST API on client mount
  useEffect(() => {
    wawApi
      .getProducts({
        limit: 48,
        vendorId: fixedVendorSlug,
      })
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        }
      })
      .catch(() => {
        // Keep SSR initialProducts if offline
      });
  }, [fixedVendorSlug]);

  const handleCategoryChange = (nextCat: string) => {
    setCategoryState(nextCat);
    if (!fixedVendorSlug) setSelectedCategory(nextCat);
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearchState(nextSearch);
    if (!fixedVendorSlug) setSearchQuery(nextSearch);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === 'priceBdt') {
      list.sort((a, b) => a.priceBdt - b.priceBdt);
    } else if (sort === '-priceBdt') {
      list.sort((a, b) => b.priceBdt - a.priceBdt);
    } else if (sort === '-rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [products, category, search, sort]);

  const handleToggleWishlist = async (
    productId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const added = toggleLocalWishlist(productId);
    pushToast(
      added ? 'Saved to your wishlist.' : 'Removed from wishlist.',
      'info'
    );
    try {
      await wawApi.toggleWishlist('buyer-anika', productId);
    } catch {
      // Local wishlist state already updated
    }
  };

  const handleQuickAdd = (product: ProductDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setCartOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5DDD2]">
        {!fixedVendorSlug && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  category === cat.id
                    ? 'bg-[#2E2A25] text-[#FAF9F6]'
                    : 'bg-[#F4EBE1]/70 text-[#2E2A25] hover:bg-[#F4EBE1]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 text-[#8B7E71] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Filter Jamdani, pottery, wood..."
              className="w-full pl-9 pr-3 py-2 rounded-full border border-[#DED6CA] bg-white text-xs text-[#2E2A25] placeholder:text-[#9A8E82] focus:border-[#C85A32] focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            className="rounded-full border border-[#DED6CA] bg-white px-3.5 py-2 text-xs font-medium text-[#2E2A25] focus:border-[#C85A32] focus:outline-none"
          >
            <option value="-createdAt">Featured</option>
            <option value="priceBdt">Price: Low to High</option>
            <option value="-priceBdt">Price: High to Low</option>
            <option value="-rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-[#E8DCCF] bg-[#F4EBE1]/60 space-y-3">
          <p className="font-editorial text-xl text-[#2E2A25]">
            No handcrafted pieces matched your filter
          </p>
          <p className="text-sm text-[#6E6359]">
            Try clearing your search or switching back to All Crafts.
          </p>
          <button
            type="button"
            onClick={() => {
              handleCategoryChange('all');
              handleSearchChange('');
            }}
            className="px-5 py-2 rounded-full bg-[#2E2A25] hover:bg-[#C85A32] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={(p) => openQuickView(p)}
              onQuickAddToCart={handleQuickAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
