"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X, RefreshCw, Truck, ArrowUpRight, Package } from "lucide-react";
import { StorefrontOrderRecord } from "./types";
import { formatArtisanPrice } from "@/lib/artisans-data";

interface OrderTrackerModalProps {
  open: boolean;
  currency: "BDT" | "USD";
  onClose: () => void;
}

export function OrderTrackerModal({
  open,
  currency,
  onClose,
}: OrderTrackerModalProps) {
  const [orders, setOrders] = useState<StorefrontOrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch {
      // Keep current list on transient network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  if (!open) return null;

  const filtered = orders.filter((o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      (o.trackingCode || "").toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#FAFAF8] border border-[#E5E2DC] rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#E5E2DC] bg-white flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#18181B]">
                Orders & Shipment Tracking
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Live order fulfillment status synced from the WAW-POS backend.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close order tracker"
              className="p-2 text-[#18181B] hover:bg-[#F2F0EC] rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-[#E5E2DC] bg-[#F2F0EC]/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order number (WAW-BD-...), phone, or tracking code"
              className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#E5E2DC] rounded-md text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#B84A27]"
            />
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#18181B] bg-white border border-[#E5E2DC] hover:border-[#18181B] rounded-md cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Package className="h-7 w-7 text-[#A1A1AA] mx-auto" />
                <p className="text-sm font-medium text-[#18181B]">
                  No matching orders found
                </p>
                <p className="text-xs text-[#71717A]">
                  Orders placed at checkout appear here immediately.
                </p>
              </div>
            ) : (
              filtered.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-lg bg-white border border-[#E5E2DC] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E2DC]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono tabular-nums font-semibold text-[#18181B]">
                          {order.orderNumber}
                        </span>
                        <span className="text-[#A1A1AA]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-[#52525B] capitalize">
                          {order.status}
                        </span>
                        <span className="text-[#A1A1AA]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-[#52525B] uppercase">
                          {order.paymentMethod} ({order.paymentStatus})
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A]">
                        {order.customerName} · {order.customerPhone}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono tabular-nums text-sm font-semibold text-[#18181B]">
                        {formatArtisanPrice(order.totalAmount, currency)}
                      </p>
                      <p className="text-[11px] text-[#71717A]">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={`${order.id}-${idx}`}
                        className="flex items-center justify-between text-xs text-[#52525B]"
                      >
                        <span className="truncate pr-4">
                          {item.quantity} × {item.productName}
                        </span>
                        <span className="font-mono tabular-nums text-[#18181B] shrink-0">
                          {formatArtisanPrice(
                            item.unitPrice * item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52525B]">
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-[#71717A]" />
                      {order.courierService ? (
                        <span className="capitalize">
                          {order.courierService} ·{" "}
                          <span className="font-mono tabular-nums text-[#18181B]">
                            {order.trackingCode}
                          </span>{" "}
                          (
                          {(order.courierStatus || "pending_pickup").replace(
                            "_",
                            " "
                          )}
                          )
                        </span>
                      ) : (
                        <span>Awaiting courier assignment in WAW-POS</span>
                      )}
                    </span>

                    <span className="text-[#71717A] truncate max-w-xs">
                      {order.shippingAddress}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#E5E2DC] bg-white flex items-center justify-between gap-4">
            <span className="text-xs text-[#71717A]">
              Manage dispatches, fraud checks & COD reconciliation in WAW-POS.
            </span>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B84A27] hover:underline whitespace-nowrap"
            >
              <span>Open WAW-POS Logistics</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
