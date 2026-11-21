import { useEffect, useMemo, useState } from 'react';
import { Heart, Search, ShoppingBag, Star } from 'lucide-react';
import type { ProductDTO } from '@waw/contracts';
import { wawApi } from '../lib/api';
import {
  addToCart,
  formatMoney,
  getStoreSnapshot,
  pushToast,
  setCartOpen,
  subscribeStore,
  toggleLocalWishlist,
  type CurrencyCode,
} from '../lib/store';

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
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('-createdAt');
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCurrency(snap.currency);
      setWishlistIds(snap.wishlistIds);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  // Refresh live catalog from Next.js REST API on client mount to keep stock fresh
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

  const handleToggleWishlist = async (productId: string) => {
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
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-[#221E1B] text-[#FAF9F6]'
                    : 'bg-transparent text-[#574E46] hover:bg-[#EFE9E0] hover:text-[#221E1B]'
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Jamdani, pottery, wood..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-[#DED6CA] bg-white text-sm text-[#221E1B] placeholder:text-[#9A8E82] focus:border-[#221E1B] focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            className="rounded-md border border-[#DED6CA] bg-white px-3 py-2 text-xs font-medium text-[#221E1B] focus:border-[#221E1B] focus:outline-none"
          >
            <option value="-createdAt">Featured</option>
            <option value="priceBdt">Price: Low to High</option>
            <option value="-priceBdt">Price: High to Low</option>
            <option value="-rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Uniform 3-Column Product Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#E5DDD2] bg-[#F3EFE9]/60">
          <p className="font-editorial text-xl text-[#221E1B]">
            No handcrafted pieces matched your filter
          </p>
          <p className="mt-1 text-sm text-[#6E6359]">
            Try clearing your search or switching to All Crafts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
          {filtered.map((product) => {
            const isWishlisted = wishlistIds.includes(product.id);
            const inStock = product.currentStock > 0;
            return (
              <article key={product.id} className="group flex flex-col">
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-[#EFE9E0] mb-4">
                  <a href={`/products/${product.id}`} className="block w-full h-full">
                    <img
                      src={
                        product.imageUrl ||
                        '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
                      }
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleWishlist(product.id)}
                    aria-label="Save to wishlist"
                    className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                      isWishlisted
                        ? 'bg-[#B84A27] text-white'
                        : 'bg-white/85 text-[#221E1B] hover:bg-white'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
                    />
                  </button>

                  {!inStock && (
                    <div className="absolute bottom-3 left-3 bg-[#221E1B]/85 text-white text-[11px] font-medium px-2.5 py-1 rounded">
                      Sold Out
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6E6359]">
                    <a
                      href={`/shops/${product.vendorSlug}`}
                      className="hover:text-[#B84A27] truncate"
                    >
                      {product.vendorName}
                    </a>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#221E1B] shrink-0">
                      <Star className="h-3 w-3 fill-[#B84A27] text-[#B84A27]" />
                      {product.rating.toFixed(1)}
                    </span>
                  </div>

                  <a
                    href={`/products/${product.id}`}
                    className="mt-1 font-editorial text-lg font-medium text-[#221E1B] group-hover:text-[#B84A27] transition-colors leading-snug line-clamp-2"
                  >
                    {product.name}
                  </a>

                  <div className="mt-3 pt-3 border-t border-[#ECE4D9] flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-base font-semibold tabular-nums text-[#221E1B]">
                        {formatMoney(product.priceBdt, currency)}
                      </span>
                      {product.compareAtPriceBdt &&
                        product.compareAtPriceBdt > product.priceBdt && (
                          <span className="ml-2 font-mono text-xs line-through text-[#9A8E82] tabular-nums">
                            {formatMoney(product.compareAtPriceBdt, currency)}
                          </span>
                        )}
                    </div>

                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => {
                        addToCart(product, 1);
                        setCartOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#221E1B] hover:bg-[#B84A27] text-[#FAF9F6] text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
