import { useEffect, useState } from 'react';
import {
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  formatBDT,
  type BuyerProfileDTO,
  type OrderDTO,
  type ProductDTO,
} from '@waw/contracts';
import { wawApi } from '../lib/api';

interface BuyerAccountIslandProps {
  initialProfile: BuyerProfileDTO | null;
  initialOrders: OrderDTO[];
  initialProducts: ProductDTO[];
}

export function BuyerAccountIsland({
  initialProfile,
  initialOrders,
  initialProducts,
}: BuyerAccountIslandProps) {
  const [profile, setProfile] = useState<BuyerProfileDTO | null>(
    initialProfile
  );
  const [orders, setOrders] = useState<OrderDTO[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'wishlist' | 'addresses' | 'trust'
  >('orders');

  useEffect(() => {
    Promise.all([
      wawApi.getBuyerProfile('buyer-anika'),
      wawApi.getOrders({ buyerUserId: 'buyer-anika', limit: 20 }),
    ])
      .then(([profRes, ordRes]) => {
        setProfile(profRes.data);
        setOrders(ordRes.data);
      })
      .catch(() => {
        // Keep SSR data
      });
  }, []);

  if (!profile) {
    return (
      <div className="rounded-xl border border-[#E5DDD2] bg-white p-8 text-center text-sm text-[#6E6359]">
        Loading buyer account from Next.js REST API...
      </div>
    );
  }

  const wishlistProducts = initialProducts.filter((p) =>
    profile.wishlistProductIds.includes(p.id)
  );

  return (
    <div className="space-y-8">
      {/* Top Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E5DDD2] bg-white p-5">
          <div className="flex items-center gap-2 text-xs text-[#6E6359]">
            <Wallet className="h-4 w-4 text-[#B84A27]" />
            <span>Store Wallet Credit</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#221E1B] tabular-nums">
            {formatBDT(profile.walletBalanceBdt)}
          </div>
        </div>

        <div className="rounded-xl border border-[#E5DDD2] bg-white p-5">
          <div className="flex items-center gap-2 text-xs text-[#6E6359]">
            <ShieldCheck className="h-4 w-4 text-[#4D6B59]" />
            <span>Buyer Trust & COD Standing</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#221E1B] tabular-nums">
            {profile.trustScore}/100
          </div>
          <div className="mt-1 text-xs text-[#4D6B59]">
            {profile.codEligible
              ? 'Eligible for Cash on Delivery'
              : 'Online prepayment required'}
          </div>
        </div>

        <div className="rounded-xl border border-[#E5DDD2] bg-white p-5">
          <div className="flex items-center gap-2 text-xs text-[#6E6359]">
            <Package className="h-4 w-4 text-[#221E1B]" />
            <span>Active & Past Orders</span>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#221E1B] tabular-nums">
            {orders.length}
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5DDD2] pb-3">
        {(
          [
            { id: 'orders', label: 'Orders & Tracking', icon: Truck },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})`, icon: Heart },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'trust', label: 'Style & Trust Profile', icon: ShieldCheck },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-[#221E1B] text-white'
                  : 'text-[#574E46] hover:bg-[#EFE9E0]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-xl border border-[#E5DDD2] bg-white p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EFE8DE]">
                <div>
                  <span className="font-mono text-sm font-semibold text-[#221E1B]">
                    {ord.orderNumber}
                  </span>
                  <span className="ml-3 text-xs text-[#6E6359]">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#6E6359]">
                    Tracking: {ord.trackingCode || 'Pending'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[#F3EFE9] text-xs font-medium text-[#221E1B] capitalize">
                    {ord.status}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {ord.items.map((item, idx) => (
                  <div
                    key={`${ord.id}-${idx}`}
                    className="flex justify-between text-sm text-[#4A413A]"
                  >
                    <span>
                      {item.quantity}× {item.productName}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatBDT(Math.round(item.unitPrice * item.quantity * 120))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#EFE8DE] flex justify-between text-xs text-[#6E6359]">
                <span>{ord.shippingAddress}</span>
                <span className="font-mono font-semibold text-sm text-[#221E1B] tabular-nums">
                  Total {formatBDT(Math.round(ord.totalAmount * 120))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((p) => (
            <a
              key={p.id}
              href={`/products/${p.id}`}
              className="rounded-xl border border-[#E5DDD2] bg-white overflow-hidden hover:border-[#221E1B] transition-colors"
            >
              <img
                src={p.imageUrl || '/images/artisans/artisans_hero_workshop_1795181990328.jpg'}
                alt={p.name}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-4">
                <div className="text-xs text-[#6E6359]">{p.vendorName}</div>
                <div className="font-editorial text-base font-medium text-[#221E1B] mt-0.5">
                  {p.name}
                </div>
                <div className="mt-2 font-mono text-sm font-semibold tabular-nums">
                  {formatBDT(p.priceBdt)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile.savedAddresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-xl border border-[#E5DDD2] bg-white p-5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#221E1B]">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="text-[11px] font-medium text-[#4D6B59]">
                    Default
                  </span>
                )}
              </div>
              <div className="text-sm text-[#4A413A]">{addr.recipientName}</div>
              <div className="text-xs text-[#6E6359]">{addr.addressLine}</div>
              <div className="text-xs text-[#6E6359]">
                {addr.district}, {addr.division} {addr.postalCode}
              </div>
              <div className="text-xs font-mono text-[#6E6359]">{addr.phone}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trust' && (
        <div className="rounded-xl border border-[#E5DDD2] bg-white p-6 space-y-4 max-w-2xl">
          <h3 className="font-editorial text-lg font-semibold text-[#221E1B]">
            Craft Preferences & Account Governance
          </h3>
          <div className="text-sm text-[#4A413A] space-y-2">
            <div>
              <strong>Preferred Department:</strong>{' '}
              {profile.styleProfile.department}
            </div>
            <div>
              <strong>Favorite Crafts:</strong>{' '}
              {profile.styleProfile.favoriteCrafts.join(', ')}
            </div>
            <div>
              <strong>Palette Preferences:</strong>{' '}
              {profile.styleProfile.preferredColors.join(', ')}
            </div>
          </div>
          <div className="pt-3 border-t border-[#EFE8DE] space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6E6359]">
              Recent Notifications
            </div>
            {profile.notifications.map((n) => (
              <div key={n.id} className="text-xs text-[#4A413A]">
                <strong>{n.title}:</strong> {n.body}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
