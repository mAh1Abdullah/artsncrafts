import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Heart,
  Layers,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { getDashboardUrl, storefrontPath, wawApi } from '../lib/api';
import {
  getStoreSnapshot,
  pushToast,
  setActiveRole,
  setAdvisorOpen,
  setCartOpen,
  setCurrency,
  setNotifications,
  setSearchQuery,
  setSelectedCategory,
  subscribeStore,
  type BuyerNotification,
  type CurrencyCode,
  type StorefrontRole,
} from '../lib/store';

interface StorefrontHeaderIslandProps {
  currentPath: string;
}

const ROLE_LABELS: Record<StorefrontRole, string> = {
  user: 'Shopper',
  vendor_user: 'Artisan',
  wholesaler: 'Wholesale',
  admin: 'Admin',
};

export function StorefrontHeaderIsland({
  currentPath,
}: StorefrontHeaderIslandProps) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [currency, setCurrencyState] = useState<CurrencyCode>('BDT');
  const [activeRole, setActiveRoleState] = useState<StorefrontRole>('user');
  const [searchQuery, setSearchQueryState] = useState('');
  const [notifications, setNotificationsState] = useState<BuyerNotification[]>([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const dashboardUrl = getDashboardUrl();
  const isHome =
    currentPath === '/' ||
    currentPath === '' ||
    currentPath === '/storefront' ||
    currentPath === '/storefront/';

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCartCount(snap.cart.reduce((sum, i) => sum + i.quantity, 0));
      setWishlistCount(snap.wishlistIds.length);
      setCurrencyState(snap.currency);
      setActiveRoleState(snap.activeRole);
      setSearchQueryState(snap.searchQuery);
      setNotificationsState(snap.notifications);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  // Load live notifications from buyer profile API once on mount
  useEffect(() => {
    wawApi
      .getBuyerProfile('buyer-anika')
      .then((res) => {
        setNotifications(res.data.notifications);
      })
      .catch(() => {
        // Non-blocking if backend is restarting
      });
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleMarkAllRead = async () => {
    const optimistic = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(optimistic);
    try {
      const res = await wawApi.markBuyerNotificationsRead('buyer-anika', {
        all: true,
      });
      setNotifications(res.data.notifications);
    } catch {
      // Keep optimistic state
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHome) {
      window.location.href = storefrontPath(
        `/?q=${encodeURIComponent(searchQuery.trim())}#collections`
      );
      return;
    }
    const el = document.getElementById('collections');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRoleSwitch = (
    role: StorefrontRole,
    href?: string,
    toastMsg?: string
  ) => {
    setActiveRole(role);
    setRoleMenuOpen(false);
    if (toastMsg) pushToast(toastMsg, 'info');
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs transition-all">
      {/* Top Announcement Strip */}
      <div className="bg-[#F4EBE1] text-[#2E2A25] text-xs py-1.5 px-4 text-center font-medium border-b border-[#E8DCCF] flex items-center justify-center gap-2 sm:gap-4">
        <span className="flex items-center gap-1.5 text-xs text-[#2E2A25]">
          <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>
            Find things you&apos;ll love. Support independent master artisans.
          </span>
        </span>
        <span className="hidden md:inline text-stone-400">•</span>
        <button
          type="button"
          onClick={() => setAdvisorOpen(true)}
          className="hidden md:inline text-xs font-semibold text-[#C85A32] hover:underline cursor-pointer"
        >
          AI Bespoke Craft Advisor
        </button>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-5">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={storefrontPath('/')}
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 text-left group"
            >
              <span className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#C85A32] group-hover:text-[#A84825] transition-colors">
                Artisans
                <span className="font-sans font-light text-[#2E2A25] text-xl sm:text-2xl tracking-normal">
                  Market
                </span>
              </span>
            </a>
          </div>

          {/* Rounded Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl mx-2 relative items-center"
          >
            <div className="w-full flex items-center bg-[#FAF9F6] hover:bg-[#F4EBE1] focus-within:bg-white rounded-full border-2 border-[#2E2A25] focus-within:border-[#C85A32] focus-within:ring-2 focus-within:ring-[#C85A32]/20 transition-all pl-4 pr-1.5 py-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything (ceramics, Jamdani, teak, gifts, jewelry...)"
                aria-label="Search handcrafted marketplace"
                className="w-full bg-transparent text-sm text-[#2E2A25] placeholder-stone-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-stone-400 hover:text-[#2E2A25] text-xs font-semibold mr-2 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="bg-[#C85A32] hover:bg-[#A84825] text-white p-2 rounded-full transition-colors cursor-pointer shrink-0 ml-1 shadow-xs"
                title="Search"
                aria-label="Search catalog"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Compact Currency Switch */}
            <button
              type="button"
              onClick={() => setCurrency(currency === 'BDT' ? 'USD' : 'BDT')}
              title="Toggle display currency"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-full border border-stone-200 hover:bg-[#F4EBE1] text-[11px] font-mono font-semibold text-[#2E2A25] transition-colors cursor-pointer"
            >
              {currency === 'BDT' ? '৳ BDT' : '$ USD'}
            </button>

            {/* Role & Operations Mode Switcher */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                title="Switch role or open Operations Console"
                aria-expanded={roleMenuOpen}
              >
                <User className="w-4 h-4 text-stone-700" />
                <span className="hidden lg:inline">
                  {ROLE_LABELS[activeRole]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Mode Switcher
                    </p>
                    <p className="text-xs font-semibold text-stone-800 truncate">
                      Anika Rahman
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRoleSwitch(
                        'user',
                        storefrontPath('/'),
                        'Switched to Shopper Mode.'
                      )
                    }
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F4EBE1] cursor-pointer ${
                      activeRole === 'user'
                        ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70'
                        : 'text-[#2E2A25]'
                    }`}
                  >
                    <User className="w-4 h-4 text-stone-500" />
                    Shopper Mode
                  </button>

                  <a
                    href={`${dashboardUrl}/seller`}
                    onClick={() => setActiveRole('vendor_user')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F4EBE1] ${
                      activeRole === 'vendor_user'
                        ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70'
                        : 'text-[#2E2A25]'
                    }`}
                  >
                    <Store className="w-4 h-4 text-[#C85A32]" />
                    Artisan Shop Manager
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleRoleSwitch(
                        'wholesaler',
                        storefrontPath('/raw-materials'),
                        'Wholesale Raw Supply mode unlocked.'
                      )
                    }
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F4EBE1] cursor-pointer ${
                      activeRole === 'wholesaler'
                        ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70'
                        : 'text-[#2E2A25]'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#5F7464]" />
                    Wholesale Raw Supply
                  </button>

                  <a
                    href={`${dashboardUrl}/admin`}
                    onClick={() => setActiveRole('admin')}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-[#F4EBE1] ${
                      activeRole === 'admin'
                        ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70'
                        : 'text-[#2E2A25]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#2E2A25]" />
                    Admin Portal
                  </a>

                  <div className="my-1.5 border-t border-stone-100" />

                  <a
                    href={storefrontPath('/account')}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-[#2E2A25] hover:bg-[#F4EBE1]"
                  >
                    <Heart className="w-4 h-4 text-[#C85A32]" />
                    Buyer Account &amp; Orders
                  </a>

                  <a
                    href={`${dashboardUrl}/ops`}
                    className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-[#2E2A25] hover:bg-[#F4EBE1]"
                  >
                    <Wrench className="w-4 h-4 text-stone-500" />
                    Operations Hub &amp; WAW-POS
                  </a>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[#2E2A25]" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C85A32] rounded-full ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                    <span className="font-bold text-sm text-[#2E2A25]">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-[#C85A32] uppercase hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-stone-400 py-4">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border transition-colors ${
                            n.read
                              ? 'bg-white border-stone-200'
                              : 'bg-[#F4EBE1]/70 border-[#C85A32]/30'
                          }`}
                        >
                          <p className="font-bold text-[#2E2A25]">{n.title}</p>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-[9px] text-stone-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <a
                    href={storefrontPath('/account?tab=notifications')}
                    className="block text-center text-[11px] font-bold text-[#C85A32] hover:underline pt-1 border-t border-stone-100"
                  >
                    View all in Buyer Portal →
                  </a>
                </div>
              )}
            </div>

            {/* Favorites / Wishlist Heart */}
            <a
              href={storefrontPath('/account?tab=wishlist')}
              className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative"
              title="Favorites & Wishlist"
              aria-label="Favorites and Wishlist"
            >
              <Heart className="w-5 h-5 text-[#2E2A25]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C85A32] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </a>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative cursor-pointer flex items-center"
              title="Shopping Cart"
              aria-label="Open shopping cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#2E2A25]" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C85A32] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Sell on Market / Shop Manager CTA */}
            <a
              href={
                activeRole === 'vendor_user'
                  ? `${dashboardUrl}/seller`
                  : storefrontPath('/sell')
              }
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F4EBE1] text-xs font-semibold text-[#2E2A25] transition-colors border border-[#2E2A25]/20 shrink-0"
            >
              <Store className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>
                {activeRole === 'vendor_user'
                  ? 'Shop Manager'
                  : 'Sell on Market'}
              </span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search & Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything on Artisans Market..."
              className="w-full pl-4 pr-10 py-2 bg-stone-100 border border-stone-300 rounded-full text-xs text-stone-900"
            />
            <button
              type="submit"
              className="absolute right-1.5 bg-[#C85A32] text-white p-1.5 rounded-full"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href={storefrontPath('/')}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-[#F4EBE1]"
            >
              Marketplace Home
            </a>
            <a
              href={storefrontPath('/raw-materials')}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-[#F4EBE1]"
            >
              Raw Materials
            </a>
            <a
              href={storefrontPath('/account')}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-[#F4EBE1]"
            >
              Orders &amp; Wishlist
            </a>
            <a
              href={storefrontPath('/sell')}
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 text-left bg-stone-50 rounded-lg font-medium text-[#C85A32] hover:bg-[#F4EBE1]"
            >
              Sell on Artisans Market
            </a>
            <a
              href={`${dashboardUrl}/ops`}
              className="p-2.5 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-[#F4EBE1]"
            >
              Operations Hub
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAdvisorOpen(true);
              }}
              className="p-2.5 text-left bg-[#F4EBE1] rounded-lg font-semibold text-[#C85A32]"
            >
              AI Craft Advisor
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
