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
import { ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import type { SubscriptionTier, UserRole } from "@/lib/permissions";
import type { PosWorkspaceController } from "../../hooks/usePosWorkspace";

interface AccessRestrictedDialogProps {
  pos: PosWorkspaceController;
}

export function AccessRestrictedDialog({ pos }: AccessRestrictedDialogProps) {
  const {
    accessDeniedModal,
    setAccessDeniedModal,
    userRole,
    setUserRole,
    subscriptionTier,
    setSubscriptionTier,
    setEnabledModules,
  } = pos;

  return (
    <Dialog
      open={accessDeniedModal.isOpen}
      onOpenChange={(open) => setAccessDeniedModal((prev) => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-amber-600 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-slate-900">
              {accessDeniedModal.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed">
            {accessDeniedModal.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active User Role:</span>
              <Badge variant="outline" className="capitalize font-semibold">
                {userRole}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Current Subscription Tier:</span>
              <Badge variant="outline" className="capitalize font-semibold">
                {subscriptionTier} Plan
              </Badge>
            </div>
            {accessDeniedModal.requiredTier && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-indigo-700 font-semibold">
                <span>Required Tier:</span>
                <span className="capitalize">{accessDeniedModal.requiredTier} Plan or higher</span>
              </div>
            )}
            {accessDeniedModal.requiredRole && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-indigo-700 font-semibold">
                <span>Required Role:</span>
                <span className="capitalize">{accessDeniedModal.requiredRole} or higher</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }))}
            className="text-xs"
          >
            Dismiss
          </Button>

          {accessDeniedModal.requiredTier ? (
            <Button
              size="sm"
              onClick={() => {
                setSubscriptionTier(accessDeniedModal.requiredTier as SubscriptionTier);
                setEnabledModules((prev) => ({
                  ...prev,
                  [accessDeniedModal.requiredModule || "advanced_reports"]: true,
                  barcodes: true,
                  ecommerce_bridge: true,
                  multi_store: true,
                }));
                setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }));
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Upgrade to {accessDeniedModal.requiredTier.toUpperCase()} Tier
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setUserRole((accessDeniedModal.requiredRole as UserRole) || "admin");
                setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }));
              }}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Switch to {accessDeniedModal.requiredRole?.toUpperCase() || "ADMIN"} Role
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
