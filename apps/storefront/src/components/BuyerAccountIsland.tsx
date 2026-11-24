import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle,
  FileText,
  Heart,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import {
  ApiProblemError,
  BDT_PER_USD,
  type BuyerProfileDTO,
  type OrderDTO,
  type ProductDTO,
} from '@waw/contracts';
import { wawApi } from '../lib/api';
import {
  addToCart,
  formatMoney,
  getStoreSnapshot,
  openQuickView,
  pushToast,
  setCartOpen,
  setNotifications,
  setWishlistIds,
  subscribeStore,
  toggleLocalWishlist,
  type CurrencyCode,
} from '../lib/store';
import { ProductCard } from './ProductCard';

interface BuyerAccountIslandProps {
  initialProfile: BuyerProfileDTO | null;
  initialOrders: OrderDTO[];
  initialProducts: ProductDTO[];
}

type AccountTab = 'orders' | 'wishlist' | 'style' | 'notifications' | 'trust';

const CRAFT_SPECIALTIES = [
  'Jamdani Weaving',
  'Terracotta Pottery',
  'Silver Filigree',
  'Nakshi Kantha',
  'Wood Carving',
  'Shitalpati Cane',
];

function getTrustTier(score: number) {
  if (score >= 85) {
    return {
      label: 'Trusted Collector',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      barColor: 'bg-emerald-600',
      description:
        'Top-tier buyer standing. Cash on Delivery (COD) and priority artisan support are fully unlocked nationwide.',
    };
  }
  if (score >= 65) {
    return {
      label: 'Verified Standing',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      barColor: 'bg-amber-500',
      description:
        'Good standing above the 65/100 threshold. Eligible for Cash on Delivery across Dhaka Metro and divisional zones.',
    };
  }
  return {
    label: 'Prepaid Verification',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    barColor: 'bg-rose-500',
    description:
      'Complete prepaid deliveries or verify your phone number (+10 Pts) to unlock nationwide Cash on Delivery.',
  };
}

