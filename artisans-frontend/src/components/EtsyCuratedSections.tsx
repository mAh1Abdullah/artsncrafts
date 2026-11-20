import React, { useState } from 'react';
import { ArrowRight, Heart, Play, Sparkles } from 'lucide-react';
import { Product, VendorProfile } from '../types';

interface EtsyCuratedSectionsProps {
  onSelectVendor: (vendorId: string) => void;
  onSelectProduct: (product: Product) => void;
  onExploreCrafts: () => void;
  products: Product[];
  vendors: VendorProfile[];
}

export const EtsyCuratedSections: React.FC<EtsyCuratedSectionsProps> = ({
  onSelectVendor,
  onSelectProduct,
  onExploreCrafts,
  products,
  vendors
}) => {
  const [favoriteShops, setFavoriteShops] = useState<Record<string, boolean>>({});

  const toggleFavoriteShop = (shopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };

  // Sample Shops corresponding to Panel 2 in the image
  const sampleShops = [
    {
      id: vendors[0]?.id || 'v_clay',
      name: 'IrisLeeGallery',
      avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=200',
      banner: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600',
      tagline: 'Custom Fine Textured Canvas & Wall Art'
    },
    {
      id: vendors[1]?.id || 'v_loom',
      name: 'PurzInzert',
      avatar: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200',
      banner: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600',
      tagline: 'Custom Felt Tote Organizers & Liners'
    },
    {
      id: vendors[2]?.id || 'v_wood',
      name: 'WeddingVogueCraft',
      avatar: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=200',
      banner: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
      tagline: 'Handwoven Bridal Veils & Heritage Lace'
    }
  ];

  return (
    <div className="space-y-16 py-10 bg-[#FAF9F6]">

      {/* ========================================== */}
      {/* SECTION 1: EDITORS' PICKS - HOME IMPROVEMENT */}
      {/* ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-10 border border-[#E8DCCF]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Header Title Block */}
            <div className="lg:col-span-3 space-y-3 pt-2">
              <span className="text-xs font-semibold text-[#5F7464]">Editors' Picks</span>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#2E2A25] tracking-tight leading-none">
                Home Improvement
              </h2>
              <button
                onClick={onExploreCrafts}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E2A25] hover:text-[#C85A32] pt-2 transition-colors cursor-pointer group"
              >
                <span>Shop these unique finds</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Grid Layout */}
            <div className="lg:col-span-9 space-y-4">
              
              {/* Top Row: 3 Images */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Image 1: Hardware Handles */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=500"
                    alt="Cabinet handles"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Image 2: Striped Fabric Bench */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=500"
                    alt="Striped bench fabric"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Image 3: Teak Switch Covers (With Video Icon) */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=500"
                    alt="Teak switch cover plates"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                    <Play className="w-3 h-3 text-stone-900 fill-stone-900 ml-0.5" />
                  </div>
                </div>

              </div>

              {/* Bottom Row: 3 Images + Text Box */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                
                {/* Image 1: Sconce Light */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=500"
                    alt="Ceramic sconce"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                    <Play className="w-3 h-3 text-stone-900 fill-stone-900 ml-0.5" />
                  </div>
                </div>

                {/* Image 2: Mirror Bathroom */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=500"
                    alt="Bathroom mirror vanity"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                    <Play className="w-3 h-3 text-stone-900 fill-stone-900 ml-0.5" />
                  </div>
                </div>

                {/* Image 3: Linen Curtain */}
                <div 
                  onClick={onExploreCrafts}
                  className="aspect-square rounded-2xl overflow-hidden bg-stone-200 relative group cursor-pointer border border-stone-200"
                >
                  <img
                    src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=500"
                    alt="Linen curtain"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                    <Play className="w-3 h-3 text-stone-900 fill-stone-900 ml-0.5" />
                  </div>
                </div>

                {/* Column 4: Text Callout */}
                <div className="p-2 space-y-2 text-stone-700">
                  <p className="text-xs sm:text-sm font-normal leading-relaxed">
                    Elevate your space with these simple installs and easy home projects for your next DIY weekend.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 2: DISCOVER SHOPS IN YOUR REGION */}
      {/* ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-10 border border-[#E8DCCF]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Header Block */}
            <div className="lg:col-span-3 space-y-4">
              <span className="text-xs text-[#5F7464] font-semibold">Local finds? Artisans Market has it.</span>
              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#2E2A25] tracking-tight leading-tight">
                Discover shops in your region
              </h2>
              <button
                onClick={onExploreCrafts}
                className="px-6 py-2.5 border border-[#2E2A25] text-[#2E2A25] hover:bg-[#2E2A25] hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer inline-block"
              >
                Shop from local makers
              </button>
            </div>

            {/* Right 3 Shop Cards Row */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {sampleShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => onSelectVendor(shop.id)}
                  className="bg-white rounded-2xl border border-[#2E2A25]/15 hover:border-[#2E2A25]/40 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  {/* Shop Banner Image Container */}
                  <div className="relative aspect-3/4 overflow-hidden bg-stone-100">
                    <img
                      src={shop.banner}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Floating Heart Button */}
                    <button
                      onClick={(e) => toggleFavoriteShop(shop.id, e)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all cursor-pointer ${
                        favoriteShops[shop.id]
                          ? 'bg-[#C85A32] text-white'
                          : 'bg-white/90 hover:bg-white text-stone-700'
                      }`}
                      title="Save shop"
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoriteShops[shop.id] ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Bottom White Bar with Round Avatar + Name */}
                  <div className="p-3.5 flex items-center gap-3 bg-[#FAF9F6] border-t border-stone-100">
                    <img
                      src={shop.avatar}
                      alt={shop.name}
                      className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-[#2E2A25] group-hover:text-[#C85A32] transition-colors truncate">
                        {shop.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 truncate">{shop.tagline}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 3: ETSY-SPECIAL GIFTS FOR BIRTHDAYS */}
      {/* ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header & Inspiration Row */}
        <div className="bg-[#F4EBE1] rounded-3xl p-6 sm:p-8 border border-[#E8DCCF] space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2E2A25] tracking-tight">
                Artisan-special gifts for birthdays
              </h2>
            </div>
            <button
              onClick={onExploreCrafts}
              className="px-5 py-2 bg-[#2E2A25] hover:bg-[#C85A32] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer self-start sm:self-auto"
            >
              Get inspired
            </button>
          </div>

          {/* 3 Top Visual Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Unique Vases */}
            <div 
              onClick={onExploreCrafts}
              className="h-44 sm:h-52 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs border border-stone-200 bg-stone-900"
            >
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600"
                alt="Unique Vases"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white font-bold text-base sm:text-lg">
                Unique Vases
              </div>
            </div>

            {/* Card 2: Custom Labels */}
            <div 
              onClick={onExploreCrafts}
              className="h-44 sm:h-52 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs border border-stone-200 bg-stone-900"
            >
              <img
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600"
                alt="Custom Labels"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white font-bold text-base sm:text-lg">
                Custom Labels
              </div>
            </div>

            {/* Card 3: Custom Birthday Crowns */}
            <div 
              onClick={onExploreCrafts}
              className="h-44 sm:h-52 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xs border border-stone-200 bg-stone-900"
            >
              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600"
                alt="Custom Birthday Crowns"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white font-bold text-base sm:text-lg">
                Custom Birthday Crowns
              </div>
            </div>

          </div>

          {/* Middle Row of 6 Product Cards with Price Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            
            {/* Item 1 */}
            <div 
              onClick={() => products[0] && onSelectProduct(products[0])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=400"
                alt="Art Card"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200">
                ৳ 850
              </div>
            </div>

            {/* Item 2 */}
            <div 
              onClick={() => products[1] && onSelectProduct(products[1])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400"
                alt="Birthday card"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200">
                ৳ 620
              </div>
            </div>

            {/* Item 3 */}
            <div 
              onClick={() => products[2] && onSelectProduct(products[2])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=400"
                alt="Cake pouch"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200">
                ৳ 3,500
              </div>
            </div>

            {/* Item 4 */}
            <div 
              onClick={() => products[3] && onSelectProduct(products[3])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400"
                alt="Personalised Pencils"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200">
                ৳ 2,000
              </div>
            </div>

            {/* Item 5 */}
            <div 
              onClick={() => products[4] && onSelectProduct(products[4])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400"
                alt="Pet locket"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[10px] font-bold text-stone-900 shadow-xs border border-stone-200 flex items-center gap-1">
                <span>৳ 5,800</span>
                <span className="text-stone-400 line-through text-[9px]">৳ 11,600</span>
              </div>
            </div>

            {/* Item 6 */}
            <div 
              onClick={() => products[5] && onSelectProduct(products[5])}
              className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-stone-100 border border-stone-200"
            >
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400"
                alt="Party Garland"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-stone-900 shadow-xs border border-stone-200">
                ৳ 3,200
              </div>
            </div>

          </div>

          {/* Bottom Category Tiles Block */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Gifts as special as they are
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              
              <div 
                onClick={onExploreCrafts}
                className="bg-stone-100/80 hover:bg-stone-200/80 p-2.5 rounded-2xl border border-stone-200 flex items-center gap-3 cursor-pointer transition-colors group"
              >
                <img
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=150"
                  alt="Outdoor"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span className="text-xs font-bold text-stone-900 group-hover:text-[#F1641E] leading-tight">
                  Outdoor Entertaining
                </span>
              </div>

              <div 
                onClick={onExploreCrafts}
                className="bg-stone-100/80 hover:bg-stone-200/80 p-2.5 rounded-2xl border border-stone-200 flex items-center gap-3 cursor-pointer transition-colors group"
              >
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=150"
                  alt="Backpacks"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span className="text-xs font-bold text-stone-900 group-hover:text-[#F1641E] leading-tight">
                  Personalised Backpacks
                </span>
              </div>

              <div 
                onClick={onExploreCrafts}
                className="bg-stone-100/80 hover:bg-stone-200/80 p-2.5 rounded-2xl border border-stone-200 flex items-center gap-3 cursor-pointer transition-colors group"
              >
                <img
                  src="https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&q=80&w=150"
                  alt="Summer"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span className="text-xs font-bold text-stone-900 group-hover:text-[#F1641E] leading-tight">
                  Summer Style
                </span>
              </div>

              <div 
                onClick={onExploreCrafts}
                className="bg-stone-100/80 hover:bg-stone-200/80 p-2.5 rounded-2xl border border-stone-200 flex items-center gap-3 cursor-pointer transition-colors group"
              >
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=150"
                  alt="Wedding"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span className="text-xs font-bold text-stone-900 group-hover:text-[#F1641E] leading-tight">
                  Wedding Gifts
                </span>
              </div>

              <div 
                onClick={onExploreCrafts}
                className="bg-stone-100/80 hover:bg-stone-200/80 p-2.5 rounded-2xl border border-stone-200 flex items-center gap-3 cursor-pointer transition-colors group"
              >
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150"
                  alt="Clothing"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <span className="text-xs font-bold text-stone-900 group-hover:text-[#F1641E] leading-tight">
                  Personalised Clothing
                </span>
              </div>

            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
