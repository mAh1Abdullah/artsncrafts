import { OperationsShell } from "@/components/layout/OperationsShell";
import { SellerStudioClient } from "@/features/seller/components/SellerStudioClient";
import {
  getEnrichedProducts,
  listOrders,
  listSettlements,
  listVendors,
} from "@/lib/db/marketplace";

export const dynamic = "force-dynamic";

export default async function SellerStudioPage() {
  const [products, vendors, orders, settlements] = await Promise.all([
    getEnrichedProducts(),
    Promise.resolve(listVendors()),
    Promise.resolve(listOrders()),
    Promise.resolve(listSettlements()),
  ]);

  return (
    <OperationsShell
      title="Artisan Seller Studio"
      subtitle="Manage handcrafted listings, Gemini AI editorial copy, order fulfillment, and payout settlements"
    >
      <SellerStudioClient
        initialVendors={vendors}
        initialProducts={products}
        initialOrders={orders}
        initialSettlements={settlements}
      />
    </OperationsShell>
  );
}
