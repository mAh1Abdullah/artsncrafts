"use client";

import { usePosWorkspace } from "../hooks/usePosWorkspace";
import { PosHeader } from "./PosHeader";
import { PosRegisterView } from "./views/PosRegisterView";
import { PosCatalogView } from "./views/PosCatalogView";
import { PosSalesView } from "./views/PosSalesView";
import { PosExpensesView } from "./views/PosExpensesView";
import { PosReportsView } from "./views/PosReportsView";
import { PosEcommerceView } from "./views/PosEcommerceView";
import { PosResellerView } from "./views/PosResellerView";
import { PosSubscriptionsView } from "./views/PosSubscriptionsView";
import { CheckoutTenderDialog } from "./dialogs/CheckoutTenderDialog";
import { ThermalReceiptDialog } from "./dialogs/ThermalReceiptDialog";
import { AddProductDialog } from "./dialogs/AddProductDialog";
import { AddExpenseDialog } from "./dialogs/AddExpenseDialog";
import { StockTransferDialog } from "./dialogs/StockTransferDialog";
import { BarcodeLabelsDialog } from "./dialogs/BarcodeLabelsDialog";
import { ShiftAuditDialog } from "./dialogs/ShiftAuditDialog";
import { AccessRestrictedDialog } from "./dialogs/AccessRestrictedDialog";
import { BulkInventoryDialogs } from "./dialogs/BulkInventoryDialogs";
import { OfflineSyncModal } from "./dialogs/OfflineSyncModal";

export function PosWorkspace() {
  const pos = usePosWorkspace();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <PosHeader pos={pos} />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {pos.activeTab === "pos" && <PosRegisterView pos={pos} />}
        {pos.activeTab === "inventory" && <PosCatalogView pos={pos} />}
        {pos.activeTab === "sales" && <PosSalesView pos={pos} />}
        {pos.activeTab === "expenses" && <PosExpensesView pos={pos} />}
        {pos.activeTab === "reports" && <PosReportsView pos={pos} />}
        {pos.activeTab === "ecommerce" && <PosEcommerceView pos={pos} />}
        {pos.activeTab === "reseller" && <PosResellerView />}
        {pos.activeTab === "subscriptions" && <PosSubscriptionsView pos={pos} />}
      </main>

      <CheckoutTenderDialog pos={pos} />
      <ThermalReceiptDialog pos={pos} />
      <AddProductDialog pos={pos} />
      <AddExpenseDialog pos={pos} />
      <StockTransferDialog pos={pos} />
      <BarcodeLabelsDialog pos={pos} />
      <ShiftAuditDialog pos={pos} />
      <AccessRestrictedDialog pos={pos} />
      <BulkInventoryDialogs pos={pos} />
      <OfflineSyncModal pos={pos} />
    </div>
  );
}

export default PosWorkspace;
