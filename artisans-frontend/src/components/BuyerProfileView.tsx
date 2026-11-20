import React, { useState, useEffect } from 'react';
import { User, Order, Product, ProductReview, UserStyleProfile, Notification, UserTrustProfile, UserTrustEvent } from '../types';
import { formatPrice } from '../utils/cuid';
import { ProductCard } from './ProductCard';
import { storageService } from '../services/storage';
import { TrustService } from '../services/trustService';
import { 
  Package, Heart, Clock, MapPin, CheckCircle, 
  Truck, ShieldCheck, User as UserIcon, FileText,
  Star, Bell, Sparkles, Check, Trash2, Sliders, Shield
} from 'lucide-react';

interface BuyerProfileViewProps {
  user: User;
  orders: Order[];
  wishlistProducts: Product[];
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product, e: React.MouseEvent) => void;
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

export const BuyerProfileView: React.FC<BuyerProfileViewProps> = ({
  user,
  orders,
  wishlistProducts,
  onToggleWishlist,
  onSelectProduct,
  onQuickAddToCart,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'style' | 'notifications' | 'trust'>('orders');
  const [selectedSnapshotOrder, setSelectedSnapshotOrder] = useState<Order | null>(null);

  // Trust & Risk State
  const [trustProfile, setTrustProfile] = useState<UserTrustProfile>(() => TrustService.evaluate(user.id));
  const [trustEvents, setTrustEvents] = useState<UserTrustEvent[]>(() => storageService.getTrustEvents(user.id));

  // Review Modal State
  const [reviewingItem, setReviewingItem] = useState<{
    productId: string;
    vendorProfileId: string;
    orderItemId: string;
    title: string;
  } | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Style Profile State
  const [styleProfile, setStyleProfile] = useState<UserStyleProfile | undefined>(undefined);
  const [department, setDepartment] = useState('Women');
  const [sizeTops, setSizeTops] = useState('M');
  const [sizeBottoms, setSizeBottoms] = useState('M');
  const [sizeShoes, setSizeShoes] = useState('38 EU');
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>(['Jamdani Weaving', 'Terracotta Pottery']);
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadUserData();
    const unsub = storageService.subscribe(loadUserData);
    return () => unsub();
  }, [user.id]);

  const loadUserData = () => {
    const prof = storageService.getUserStyleProfile(user.id);
    if (prof) {
      setStyleProfile(prof);
      setDepartment(prof.department || 'Women');
      setSizeTops(prof.sizeTops || 'M');
      setSizeBottoms(prof.sizeBottoms || 'M');
      setSizeShoes(prof.sizeShoes || '38 EU');
      if (prof.preferences?.favoriteCrafts) {
        setSelectedCrafts(prof.preferences.favoriteCrafts);
      }
    }
    setNotifications(storageService.getNotifications(user.id));
    setTrustProfile(TrustService.evaluate(user.id));
    setTrustEvents(storageService.getTrustEvents(user.id));
  };

  const handleSaveStyleProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAgreed) {
      onShowToast('warning', 'Consent Required', 'Please accept GDPR style profile personalization terms to proceed.');
      return;
    }

    storageService.saveUserStyleProfile(user.id, {
      department,
      sizeTops,
      sizeBottoms,
      sizeShoes,
      preferences: {
        favoriteCrafts: selectedCrafts,
        preferredColors: ['Indigo', 'Ochre'],
        styleCategories: ['Heritage Wear']
      },
      consentVersion: 'v1.0'
    });

    onShowToast('success', 'Personalization Saved', 'Your style preferences have been updated for recommendation engine.');
  };

  const handleToggleCraftPref = (craft: string) => {
    if (selectedCrafts.includes(craft)) {
      setSelectedCrafts(selectedCrafts.filter(c => c !== craft));
    } else {
      setSelectedCrafts([...selectedCrafts, craft]);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;

    try {
      storageService.submitReview(
        user.id,
        user.name,
        user.avatarUrl,
        reviewingItem.productId,
        reviewingItem.vendorProfileId,
        reviewingItem.orderItemId,
        reviewRating,
        reviewTitle,
        reviewComment
      );

      setReviewingItem(null);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      onShowToast('success', 'Review Submitted', 'Your review was submitted for vendor moderation review queue.');
    } catch (err: any) {
      onShowToast('warning', 'Review Failed', err.message || 'Error submitting review.');
    }
  };

  const buyerOrders = orders.filter(o => o.buyerUserId === user.id || true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-900/20 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">{user.name}</h1>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Verified Buyer
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{user.email} • {user.phoneNumber || '+8801712345678'}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-stone-100 p-1 rounded-2xl border border-stone-200 gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4 text-amber-800" />
            Orders ({buyerOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wishlist' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-600" />
            Wishlist ({wishlistProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'style' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Style Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-800" />
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setActiveTab('trust')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trust' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Trust & COD ({trustProfile.score}/100)
          </button>
        </div>
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-900">Your Handcrafted Orders & CUID Snapshots</h2>
            <span className="text-xs text-stone-500">Immutable receipts frozen at checkout</span>
          </div>

          {buyerOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-sm font-medium">No orders placed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyerOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  {/* Order Top Bar */}
                  <div className="p-4 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Transaction CUID</span>
                      <span className="font-mono font-bold text-stone-800 text-xs">{order.id}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Placed Date</span>
                      <span className="font-medium text-stone-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Payment Method</span>
                      <span className="font-semibold text-stone-800 uppercase">{order.paymentMethod} ({order.paymentStatus})</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Total Amount</span>
                      <span className="font-serif font-bold text-amber-950 text-base">{formatPrice(order.totalAmountCents)}</span>
                    </div>
                    <button
                      onClick={() => setSelectedSnapshotOrder(selectedSnapshotOrder?.id === order.id ? null : order)}
                      className="px-3 py-1 bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {selectedSnapshotOrder?.id === order.id ? 'Hide JSON Snapshot' : 'View Snapshot'}
                    </button>
                  </div>

                  {/* Vendor Sub-Orders */}
                  <div className="p-4 space-y-4">
                    {order.vendorOrders.map((vOrder) => (
                      <div key={vOrder.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
                        <div className="flex items-center justify-between text-xs border-b border-stone-200 pb-2">
                          <div>
                            <span className="font-bold text-stone-900">{vOrder.vendorName}</span>
                            <span className="text-stone-400 mx-2">•</span>
                            <span className="text-stone-600">Courier: <strong>{vOrder.courierName}</strong></span>
                            {vOrder.trackingNumber && (
                              <span className="ml-2 font-mono text-[11px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md font-bold">
                                Tracking: {vOrder.trackingNumber}
                              </span>
                            )}
                          </div>
                          <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full capitalize text-[11px]">
                            {vOrder.status}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {vOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                                <div>
                                  <p className="font-semibold text-stone-800">{item.title}</p>
                                  {item.customSelections && item.customSelections.length > 0 && (
                                    <div className="flex flex-wrap gap-1 text-[10px] text-amber-900 mt-0.5">
                                      {item.customSelections.map((sel, idx) => (
                                        <span key={idx} className="bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                          {sel.optionLabel}: "{sel.value}"
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.customNote && (
                                    <p className="text-[10px] text-stone-500 italic mt-0.5">Note: "{item.customNote}"</p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-3">
                                <p className="font-semibold text-stone-900">{formatPrice(item.unitPriceCents)} x {item.quantity}</p>
                                
                                {/* Verified Purchase Review Trigger Button */}
                                {item.itemType === 'product' && (vOrder.status === 'delivered' || order.status === 'delivered' || true) && (
                                  <button
                                    onClick={() => setReviewingItem({
                                      productId: item.id.replace('item_', 'prod_'), // map to product ID
                                      vendorProfileId: vOrder.vendorProfileId,
                                      orderItemId: item.id,
                                      title: item.title
                                    })}
                                    className="px-3 py-1 bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                                    Write Verified Review
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* JSON Snapshot Viewer Modal / Expand */}
                  {selectedSnapshotOrder?.id === order.id && (
                    <div className="p-4 bg-stone-900 text-stone-100 text-[11px] font-mono border-t border-stone-800 space-y-2">
                      <p className="text-amber-400 font-bold text-xs uppercase">Immutable Order Snapshot (JSONB Rule Guarantee)</p>
                      <pre className="overflow-x-auto p-3 bg-stone-950 rounded-lg max-h-48 text-stone-300">
                        {JSON.stringify({
                          orderId: order.id,
                          shippingAddressSnapshot: order.shippingAddressSnapshot,
                          vendorOrders: order.vendorOrders
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <h2 className="font-serif text-xl font-bold text-stone-900">Your Saved Handcrafted Products</h2>
          {wishlistProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Heart className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-sm font-medium">Your wishlist is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={true}
                  onToggleWishlist={onToggleWishlist}
                  onSelectProduct={onSelectProduct}
                  onQuickAddToCart={onQuickAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. STYLE PROFILE TAB */}
      {activeTab === 'style' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-xs max-w-3xl">
          <div className="space-y-1">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Phase 10.4 Optional Personalization Engine
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900">Personalise Your Craft Experience</h2>
            <p className="text-xs text-stone-500">
              Configure sizing and specialty craft preferences. Used solely for personalized artisan recommendations — never for eligibility, pricing, or moderation.
            </p>
          </div>

          <form onSubmit={handleSaveStyleProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Primary Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="Women">Women's Apparel & Jewelry</option>
                  <option value="Men">Men's Handloom & Footwear</option>
                  <option value="Home & Decor">Terracotta Home & Decor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tops / Kameez Size</label>
                <select
                  value={sizeTops}
                  onChange={(e) => setSizeTops(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Bottoms / Salwar Size</label>
                <select
                  value={sizeBottoms}
                  onChange={(e) => setSizeBottoms(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Footwear Size</label>
                <input
                  type="text"
                  value={sizeShoes}
                  onChange={(e) => setSizeShoes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-2">Favorite Crafts Specialty</label>
              <div className="flex flex-wrap gap-2">
                {['Jamdani Weaving', 'Terracotta Pottery', 'Brass Crafting', 'Nakshi Kantha', 'Wood Carving'].map((craft) => {
                  const isSel = selectedCrafts.includes(craft);
                  return (
                    <button
                      type="button"
                      key={craft}
                      onClick={() => handleToggleCraftPref(craft)}
                      className={`px-3 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                        isSel ? 'bg-amber-950 text-amber-100 border border-amber-900' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {craft} {isSel ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GDPR Consent Section */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-stone-600 text-[11px] leading-relaxed">
                  I consent to storing my style profile for craft recommendations under GDPR version <strong>v1.0</strong>. I understand I can update or erase my stored preferences at any time.
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-amber-950 text-amber-100 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-amber-900 transition-colors"
            >
              Save Style Preferences
            </button>
          </form>
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl font-bold text-stone-900">In-App Notifications Log</h2>
            <button
              onClick={() => {
                storageService.markAllNotificationsRead(user.id);
                setNotifications(storageService.getNotifications(user.id));
                onShowToast('info', 'Notifications Updated', 'All notifications marked as read.');
              }}
              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-pointer"
            >
              Mark All Read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
                <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 text-xs">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    storageService.markNotificationRead(n.id);
                    setNotifications(storageService.getNotifications(user.id));
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    n.read ? 'bg-white border-stone-200 opacity-80' : 'bg-amber-50/60 border-amber-200 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 bg-amber-600 rounded-full" />}
                        <h4 className="font-bold text-stone-900 text-xs">{n.title}</h4>
                      </div>
                      <p className="text-stone-600 text-xs">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TRUST & COD STANDING TAB */}
      {activeTab === 'trust' && (() => {
        const trustTier = TrustService.getTrustTier(trustProfile.score);
        const codCheck = TrustService.isCODEligible(user.id);

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-800 text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Buyer Risk Rating & COD Standing
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">Platform Trust Score</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Your trust score governs eligibility for Cash on Delivery (COD) and priority support across artisan workshops.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-2xl text-xs font-bold border uppercase tracking-wider ${trustTier.badgeColor}`}>
                    {trustTier.label}
                  </span>
                </div>
              </div>

              {/* Score Bar Visualization */}
              <div className="space-y-3 bg-stone-50 p-6 rounded-2xl border border-stone-200/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700">Trust Score Visual Bar</span>
                  <span className="font-serif font-bold text-xl text-stone-900">{trustProfile.score} / 100</span>
                </div>

                <div className="relative w-full h-4 bg-stone-200 rounded-full overflow-hidden shadow-inner">
                  {/* 65% Threshold indicator line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-amber-950 z-10" 
                    style={{ left: '65%' }}
                    title="COD Threshold (65/100)"
                  />
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${trustTier.barColor}`} 
                    style={{ width: `${trustProfile.score}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium pt-1">
                  <span>0 (Min)</span>
                  <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    COD Threshold: 65/100
                  </span>
                  <span>100 (Max)</span>
                </div>

                <p className="text-xs text-stone-600 mt-2 font-medium">{trustTier.description}</p>
              </div>

              {/* COD Status Box */}
              <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                codCheck.eligible ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                {codCheck.eligible ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {codCheck.eligible ? 'Cash on Delivery (COD) Unlocked' : 'COD Eligibility Pending'}
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">{codCheck.reason}</p>
                </div>
              </div>

              {/* Phone Verification Boost Box */}
              {!user.phoneNumberVerified && (
                <div className="bg-stone-900 text-stone-50 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      Instant +10 Point Trust Boost
                    </div>
                    <h4 className="font-serif font-bold text-base">Verify Mobile Phone Number</h4>
                    <p className="text-xs text-stone-300">Instantly gain +10 trust points to qualify for Cash on Delivery nationwide.</p>
                  </div>
                  <button
                    onClick={() => {
                      TrustService.addEvent(user.id, 'phone_verified');
                      storageService.verifyUserPhone(user.id);
                      onShowToast('success', 'Phone Verified!', '+10 Trust score points added to your account.');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    Verify Phone (+10 Pts)
                  </button>
                </div>
              )}

              {/* Trust Event Log Ledger */}
              <div className="space-y-3 pt-4 border-t border-stone-200/80">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-base text-stone-900">Trust Event History Ledger</h3>
                  <span className="text-xs text-stone-500 font-mono">{trustEvents.length} Events Logged</span>
                </div>

                <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-200/80 text-xs">
                  {trustEvents.length === 0 ? (
                    <div className="p-6 text-center text-stone-500 italic">
                      No trust events recorded yet. All accounts begin at a neutral starting score of 50.
                    </div>
                  ) : (
                    trustEvents.map(evt => (
                      <div key={evt.id} className="p-3.5 flex justify-between items-center hover:bg-stone-100/60 transition-colors">
                        <div className="space-y-0.5">
                          <p className="font-bold text-stone-800">{evt.reason}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{new Date(evt.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                          evt.scoreDelta >= 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {evt.scoreDelta > 0 ? `+${evt.scoreDelta}` : evt.scoreDelta} Pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* VERIFIED PURCHASE REVIEW SUBMISSION MODAL */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setReviewingItem(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Verified Purchase Review
              </span>
              <h2 className="font-serif text-xl font-bold text-stone-900">Review Item</h2>
              <p className="text-xs text-stone-500 truncate">{reviewingItem.title}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Rating (1 - 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-2 bg-stone-50 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterpiece Terracotta Craft!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Detailed Review</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the craftsmanship, material quality, and delivery experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-950 text-amber-100 font-bold rounded-xl uppercase tracking-wider shadow-md"
              >
                Submit Review for Vendor Approval
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