export function BuyerAccountIsland({
  initialProfile,
  initialOrders,
  initialProducts,
}: BuyerAccountIslandProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [profile, setProfile] = useState<BuyerProfileDTO | null>(
    initialProfile
  );
  const [orders, setOrders] = useState<OrderDTO[]>(initialOrders);
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [wishlistIds, setWishlistIdsState] = useState<string[]>(
    initialProfile?.wishlistProductIds ?? []
  );

  // Order Snapshot expand
  const [selectedSnapshotOrderId, setSelectedSnapshotOrderId] = useState<
    string | null
  >(null);

  // Verified Purchase Review Modal
  const [reviewingItem, setReviewingItem] = useState<{
    productId: string;
    title: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Style Profile Form
  const [department, setDepartment] = useState(
    initialProfile?.styleProfile.department || 'Home & Heritage Textiles'
  );
  const [sizeTops, setSizeTops] = useState(
    initialProfile?.styleProfile.sizeTops || 'M'
  );
  const [sizeBottoms, setSizeBottoms] = useState(
    initialProfile?.styleProfile.sizeBottoms || 'M'
  );
  const [sizeShoes, setSizeShoes] = useState(
    initialProfile?.styleProfile.sizeShoes || '38 EU'
  );
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>(
    initialProfile?.styleProfile.favoriteCrafts || [
      'Jamdani Weaving',
      'Terracotta Pottery',
    ]
  );
  const [consentAgreed, setConsentAgreed] = useState(
    Boolean(initialProfile?.styleProfile.consentVersion ?? true)
  );
  const [savingStyle, setSavingStyle] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Sync deep-link ?tab=... query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (
        tabParam === 'orders' ||
        tabParam === 'wishlist' ||
        tabParam === 'style' ||
        tabParam === 'notifications' ||
        tabParam === 'trust'
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCurrency(snap.currency);
      setWishlistIdsState(snap.wishlistIds);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  // Fetch live profile, orders & products from Next.js REST v1
  useEffect(() => {
    Promise.all([
      wawApi.getBuyerProfile('buyer-anika'),
      wawApi.getOrders({ buyerUserId: 'buyer-anika', limit: 25 }),
      wawApi.getProducts({ limit: 48 }),
    ])
      .then(([profRes, ordRes, prodRes]) => {
        const p = profRes.data;
        setProfile(p);
        setOrders(ordRes.data);
        setProducts(prodRes.data);
        setWishlistIds(p.wishlistProductIds);
        setNotifications(p.notifications);
        setDepartment(p.styleProfile.department || 'Home & Heritage Textiles');
        setSizeTops(p.styleProfile.sizeTops || 'M');
        setSizeBottoms(p.styleProfile.sizeBottoms || 'M');
        setSizeShoes(p.styleProfile.sizeShoes || '38 EU');
        setSelectedCrafts(p.styleProfile.favoriteCrafts || []);
        setConsentAgreed(Boolean(p.styleProfile.consentVersion ?? true));
      })
      .catch(() => {
        // Keep SSR state
      });
  }, []);

  const productImageById = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      map.set(
        p.id,
        p.imageUrl || '/images/artisans/artisans_hero_workshop_1795181990328.jpg'
      );
    });
    return map;
  }, [products]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const notifications = profile?.notifications ?? [];
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const trustScore = profile?.trustScore ?? 84;
  const trustTier = getTrustTier(trustScore);
  const trustEvents = profile?.trustEvents ?? [];

  const handleToggleWishlist = async (
    productId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const added = toggleLocalWishlist(productId);
    pushToast(
      added ? 'Saved to your wishlist.' : 'Removed from wishlist.',
      'info'
    );
    try {
      await wawApi.toggleWishlist('buyer-anika', productId);
    } catch {
      // Optimistic local state retained
    }
  };

  const handleToggleCraft = (craft: string) => {
    setSelectedCrafts((prev) =>
      prev.includes(craft) ? prev.filter((c) => c !== craft) : [...prev, craft]
    );
  };

  const handleSaveStyleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAgreed) {
      pushToast(
        'Please accept GDPR v1.0 personalization consent before saving.',
        'error'
      );
      return;
    }
    setSavingStyle(true);
    try {
      const res = await wawApi.updateBuyerProfile('buyer-anika', {
        styleProfile: {
          department,
          sizeTops,
          sizeBottoms,
          sizeShoes,
          favoriteCrafts: selectedCrafts,
          preferredColors: profile?.styleProfile.preferredColors ?? [
            'Alabaster',
            'Terracotta',
            'Forest Sage',
          ],
          consentVersion: 'v1.0',
        },
      });
      setProfile(res.data);
      pushToast(
        'Your style preferences have been saved to your collector profile.',
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Failed to save style profile.', 'error');
    } finally {
      setSavingStyle(false);
    }
  };

  const handleMarkNotificationRead = async (opts: {
    notificationId?: string;
    all?: boolean;
  }) => {
    try {
      const res = await wawApi.markBuyerNotificationsRead('buyer-anika', opts);
      setProfile(res.data);
      setNotifications(res.data.notifications);
      if (opts.all) {
        pushToast('All notifications marked as read.', 'info');
      }
    } catch {
      pushToast('Could not update notification status.', 'error');
    }
  };

  const handleVerifyPhone = async () => {
    setVerifyingPhone(true);
    try {
      const res = await wawApi.verifyBuyerPhone('buyer-anika');
      setProfile(res.data);
      setNotifications(res.data.notifications);
      pushToast(
        `Mobile number verified! Trust score increased to ${res.data.trustScore}/100.`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Phone verification failed.', 'error');
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setSubmittingReview(true);
    try {
      await wawApi.submitReview({
        productId: reviewingItem.productId,
        userId: profile?.id || 'buyer-anika',
        userName: profile?.name || 'Anika Rahman',
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviewingItem(null);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      pushToast('Verified purchase review published!', 'success');
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Collector Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F4EBE1] border-2 border-[#C85A32]/25 shadow-sm flex items-center justify-center font-editorial text-2xl font-bold text-[#C85A32] shrink-0">
            {(profile?.name || 'Anika Rahman').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-editorial text-2xl font-bold text-[#2E2A25]">
                {profile?.name || 'Anika Rahman'}
              </h1>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Verified Buyer
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {profile?.email || 'anika@example.com'} •{' '}
              {profile?.phone || '+8801712345678'}
            </p>
          </div>
        </div>

        {/* 5-Tab Switcher */}
        <div className="flex flex-wrap bg-stone-100 p-1 rounded-2xl border border-stone-200 gap-1 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4 text-[#C85A32]" />
            Orders ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wishlist'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-600" />
            Wishlist ({wishlistProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'style'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Style Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="w-4 h-4 text-[#C85A32]" />
            Notifications ({unreadNotifsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trust')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trust'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Trust &amp; COD ({trustScore}/100)
          </button>
        </div>
      </div>

      {/* TAB 1: ORDERS & IMMUTABLE SNAPSHOTS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-editorial text-xl font-bold text-[#2E2A25]">
              Your Handcrafted Orders &amp; Immutable Snapshots
            </h2>
            <span className="text-xs text-stone-500">
              Verified receipts frozen at checkout via WAW-POS
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-sm font-medium">
                No handcrafted orders placed yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderTotalBdt = Math.round(
                  order.totalAmount * BDT_PER_USD
                );
                const isExpanded = selectedSnapshotOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                  >
                    {/* Top Metadata Bar */}
                    <div className="p-4 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                          Order Number
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                          Placed Date
                        </span>
                        <span className="font-medium text-stone-700">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                          Payment
                        </span>
                        <span className="font-semibold text-stone-800 uppercase">
                          {order.paymentMethod} ({order.paymentStatus})
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                          Total Amount
                        </span>
                        <span className="font-editorial font-bold text-[#2E2A25] text-base tabular-nums">
                          {formatMoney(orderTotalBdt, currency)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSnapshotOrderId(
                            isExpanded ? null : order.id
                          )
                        }
                        className="px-3 py-1.5 bg-[#F4EBE1] hover:bg-[#E8DCCF] text-[#2E2A25] rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C85A32]" />
                        {isExpanded ? 'Hide JSON Snapshot' : 'View Snapshot'}
                      </button>
                    </div>

                    {/* Fulfillment & Line Items */}
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-stone-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-stone-600">
                            Courier:{' '}
                            <strong className="uppercase text-stone-900">
                              {order.courierService || 'Pathao'}
                            </strong>
                          </span>
                          {order.trackingCode && (
                            <span className="font-mono text-[11px] text-[#C85A32] bg-[#F4EBE1] px-2 py-0.5 rounded-md font-bold">
                              Tracking: {order.trackingCode}
                            </span>
                          )}
                        </div>
                        <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full capitalize text-[11px]">
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {order.items.map((item, idx) => {
                          const unitBdt = Math.round(
                            item.unitPrice * BDT_PER_USD
                          );
                          const thumb =
                            productImageById.get(item.productId) ||
                            '/images/artisans/artisans_hero_workshop_1795181990328.jpg';

                          return (
                            <div
                              key={`${order.id}-${item.productId}-${idx}`}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={thumb}
                                  alt={item.productName}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                                <div>
                                  <p className="font-semibold text-stone-900">
                                    {item.productName}
                                  </p>
                                  {item.vendorName && (
                                    <p className="text-[11px] text-stone-500">
                                      Studio: {item.vendorName}
                                    </p>
                                  )}
                                  {item.customSelections &&
                                    item.customSelections.length > 0 && (
                                      <div className="flex flex-wrap gap-1 text-[10px] text-amber-900 mt-1">
                                        {item.customSelections.map((sel, i) => (
                                          <span
                                            key={i}
                                            className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
                                          >
                                            {sel.optionLabel}: &ldquo;{sel.value}
                                            &rdquo;
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  {item.customNote && (
                                    <p className="text-[10px] text-stone-500 italic mt-0.5">
                                      Note: &ldquo;{item.customNote}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <p className="font-semibold text-stone-900 tabular-nums">
                                  {formatMoney(unitBdt, currency)} x{' '}
                                  {item.quantity}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewingItem({
                                      productId: item.productId,
                                      title: item.productName,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-[#2E2A25] hover:bg-[#C85A32] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                                  Write Verified Review
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Immutable JSON Snapshot Expandable Panel */}
                    {isExpanded && (
                      <div className="p-4 bg-stone-900 text-stone-100 text-[11px] font-mono border-t border-stone-800 space-y-2">
                        <p className="text-amber-400 font-bold text-xs uppercase">
                          Immutable Order Snapshot (Checkout Ledger Guarantee)
                        </p>
                        <pre className="overflow-x-auto p-3 bg-stone-950 rounded-lg max-h-56 text-stone-300">
                          {JSON.stringify(
                            {
                              orderId: order.id,
                              orderNumber: order.orderNumber,
                              shippingAddress: order.shippingAddress,
                              courierService: order.courierService,
                              trackingCode: order.trackingCode,
                              paymentMethod: order.paymentMethod,
                              paymentStatus: order.paymentStatus,
                              items: order.items,
                              createdAt: order.createdAt,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <h2 className="font-editorial text-xl font-bold text-[#2E2A25]">
            Your Saved Handcrafted Pieces
          </h2>
          {wishlistProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Heart className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-sm font-medium">
                Your wishlist is currently empty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={currency}
                  isWishlisted={true}
                  onToggleWishlist={handleToggleWishlist}
                  onSelectProduct={(p) => openQuickView(p)}
                  onQuickAddToCart={(p, e) => {
                    e.stopPropagation();
                    addToCart(p, 1);
                    setCartOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STYLE PROFILE & GDPR CONSENT */}
      {activeTab === 'style' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl">
          <div className="space-y-1">
            <span className="bg-[#F4EBE1] text-[#C85A32] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Optional Collector Personalization
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[#2E2A25]">
              Personalise Your Craft Experience
            </h2>
            <p className="text-xs text-stone-500">
              Configure sizing and specialty craft preferences. Used solely for
              tailored artisan recommendations — never for pricing or COD
              eligibility.
            </p>
          </div>

          <form onSubmit={handleSaveStyleProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Primary Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                >
                  <option value="Home & Heritage Textiles">
                    Home &amp; Heritage Textiles
                  </option>
                  <option value="Women">Women&apos;s Apparel &amp; Jewelry</option>
                  <option value="Men">Men&apos;s Handloom &amp; Leather</option>
                  <option value="Home & Decor">Terracotta Home &amp; Decor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tops / Kameez Size
                </label>
                <select
                  value={sizeTops}
                  onChange={(e) => setSizeTops(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Bottoms / Salwar Size
                </label>
                <select
                  value={sizeBottoms}
                  onChange={(e) => setSizeBottoms(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                >
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Footwear Size
                </label>
                <input
                  type="text"
                  value={sizeShoes}
                  onChange={(e) => setSizeShoes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-2">
                Favorite Craft Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {CRAFT_SPECIALTIES.map((craft) => {
                  const isSel = selectedCrafts.includes(craft);
                  return (
                    <button
                      type="button"
                      key={craft}
                      onClick={() => handleToggleCraft(craft)}
                      className={`px-3.5 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer ${
                        isSel
                          ? 'bg-[#2E2A25] text-white border border-[#2E2A25]'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {craft} {isSel ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GDPR Consent */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="gdpr-consent"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#C85A32]"
                />
                <label
                  htmlFor="gdpr-consent"
                  className="text-stone-600 text-[11px] leading-relaxed"
                >
                  I consent to storing my style profile for craft
                  recommendations under GDPR version <strong>v1.0</strong>. I
                  can update or erase my preferences at any time.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingStyle}
              className="py-3 px-6 bg-[#2E2A25] hover:bg-[#C85A32] disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
            >
              {savingStyle ? 'Saving Preferences...' : 'Save Style Preferences'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: IN-APP NOTIFICATIONS LOG */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-editorial text-xl font-bold text-[#2E2A25]">
              In-App Notifications Log
            </h2>
            <button
              type="button"
              onClick={() => handleMarkNotificationRead({ all: true })}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-pointer"
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
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    !n.read &&
                    handleMarkNotificationRead({ notificationId: n.id })
                  }
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-white border-stone-200 opacity-85'
                      : 'bg-[#F4EBE1]/70 border-[#C85A32]/30 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 bg-[#C85A32] rounded-full" />
                        )}
                        <h4 className="font-bold text-stone-900 text-xs">
                          {n.title}
                        </h4>
                      </div>
                      <p className="text-stone-600 text-xs">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TRUST SCORE & COD STANDING */}
      {activeTab === 'trust' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
              <div>
                <div className="flex items-center gap-2 text-[#C85A32] text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Buyer Risk Rating &amp; COD Standing
                </div>
                <h2 className="font-editorial text-2xl font-bold text-[#2E2A25] mt-1">
                  Platform Trust Score
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Your trust score governs Cash on Delivery (COD) eligibility
                  and priority workshop support across Bangladesh.
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-2xl text-xs font-bold border uppercase tracking-wider self-start md:self-auto ${trustTier.badgeColor}`}
              >
                {trustTier.label}
              </span>
            </div>

            {/* Trust Score Progress Bar */}
            <div className="space-y-3 bg-stone-50 p-6 rounded-2xl border border-stone-200/80">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-700">
                  Trust Score Visual Bar
                </span>
                <span className="font-editorial font-bold text-xl text-[#2E2A25] tabular-nums">
                  {trustScore} / 100
                </span>
              </div>

              <div className="relative w-full h-4 bg-stone-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="absolute top-0 bottom-0 w-1 bg-amber-950 z-10"
                  style={{ left: '65%' }}
                  title="COD Threshold (65/100)"
                />
                <div
                  className={`h-full rounded-full transition-all duration-500 ${trustTier.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium pt-1">
                <span>0 (Min)</span>
                <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  COD Threshold: 65/100
                </span>
                <span>100 (Max)</span>
              </div>

              <p className="text-xs text-stone-600 mt-2 font-medium">
                {trustTier.description}
              </p>
            </div>

            {/* COD Status Card */}
            <div
              className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                profile?.codEligible !== false
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {profile?.codEligible !== false
                    ? 'Cash on Delivery (COD) Unlocked'
                    : 'COD Eligibility Pending'}
                </h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {profile?.codEligible !== false
                    ? 'Your score meets the 65/100 benchmark. You can select Cash on Delivery at checkout for all COD-enabled artisan studios.'
                    : 'Reach 65/100 via prepaid orders or phone verification to unlock Cash on Delivery.'}
                </p>
              </div>
            </div>

            {/* Instant +10 Pt Phone Verification Boost */}
            {profile && !profile.phoneNumberVerified && (
              <div className="bg-[#2E2A25] text-stone-50 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Instant +10 Point Trust Boost
                  </div>
                  <h4 className="font-editorial font-bold text-base">
                    Verify Mobile Phone Number ({profile.phone})
                  </h4>
                  <p className="text-xs text-stone-300">
                    Instantly gain +10 trust points and record a verified SMS
                    attestation in your ledger.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={verifyingPhone}
                  onClick={handleVerifyPhone}
                  className="bg-[#C85A32] hover:bg-[#A84825] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  {verifyingPhone ? 'Verifying...' : 'Verify Phone (+10 Pts)'}
                </button>
              </div>
            )}

            {/* Trust Event History Ledger */}
            <div className="space-y-3 pt-4 border-t border-stone-200/80">
              <div className="flex justify-between items-center">
                <h3 className="font-editorial font-bold text-base text-[#2E2A25]">
                  Trust Event History Ledger
                </h3>
                <span className="text-xs text-stone-500 font-mono">
                  {trustEvents.length} Events Logged
                </span>
              </div>

              <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-200/80 text-xs">
                {trustEvents.length === 0 ? (
                  <div className="p-6 text-center text-stone-500 italic">
                    No trust events recorded yet.
                  </div>
                ) : (
                  trustEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 flex justify-between items-center gap-3 hover:bg-stone-100/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-stone-800">{evt.reason}</p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {new Date(evt.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                          evt.scoreDelta >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evt.scoreDelta > 0
                          ? `+${evt.scoreDelta}`
                          : evt.scoreDelta}{' '}
                        Pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED PURCHASE REVIEW MODAL */}
      {reviewingItem && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReviewingItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReviewingItem(null)}
              aria-label="Close review modal"
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-6">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Verified Purchase Review
              </span>
              <h2 className="font-editorial text-xl font-bold text-stone-900">
                Review Item
              </h2>
              <p className="text-xs text-stone-500 truncate">
                {reviewingItem.title}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Rating (1 - 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-2 bg-stone-50 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Review Headline
                </label>
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
                <label className="block font-bold text-stone-700 mb-1">
                  Detailed Review
                </label>
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
                disabled={submittingReview}
                className="w-full py-3 bg-[#2E2A25] hover:bg-[#C85A32] disabled:opacity-50 text-white font-bold rounded-xl uppercase tracking-wider shadow-md cursor-pointer transition-colors"
              >
                {submittingReview
                  ? 'Publishing Review...'
                  : 'Submit Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
