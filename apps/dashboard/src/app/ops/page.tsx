import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ExternalLink,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { OperationsShell } from "@/components/layout/OperationsShell";
import {
  getEnrichedProducts,
  listOrders,
  listReviews,
  listSettlements,
  listShipments,
  listVendors,
} from "@/lib/db/marketplace";
import { formatBDT } from "@waw/contracts";

export const dynamic = "force-dynamic";

export default async function OperationsHubPage() {
  const products = await getEnrichedProducts();
  const vendors = listVendors();
  const orders = listOrders();
  const reviews = listReviews();
  const shipments = listShipments();
  const settlements = listSettlements();

  const lowStockCount = products.filter(
    (p) => p.currentStock <= p.reorderLevel
  ).length;
  const pendingVendors = vendors.filter(
    (v) => v.status === "submitted" || v.status === "under_review"
  ).length;
  const pendingReviews = reviews.filter((r) => r.status === "submitted").length;
  const activeShipments = shipments.filter(
    (s) => s.status !== "delivered"
  ).length;
  const totalRevenueBdt = orders.reduce(
    (sum, o) => sum + Math.round(o.totalAmount * 120),
    0
  );
  const pendingPayoutBdt = settlements
    .filter((s) => s.status === "pending_review" || s.status === "approved")
    .reduce((sum, s) => sum + s.netAmountBdt, 0);

  const storefrontUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || "/";

  const workspaces = [
    {
      href: "/pos",
      title: "WAW-POS Offline-First Register",
      description:
        "Point of Sale checkout terminal with barcode scanning, IndexedDB offline queue, thermal receipts, expenses, and financial P&L reports.",
      metric: `${products.length} synced SKUs`,
      icon: ShoppingCart,
      cta: "Launch Register",
    },
    {
      href: "/pos/inventory",
      title: "Stock Audit & Inventory Console",
      description:
        "Bulk stock adjustments, reorder-level thresholds, barcode label printing, and immutable stock movement audit trails.",
      metric: `${lowStockCount} low-stock alerts`,
      icon: Boxes,
      cta: "Open Stock Console",
    },
    {
      href: "/seller",
      title: "Artisan Seller Studio",
      description:
        "Create and manage handcrafted listings synced to WAW-POS, generate product stories via Gemini 4 Hydrogen, fulfill orders, and review payouts.",
      metric: `${vendors.filter((v) => v.status === "approved").length} active studios`,
      icon: Store,
      cta: "Open Seller Studio",
    },
    {
      href: "/admin",
      title: "Marketplace Governance & Admin",
      description:
        "Approve artisan studio applications, moderate listings and buyer reviews, issue coupons, approve settlements, and inspect audit trails.",
      metric: `${pendingVendors + pendingReviews} items in queue`,
      icon: ShieldCheck,
      cta: "Open Admin Console",
    },
    {
      href: "/shipping",
      title: "Shipping & Bangladesh Logistics",
      description:
        "Manage Dhaka Metro & regional delivery tariffs, simulate Pathao/Steadfast/RedX courier scoring, book consignments, and append tracking scans.",
      metric: `${activeShipments} in-transit shipments`,
      icon: Truck,
      cta: "Open Logistics Console",
    },
  ];

  return (
    <OperationsShell
      title="Operations Command Hub"
      subtitle="Unified Next.js 16 backend, PostgreSQL schema owner, and multi-console workspace"
      action={
        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Open POS</span>
        </Link>
      }
    >
      {/* Top KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Gross Order Volume
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatBDT(totalRevenueBdt)}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Across {orders.length} active marketplace orders
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Unified Catalog SKUs
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {products.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {lowStockCount} at or below reorder threshold
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Moderation Queue
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {pendingVendors + pendingReviews}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {pendingVendors} studio app(s) · {pendingReviews} review(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Pending Artisan Payouts
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatBDT(pendingPayoutBdt)}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {settlements.filter((s) => s.status !== "paid").length} open
            settlement cycle(s)
          </div>
        </div>
      </section>

      {/* Workspace Launchers */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Operational Consoles
          </h2>
          <a
            href={storefrontUrl}
            className="text-xs font-semibold text-[#B84A27] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Customer Storefront (Astro 7.4 · /)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <Link
                key={ws.href}
                href={ws.href}
                className="group bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-5 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="h-9 w-9 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {ws.metric}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {ws.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {ws.description}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span>{ws.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Marketplace Orders Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Storefront & POS Orders
            </h2>
            <p className="text-xs text-slate-500">
              Orders submitted from Astro 7.4 via POST /api/v1/orders deduct
              WAW-POS stock automatically
            </p>
          </div>
          <Link
            href="/shipping"
            className="text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            Manage Shipments
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-5">Order #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4">Courier</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-5 text-right">Total (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders.slice(0, 6).map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      {ord.customerName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {ord.customerPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 uppercase text-xs font-mono text-slate-600">
                    {ord.paymentMethod} · {ord.paymentStatus}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-600">
                    {ord.trackingCode || "Unassigned"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-medium text-slate-900 tabular-nums">
                    {formatBDT(Math.round(ord.totalAmount * 120))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OperationsShell>
  );
}
