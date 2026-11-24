import React, { useState } from 'react';
import { 
  ShoppingBag, Heart, Search, User, Store, Package, 
  Sparkles, Menu, X, ChevronDown, Layers, Bell, ShieldCheck, Check
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { storageService } from '../services/storage';

interface HeaderProps {
  currentUser: UserType;
  cartCount: number;
  wishlistCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenCart: () => void;
  onOpenAdvisor: () => void;
  onRoleChange: (role: UserRole) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  cartCount,
  wishlistCount,
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  onOpenCart,
  onOpenAdvisor,
  onRoleChange,
  activeCategory,
  setActiveCategory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = storageService.getNotifications(currentUser.id);
  const unreadNotifs = notifications.filter(n => !n.read);

  const handleMarkNotifsRead = () => {
    storageService.markAllNotificationsRead(currentUser.id);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs transition-all">
      {/* Top Etsy Banner Strip */}
      <div className="bg-[#F4EBE1] text-[#2E2A25] text-xs py-1.5 px-4 text-center font-medium border-b border-[#E8DCCF] flex items-center justify-center gap-2 sm:gap-4">
        <span className="flex items-center gap-1.5 text-xs text-[#2E2A25]">
          <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>Find things you'll love. Support independent master artisans.</span>
        </span>
        <span className="hidden md:inline text-stone-400">•</span>
        <button 
          onClick={onOpenAdvisor}
          className="hidden md:inline text-xs font-semibold text-[#C85A32] hover:underline cursor-pointer"
        >
          AI Bespoke Craft Advisor
        </button>
      </div>

      {/* Main Etsy Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Etsy Style Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => { setActiveView('explore'); setActiveCategory('all'); }} 
              className="flex items-center gap-1.5 text-left group cursor-pointer"
            >
              <span className="font-serif text-3xl font-bold tracking-tighter text-[#C85A32] group-hover:text-[#A84825] transition-colors">
                Artisans<span className="font-sans font-light text-[#2E2A25] text-2xl tracking-normal">Market</span>
              </span>
            </button>
          </div>

          {/* Etsy Style Large Rounded Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2 relative items-center">
            <div className="w-full flex items-center bg-[#FAF9F6] hover:bg-[#F4EBE1] focus-within:bg-white rounded-full border-2 border-[#2E2A25] focus-within:border-[#C85A32] focus-within:ring-2 focus-within:ring-[#C85A32]/20 transition-all pl-4 pr-1.5 py-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything (ceramics, sarees, teak, gifts, jewelry...)"
                className="w-full bg-transparent text-sm text-[#2E2A25] placeholder-stone-500 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-stone-400 hover:text-[#2E2A25] text-xs font-semibold mr-2"
                >
                  Clear
                </button>
              )}
              <button 
                type="button"
                className="bg-[#C85A32] hover:bg-[#A84825] text-white p-2.5 rounded-full transition-colors cursor-pointer shrink-0 ml-1 shadow-xs"
                title="Search"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Action Icons & User Role Selector */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            
            {/* Role Switcher styled like Etsy Account menu */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                title="Switch persona role"
              >
                <User className="w-4 h-4 text-stone-700" />
                <span className="hidden lg:inline capitalize">{currentUser.role.replace('_', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Mode Switcher</p>
                    <p className="text-xs font-semibold text-stone-800 truncate">{currentUser.name}</p>
                  </div>
                  <button
                    onClick={() => { onRoleChange('user'); setActiveView('explore'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#F4EBE1] ${currentUser.role === 'user' ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70' : 'text-[#2E2A25]'}`}
                  >
                    <User className="w-4 h-4 text-stone-500" />
                    Shopper Mode
                  </button>
                  <button
                    onClick={() => { onRoleChange('vendor_user'); setActiveView('seller_dashboard'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#F4EBE1] ${currentUser.role === 'vendor_user' ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70' : 'text-[#2E2A25]'}`}
                  >
                    <Store className="w-4 h-4 text-[#C85A32]" />
                    Artisan Shop Manager
                  </button>
                  <button
                    onClick={() => { onRoleChange('wholesaler'); setActiveView('raw_materials'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#F4EBE1] ${currentUser.role === 'wholesaler' ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70' : 'text-[#2E2A25]'}`}
                  >
                    <Layers className="w-4 h-4 text-[#5F7464]" />
                    Wholesale Raw Supply
                  </button>
                  <button
                    onClick={() => { onRoleChange('admin'); setActiveView('admin_dashboard'); setRoleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#F4EBE1] ${currentUser.role === 'admin' ? 'font-bold text-[#C85A32] bg-[#F4EBE1]/70' : 'text-[#2E2A25]'}`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#2E2A25]" />
                    Admin Portal
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) handleMarkNotifsRead();
                }}
                className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-[#2E2A25]" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C85A32] rounded-full" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                    <span className="font-bold text-sm text-[#2E2A25]">Notifications</span>
                    <button onClick={handleMarkNotifsRead} className="text-[10px] font-bold text-[#C85A32] uppercase hover:underline">
                      Mark all read
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-stone-400 py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-2.5 rounded-xl border transition-colors ${n.read ? 'bg-white border-stone-200' : 'bg-[#F4EBE1]/60 border-[#C85A32]/30'}`}>
                          <p className="font-bold text-[#2E2A25]">{n.title}</p>
                          <p className="text-[11px] text-stone-600 mt-0.5">{n.body}</p>
                          <p className="text-[9px] text-stone-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Favorites Heart */}
            <button
              onClick={() => setActiveView('buyer_profile')}
              className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative cursor-pointer"
              title="Favorites & Wishlist"
            >
              <Heart className="w-5 h-5 text-[#2E2A25]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C85A32] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="p-2 rounded-full text-[#2E2A25] hover:bg-[#F4EBE1] transition-colors relative cursor-pointer flex items-center"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#2E2A25]" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C85A32] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Sell on Artisans Market link */}
            <button
              onClick={() => {
                if (currentUser.role === 'vendor_user') {
                  setActiveView('seller_dashboard');
                } else {
                  setActiveView('seller_signup');
                }
              }}
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#F4EBE1] text-xs font-semibold text-[#2E2A25] transition-colors cursor-pointer border border-[#2E2A25]/20"
            >
              <Store className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>{currentUser.role === 'vendor_user' ? 'Shop Manager' : 'Sell on Market'}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-full cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search & Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything on Artisans Market..."
              className="w-full pl-4 pr-10 py-2 bg-stone-100 border border-stone-300 rounded-full text-xs text-stone-900"
            />
            <button className="absolute right-1.5 bg-[#F1641E] text-white p-1.5 rounded-full">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => { setActiveView('explore'); setMobileMenuOpen(false); }}
              className="p-2 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-orange-50"
            >
              Marketplace Home
            </button>
            <button 
              onClick={() => { setActiveView('raw_materials'); setMobileMenuOpen(false); }}
              className="p-2 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-orange-50"
            >
              Raw Materials
            </button>
            <button 
              onClick={() => { setActiveView('buyer_profile'); setMobileMenuOpen(false); }}
              className="p-2 text-left bg-stone-50 rounded-lg font-medium text-stone-800 hover:bg-orange-50"
            >
              Favorites & Wishlist
            </button>
            <button 
              onClick={() => { setActiveView('seller_signup'); setMobileMenuOpen(false); }}
              className="p-2 text-left bg-stone-50 rounded-lg font-medium text-[#F1641E] hover:bg-orange-50"
            >
              Sell on Artisans Market
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
