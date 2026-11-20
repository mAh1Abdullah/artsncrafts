"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import { ROLE_PERMISSIONS, type PermissionAction } from "@/lib/permissions";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface PosSubscriptionsViewProps {
  pos: PosWorkspaceController;
}

const RBAC_MATRIX_ROWS: Array<{
  action: PermissionAction;
  label: string;
  module: string;
  minTier: "starter" | "pro" | "enterprise";
}> = [
  { action: "pos:checkout", label: "Process Sales & Receipts", module: "core_pos", minTier: "starter" },
  { action: "pos:discount:override", label: "Special Discount Overrides (>10%)", module: "core_pos", minTier: "starter" },
  { action: "pos:refund", label: "Issue Refunds & Void Invoices", module: "core_pos", minTier: "starter" },
  { action: "inventory:create", label: "Create / Edit Catalog Items", module: "inventory", minTier: "starter" },
  { action: "inventory:stock_transfer", label: "Inter-Branch Stock Transfers", module: "multi_store", minTier: "pro" },
  { action: "inventory:barcodes", label: "Barcode Scanning & Label Printing", module: "barcodes", minTier: "pro" },
  { action: "expenses:create", label: "Record Business Expenses", module: "core_pos", minTier: "starter" },
  { action: "reports:financial_pnl", label: "P&L, Margins & Valuation Reports", module: "advanced_reports", minTier: "pro" },
  { action: "ecommerce:sync", label: "E-Commerce Bridge & Webhooks", module: "ecommerce_bridge", minTier: "pro" },
  { action: "pos:shift_audit", label: "Register Drawer Cashier Auditing", module: "shift_auditing", minTier: "enterprise" },
];

export function PosSubscriptionsView({ pos }: PosSubscriptionsViewProps) {
  const {
    subscriptionTier,
    setSubscriptionTier,
    setEnabledModules,
    userRole,
    canPerform,
  } = pos;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Modular Subscriptions & Plugin Architecture
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic module loading inspired by modular enterprise POS systems. Features are gatekept
          based on subscriber tier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => {
            setSubscriptionTier("starter");
            setEnabledModules({
              core_pos: true,
              inventory: true,
              barcodes: false,
              ecommerce_bridge: false,
              multi_store: false,
              advanced_reports: false,
              shift_auditing: false,
            });
          }}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            subscriptionTier === "starter"
              ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-900">Starter Plan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Single-register physical shop</p>
            </div>
            <span className="text-lg font-bold text-slate-900">Free</span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Core POS Register & Receipts
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Basic Inventory CRUD
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Expense Logging
            </div>
            <div className="flex items-center text-slate-400">
              <Lock className="h-3.5 w-3.5 mr-2" /> Barcode Scanning & Label Printing
            </div>
            <div className="flex items-center text-slate-400">
              <Lock className="h-3.5 w-3.5 mr-2" /> E-Commerce Sync Bridge
            </div>
            <div className="flex items-center text-slate-400">
              <Lock className="h-3.5 w-3.5 mr-2" /> Multi-Branch Network
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setSubscriptionTier("pro");
            setEnabledModules({
              core_pos: true,
              inventory: true,
              barcodes: true,
              ecommerce_bridge: true,
              multi_store: false,
              advanced_reports: true,
              shift_auditing: true,
            });
          }}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            subscriptionTier === "pro"
              ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900">Pro Retailer</h3>
                {subscriptionTier === "pro" && (
                  <Badge className="bg-indigo-600 text-white text-[10px]">Active Plan</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Physical Store + Online Sync</p>
            </div>
            <span className="text-lg font-bold text-slate-900">$29/mo</span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Core POS & Expense Tracking
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Barcode Scanner & Label Gen
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Shopify & WooCommerce Bridge
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Advanced Profit & Loss Reports
            </div>
            <div className="flex items-center text-slate-400">
              <Lock className="h-3.5 w-3.5 mr-2" /> Multi-Branch Network
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setSubscriptionTier("enterprise");
            setEnabledModules({
              core_pos: true,
              inventory: true,
              barcodes: true,
              ecommerce_bridge: true,
              multi_store: true,
              advanced_reports: true,
              shift_auditing: true,
            });
          }}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            subscriptionTier === "enterprise"
              ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-900">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-0.5">Multi-Location Retail Chain</p>
            </div>
            <span className="text-lg font-bold text-slate-900">$89/mo</span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> All Pro Features Included
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Unlimited Store Branches
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Inter-Branch Stock Transfers
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Cashier Drawer Shift Audits
            </div>
            <div className="flex items-center text-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Custom Webhook API Endpoints
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center">
              <KeyRound className="h-4 w-4 text-indigo-600 mr-2" />
              Role-Based Access Control (RBAC) & Tier Entitlement Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live authorization matrix evaluated by WAW-POS Gateway Middleware (
              <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                src/middleware.ts
              </code>
              ).
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Viewing as:</span>
            <Badge variant="outline" className="capitalize font-semibold text-slate-900">
              {userRole} ({subscriptionTier} tier)
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-semibold">Action / Permission</TableHead>
              <TableHead className="text-xs font-semibold">Module Area</TableHead>
              <TableHead className="text-xs font-semibold text-center">Min Subscription</TableHead>
              <TableHead className="text-xs font-semibold text-center">Cashier</TableHead>
              <TableHead className="text-xs font-semibold text-center">Manager</TableHead>
              <TableHead className="text-xs font-semibold text-center">Admin</TableHead>
              <TableHead className="text-xs font-semibold text-center">Owner</TableHead>
              <TableHead className="text-xs font-semibold text-center">Current Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RBAC_MATRIX_ROWS.map((row) => {
              const isAllowedForCurrent = canPerform(row.action);
              const cashierAllowed = ROLE_PERMISSIONS.cashier.includes(row.action);
              const managerAllowed = ROLE_PERMISSIONS.manager.includes(row.action);
              const adminAllowed = ROLE_PERMISSIONS.admin.includes(row.action);
              const ownerAllowed = ROLE_PERMISSIONS.owner.includes(row.action);

              return (
                <TableRow key={row.action} className="text-xs">
                  <TableCell>
                    <div className="font-semibold text-slate-900">{row.label}</div>
                    <code className="text-[10px] text-slate-400 font-mono">{row.action}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      {row.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize font-medium ${
                        row.minTier === "enterprise"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : row.minTier === "pro"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {row.minTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {cashierAllowed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {managerAllowed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {adminAllowed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {ownerAllowed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isAllowedForCurrent ? (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100 font-medium">
                        Granted (200)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 text-[10px] font-medium"
                      >
                        Restricted (403)
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
