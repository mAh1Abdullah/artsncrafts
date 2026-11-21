import { OperationsShell } from "@/components/layout/OperationsShell";
import { ShippingConsoleClient } from "@/features/shipping/components/ShippingConsoleClient";
import {
  listCourierProviders,
  listDeliveryZones,
  listOrders,
  listShipments,
} from "@/lib/db/marketplace";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const zones = listDeliveryZones();
  const couriers = listCourierProviders();
  const shipments = listShipments();
  const orders = listOrders();

  return (
    <OperationsShell
      title="Shipping & Bangladesh Logistics"
      subtitle="Delivery zone tariffs, Pathao/Steadfast/RedX courier scoring, consignment booking, and tracking timelines"
    >
      <ShippingConsoleClient
        initialZones={zones}
        initialCouriers={couriers}
        initialShipments={shipments}
        initialOrders={orders}
      />
    </OperationsShell>
  );
}
