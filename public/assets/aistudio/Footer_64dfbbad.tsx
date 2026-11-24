import React from 'react';
import { Store, Globe, HelpCircle } from 'lucide-react';

interface FooterProps {
  onApplySeller: () => void;
  onOpenRawMaterials: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onApplySeller, onOpenRawMaterials }) => {
  return (
    <footer className="bg-[#2E2A25] text-white border-t border-[#2E2A25]/20">
      
      {/* What is Artisans Market Section (Etsy signature banner) */}
      <div className="bg-[#3D3832] py-10 px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            What is Artisans Market?
          </h2>
          <p className="text-xs sm:text-sm text-[#F4EBE1]/90 leading-relaxed max-w-2xl mx-auto">
            Artisans Market is a global online marketplace, where people come together to make, sell, buy, and collect unique handcrafted items, heritage textiles, and raw craft supplies.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onApplySeller}
              className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#A84825] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-xs"
            >
              Sell on Artisans Market
            </button>
            <button
              onClick={onOpenRawMaterials}
              className="px-5 py-2.5 bg-[#2E2A25] hover:bg-stone-800 text-[#F4EBE1] text-xs font-semibold rounded-full border border-[#F4EBE1]/30 transition-colors cursor-pointer"
            >
              Wholesale Supplies
            </button>
          </div>
        </div>
      </div>

      {/* Main Etsy Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-stone-300">
          
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Shop</h4>
            <ul className="space-y-2">
              <li><a href="#handcrafted-catalog" className="hover:underline">Gift Cards</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Pottery & Clay</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Jamdani Sarees</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Teak Woodcraft</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Custom Engravings</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Sell</h4>
            <ul className="space-y-2">
              <li><button onClick={onApplySeller} className="hover:underline text-left">Sell on Artisans Market</button></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Teams & Guilds</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Seller Handbook</a></li>
              <li><button onClick={onOpenRawMaterials} className="hover:underline text-left">Wholesale Sourcing</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">About</h4>
            <ul className="space-y-2">
              <li><a href="#handcrafted-catalog" className="hover:underline">Artisans Market, Inc.</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Policies & Direct Commerce</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Artisan Impact & Sustainability</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Investor Relations</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Help & Assurance</h4>
            <ul className="space-y-2">
              <li><a href="#handcrafted-catalog" className="hover:underline">Help Center & FAQ</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Privacy Settings</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">Buyer Protection Guarantee</a></li>
              <li><a href="#handcrafted-catalog" className="hover:underline">CUID2 Verification System</a></li>
            </ul>
          </div>

        </div>

        {/* Etsy Bottom Currency & Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-stone-700 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-white bg-stone-800 px-3 py-1 rounded-full border border-stone-700">
              <Globe className="w-3.5 h-3.5 text-[#C85A32]" />
              Bangladesh | BDT (৳)
            </span>
          </div>

          <p className="text-center sm:text-right text-stone-400 text-[11px]">
            © 2026 Artisans Market, Inc. All rights reserved. • <span className="underline hover:text-white cursor-pointer">Terms of Use</span> • <span className="underline hover:text-white cursor-pointer">Privacy</span>
          </p>
        </div>
      </div>

    </footer>
  );
};


