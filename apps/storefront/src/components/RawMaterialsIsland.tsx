import { useState } from 'react';
import { CheckCircle2, Loader2, Package, ShoppingCart } from 'lucide-react';
import {
  ApiProblemError,
  formatBDT,
  type RawMaterialDTO,
  type WholesaleOrderDTO,
} from '@waw/contracts';
import { wawApi } from '../lib/api';
import { pushToast } from '../lib/store';

interface RawMaterialsIslandProps {
  initialMaterials: RawMaterialDTO[];
}

const MAT_CATEGORIES = [
  'All',
  'Clay',
  'Yarn',
  'Wood',
  'Metals',
  'Leather',
  'Packaging',
] as const;

export function RawMaterialsIsland({
  initialMaterials,
}: RawMaterialsIslandProps) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [category, setCategory] = useState<string>('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buyerVendorName, setBuyerVendorName] = useState(
    'Dhamrai Clay Heritage Studio'
  );
  const [buyerPhone, setBuyerPhone] = useState('+8801811223344');
  const [shippingAddress, setShippingAddress] = useState(
    'Pottery Lane, Dhamrai, Dhaka 1350'
  );
  const [paymentMethod, setPaymentMethod] = useState<
    'bkash' | 'nagad' | 'sslcommerz' | 'amarpay'
  >('bkash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<WholesaleOrderDTO | null>(null);

  const visible =
    category === 'All'
      ? materials
      : materials.filter((m) => m.category === category);

  const cartLines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const mat = materials.find((m) => m.id === id);
      return mat ? { mat, qty } : null;
    })
    .filter((x): x is { mat: RawMaterialDTO; qty: number } => x !== null);

  const totalBdt = cartLines.reduce(
    (sum, line) => sum + line.mat.priceBdt * line.qty,
    0
  );

  const addMoqBatch = (mat: RawMaterialDTO) => {
    setCart((prev) => ({
      ...prev,
      [mat.id]: Math.max(mat.moq, (prev[mat.id] ?? 0) + mat.moq),
    }));
    pushToast(`Added ${mat.moq} ${mat.unit}(s) of ${mat.name}.`, 'info');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartLines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await wawApi.createWholesaleOrder(
        {
          buyerVendorName,
          buyerPhone,
          shippingAddress,
          paymentMethod,
          items: cartLines.map((l) => ({
            rawMaterialId: l.mat.id,
            quantity: l.qty,
          })),
        },
        `whl-${Date.now()}`
      );
      setPlacedOrder(res.data);
      setCart({});
      // Refresh stock counts from server
      const fresh = await wawApi.getRawMaterials();
      setMaterials(fresh.data);
      pushToast(`Wholesale PO ${res.data.orderNumber} submitted!`, 'success');
    } catch (err) {
      if (err instanceof ApiProblemError) {
        setError(err.problem.detail);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 pb-4 border-b border-[#E5DDD2]">
        {MAT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              category === cat
                ? 'bg-[#221E1B] text-white'
                : 'text-[#574E46] hover:bg-[#EFE9E0]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {placedOrder && (
        <div className="rounded-xl border border-[#4D6B59] bg-emerald-50/60 p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#4D6B59] shrink-0 mt-0.5" />
          <div className="text-sm text-[#221E1B]">
            <div className="font-semibold">
              Wholesale Order {placedOrder.orderNumber} Confirmed (
              {formatBDT(placedOrder.totalAmountBdt)})
            </div>
            <p className="text-xs text-[#574E46] mt-0.5">
              Paid online via {placedOrder.paymentMethod.toUpperCase()} ·
              Supplier stock updated immediately via Next.js REST API.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Materials Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {visible.map((mat) => (
            <div
              key={mat.id}
              className="rounded-xl border border-[#E5DDD2] bg-white overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-[#EFE9E0]">
                <img
                  src={mat.imageUrl}
                  alt={mat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6E6359]">
                    <span>{mat.supplierName}</span>
                    <span className="font-mono text-[#4D6B59]">
                      MOQ {mat.moq} {mat.unit}s
                    </span>
                  </div>
                  <h3 className="mt-1 font-editorial text-lg font-medium text-[#221E1B]">
                    {mat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#574E46] leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EFE8DE] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-base font-semibold text-[#221E1B] tabular-nums">
                      {formatBDT(mat.priceBdt)}{' '}
                      <span className="text-xs font-normal text-[#6E6359]">
                        / {mat.unit}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#6E6359]">
                      {mat.stockQuantity} in stock
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMoqBatch(mat)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#221E1B] hover:bg-[#B84A27] text-white text-xs font-medium transition-colors"
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>+ {mat.moq} MOQ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wholesale Purchase Order Sidebar */}
        <form
          onSubmit={handleCheckout}
          className="lg:col-span-4 rounded-xl border border-[#DED6CA] bg-[#F3EFE9] p-6 space-y-4 sticky top-24"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#B84A27]" />
            <h2 className="font-editorial text-lg font-semibold text-[#221E1B]">
              Wholesale Purchase Order
            </h2>
          </div>

          <p className="text-xs text-[#574E46]">
            B2B artisan supply orders require MOQ compliance and verified online
            payment (COD disabled for bulk raw materials).
          </p>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              {error}
            </div>
          )}

          {cartLines.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#6E6359] border border-dashed border-[#D2C7B8] rounded-lg">
              Add raw material batches on the left to build your workshop PO.
            </div>
          ) : (
            <div className="space-y-2.5 border-y border-[#DED6CA] py-3">
              {cartLines.map(({ mat, qty }) => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#221E1B] truncate">
                      {mat.name}
                    </div>
                    <div className="font-mono text-[#6E6359]">
                      {qty} {mat.unit}s × {formatBDT(mat.priceBdt)}
                    </div>
                  </div>
                  <div className="font-mono font-semibold tabular-nums">
                    {formatBDT(qty * mat.priceBdt)}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#DED6CA] flex justify-between font-semibold text-sm">
                <span>PO Total</span>
                <span className="font-mono tabular-nums">
                  {formatBDT(totalBdt)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              required
              value={buyerVendorName}
              onChange={(e) => setBuyerVendorName(e.target.value)}
              placeholder="Workshop / Studio Name"
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
            />
            <input
              type="tel"
              required
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Contact Phone"
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm font-mono"
            />
            <input
              type="text"
              required
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Workshop Delivery Address"
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
            />
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as 'bkash' | 'nagad' | 'sslcommerz' | 'amarpay'
                )
              }
              className="w-full rounded-md border border-[#D8CFC3] bg-white px-3 py-2 text-sm"
            >
              <option value="bkash">bKash Merchant Pay</option>
              <option value="nagad">Nagad Business Pay</option>
              <option value="sslcommerz">SSLCommerz Corporate Card</option>
              <option value="amarpay">AmarPay Online</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || cartLines.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#B84A27] hover:bg-[#9c3d1f] text-white text-sm font-medium disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Submit Wholesale PO</span>
          </button>
        </form>
      </div>
    </div>
  );
}
