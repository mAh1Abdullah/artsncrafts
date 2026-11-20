"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCw, ShoppingBag } from "lucide-react";
import { EcommerceOrdersLogistics } from "../shared/ecommerce-orders-logistics";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosEcommerceViewProps {
  pos: PosWorkspaceController;
}

export function PosEcommerceView({ pos }: PosEcommerceViewProps) {
  const {
    subscriptionTier,
    canPerform,
    simulateExternalOrder,
    triggerManualSync,
    isSyncing,
    apiResponseTest,
    syncLogs,
  } = pos;

  return (
    <div className="space-y-6">
      <EcommerceOrdersLogistics
        subscriptionTier={subscriptionTier}
        canManageEcommerce={canPerform("ecommerce:sync")}
      />

      <div className="pt-6 border-t border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Universal Webhook & Cloud Sync Channels
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bi-directional inventory sync with Shopify, WooCommerce, and Custom Store Webhooks.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={simulateExternalOrder}
              disabled={isSyncing}
              variant="outline"
              className="h-8 text-xs bg-white"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1 text-indigo-600" />
              Simulate Inbound Order
            </Button>
            <Button
              onClick={triggerManualSync}
              disabled={isSyncing}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Outbound Catalog
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-100 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Shopify Store</CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <CardDescription className="text-xs">
                Connected: sylhet-crafts.myshopify.com
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Active Sync:</span>
                <span className="font-semibold text-emerald-600">Bi-directional Live</span>
              </div>
              <div className="flex justify-between">
                <span>Webhook Endpoint:</span>
                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                  /api/v1/orders/webhook
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">WooCommerce Store</CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <CardDescription className="text-xs">
                Connected: store.sylhetartisans.com
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Active Sync:</span>
                <span className="font-semibold text-emerald-600">Inventory Deltas</span>
              </div>
              <div className="flex justify-between">
                <span>API Bridge:</span>
                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                  /api/v1/inventory/sync
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Artisans Market Storefront</CardTitle>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <CardDescription className="text-xs">
                Native Storefront Route (/)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Stock Sync:</span>
                <span className="font-semibold text-emerald-600">Real-Time Atomic</span>
              </div>
              <div className="flex justify-between">
                <span>Orders API:</span>
                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                  /api/v1/orders
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {apiResponseTest && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-1">
            <div className="text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
              <span>API Debug Output Console</span>
            </div>
            <pre className="overflow-x-auto pt-2">{apiResponseTest}</pre>
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Recent Sync Events & Webhook Logs
            </CardTitle>
            <CardDescription className="text-xs">
              Event stream of POS sales and external e-commerce inventory sync triggers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {syncLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{log.details}</p>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono font-medium text-indigo-600">
                          {log.platform}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{log.eventType}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
