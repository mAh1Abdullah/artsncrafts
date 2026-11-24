import { Globe } from 'lucide-react';
import { getDashboardUrl, storefrontPath } from '../lib/api';

export function StorefrontFooter() {
  const dashboardUrl = getDashboardUrl();

  return (
    <footer className="mt-16 bg-[#2E2A25] text-white border-t border-[#2E2A25]/20">
      {/* What is Artisans Market Mission Banner */}
      <div className="bg-[#3D3832] py-10 px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-3">
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
            What is Artisans Market?
          </h2>
          <p className="text-xs sm:text-sm text-[#F4EBE1]/90 leading-relaxed max-w-2xl mx-auto">
            Artisans Market is a direct-from-workshop marketplace connecting
            master potters, Sonargaon Jamdani weavers, Chittagong woodcarvers,
            and Sylhet silversmiths with collectors and craft studios across
            Bangladesh and beyond.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a
              href={storefrontPath('/sell')}
              className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#A84825] text-white text-xs font-bold rounded-full transition-colors shadow-xs"
            >
              Sell on Artisans Market
            </a>
            <a
              href={storefrontPath('/raw-materials')}
              className="px-5 py-2.5 bg-[#2E2A25] hover:bg-stone-800 text-[#F4EBE1] text-xs font-semibold rounded-full border border-[#F4EBE1]/30 transition-colors"
            >
              Wholesale Supplies
            </a>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-stone-300">
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Shop</h4>
            <ul className="space-y-2">
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Handcrafted Catalog
                </a>
              </li>
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Pottery &amp; Clay
                </a>
              </li>
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Jamdani Sarees
                </a>
              </li>
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Teak Woodcraft
                </a>
              </li>
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Custom Engravings
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Sell &amp; Source</h4>
            <ul className="space-y-2">
              <li>
                <a href={storefrontPath('/sell')} className="hover:underline">
                  Sell on Artisans Market
                </a>
              </li>
              <li>
                <a href={storefrontPath('/raw-materials')} className="hover:underline">
                  Wholesale Raw Supplies
                </a>
              </li>
              <li>
                <a href={`${dashboardUrl}/seller`} className="hover:underline">
                  Artisan Seller Studio
                </a>
              </li>
              <li>
                <a href={storefrontPath('/account')} className="hover:underline">
                  Buyer Portal &amp; Trust Score
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">
              Operations &amp; WAW-POS
            </h4>
            <ul className="space-y-2">
              <li>
                <a href={`${dashboardUrl}/ops`} className="hover:underline">
                  Operations Command Hub
                </a>
              </li>
              <li>
                <a href={`${dashboardUrl}/pos`} className="hover:underline">
                  WAW-POS Offline Register
                </a>
              </li>
              <li>
                <a href={`${dashboardUrl}/admin`} className="hover:underline">
                  Marketplace Admin Governance
                </a>
              </li>
              <li>
                <a href={`${dashboardUrl}/shipping`} className="hover:underline">
                  Pathao / Steadfast Logistics
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">
              Help &amp; Assurance
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={storefrontPath('/account?tab=trust')}
                  className="hover:underline"
                >
                  COD Eligibility &amp; Trust Standing
                </a>
              </li>
              <li>
                <a
                  href={storefrontPath('/account?tab=style')}
                  className="hover:underline"
                >
                  Style Profile &amp; GDPR Privacy
                </a>
              </li>
              <li>
                <a
                  href={storefrontPath('/account?tab=orders')}
                  className="hover:underline"
                >
                  Immutable Order Snapshots
                </a>
              </li>
              <li>
                <a href={storefrontPath('/#collections')} className="hover:underline">
                  Buyer Protection Guarantee
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Currency & Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-stone-700 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-white bg-stone-800 px-3 py-1 rounded-full border border-stone-700">
              <Globe className="w-3.5 h-3.5 text-[#C85A32]" />
              Bangladesh | BDT (৳)
            </span>
          </div>

          <p className="text-center sm:text-right text-stone-400 text-[11px]">
            © {new Date().getFullYear()} The Artisan&apos;s Market &amp; WAW-POS. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
