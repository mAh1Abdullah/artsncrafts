"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCheck,
  Database,
  HardDrive,
  History,
  Package,
  Receipt,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingDown,
} from "lucide-react";
import {
  cacheProductCatalog,
  removePendingExpense,
  removePendingInventory,
  removePendingSale,
} from "@/lib/offline-db";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface OfflineSyncModalProps {
  pos: PosWorkspaceController;
}

export function OfflineSyncModal({ pos }: OfflineSyncModalProps) {
  const {
    isOfflineSyncModalOpen,
    setIsOfflineSyncModalOpen,
    isOffline,
    offlineModalTab,
    setOfflineModalTab,
    queueCounts,
    isSyncEngineRunning,
    handleTriggerFullSync,
    pendingSalesList,
    pendingInventoryList,
    pendingExpensesList,
    offlineSyncHistory,
    loadOfflineQueueData,
    products,
    pwaInstallPrompt,
    isPwaInstalled,
    setIsPwaInstalled,
    setPwaInstallPrompt,
    notify,
  } = pos;

  return (
    <Dialog open={isOfflineSyncModalOpen} onOpenChange={setIsOfflineSyncModalOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>PWA Offline Engine & Background Sync</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold ${
                      isOffline
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300"
                    }`}
                  >
                    {isOffline ? "Offline Mode" : "Online & Connected"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  IndexedDB durable queue with auto-retry background synchronization to Cloud D1
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-3 pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setOfflineModalTab("queue")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                offlineModalTab === "queue"
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Pending Queue ({queueCounts.totalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setOfflineModalTab("history")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                offlineModalTab === "history"
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Sync Audit Logs ({offlineSyncHistory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOfflineModalTab("pwa")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                offlineModalTab === "pwa"
                  ? "bg-white text-indigo-600 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>PWA Diagnostics</span>
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {offlineModalTab === "queue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">
                    Total Queued Items:{" "}
                    <span className="font-mono text-indigo-600">{queueCounts.totalCount}</span>
                  </p>
                  <p className="text-slate-500">
                    {queueCounts.salesCount} sale(s), {queueCounts.inventoryCount} stock
                    adjustment(s), {queueCounts.expensesCount} expense(s)
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={isSyncEngineRunning || queueCounts.totalCount === 0}
                  onClick={handleTriggerFullSync}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isSyncEngineRunning ? "animate-spin" : ""}`}
                  />
                  <span>{isSyncEngineRunning ? "Synchronizing..." : "Sync to Database Now"}</span>
                </Button>
              </div>

              {/* Sales Queue */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Pending Sales Queue ({pendingSalesList.length})</span>
                </h4>
                {pendingSalesList.length === 0 ? (
                  <div className="text-center py-4 border rounded-lg bg-slate-50/50 text-xs text-slate-400">
                    No pending sales queued in local IndexedDB.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {pendingSalesList.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {sale.invoiceNumber}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {sale.paymentMethod}
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {sale.items.length} item(s) · Total: ${sale.totalAmount.toFixed(2)} ·
                            Cashier: {sale.cashierName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await removePendingSale(sale.id);
                            loadOfflineQueueData();
                          }}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventory Queue */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pending Inventory Stock Mutations ({pendingInventoryList.length})</span>
                </h4>
                {pendingInventoryList.length === 0 ? (
                  <div className="text-center py-4 border rounded-lg bg-slate-50/50 text-xs text-slate-400">
                    No pending stock updates queued.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {pendingInventoryList.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{inv.productName}</span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              ({inv.sku})
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {inv.storeId}: {inv.previousStock} →{" "}
                            <strong className="text-indigo-600 font-mono">
                              {inv.newStock} units
                            </strong>{" "}
                            ({inv.reason})
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await removePendingInventory(inv.id);
                            loadOfflineQueueData();
                          }}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expenses Queue */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  <span>Pending Expense Logs ({pendingExpensesList.length})</span>
                </h4>
                {pendingExpensesList.length === 0 ? (
                  <div className="text-center py-4 border rounded-lg bg-slate-50/50 text-xs text-slate-400">
                    No pending expense logs queued.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {pendingExpensesList.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{exp.category}</span>
                            <span className="font-mono text-rose-600 font-bold">
                              ${exp.amount.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {exp.description} · Recorded by: {exp.recordedBy}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await removePendingExpense(exp.id);
                            loadOfflineQueueData();
                          }}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {offlineModalTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Audit log of synchronization runs between browser IndexedDB and Cloud database.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOfflineQueueData}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Logs
                </Button>
              </div>

              {offlineSyncHistory.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-slate-50 text-xs text-slate-400">
                  No sync cycles recorded yet. Sync cycles will appear here when background sync
                  triggers.
                </div>
              ) : (
                <div className="border rounded-lg divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                  {offlineSyncHistory.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white hover:bg-slate-50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold ${
                              log.status === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : log.status === "failed"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {log.status}
                          </Badge>
                          <span className="font-semibold text-slate-800 capitalize">
                            Trigger: {log.trigger.replace("_", " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{log.details}</p>
                        {(log.salesCount > 0 ||
                          log.inventoryCount > 0 ||
                          log.expensesCount > 0) && (
                          <p className="text-slate-400 text-[10px] font-mono">
                            Synced: {log.salesCount} sales, {log.inventoryCount} stock,{" "}
                            {log.expensesCount} exp
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {offlineModalTab === "pwa" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Service Worker</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                      Registered (/sw.js)
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Caches static assets with stale-while-revalidate and intercepts offline network
                    calls.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Local Storage Layer
                    </span>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px]">
                      IndexedDB v1
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Stores pending transactions, stock mutations, and product catalog offline.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Background Sync API
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                      Active (Tag: waw-pos-sync)
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Wakes up service worker when network connectivity is re-established.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Catalog Cache</span>
                    <Badge className="bg-slate-200 text-slate-800 text-[10px]">
                      {products.length} Products Cached
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enables sub-millisecond offline barcode lookup and instant search.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Quick Diagnostics Actions</span>
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      cacheProductCatalog(products);
                      notify(
                        `Refreshed ${products.length} catalog items in IndexedDB product cache.`,
                        "success"
                      );
                    }}
                    className="text-xs bg-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Re-cache Product Catalog
                  </Button>
                  {pwaInstallPrompt && !isPwaInstalled && (
                    <Button
                      size="sm"
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
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Smartphone className="h-3 w-3 mr-1" />
                      Install Progressive Web App
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Offline data is safe and protected against accidental tab closes</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOfflineSyncModalOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
