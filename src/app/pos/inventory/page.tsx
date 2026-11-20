import Link from "next/link";
import { ArrowLeft, Globe, ShieldCheck } from "lucide-react";
import {
  fetchCategories,
  fetchProducts,
  fetchStockAuditLogs,
} from "@/lib/actions/products";
import InventoryClient from "@/features/inventory/components/InventoryClient";

export const dynamic = "force-dynamic";

export default async function PosInventoryPage() {
  const [products, categories, auditLogs] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchStockAuditLogs({ limit: 100 }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>WAW-POS Dashboard</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <div>
                <h1 className="text-sm font-bold leading-tight text-slate-900">
                  Inventory & Stock Audit Console
                </h1>
                <p className="text-[11px] text-slate-500">
                  Server-persisted catalog, barcode management, and ledger trail
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#18181B] hover:bg-[#B84A27] text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Artisans Storefront</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <InventoryClient
          products={products}
          categories={categories}
          initialLogs={auditLogs}
        />
      </main>
    </div>
  );
}
