import { useEffect, useState } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import type { ProductDTO, VendorDTO } from '@waw/contracts';
import { storefrontPath } from '../lib/api';
import {
  formatMoney,
  getStoreSnapshot,
  openQuickView,
  pushToast,
  setSelectedCategory,
  subscribeStore,
  toggleFavoriteShop,
  type CurrencyCode,
} from '../lib/store';

interface CuratedSectionsIslandProps {
  products: ProductDTO[];
  vendors: VendorDTO[];
}

const GIFT_OCCASION_CARDS = [
  {
    title: 'Earthenware & Vases',
    category: 'pottery',
    img: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
  },
  {
    title: 'Heirloom Jamdani',
    category: 'textiles',
    img: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
  },
  {
    title: 'Tarkashi Silver Gifts',
    category: 'jewelry',
    img: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
  },
] as const;

const SPECIAL_GIFT_TILES = [
  {
    label: 'Teak Tableware',
    category: 'woodwork',
    img: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
  },
  {
    label: 'Heritage Leather',
    category: 'leatherwork',
    img: '/images/artisans/product_heritage_leather_1795182012960.jpg',
  },
  {
    label: 'Cane & Shitalpati',
    category: 'handicrafts',
    img: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
  },
  {
    label: 'Rickshaw Folk Art',
    category: 'paintings',
    img: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
  },
  {
    label: 'Handloom Textiles',
    category: 'textiles',
    img: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
  },
] as const;

