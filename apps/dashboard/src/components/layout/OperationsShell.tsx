"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";

interface OperationsShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/ops", label: "Operations Hub", icon: LayoutDashboard },
  { href: "/pos", label: "WAW-POS Register", icon: ShoppingCart },
  { href: "/pos/inventory", label: "Stock Audit Console", icon: Boxes },
  { href: "/seller", label: "Seller Studio", icon: Store },
  { href: "/admin", label: "Marketplace Admin", icon: ShieldCheck },
  { href: "/shipping", label: "Shipping & Logistics", icon: Truck },
];

export function OperationsShell({
  title,
  subtitle,
  action,
  children,
}: OperationsShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const storefrontUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL || "/";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200">
          <div className="h-8 w-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            W
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-slate-900 truncate">
              WAW Operations
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Next.js 16 · REST v1
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/ops"
                ? pathname === "/ops"
                : pathname === item.href ||
                  (item.href !== "/pos" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <a
            href={storefrontUrl}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-semibold bg-[#B84A27] text-white hover:bg-[#9c3d1f] transition-colors"
          >
            <span className="truncate">Open Astro Storefront</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </a>
          <div className="px-2 py-1 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>API /api/v1</span>
            <span>Web /</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
              <span className="text-sm font-semibold">WAW Operations</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-200">
              <a
                href={storefrontUrl}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-semibold bg-[#B84A27] text-white"
              >
                <span>Open Astro Storefront</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {action}
            <a
              href={storefrontUrl}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
