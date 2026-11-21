import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  ApiProblemError,
  BDT_PER_USD,
  type DeliveryZoneDTO,
  type OrderDTO,
  type PaymentMethod,
} from '@waw/contracts';
import { wawApi } from '../lib/api';
import {
  clearCart,
  formatMoney,
  getStoreSnapshot,
  pushToast,
  removeCartItem,
  setCartOpen,
  subscribeStore,
  updateCartQuantity,
  type CartItem,
  type CurrencyCode,
} from '../lib/store';

export function CartAndCheckoutIsland() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [zones, setZones] = useState<DeliveryZoneDTO[]>([]);
  const [selectedZoneCode, setSelectedZoneCode] = useState('dhaka_metro');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountBdt: number;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  // Checkout fields
  const [customerName, setCustomerName] = useState('Anika Rahman');
  const [customerEmail, setCustomerEmail] = useState('anika@example.com');
  const [customerPhone, setCustomerPhone] = useState('+8801712345678');
  const [shippingAddress, setShippingAddress] = useState(
    'House 42, Road 11, Block D, Banani, Dhaka 1213'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDTO | null>(null);

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setOpen(snap.cartOpen);
      setCart(snap.cart);
      setCurrency(snap.currency);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  useEffect(() => {
    if (!open || zones.length > 0) return;
    wawApi
      .getDeliveryZones()
      .then((res) => setZones(res.data))
      .catch(() => {
        // Fallback default zone values if API unreachable momentarily
      });
  }, [open, zones.length]);

  if (!open) return null;

  const subtotalBdt = cart.reduce(
    (sum, item) => sum + item.unitPriceBdt * item.quantity,
    0
  );
  const activeZone =
    zones.find((z) => z.code === selectedZoneCode) ?? {
      id: 'zone-dhaka',
      code: 'dhaka_metro' as const,
      name: 'Dhaka Metro',
      basePriceBdt: 70,
      estimatedDeliveryDaysMin: 1,
      estimatedDeliveryDaysMax: 2,
      isActive: true,
    };
  const shippingFeeBdt = cart.length > 0 ? activeZone.basePriceBdt : 0;
  const discountBdt = appliedCoupon?.discountBdt ?? 0;
  const grandTotalBdt = Math.max(0, subtotalBdt + shippingFeeBdt - discountBdt);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponMessage(null);
    try {
      const res = await wawApi.validateCoupon(couponInput.trim(), subtotalBdt);
      if (res.data.valid) {
        setAppliedCoupon({
          code: res.data.code,
          discountBdt: res.data.discountBdt,
        });
        setCouponMessage(res.data.message);
      } else {
        setAppliedCoupon(null);
        setCouponMessage(res.data.message);
      }
    } catch (err) {
      setCouponMessage((err as Error).message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const idempotencyKey = `ord-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const res = await wawApi.createOrder(
        {
          customerName,
          customerEmail: customerEmail || undefined,
          customerPhone,
          shippingAddress,
          district:
            selectedZoneCode === 'dhaka_metro' ? 'Dhaka' : 'Sylhet',
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            vendorId: item.vendorId,
            vendorName: item.vendorName,
            quantity: item.quantity,
            unitPrice: item.unitPriceUsd,
            customSelections: item.customSelections,
            customNote: item.customNote,
          })),
          subtotalAmount: Number((subtotalBdt / BDT_PER_USD).toFixed(2)),
          shippingFee: Number((shippingFeeBdt / BDT_PER_USD).toFixed(2)),
          discountAmount: Number((discountBdt / BDT_PER_USD).toFixed(2)),
          couponCode: appliedCoupon?.code,
          totalAmount: Number((grandTotalBdt / BDT_PER_USD).toFixed(2)),
          advanceAmount:
            paymentMethod === 'cod'
              ? 0
              : Number((grandTotalBdt / BDT_PER_USD).toFixed(2)),
          paymentMethod,
          courierService:
            selectedZoneCode === 'dhaka_metro' ? 'pathao' : 'steadfast',
          notes: notes || undefined,
          buyerUserId: 'buyer-anika',
        },
        idempotencyKey
      );

      setConfirmedOrder(res.data);
      clearCart();
      setAppliedCoupon(null);
      setStep('confirmed');
      pushToast(`Order ${res.data.orderNumber} confirmed!`, 'success');
    } catch (err) {
      if (err instanceof ApiProblemError) {
        setCheckoutError(err.problem.detail);
      } else {
        setCheckoutError((err as Error).message || 'Checkout failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    setCartOpen(false);
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#221E1B]/45 backdrop-blur-[1px]"
        onClick={closeDrawer}
      />
      <aside className="relative z-10 w-full max-w-md bg-[#FAF9F6] h-full flex flex-col border-l border-[#DED6CA] shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD2] flex items-center justify-between bg-[#F3EFE9]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#B84A27]" />
            <h2 className="font-editorial text-lg font-semibold text-[#221E1B]">
              {step === 'cart'
                ? 'Your Craft Bag'
                : step === 'checkout'
                ? 'Express Checkout'
                : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded-md text-[#6E6359] hover:text-[#221E1B]"
            aria-label="Close bag"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'confirmed' && confirmedOrder && (
            <div className="space-y-5 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#4D6B59] mx-auto" />
              <div>
                <h3 className="font-editorial text-2xl font-semibold text-[#221E1B]">
                  Thank you, {confirmedOrder.customerName}
                </h3>
                <p className="mt-1 text-sm text-[#574E46]">
                  Your order has been synced with the artisan workshop and
                  WAW-POS inventory.
                </p>
              </div>
              <div className="rounded-lg border border-[#E2D9CC] bg-white p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6E6359]">Order Number</span>
                  <span className="font-mono font-semibold">
                    {confirmedOrder.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6359]">Tracking Code</span>
                  <span className="font-mono">
                    {confirmedOrder.trackingCode || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6359]">Payment</span>
                  <span className="font-mono uppercase">
                    {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="/account"
                  className="w-full py-2.5 rounded-lg bg-[#221E1B] hover:bg-[#B84A27] text-white text-sm font-medium transition-colors"
                >
                  Track Shipment in My Account
                </a>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-full py-2.5 rounded-lg border border-[#D8CFC3] text-sm font-medium text-[#221E1B]"
                >
                  Continue Exploring
                </button>
              </div>
            </div>
          )}

          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="h-10 w-10 text-[#C2B7A8] mx-auto" />
                  <p className="font-editorial text-lg text-[#221E1B]">
                    Your craft bag is empty
                  </p>
                  <p className="text-sm text-[#6E6359]">
                    Explore hand-thrown pottery, Jamdani sarees, silver
                    filigree, and teak woodcraft.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.key}
                      className="flex gap-3.5 pb-4 border-b border-[#EAE2D6]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-20 w-20 rounded-md object-cover bg-[#EFE9E0] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-[#221E1B] leading-snug line-clamp-2">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.key)}
                            className="text-[#8B7E71] hover:text-rose-700 p-0.5"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-[#6E6359] mt-0.5">
                          {item.vendorName}
                        </div>
                        {item.customSelections &&
                          item.customSelections.length > 0 && (
                            <div className="mt-1 text-[11px] text-[#4D6B59]">
                              {item.customSelections
                                .map((s) => `${s.optionLabel}: ${s.value}`)
                                .join(' · ')}
                            </div>
                          )}
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-[#D8CFC3] rounded bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.key, item.quantity - 1)
                              }
                              className="px-2 py-1 text-[#574E46] hover:text-[#221E1B]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2.5 text-xs font-mono tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.key, item.quantity + 1)
                              }
                              className="px-2 py-1 text-[#574E46] hover:text-[#221E1B]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-mono text-sm font-semibold tabular-nums text-[#221E1B]">
                            {formatMoney(
                              item.unitPriceBdt * item.quantity,
                              currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Coupon Box */}
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-medium text-[#574E46] flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#B84A27]" />
                      <span>Promo Code (try ARTISAN15 or CRAFT500)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 rounded-md border border-[#D8CFC3] bg-white px-3 py-1.5 text-sm font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3.5 py-1.5 rounded-md border border-[#221E1B] text-xs font-medium text-[#221E1B] hover:bg-[#221E1B] hover:text-white transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className="text-xs text-[#4D6B59]">{couponMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form
              id="storefront-checkout-form"
              onSubmit={handlePlaceOrder}
              className="space-y-4"
            >
              {checkoutError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900">
                  {checkoutError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#574E46] mb-1">
                    Phone (+880)
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#574E46] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1">
                  Delivery Zone
                </label>
                <select
                  value={selectedZoneCode}
                  onChange={(e) => setSelectedZoneCode(e.target.value)}
                  className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                >
                  {(zones.length > 0 ? zones : [activeZone]).map((z) => (
                    <option key={z.id} value={z.code}>
                      {z.name} — {formatMoney(z.basePriceBdt, currency)} (
                      {z.estimatedDeliveryDaysMin}–{z.estimatedDeliveryDaysMax}{' '}
                      days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1">
                  Shipping Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'bkash', label: 'bKash Instant' },
                      { id: 'nagad', label: 'Nagad Instant' },
                      { id: 'sslcommerz', label: 'Card / SSLCommerz' },
                      { id: 'cod', label: 'Cash on Delivery' },
                    ] as const
                  ).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`px-3 py-2 rounded-md border text-xs font-medium text-left transition-colors ${
                        paymentMethod === pm.id
                          ? 'border-[#B84A27] bg-[#F3EFE9] text-[#221E1B]'
                          : 'border-[#D8CFC3] bg-white text-[#574E46]'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#574E46] mb-1">
                  Delivery Note (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gift wrap or delivery window preference"
                  className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
                />
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {step !== 'confirmed' && cart.length > 0 && (
          <div className="p-6 border-t border-[#E5DDD2] bg-[#F3EFE9] space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#574E46]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(subtotalBdt, currency)}
                </span>
              </div>
              <div className="flex justify-between text-[#574E46]">
                <span>Delivery ({activeZone.name})</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(shippingFeeBdt, currency)}
                </span>
              </div>
              {discountBdt > 0 && (
                <div className="flex justify-between text-[#4D6B59]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono tabular-nums">
                    -{formatMoney(discountBdt, currency)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-[#DED6CA] flex justify-between font-semibold text-base text-[#221E1B]">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(grandTotalBdt, currency)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-medium transition-colors"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 rounded-lg border border-[#D8CFC3] bg-white text-sm font-medium text-[#221E1B]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="storefront-checkout-form"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-medium disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Place Order</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