export function CuratedSectionsIsland({
  products,
  vendors,
}: CuratedSectionsIslandProps) {
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setFavoriteShopIds(snap.favoriteShopIds);
      setCurrency(snap.currency);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  const scrollToCatalog = (category?: string) => {
    if (category) setSelectedCategory(category);
    document
      .getElementById('collections')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleShop = (shop: VendorDTO, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavoriteShop(shop.id);
    pushToast(
      added
        ? `Following ${shop.displayName}.`
        : `Unfollowed ${shop.displayName}.`,
      'info'
    );
  };

  const editorPicks = products.slice(0, 6);
  const regionalStudios = vendors.slice(0, 3);
  const giftStripProducts = products.slice(0, 6);

  return (
    <div className="space-y-12 py-10 bg-[#FAF9F6]">
      {/* SECTION 1: EDITORS' PICKS - HANDCRAFTED HOME & LIVING */}
      {editorPicks.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-10 border border-[#E8DCCF]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Header Title Block */}
              <div className="lg:col-span-3 space-y-3 pt-2">
                <span className="text-xs font-semibold text-[#5F7464]">
                  Editors&apos; Picks
                </span>
                <h2 className="font-editorial font-bold text-3xl sm:text-4xl text-[#2E2A25] tracking-tight leading-tight">
                  Handcrafted Home &amp; Living
                </h2>
                <button
                  type="button"
                  onClick={() => scrollToCatalog('all')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E2A25] hover:text-[#C85A32] pt-2 transition-colors cursor-pointer group"
                >
                  <span>Shop these unique finds</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right 6-Piece Editorial Grid */}
              <div className="lg:col-span-9 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {editorPicks.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openQuickView(item)}
                      className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200 text-left"
                    >
                      <img
                        src={
                          item.imageUrl ||
                          '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
                        }
                        alt={item.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                        <p className="text-white text-xs font-semibold line-clamp-1">
                          {item.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                  {editorPicks.slice(3, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openQuickView(item)}
                      className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200 text-left"
                    >
                      <img
                        src={
                          item.imageUrl ||
                          '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
                        }
                        alt={item.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-[#2E2A25] shadow-xs border border-stone-200 tabular-nums">
                        {formatMoney(item.priceBdt, currency)}
                      </div>
                    </button>
                  ))}

                  <div className="col-span-2 sm:col-span-1 p-2 space-y-2 text-[#2E2A25]/80">
                    <p className="text-xs sm:text-sm font-normal leading-relaxed">
                      Elevate your home with small-batch terracotta, seasoned
                      teak woodcraft, and woven Shitalpati direct from master
                      workshops.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: DISCOVER SHOPS IN YOUR REGION */}
      {regionalStudios.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-10 border border-[#E8DCCF]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-3 space-y-4">
                <span className="text-xs text-[#5F7464] font-semibold">
                  Local finds? Artisans Market has it.
                </span>
                <h2 className="font-editorial font-bold text-3xl sm:text-4xl text-[#2E2A25] tracking-tight leading-tight">
                  Discover shops in your region
                </h2>
                <button
                  type="button"
                  onClick={() => scrollToCatalog('all')}
                  className="px-6 py-2.5 border border-[#2E2A25] text-[#2E2A25] hover:bg-[#2E2A25] hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer inline-block"
                >
                  Shop from local makers
                </button>
              </div>

              <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {regionalStudios.map((shop) => {
                  const isFav = favoriteShopIds.includes(shop.id);
                  return (
                    <a
                      key={shop.id}
                      href={storefrontPath(`/shops/${shop.publicSlug}`)}
                      className="bg-white rounded-2xl border border-[#2E2A25]/15 hover:border-[#2E2A25]/40 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <img
                          src={shop.bannerUrl}
                          alt={shop.displayName}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        <button
                          type="button"
                          onClick={(e) => handleToggleShop(shop, e)}
                          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all cursor-pointer ${
                            isFav
                              ? 'bg-[#C85A32] text-white'
                              : 'bg-white/90 hover:bg-white text-stone-700'
                          }`}
                          aria-label={isFav ? 'Unfollow shop' : 'Follow shop'}
                          title={isFav ? 'Unfollow shop' : 'Follow shop'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-3.5 flex items-center gap-3 bg-[#FAF9F6] border-t border-stone-100">
                        <img
                          src={shop.avatarUrl}
                          alt={shop.displayName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#2E2A25] group-hover:text-[#C85A32] transition-colors truncate">
                            {shop.displayName}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            {shop.workshopLocation} · {shop.craftSpecialty}
                          </p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: ARTISAN-SPECIAL GIFTS FOR BIRTHDAYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-8 border border-[#E8DCCF] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-editorial font-bold text-2xl sm:text-3xl text-[#2E2A25] tracking-tight">
              Artisan-special gifts for birthdays &amp; milestones
            </h2>
            <button
              type="button"
              onClick={() => scrollToCatalog('all')}
              className="px-5 py-2 bg-[#2E2A25] hover:bg-[#C85A32] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer self-start sm:self-auto"
            >
              Get inspired
            </button>
          </div>

          {/* 3 Visual Occasion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GIFT_OCCASION_CARDS.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => scrollToCatalog(card.category)}
                className="h-44 sm:h-52 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs border border-stone-200 bg-stone-900 text-left"
              >
                <img
                  src={card.img}
                  alt={card.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-bold text-base sm:text-lg">
                  {card.title}
                </div>
              </button>
            ))}
          </div>

          {/* Middle Row of 6 Live Priced Product Tiles */}
          {giftStripProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              {giftStripProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openQuickView(item)}
                  className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
                >
                  <img
                    src={
                      item.imageUrl ||
                      '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
                    }
                    alt={item.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200 flex items-center gap-1 tabular-nums">
                    <span>{formatMoney(item.priceBdt, currency)}</span>
                    {item.compareAtPriceBdt &&
                      item.compareAtPriceBdt > item.priceBdt && (
                        <span className="text-stone-400 line-through text-[9px]">
                          {formatMoney(item.compareAtPriceBdt, currency)}
                        </span>
                      )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bottom 5 Gift Category Tiles */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-[#2E2A25]">
              Gifts as special as they are
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SPECIAL_GIFT_TILES.map((tile) => (
                <button
                  key={tile.label}
                  type="button"
                  onClick={() => scrollToCatalog(tile.category)}
                  className="bg-white/80 hover:bg-white p-2.5 rounded-2xl border border-[#E8DCCF] flex items-center gap-3 cursor-pointer transition-colors group text-left"
                >
                  <img
                    src={tile.img}
                    alt={tile.label}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <span className="text-xs font-bold text-[#2E2A25] group-hover:text-[#C85A32] leading-tight">
                    {tile.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
