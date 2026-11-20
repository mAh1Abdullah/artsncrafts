import React, { useState, useEffect } from 'react';
import { CartItem, Address, PaymentMethod, Order, PaymentRecord } from '../types';
import { COURIER_PROVIDERS } from '../data/mockData';
import { formatPrice } from '../utils/cuid';
import { storageService } from '../services/storage';
import { CouponService } from '../services/couponService';
import { 
  X, CheckCircle2, ShieldCheck, Truck, 
  MapPin, CreditCard, ArrowRight, Tag, Smartphone, Lock, AlertCircle, RefreshCw, FileText 
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onOrderPlaced: (
    recipientName: string,
    email: string,
    phone: string,
    address: Address,
    paymentMethod: PaymentMethod,
    courierName: string
  ) => Order;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  onClose,
  onOrderPlaced
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'address' | 'payment' | 'gateway_simulation' | 'confirmation'>('address');
  
  // Shipping Address Form State
  const [recipientName, setRecipientName] = useState('Anika Rahman');
  const [email, setEmail] = useState('anika@example.com');
  const [phone, setPhone] = useState('+8801712345678');
  const [addressLine, setAddressLine] = useState('House 42, Road 11, Block D');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Banani');
  const [postalCode, setPostalCode] = useState('1213');
  const [deliveryNote, setDeliveryNote] = useState('Ring bell upon arrival');

  // Selected Courier Provider
  const [selectedCourierId, setSelectedCourierId] = useState('pathao');
  
  // Payment Method & Credentials
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [bKashNumber, setBKashNumber] = useState('01712345678');
  const [bKashOtp, setBKashOtp] = useState('123456');
  const [bKashPin, setBKashPin] = useState('77881');
  
  // SSLCommerz Card Details
  const [cardNumber, setCardNumber] = useState('4321 8890 1234 5678');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('889');

  // COD Eligibility Status
  const [codStatus, setCodStatus] = useState<{ eligible: boolean; reason?: string }>({ eligible: true });

  // Gateway Simulation State
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [webhookLog, setWebhookLog] = useState<{ eventId: string; signature: string } | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountCents: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Placed Order Result
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [lastPaymentRecord, setLastPaymentRecord] = useState<PaymentRecord | null>(null);

  const currentUser = storageService.getCurrentUser();
  const selectedCourier = COURIER_PROVIDERS.find(c => c.id === selectedCourierId) || COURIER_PROVIDERS[0];

  const uniqueVendors = Array.from(new Set(cart.map(i => i.vendorId))) as string[];

  useEffect(() => {
    // Validate COD Eligibility for user & vendors
    const res = storageService.checkCodEligibility(currentUser.id, uniqueVendors);
    setCodStatus(res);
    if (!res.eligible && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [currentUser.id, cart]);

  const subtotalCents = cart.reduce((sum, item) => {
    const customMods = item.customSelections?.reduce((s, c) => s + c.priceModifierCents, 0) || 0;
    return sum + (item.unitPriceCents + customMods) * item.quantity;
  }, 0);

  const totalShippingFeeCents = selectedCourier.basePriceCents * uniqueVendors.length;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;
  const grandTotalCents = Math.max(0, subtotalCents + totalShippingFeeCents - discountCents);

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = CouponService.validate(couponCode, currentUser.id, cart, subtotalCents);
    if (res.valid) {
      setAppliedCoupon({
        code: res.coupon?.code || couponCode.trim().toUpperCase(),
        discountCents: res.discountAmountCents,
        message: `Promo code '${res.coupon?.code}' applied! Saved ৳${Math.round(res.discountAmountCents / 100).toLocaleString()}.`
      });
      setCouponError('');
    } else {
      setCouponError(res.reason || 'Invalid promo coupon.');
      setAppliedCoupon(null);
    }
  };

  const executeCheckoutPayment = (e: React.FormEvent) => {
    e.preventDefault();

    const addressSnapshot: Address = {
      id: 'addr_snap_' + Date.now(),
      recipientName,
      phone,
      addressLine,
      division,
      district,
      upazila,
      postalCode,
      deliveryNote
    };

    if (paymentMethod === 'cod') {
      const newOrder = onOrderPlaced(
        recipientName,
        email,
        phone,
        addressSnapshot,
        'cod',
        selectedCourier.name
      );
      if (appliedCoupon) {
        CouponService.apply(appliedCoupon.code, currentUser.id, newOrder.id, appliedCoupon.discountCents);
      }
      storageService.createPaymentAttempt(newOrder.id, 'cod', grandTotalCents, { note: 'COD upon doorstep delivery' });
      setPlacedOrder(newOrder);
      setStep('confirmation');
    } else {
      setStep('gateway_simulation');
    }
  };

  const handleSimulateGatewayPayment = () => {
    setGatewayProcessing(true);

    const addressSnapshot: Address = {
      id: 'addr_snap_' + Date.now(),
      recipientName,
      phone,
      addressLine,
      division,
      district,
      upazila,
      postalCode,
      deliveryNote
    };

    const newOrder = onOrderPlaced(
      recipientName,
      email,
      phone,
      addressSnapshot,
      paymentMethod,
      selectedCourier.name
    );

    if (appliedCoupon) {
      CouponService.apply(appliedCoupon.code, currentUser.id, newOrder.id, appliedCoupon.discountCents);
    }

    // 1. Record payment attempt
    const attempt = storageService.createPaymentAttempt(newOrder.id, paymentMethod, grandTotalCents, {
      bKashNumber,
      cardNumberMasked: paymentMethod === 'sslcommerz' ? `**** **** **** ${cardNumber.slice(-4)}` : undefined
    });

    setTimeout(() => {
      // 2. Trigger webhook callback with signature
      const eventId = `EVT_${paymentMethod.toUpperCase()}_${Date.now().toString().slice(-6)}`;
      const signature = `sha256_${paymentMethod}_sig_${Date.now()}`;

      const webhookRes = storageService.processWebhookCallback(
        paymentMethod,
        `${paymentMethod}.payment.completed`,
        eventId,
        {
          orderId: newOrder.id,
          attemptId: attempt.id,
          amount: (grandTotalCents / 100).toFixed(2),
          status: 'SUCCESS'
        },
        signature,
        newOrder.id
      );

      setGatewayProcessing(false);
      setWebhookLog({ eventId, signature });
      setLastPaymentRecord(webhookRes.paymentRecord || null);
      setPlacedOrder(newOrder);
      setStep('confirmation');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 relative text-stone-800">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Handcrafted Market Checkout</h2>
            <p className="text-xs text-stone-500">Step {step === 'address' ? '1 of 2: Shipping & Delivery' : step === 'payment' ? '2 of 2: Payment Method' : 'Confirmation'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Shipping Address & Courier Selection */}
        {step === 'address' && (
          <form onSubmit={() => setStep('payment')} className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-800" />
                Delivery Address in Bangladesh
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-800 block mb-1">Street Address / House / Road *</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Division *</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">District / Upazila *</label>
                  <input
                    type="text"
                    required
                    value={`${district}, ${upazila}`}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Courier Provider Suggestion Engine */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-800" />
                Automated Courier Provider Suggestion
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {COURIER_PROVIDERS.map((courier) => (
                  <div
                    key={courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      selectedCourierId === courier.id
                        ? 'bg-amber-50/80 border-amber-900 ring-2 ring-amber-800/20'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <img src={courier.logo} alt={courier.name} className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-stone-900">{courier.name}</p>
                      <p className="text-[10px] text-stone-500">{courier.estimatedDeliveryDays}</p>
                      <p className="text-xs font-serif font-bold text-amber-900 mt-0.5">
                        +{formatPrice(courier.basePriceCents * uniqueVendors.length)} shipping
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Code Rules Engine Input */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-800" />
                Promo & Coupon Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. HERITAGE15, ARTISAN500)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs uppercase font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex justify-between items-center">
                  <span>✓ {appliedCoupon.message}</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="text-emerald-900 font-bold hover:underline">Remove</button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-rose-700 font-medium">{couponError}</p>
              )}
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">Total Payable</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-bold text-amber-950 text-xl">{formatPrice(grandTotalCents)}</span>
                  {appliedCoupon && (
                    <span className="text-xs text-emerald-800 font-bold">(-{formatPrice(appliedCoupon.discountCents)})</span>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                Continue to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Payment Provider Selection */}
        {step === 'payment' && (
          <form onSubmit={executeCheckoutPayment} className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-800" />
                Select Payment Method
              </h3>

              <div className="space-y-3 text-xs">
                {/* bKash Mobile Gateway */}
                <div
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'bkash'
                      ? 'bg-pink-50/80 border-pink-700 ring-2 ring-pink-700/20'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-pink-700" />
                      <span className="font-bold text-pink-900 text-sm">bKash Mobile Payment Gateway</span>
                    </div>
                    <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Instant Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Direct bKash merchant gateway authorization with signature verification.
                  </p>
                  {paymentMethod === 'bkash' && (
                    <div className="mt-3 pt-3 border-t border-pink-200/60 space-y-2">
                      <label className="text-[11px] font-semibold text-stone-700 block">bKash Wallet Number</label>
                      <input
                        type="text"
                        value={bKashNumber}
                        onChange={(e) => setBKashNumber(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* SSLCommerz Card Gateway */}
                <div
                  onClick={() => setPaymentMethod('sslcommerz')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'sslcommerz'
                      ? 'bg-blue-50/80 border-blue-700 ring-2 ring-blue-700/20'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-700" />
                      <span className="font-bold text-blue-950 text-sm">SSLCommerz (Debit/Credit Card)</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      3D Secure
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Supports Visa, Mastercard, City Bank AMEX & DBBL Nexus cards.
                  </p>
                </div>

                {/* Cash on Delivery (COD) with Trust Profile Verification */}
                <div
                  onClick={() => {
                    if (codStatus.eligible) setPaymentMethod('cod');
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    !codStatus.eligible 
                      ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                      : paymentMethod === 'cod'
                      ? 'bg-amber-50/80 border-amber-900 ring-2 ring-amber-800/20 cursor-pointer'
                      : 'bg-stone-50 border-stone-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-800" />
                      <span className="font-bold text-stone-900 text-sm">Cash on Delivery (COD)</span>
                    </div>
                    {codStatus.eligible ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Trust Eligible (Score 85/100)
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ineligible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Pay in cash upon doorstep delivery after inspecting your items.
                  </p>
                  {!codStatus.eligible && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codStatus.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('address')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Back to Address
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {paymentMethod === 'cod' ? `Confirm COD Order (${formatPrice(grandTotalCents)})` : `Proceed to Gateway (${formatPrice(grandTotalCents)})`}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Gateway Simulation Portal (bKash / SSLCommerz) */}
        {step === 'gateway_simulation' && (
          <div className="p-6 space-y-6">
            {paymentMethod === 'bkash' ? (
              <div className="p-6 bg-pink-900 text-white rounded-3xl space-y-5 relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-center border-b border-pink-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-pink-300" />
                    <span className="font-serif font-bold text-lg tracking-wide">bKash Payment Gateway</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-pink-800 px-2.5 py-1 rounded-full text-pink-200">
                    Merchant API v2.4
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-pink-200">
                    <span>Merchant Name:</span>
                    <span className="font-bold text-white">The Artisan Market Ltd.</span>
                  </div>
                  <div className="flex justify-between text-pink-200">
                    <span>Total Amount:</span>
                    <span className="font-serif font-bold text-amber-300 text-sm">{formatPrice(grandTotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-pink-200">
                    <span>Account Number:</span>
                    <span className="font-mono text-white">{bKashNumber}</span>
                  </div>
                </div>

                <div className="space-y-3 bg-pink-950/60 p-4 rounded-2xl border border-pink-700/50">
                  <div>
                    <label className="text-[11px] text-pink-200 block mb-1">Enter Verification OTP</label>
                    <input
                      type="text"
                      value={bKashOtp}
                      onChange={(e) => setBKashOtp(e.target.value)}
                      className="w-full px-3 py-2 bg-pink-900 border border-pink-700 rounded-xl text-white font-mono text-sm tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-pink-200 block mb-1">Enter 5-digit bKash PIN</label>
                    <input
                      type="password"
                      maxLength={5}
                      value={bKashPin}
                      onChange={(e) => setBKashPin(e.target.value)}
                      className="w-full px-3 py-2 bg-pink-900 border border-pink-700 rounded-xl text-white font-mono text-sm tracking-widest text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSimulateGatewayPayment}
                  disabled={gatewayProcessing}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  {gatewayProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying bKash Webhook Signature...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Authorize bKash Payment
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-5 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                    <span className="font-serif font-bold text-lg">SSLCommerz Hosted Checkout</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-blue-900 text-blue-200 px-2.5 py-1 rounded-full">
                    3DS Secured
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSimulateGatewayPayment}
                  disabled={gatewayProcessing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  {gatewayProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying SSLCommerz IPN Webhook...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatPrice(grandTotalCents)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Order Confirmation & Webhook Audit */}
        {step === 'confirmation' && placedOrder && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Order Placed & Verified!</h2>
              <p className="text-xs text-stone-500 mt-1">Transaction CUID: <span className="font-mono font-bold text-stone-800">{placedOrder.id}</span></p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-stone-500">Recipient:</span>
                <span className="font-bold text-stone-800">{placedOrder.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Shipping Address:</span>
                <span className="font-medium text-stone-800">{placedOrder.shippingAddressSnapshot.addressLine}, {placedOrder.shippingAddressSnapshot.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Status:</span>
                <span className="font-bold text-emerald-800 uppercase flex items-center gap-1">
                  ✓ {placedOrder.paymentMethod.toUpperCase()} ({placedOrder.paymentStatus.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Charged:</span>
                <span className="font-serif font-bold text-amber-950 text-sm">{formatPrice(placedOrder.totalAmountCents)}</span>
              </div>
            </div>

            {/* Webhook Audit Log Card */}
            {webhookLog && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 text-left space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-emerald-400" /> Webhook Event Verified</span>
                  <span className="text-emerald-400">SIGNATURE MATCH</span>
                </div>
                <p className="text-[11px] font-mono text-slate-300">Event ID: <span className="text-amber-300">{webhookLog.eventId}</span></p>
                <p className="text-[10px] font-mono text-slate-400 truncate">Signature: {webhookLog.signature}</p>
                <p className="text-[10px] text-slate-400">Idempotency Guarantee: <span className="text-emerald-300 font-semibold">UNIQUE(provider, event_id) Enforced</span></p>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 bg-amber-950 text-amber-100 rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors cursor-pointer"
            >
              Done & Return to Market
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
