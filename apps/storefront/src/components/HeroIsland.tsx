import {
  Award,
  Bot,
  Heart,
  Layers,
  ShieldCheck,
  Star,
} from 'lucide-react';
import type { ProductDTO } from '@waw/contracts';
import { storefrontPath } from '../lib/api';
import {
  formatMoney,
  getStoreSnapshot,
  openQuickView,
  setAdvisorOpen,
  setSelectedCategory,
  subscribeStore,
  type CurrencyCode,
} from '../lib/store';
import { useEffect, useState } from 'react';

interface HeroIslandProps {
  spotlightProduct?: ProductDTO | null;
}

const CATEGORY_CIRCLES = [
  {
    id: 'pottery',
    title: 'Pottery & Clay',
    img: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
  },
  {
    id: 'textiles',
    title: 'Jamdani & Sarees',
    img: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
  },
  {
    id: 'woodwork',
    title: 'Teak & Woodcraft',
    img: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
  },
  {
    id: 'jewelry',
    title: 'Silver & Jewelry',
    img: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
  },
  {
    id: 'paintings',
    title: 'Rickshaw Folk Art',
    img: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
  },
  {
    id: 'handicrafts',
    title: 'Cane & Shitalpati',
    img: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
  },
  {
    id: 'leatherwork',
    title: 'Heritage Leather',
    img: '/images/artisans/product_heritage_leather_1795182012960.jpg',
  },
  {
    id: 'all',
    title: 'Workshop Exclusives',
    img: '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
  },
] as const;

export function HeroIsland({ spotlightProduct }: HeroIslandProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');

  useEffect(() => {
    const sync = () => setCurrency(getStoreSnapshot().currency);
    sync();
    return subscribeStore(sync);
  }, []);

  const scrollToCatalog = (category?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    const el = document.getElementById('collections');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const spotlightImg =
    spotlightProduct?.imageUrl ||
    '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg';
  const spotlightTitle =
    spotlightProduct?.name || 'Authentic Dhamrai Terracotta Pitchers';
  const spotlightPrice = spotlightProduct?.priceBdt ?? 1450;

  return (
    <section className="bg-[#FAF9F6] border-b border-[#2E2A25]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        {/* Centered Welcome Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E2A25] tracking-tight leading-[1.12]">
            Find things you&apos;ll love. <br className="hidden sm:inline" />
            <span className="italic text-[#C85A32]">
              Support independent artisans.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#2E2A25]/80">
            Discover one-of-a-kind handcrafted goods, heritage textiles, and
            custom gifts directly from verified Bangladeshi workshops.
          </p>
        </div>

        {/* 8 Circular Category Thumbnails */}
        <div className="space-y-3 mb-10">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-[#2E2A25] tracking-wide">
              Discover one-of-a-kind items
            </h2>
            <button
              type="button"
              onClick={() => scrollToCatalog('all')}
              className="text-xs font-semibold text-[#C85A32] hover:underline cursor-pointer"
            >
              Shop all categories →
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
            {CATEGORY_CIRCLES.map((circle) => (
              <button
                key={circle.id}
                type="button"
                onClick={() => scrollToCatalog(circle.id)}
                className="group flex flex-col items-center text-center space-y-2 cursor-pointer focus:outline-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white shadow-xs group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 bg-[#F4EBE1] relative">
                  <img
                    src={circle.img}
                    alt={circle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-[#2E2A25] group-hover:text-[#C85A32] transition-colors line-clamp-2 leading-tight">
                  {circle.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Cards Grid: Artisans' Choice + Wholesale Material Hub */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Spotlight Artisans' Choice Banner */}
          <div className="md:col-span-7 bg-[#F4EBE1] rounded-3xl p-6 sm:p-8 border border-[#E8DCCF] flex flex-col sm:flex-row items-center gap-6 shadow-xs relative overflow-hidden">
            <div className="flex-1 space-y-3 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C85A32] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                <Award className="w-3 h-3 text-amber-200" />
                Artisans&apos; Choice
              </div>

              <h3 className="font-editorial font-bold text-2xl sm:text-3xl text-[#2E2A25] leading-tight">
                {spotlightTitle}
              </h3>

              <p className="text-xs text-[#2E2A25]/80 leading-relaxed">
                Hand-thrown in Dhamrai using river-bank alluvial clay. Naturally
                porous, eco-friendly, and backed by live WAW-POS workshop
                inventory.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (spotlightProduct) {
                      openQuickView(spotlightProduct);
                    } else {
                      scrollToCatalog('pottery');
                    }
                  }}
                  className="bg-[#2E2A25] hover:bg-[#C85A32] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Shop Dhamrai Terracotta
                </button>
                <span className="text-xs font-bold text-[#C85A32] tabular-nums">
                  From {formatMoney(spotlightPrice, currency)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (spotlightProduct) {
                  openQuickView(spotlightProduct);
                } else {
                  scrollToCatalog('pottery');
                }
              }}
              className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white relative group cursor-pointer"
            >
              <img
                src={spotlightImg}
                alt={spotlightTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </button>
          </div>

          {/* Wholesale Raw Materials & AI Bespoke Assistant Portal */}
          <div className="md:col-span-5 bg-[#2E2A25] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full">
                <Layers className="w-3 h-3 text-amber-300" />
                Wholesale Material Hub
              </div>
              <h3 className="font-editorial font-bold text-xl sm:text-2xl text-white">
                Bulk Craft Supplies for Creators
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Order raw pottery clay, kiln-dried teak timber planks, mulberry
                silk yarns, and export jute packaging directly from verified
                origin suppliers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={storefrontPath('/raw-materials')}
                className="flex-1 bg-[#C85A32] hover:bg-[#A84825] text-white px-4 py-2.5 rounded-full text-xs font-bold text-center transition-colors"
              >
                Browse Raw Supplies
              </a>
              <button
                type="button"
                onClick={() => setAdvisorOpen(true)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-4 py-2.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Bespoke Request</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Item Trust Badges Row */}
        <div className="mt-8 pt-6 border-t border-[#2E2A25]/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-[#2E2A25]">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5F7464]" />
            <span className="font-semibold">Buyer Protection Guarantee</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-[#C85A32]" />
            <span className="font-semibold">Verified Star Sellers</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 text-[#C85A32]" />
            <span className="font-semibold">Direct Artisan Trade</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-[#5F7464]" />
            <span className="font-semibold">Handcrafted Quality</span>
          </div>
        </div>
      </div>
    </section>
  );
}
