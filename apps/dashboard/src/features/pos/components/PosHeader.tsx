"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Database,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  TrendingDown,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/permissions";
import type { PosWorkspaceController } from "../hooks/usePosWorkspace";
import type { PosTabId } from "../types";

interface PosHeaderProps {
  pos: PosWorkspaceController;
}

export function PosHeader({ pos }: PosHeaderProps) {
  const {
    activeTab,
    setActiveTab,
    tenantName,
    selectedStore,
    setSelectedStore,
    storesList,
    isOffline,
    setIsOffline,
    subscriptionTier,
    userRole,
    setUserRole,
    canPerform,
    checkAction,
    queueCounts,
    isSyncEngineRunning,
    pwaInstallPrompt,
    setPwaInstallPrompt,
    isPwaInstalled,
    setIsPwaInstalled,
    loadOfflineQueueData,
    setIsOfflineSyncModalOpen,
    notification,
    setNotification,
  } = pos;

  const mobileTabs: Array<{ id: PosTabId; label: string; icon: typeof ShoppingCart }> = [
    { id: "pos", label: "POS Register", icon: ShoppingCart },
    { id: "inventory", label: "Catalog & Stock", icon: Package },
    { id: "sales", label: "Sales History", icon: Receipt },
    { id: "expenses", label: "Expenses", icon: TrendingDown },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "ecommerce", label: "E-Commerce", icon: Globe },
    { id: "reseller", label: "Resellers", icon: Users },
    { id: "subscriptions", label: "RBAC & Plugins", icon: Layers },
  ];

  return (
    <>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 font-medium shadow-xs">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4 animate-pulse text-amber-200" />
            <span>
              <strong>OFFLINE REGISTER ACTIVE:</strong> Storing transactions in local IndexedDB. Background sync will automatically push all sales and stock mutations to PostgreSQL upon reconnection.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-amber-900/80 text-amber-100 border border-amber-500 font-mono text-[11px]">
              {queueCounts.salesCount} Sales · {queueCounts.inventoryCount} Stock · {queueCounts.expensesCount} Exp
            </Badge>
            <button
              onClick={() => {
                loadOfflineQueueData();
                setIsOfflineSyncModalOpen(true);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Queue & Sync Manager</span>
            </button>
          </div>
        </div>
      )}

      {/* Non-blocking Workspace Toast Notification */}
      {notification && (
        <div
          className={`text-xs px-4 py-2 flex items-center justify-between gap-3 border-b ${
            notification.tone === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : notification.tone === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : notification.tone === "error"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : "bg-indigo-50 text-indigo-900 border-indigo-200"
          }`}
        >
          <span className="font-medium">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-0.5 rounded hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main App Bar */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-5">
          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              href="/"
              title="Back to Operations Command Hub"
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-xs transition-colors shrink-0"
            >
              W
            </Link>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-bold leading-tight tracking-tight whitespace-nowrap">
                  WAW-POS
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold whitespace-nowrap ${
                    subscriptionTier === "enterprise"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : subscriptionTier === "pro"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {subscriptionTier}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[160px] hidden 2xl:block">
                {tenantName}
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-0.5 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button
              id="nav-pos"
              onClick={() => setActiveTab("pos")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "pos"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span>Register</span>
            </button>
            <button
              id="nav-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "inventory"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Stock</span>
            </button>
            <button
              id="nav-sales"
              onClick={() => setActiveTab("sales")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "sales"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              <span>Sales</span>
            </button>
            <button
              id="nav-expenses"
              onClick={() => {
                if (!canPerform("expenses:view")) {
                  checkAction("expenses:view", () => setActiveTab("expenses"));
                } else {
                  setActiveTab("expenses");
                }
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "expenses"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              <span>Expenses</span>
              {!canPerform("expenses:view") && <Lock className="h-3 w-3 text-amber-500 ml-0.5 shrink-0" />}
            </button>
            <button
              id="nav-reports"
              onClick={() => {
                if (!canPerform("reports:basic_sales")) {
                  checkAction("reports:basic_sales", () => setActiveTab("reports"));
                } else {
                  setActiveTab("reports");
                }
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "reports"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span>Reports</span>
              {!canPerform("reports:financial_pnl") && (
                <Lock className="h-3 w-3 text-amber-500 ml-0.5 shrink-0" />
              )}
            </button>
            <button
              id="nav-ecommerce"
              onClick={() => {
                if (!canPerform("ecommerce:sync")) {
                  checkAction("ecommerce:sync", () => setActiveTab("ecommerce"));
                } else {
                  setActiveTab("ecommerce");
                }
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "ecommerce"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>Orders</span>
              {!canPerform("ecommerce:sync") && <Lock className="h-3 w-3 text-amber-500 ml-0.5 shrink-0" />}
            </button>
            <button
              id="nav-reseller"
              onClick={() => setActiveTab("reseller")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "reseller"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Resellers</span>
            </button>
            <button
              id="nav-subscriptions"
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === "subscriptions"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>RBAC</span>
            </button>
          </nav>

          {/* User Role & Quick Context Switchers */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Link
              href="/"
              className="flex items-center space-x-1 text-xs bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
              title="Back to Operations Command Hub"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Ops Hub</span>
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:4321"}
              target="_blank"
              rel="noreferrer"
              className="hidden 2xl:flex items-center space-x-1 text-xs bg-[#B84A27] hover:bg-[#9c3d1f] text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
              title="Open Astro 7.4 Customer Storefront (Port 4321)"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Storefront</span>
            </a>

            {/* PWA Install Button */}
            {pwaInstallPrompt && !isPwaInstalled && (
              <button
                onClick={async () => {
                  if (pwaInstallPrompt) {
                    await pwaInstallPrompt.prompt();
                    const { outcome } = await pwaInstallPrompt.userChoice;
                    if (outcome === "accepted") {
                      setIsPwaInstalled(true);
                      setPwaInstallPrompt(null);
                    }
                  }
                }}
                className="hidden xl:flex items-center space-x-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-1.5 rounded-lg font-semibold transition-all shadow-xs whitespace-nowrap"
                title="Install WAW-POS Desktop / Tablet App"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            )}

            {/* Offline Storage & Background Sync Drawer Button */}
            <button
              onClick={() => {
                loadOfflineQueueData();
                setIsOfflineSyncModalOpen(true);
              }}
              title="PWA Offline Storage & Background Sync Manager"
              className={`flex items-center space-x-1 text-xs px-2 py-1.5 rounded-lg border font-medium transition-all whitespace-nowrap ${
                queueCounts.totalCount > 0
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Database
                className={`h-3.5 w-3.5 ${
                  isSyncEngineRunning
                    ? "animate-spin text-indigo-600"
                    : queueCounts.totalCount > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              />
              <span className="hidden xl:inline font-mono text-[11px]">
                {queueCounts.totalCount > 0 ? `${queueCounts.totalCount} Queued` : "Sync"}
              </span>
              {queueCounts.totalCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-amber-600 rounded-full font-mono">
                  {queueCounts.totalCount}
                </span>
              )}
            </button>

            {/* User Role Switcher */}
            <div className="flex items-center space-x-1 text-xs text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <select
                aria-label="Active User Role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent font-semibold text-xs text-slate-900 focus:outline-none cursor-pointer capitalize"
              >
                <option value="owner">Owner (Nafis)</option>
                <option value="admin">Admin (Sultana)</option>
                <option value="manager">Manager (Farhan)</option>
                <option value="cashier">Cashier (Tanvir)</option>
              </select>
            </div>

            {/* Store Outlet Selector */}
            <div className="hidden 2xl:flex items-center space-x-1 text-xs text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
              <Store className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                aria-label="Active Store Outlet"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent font-medium text-xs focus:outline-none cursor-pointer"
              >
                {storesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsOffline(!isOffline)}
              title="Toggle Offline Simulation"
              aria-label="Toggle Offline Simulation"
              className={`p-1.5 rounded-lg border text-xs flex items-center ${
                isOffline
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t bg-slate-50 gap-2">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>
    </>
  );
}
