"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Package,
  Plus,
  ShieldCheck,
  Tag,
  Wallet,
} from "lucide-react";
import {
  formatBDT,
  type AdminAuditLogDTO,
  type CouponDTO,
  type ProductDTO,
  type ReviewDTO,
  type VendorDTO,
  type VendorSettlementDTO,
} from "@waw/contracts";

interface AdminConsoleClientProps {
  initialVendors: VendorDTO[];
  initialProducts: ProductDTO[];
  initialReviews: ReviewDTO[];
  initialCoupons: CouponDTO[];
  initialSettlements: VendorSettlementDTO[];
  initialAuditLogs: AdminAuditLogDTO[];
}

export function AdminConsoleClient({
  initialVendors,
  initialProducts,
  initialReviews,
  initialCoupons,
  initialSettlements,
  initialAuditLogs,
}: AdminConsoleClientProps) {
  const [activeTab, setActiveTab] = useState<
    "vendors" | "products" | "reviews" | "coupons" | "settlements" | "audit"
  >("vendors");
  const [vendors, setVendors] = useState(initialVendors);
  const [products, setProducts] = useState(initialProducts);
  const [reviews, setReviews] = useState(initialReviews);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [settlements, setSettlements] = useState(initialSettlements);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // Coupon form
  const [couponCode, setCouponCode] = useState("");
  const [couponDesc, setCouponDesc] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderBdt, setMinOrderBdt] = useState("1500");

  const refreshAuditLogs = async () => {
    const res = await fetch("/api/v1/audit-logs?limit=50");
    const json = await res.json();
    if (res.ok && Array.isArray(json?.data)) {
      setAuditLogs(json.data);
    }
  };

  const handleVendorDecision = async (
    vendorId: string,
    status: VendorDTO["status"]
  ) => {
    setFeedback(null);
    const res = await fetch(`/api/v1/vendors/${encodeURIComponent(vendorId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        statusReason: `Admin governance transition to ${status}`,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Action failed" });
      return;
    }
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? json.data : v))
    );
    setFeedback({
      tone: "success",
      message: `${json.data.displayName} marked as ${status}.`,
    });
    refreshAuditLogs();
  };

  const handleProductModeration = async (
    productId: string,
    moderationStatus: "approved" | "rejected"
  ) => {
    setFeedback(null);
    const res = await fetch(
      `/api/v1/products/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderationStatus }),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Action failed" });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? json.data : p))
    );
    setFeedback({
      tone: "success",
      message: `Product "${json.data.name}" ${moderationStatus}.`,
    });
    refreshAuditLogs();
  };

  const handleReviewModeration = async (
    reviewId: string,
    status: "approved" | "rejected" | "hidden"
  ) => {
    setFeedback(null);
    const res = await fetch(`/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Action failed" });
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? json.data : r))
    );
    setFeedback({
      tone: "success",
      message: `Review updated to ${status}.`,
    });
    refreshAuditLogs();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/v1/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode.trim().toUpperCase(),
        description: couponDesc.trim(),
        type: "platform",
        discountType,
        discountValue: Number(discountValue),
        minOrderBdt: Number(minOrderBdt),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({
        tone: "error",
        message: json?.detail || "Unable to create coupon.",
      });
      return;
    }
    setCoupons((prev) => [json.data, ...prev]);
    setCouponCode("");
    setCouponDesc("");
    setFeedback({
      tone: "success",
      message: `Coupon ${json.data.code} activated for Astro Storefront checkout.`,
    });
    refreshAuditLogs();
  };

  const handleSettlementStatus = async (
    id: string,
    status: VendorSettlementDTO["status"]
  ) => {
    setFeedback(null);
    const res = await fetch(`/api/v1/settlements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ tone: "error", message: json?.detail || "Action failed" });
      return;
    }
    setSettlements((prev) =>
      prev.map((s) => (s.id === id ? json.data : s))
    );
    setFeedback({
      tone: "success",
      message: `Settlement ${id} updated to ${status}.`,
    });
    refreshAuditLogs();
  };

  const tabs = [
    { id: "vendors", label: `Vendors (${vendors.length})`, icon: ShieldCheck },
    { id: "products", label: `Products (${products.length})`, icon: Package },
    { id: "reviews", label: `Reviews (${reviews.length})`, icon: MessageSquare },
    { id: "coupons", label: `Coupons (${coupons.length})`, icon: Tag },
    {
      id: "settlements",
      label: `Settlements (${settlements.length})`,
      icon: Wallet,
    },
    { id: "audit", label: `Audit Logs (${auditLogs.length})`, icon: ClipboardList },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${
            feedback.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* VENDORS */}
      {activeTab === "vendors" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5">Artisan Studio</th>
                  <th className="py-2.5 px-4">Specialty & Location</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-900">
                        {v.displayName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {v.supportEmail}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{v.craftSpecialty}</div>
                      <div className="text-xs text-slate-500">
                        {v.workshopLocation}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          v.status === "approved"
                            ? "bg-emerald-50 text-emerald-800"
                            : v.status === "submitted"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {v.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right space-x-2 whitespace-nowrap">
                      {v.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleVendorDecision(v.id, "approved")}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {v.status !== "suspended" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleVendorDecision(v.id, "suspended")
                          }
                          className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS MODERATION */}
      {activeTab === "products" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5">Listing</th>
                  <th className="py-2.5 px-4">Studio</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-5">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs font-mono text-slate-500">
                        {p.sku} · {p.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.vendorName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatBDT(p.priceBdt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {p.moderationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleProductModeration(p.id, "approved")
                        }
                        className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleProductModeration(p.id, "rejected")
                        }
                        className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEWS */}
      {activeTab === "reviews" && (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {r.title}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {r.rating}/5 · {r.userName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize">
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReviewModeration(r.id, "approved")}
                  className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewModeration(r.id, "hidden")}
                  className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700"
                >
                  Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COUPONS */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-3.5"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              Create Platform Coupon
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Code
              </label>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. HERITAGE20"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={couponDesc}
                onChange={(e) => setCouponDesc(e.target.value)}
                placeholder="Festive craft discount"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as "percentage" | "fixed")
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (BDT)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Min Order (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={minOrderBdt}
                onChange={(e) => setMinOrderBdt(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white py-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Activate Coupon</span>
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5">Code</th>
                  <th className="py-2.5 px-4">Rule</th>
                  <th className="py-2.5 px-4 text-right">Min Order</th>
                  <th className="py-2.5 px-5 text-right">Redemptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-5 font-mono font-semibold text-slate-900">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.description}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatBDT(c.minOrderBdt)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums">
                      {c.usageCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTLEMENTS */}
      {activeTab === "settlements" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-5">Studio</th>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-right">Net Payout</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 px-5 font-medium text-slate-900">
                    {s.vendorName}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    {s.periodStart} → {s.periodEnd}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                    {formatBDT(s.netAmountBdt)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right space-x-2">
                    {s.status === "pending_review" && (
                      <button
                        type="button"
                        onClick={() => handleSettlementStatus(s.id, "approved")}
                        className="px-2.5 py-1 rounded border border-slate-300 text-xs font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {s.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => handleSettlementStatus(s.id, "paid")}
                        className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-5">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-5 font-mono text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {log.actorName}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    {log.entityType}:{log.entityId}
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {log.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
