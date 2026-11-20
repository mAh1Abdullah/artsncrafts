"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { StorefrontCartItem, StorefrontOrderRecord } from "../types";
import { formatArtisanPrice } from "@/features/artisans/data/artisans-catalog";

interface CheckoutModalProps {
  open: boolean;
  items: StorefrontCartItem[];
  currency: "BDT" | "USD";
  onClose: () => void;
  onOrderSuccess: (order: StorefrontOrderRecord) => void;
}

type PaymentOption = "cod" | "bkash" | "nagad" | "amarpay";
type CourierOption = "pathao" | "steadfast";

const FREE_SHIPPING_THRESHOLD_USD = 50;

export function CheckoutModal({
  open,
  items,
  currency,
  onClose,
  onOrderSuccess,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState("Anika Rahman");
  const [customerPhone, setCustomerPhone] = useState("+8801712345678");
  const [shippingAddress, setShippingAddress] = useState(
    "House 18, Road 7, Dhanmondi, Dhaka 1209"
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("bkash");
  const [courierService, setCourierService] =
    useState<CourierOption>("pathao");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] =
    useState<StorefrontOrderRecord | null>(null);

  if (!open) return null;

  const subtotalUsd = items.reduce(
    (sum, item) =>
      sum + (item.product.priceUsd + item.optionModifierUsd) * item.quantity,
    0
  );
  const shippingUsd =
    subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD || subtotalUsd === 0 ? 0 : 3.0;
  const totalUsd = Number((subtotalUsd + shippingUsd).toFixed(2));
  const advanceUsd =
    paymentMethod === "cod" ? 0 : totalUsd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage("Please complete your name, phone number, and delivery address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        items: items.map((item) => {
          const customizationSummary = Object.entries(item.selectedOptions)
            .filter(([, v]) => v && v.trim().length > 0)
            .map(([, v]) => v)
            .join(", ");
          return {
            productId: item.product.id,
            productName: customizationSummary
              ? `${item.product.title} (${customizationSummary})`
              : item.product.title,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: Number(
              (item.product.priceUsd + item.optionModifierUsd).toFixed(2)
            ),
          };
        }),
        totalAmount: totalUsd,
        advanceAmount: advanceUsd,
        paymentMethod,
        courierService,
        notes: deliveryNotes.trim() || "Placed via Artisans Market storefront",
      };

      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to complete checkout right now.");
      }

      setConfirmedOrder(data.order);
      onOrderSuccess(data.order);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setConfirmedOrder(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-xs"
        onClick={handleCloseModal}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FAFAF8] border border-[#E5E2DC] rounded-xl shadow-2xl"
        >
          <div className="px-6 py-5 border-b border-[#E5E2DC] flex items-center justify-between bg-white">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
                {confirmedOrder ? "Order Confirmed" : "Checkout"}
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                {confirmedOrder
                  ? "Synchronized directly with WAW-POS inventory and fulfillment."
                  : "Direct studio fulfillment powered by WAW-POS logistics."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close checkout"
              className="p-2 text-[#18181B] hover:bg-[#F2F0EC] rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirmedOrder ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-lg bg-[#F2F0EC] border border-[#E5E2DC]">
                <CheckCircle2 className="h-6 w-6 text-[#2F5241] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#18181B]">
                    Order {confirmedOrder.orderNumber} Confirmed — Preparing
                    Shipment
                  </p>
                  <p className="text-xs text-[#52525B]">
                    Your order has been logged in WAW-POS, stock levels have
                    been updated, and courier booking is queued.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-white border border-[#E5E2DC] space-y-1.5">
                  <p className="text-xs text-[#71717A]">Recipient & Delivery</p>
                  <p className="font-medium text-[#18181B]">
                    {confirmedOrder.customerName}
                  </p>
                  <p className="text-xs text-[#52525B] font-mono tabular-nums">
                    {confirmedOrder.customerPhone}
                  </p>
                  <p className="text-xs text-[#52525B]">
                    {confirmedOrder.shippingAddress}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white border border-[#E5E2DC] space-y-1.5">
                  <p className="text-xs text-[#71717A]">
                    Payment & Courier Tracking
                  </p>
                  <p className="font-medium text-[#18181B] uppercase text-xs">
                    {confirmedOrder.paymentMethod} ·{" "}
                    {confirmedOrder.paymentStatus}
                  </p>
                  <p className="text-xs text-[#52525B] font-mono tabular-nums">
                    Tracking:{" "}
                    {confirmedOrder.trackingCode || "Pending Courier Pickup"}
                  </p>
                  <p className="text-xs text-[#52525B] font-mono tabular-nums">
                    Total:{" "}
                    {formatArtisanPrice(confirmedOrder.totalAmount, currency)}
                    {confirmedOrder.dueBalance > 0 &&
                      ` (COD Due: ${formatArtisanPrice(
                        confirmedOrder.dueBalance,
                        currency
                      )})`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E5E2DC]">
                <Link
                  href="/pos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-[#18181B] bg-white border border-[#E5E2DC] hover:border-[#18181B] rounded-md transition-colors"
                >
                  <span>Inspect Live Order in WAW-POS</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-white bg-[#18181B] hover:bg-[#B84A27] rounded-md transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-12"
            >
              {/* Left Form Fields */}
              <div className="md:col-span-7 p-6 space-y-5 border-b md:border-b-0 md:border-r border-[#E5E2DC]">
                {errorMessage && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#18181B]">
                    01. Delivery Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#52525B]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] focus:outline-none focus:border-[#B84A27]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#52525B]">
                        Mobile Phone (BD)
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+88017..."
                        className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] font-mono focus:outline-none focus:border-[#B84A27]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#52525B]">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] focus:outline-none focus:border-[#B84A27]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#52525B]">
                      Delivery Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Preferred delivery window or gate instructions"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#B84A27]"
                    />
                  </div>
                </div>

                {/* Courier Choice */}
                <div className="space-y-2.5 pt-2 border-t border-[#E5E2DC]">
                  <h3 className="text-xs font-semibold text-[#18181B]">
                    02. Courier Partner
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: "pathao",
                          label: "Pathao Courier",
                          sub: "1–3 days · Express",
                        },
                        {
                          id: "steadfast",
                          label: "Steadfast Courier",
                          sub: "2–4 days · Nationwide",
                        },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCourierService(c.id)}
                        className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                          courierService === c.id
                            ? "bg-[#18181B] text-white border-[#18181B]"
                            : "bg-white text-[#18181B] border-[#E5E2DC] hover:border-[#18181B]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Truck className="h-3.5 w-3.5" />
                          <span>{c.label}</span>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            courierService === c.id
                              ? "text-white/75"
                              : "text-[#71717A]"
                          }`}
                        >
                          {c.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2.5 pt-2 border-t border-[#E5E2DC]">
                  <h3 className="text-xs font-semibold text-[#18181B]">
                    03. Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: "bkash", label: "bKash", sub: "Instant mobile pay" },
                        { id: "nagad", label: "Nagad", sub: "Instant mobile pay" },
                        { id: "amarpay", label: "AmarPay", sub: "Card & bank" },
                        { id: "cod", label: "Cash on Delivery", sub: "Pay at doorstep" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id)}
                        className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                          paymentMethod === p.id
                            ? "bg-[#18181B] text-white border-[#18181B]"
                            : "bg-white text-[#18181B] border-[#E5E2DC] hover:border-[#18181B]"
                        }`}
                      >
                        <p className="text-xs font-semibold">{p.label}</p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            paymentMethod === p.id
                              ? "text-white/75"
                              : "text-[#71717A]"
                          }`}
                        >
                          {p.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Summary Column */}
              <div className="md:col-span-5 p-6 bg-[#F2F0EC] flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-[#18181B]">
                    Order Summary
                  </h3>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={item.cartKey}
                        className="flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#18181B] line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-[#71717A] font-mono tabular-nums">
                            Qty {item.quantity} · {item.product.sku}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums font-medium text-[#18181B] shrink-0">
                          {formatArtisanPrice(
                            (item.product.priceUsd + item.optionModifierUsd) *
                              item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#E5E2DC] space-y-2 text-xs">
                    <div className="flex justify-between text-[#52525B]">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums text-[#18181B]">
                        {formatArtisanPrice(subtotalUsd, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#52525B]">
                      <span>Courier Shipping</span>
                      <span className="font-mono tabular-nums text-[#18181B]">
                        {shippingUsd === 0
                          ? "Free"
                          : formatArtisanPrice(shippingUsd, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#52525B]">
                      <span>Pay Now</span>
                      <span className="font-mono tabular-nums text-[#18181B]">
                        {formatArtisanPrice(advanceUsd, currency)}
                      </span>
                    </div>
                    {paymentMethod === "cod" && (
                      <div className="flex justify-between text-[#52525B]">
                        <span>Due on Delivery</span>
                        <span className="font-mono tabular-nums text-[#18181B]">
                          {formatArtisanPrice(totalUsd, currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2.5 border-t border-[#E5E2DC] text-sm font-semibold text-[#18181B]">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">
                        {formatArtisanPrice(totalUsd, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#B84A27] hover:bg-[#9D3D1F] disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirming Order...</span>
                      </>
                    ) : (
                      <span>
                        Place Order · {formatArtisanPrice(totalUsd, currency)}
                      </span>
                    )}
                  </button>

                  <p className="text-[11px] text-[#71717A] flex items-center justify-center gap-1.5 text-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2F5241] shrink-0" />
                    <span>Protected purchase synced with WAW-POS ledger</span>
                  </p>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
