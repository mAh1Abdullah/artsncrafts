import { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import {
  getStoreSnapshot,
  setAdvisorOpen,
  setCartOpen,
  setCurrency,
  subscribeStore,
  type CurrencyCode,
} from '../lib/store';

export function StorefrontHeaderControls() {
  const [cartCount, setCartCount] = useState(0);
  const [currency, setLocalCurrency] = useState<CurrencyCode>('BDT');

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCartCount(snap.cart.reduce((sum, item) => sum + item.quantity, 0));
      setLocalCurrency(snap.currency);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => setCurrency(currency === 'BDT' ? 'USD' : 'BDT')}
        className="px-2.5 py-1.5 rounded-md border border-[#DED6CA] bg-white hover:border-[#221E1B] text-xs font-mono font-medium text-[#221E1B] transition-colors"
        title="Switch display currency"
      >
        {currency === 'BDT' ? '৳ BDT' : '$ USD'}
      </button>

      <button
        type="button"
        onClick={() => setAdvisorOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DED6CA] bg-[#F3EFE9] hover:border-[#B84A27] text-xs font-medium text-[#221E1B] transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#B84A27]" />
        <span className="hidden sm:inline">Craft Advisor</span>
      </button>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#221E1B] hover:bg-[#B84A27] text-[#FAF9F6] text-xs font-medium transition-colors"
        aria-label="Open shopping bag"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Bag</span>
        <span className="font-mono tabular-nums text-[11px] bg-white/15 px-1.5 py-0.5 rounded">
          {cartCount}
        </span>
      </button>
    </div>
  );
}
