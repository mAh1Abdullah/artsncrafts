import { OperationsShell } from "@/components/layout/OperationsShell";
import { AdminConsoleClient } from "@/features/admin/components/AdminConsoleClient";
import {
  getAdminAuditLogs,
  getEnrichedProducts,
  listCoupons,
  listReviews,
  listSettlements,
  listVendors,
} from "@/lib/db/marketplace";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, vendors, reviews, coupons, settlements, auditLogs] =
    await Promise.all([
      getEnrichedProducts(),
      Promise.resolve(listVendors()),
      Promise.resolve(listReviews()),
      Promise.resolve(listCoupons()),
      Promise.resolve(listSettlements()),
      Promise.resolve(getAdminAuditLogs()),
    ]);

  return (
    <OperationsShell
      title="Marketplace Governance & Admin"
      subtitle="Approve artisan studios, moderate catalog listings & reviews, issue coupons, and release payouts"
    >
      <AdminConsoleClient
        initialVendors={vendors}
        initialProducts={products}
        initialReviews={reviews}
        initialCoupons={coupons}
        initialSettlements={settlements}
        initialAuditLogs={auditLogs}
      />
    </OperationsShell>
  );
}
