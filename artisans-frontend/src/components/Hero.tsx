import React from 'react';
import { Sparkles, ArrowRight, Layers, Bot, ShieldCheck, Heart, Star, Award } from 'lucide-react';

interface HeroProps {
  onExploreCrafts: () => void;
  onOpenRawMaterials: () => void;
  onOpenAdvisor: () => void;
  onSelectCategory?: (catId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreCrafts,
  onOpenRawMaterials,
  onOpenAdvisor,
  onSelectCategory
}) => {
  const etsyCircles = [
    {
      id: 'pottery',
      title: 'Pottery & Clay',
      img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'textiles',
      title: 'Jamdani & Sarees',
      img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'woodwork',
      title: 'Teak & Woodcraft',
      img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'jewelry',
      title: 'Silver & Jewelry',
      img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'paintings',
      title: 'Rickshaw Folk Art',
      img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'glass_resin',
      title: 'Resin & Botanical',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'leatherwork',
      title: 'Heritage Leather',
      img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'custom_gifts',
      title: 'Personalized Gifts',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=300'
    }
  ];

  return (
    <div className="bg-[#FAF9F6] border-b border-[#2E2A25]/10">
      
      {/* Etsy Welcome Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        
        {/* Welcome Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E2A25] tracking-tight">
            Find things you'll love. <br className="hidden sm:inline" />
            <span className="italic text-[#C85A32]">Support independent artisans.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#2E2A25]/80">
            Discover one-of-a-kind handcrafted goods, heritage textiles, and custom gifts directly from verified workshops.
          </p>
        </div>

        {/* Etsy Iconic Circular Category Thumbnails ("Discover one-of-a-kind items") */}
        <div className="space-y-3 mb-10">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-[#2E2A25] tracking-wide">
              Discover one-of-a-kind items
            </h2>
            <button 
              onClick={onExploreCrafts}
              className="text-xs font-semibold text-[#C85A32] hover:underline cursor-pointer"
            >
              Shop all categories &rarr;
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
            {etsyCircles.map((circle) => (
              <button
                key={circle.id}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(circle.id);
                  onExploreCrafts();
                }}
                className="group flex flex-col items-center text-center space-y-2 cursor-pointer focus:outline-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white shadow-xs group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105 bg-[#F4EBE1] relative">
                  <img
                    src={circle.img}
                    alt={circle.title}
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

        {/* Etsy Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Spotlight "Etsy's Pick" Banner */}
          <div className="md:col-span-7 bg-[#F4EBE1] rounded-3xl p-6 sm:p-8 border border-[#E8DCCF] flex flex-col sm:flex-row items-center gap-6 shadow-xs relative overflow-hidden">
            <div className="flex-1 space-y-3 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C85A32] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                <Award className="w-3 h-3 text-amber-200" />
                Artisans' Choice
              </div>

              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#2E2A25] leading-tight">
                Authentic Dhamrai Terracotta Pitchers
              </h3>

              <p className="text-xs text-[#2E2A25]/80 leading-relaxed">
                Hand-thrown by master potter Ramesh Chandra. Each piece is naturally porous, eco-friendly, and crafted using ancestral clay techniques.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onExploreCrafts}
                  className="bg-[#2E2A25] hover:bg-[#C85A32] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Shop Dhamrai Terracotta
                </button>
                <span className="text-xs font-bold text-[#C85A32]">From ৳1,450</span>
              </div>
            </div>

            <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white relative group">
              <img
                src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=400"
                alt="Terracotta Pitcher"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Wholesale Raw Materials & Custom AI Assistant Portal */}
          <div className="md:col-span-5 bg-[#2E2A25] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5F7464] uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full">
                <Layers className="w-3 h-3 text-amber-300" />
                Wholesale Material Hub
              </div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
                Bulk Craft Supplies for Creators
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Order raw pottery clay, teak timber planks, mulberry silk yarns, and brass sheets directly from primary origin suppliers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={onOpenRawMaterials}
                className="flex-1 bg-[#C85A32] hover:bg-[#A84825] text-white px-4 py-2.5 rounded-full text-xs font-bold text-center transition-colors cursor-pointer"
              >
                Browse Raw Supplies
              </button>
              <button
                onClick={onOpenAdvisor}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-4 py-2.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Bespoke Request</span>
              </button>
            </div>
          </div>

        </div>

        {/* Etsy Trust Badges Row */}
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
    </div>
  );
};


