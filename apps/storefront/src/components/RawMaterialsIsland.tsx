import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Eye,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  X,
} from 'lucide-react';
import {
  ApiProblemError,
  type RawMaterialCategory,
  type RawMaterialDTO,
  type WholesaleOrderDTO,
  type WholesaleOrderStatus,
} from '@waw/contracts';
import { storefrontPath, wawApi } from '../lib/api';
import {
  formatMoney,
  getStoreSnapshot,
  pushToast,
  setActiveRole,
  subscribeStore,
  type CurrencyCode,
  type StorefrontRole,
} from '../lib/store';

interface RawMaterialsIslandProps {
  initialMaterials: RawMaterialDTO[];
  initialOrders?: WholesaleOrderDTO[];
}

interface WholesaleCartEntry {
  material: RawMaterialDTO;
  quantity: number;
}

const CATEGORIES: Array<'all' | RawMaterialCategory> = [
  'all',
  'Beads',
  'Yarn',
  'Clay',
  'Wood',
  'Leather',
  'Metals',
  'Packaging',
];

const LOCAL_MATERIAL_IMAGES: Record<RawMaterialCategory, string> = {
  Clay: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
  Yarn: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
  Wood: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
  Metals: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
  Leather: '/images/artisans/product_heritage_leather_1795182012960.jpg',
  Packaging: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
  Beads: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
};

export function RawMaterialsIsland({
  initialMaterials,
  initialOrders = [],
}: RawMaterialsIslandProps) {
  const [materials, setMaterials] =
    useState<RawMaterialDTO[]>(initialMaterials);
  const [wholesaleOrders, setWholesaleOrders] =
    useState<WholesaleOrderDTO[]>(initialOrders);
  const [wholesaleCart, setWholesaleCart] = useState<WholesaleCartEntry[]>([]);

  const [currency, setCurrency] = useState<CurrencyCode>('BDT');
  const [activeRole, setActiveRoleState] = useState<StorefrontRole>('user');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modals & Supplier Portal
  const [selectedMaterial, setSelectedMaterial] =
    useState<RawMaterialDTO | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSupplierTabOpen, setIsSupplierTabOpen] = useState<boolean>(false);

  // Supplier new listing form
  const [isAddingMaterial, setIsAddingMaterial] = useState<boolean>(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] =
    useState<RawMaterialCategory>('Clay');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [newMatPrice, setNewMatPrice] = useState(1000);
  const [newMatUnit, setNewMatUnit] = useState('bag');
  const [newMatMoq, setNewMatMoq] = useState(5);
  const [newMatStock, setNewMatStock] = useState(100);
  const [creatingListing, setCreatingListing] = useState(false);

  // Checkout state (Online-only B2B payment, NO COD)
  const [buyerVendorName, setBuyerVendorName] = useState(
    'Dhamrai Clay Heritage Studio'
  );
  const [buyerPhone, setBuyerPhone] = useState('+8801811223344');
  const [shippingAddress, setShippingAddress] = useState(
    '12 Artisan Hub Road, Dhamrai, Dhaka 1350'
  );
  const [paymentMethod, setPaymentMethod] = useState<
    'bkash' | 'nagad' | 'sslcommerz' | 'amarpay'
  >('bkash');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const isApprovedVendor =
    activeRole === 'wholesaler' ||
    activeRole === 'vendor_user' ||
    activeRole === 'admin';

  useEffect(() => {
    const sync = () => {
      const snap = getStoreSnapshot();
      setCurrency(snap.currency);
      setActiveRoleState(snap.activeRole);
    };
    sync();
    return subscribeStore(sync);
  }, []);

  const refreshLive = async () => {
    try {
      const [matRes, ordRes] = await Promise.all([
        wawApi.getRawMaterials(),
        wawApi.getWholesaleOrders(),
      ]);
      setMaterials(matRes.data);
      setWholesaleOrders(ordRes.data);
    } catch {
      // Keep current list on transient network error
    }
  };

  useEffect(() => {
    refreshLive();
  }, []);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return materials.filter((m) => {
      const matchesCat =
        selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);
      const matchesStock = !inStockOnly || m.stockQuantity > 0;
      return matchesCat && matchesSearch && matchesStock;
    });
  }, [materials, selectedCategory, searchQuery, inStockOnly]);

  const cartTotalBdt = wholesaleCart.reduce(
    (sum, item) => sum + item.material.priceBdt * item.quantity,
    0
  );

  const addToWholesaleCart = (material: RawMaterialDTO, qty: number) => {
    if (!isApprovedVendor) {
      pushToast(
        'Switch to Wholesale Mode or apply as an artisan to order bulk supplies.',
        'error'
      );
      return;
    }
    if (qty < material.moq) {
      pushToast(
        `Minimum order quantity for ${material.name} is ${material.moq} ${material.unit}(s).`,
        'error'
      );
      return;
    }
    setWholesaleCart((prev) => {
      const existing = prev.find((e) => e.material.id === material.id);
      if (existing) {
        return prev.map((e) =>
          e.material.id === material.id
            ? {
                ...e,
                quantity: Math.min(material.stockQuantity, e.quantity + qty),
              }
            : e
        );
      }
      return [
        ...prev,
        { material, quantity: Math.min(material.stockQuantity, qty) },
      ];
    });
    pushToast(
      `Added ${qty} ${material.unit}(s) of ${material.name} to wholesale cart.`,
      'success'
    );
  };

  const updateCartItemQty = (materialId: string, nextQty: number) => {
    setWholesaleCart((prev) => {
      const entry = prev.find((e) => e.material.id === materialId);
      if (!entry) return prev;
      if (nextQty < entry.material.moq) {
        return prev.filter((e) => e.material.id !== materialId);
      }
      return prev.map((e) =>
        e.material.id === materialId
          ? { ...e, quantity: Math.min(e.material.stockQuantity, nextQty) }
          : e
      );
    });
  };

  const handleOpenDetailModal = (material: RawMaterialDTO) => {
    setSelectedMaterial(material);
    setModalQty(material.moq);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedMaterial) return;
    addToWholesaleCart(selectedMaterial, modalQty);
    if (isApprovedVendor && modalQty >= selectedMaterial.moq) {
      setSelectedMaterial(null);
    }
  };

  const handleExecuteWholesaleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wholesaleCart.length === 0) return;

    setIsProcessingCheckout(true);
    try {
      const idempotencyKey = `whl_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const res = await wawApi.createWholesaleOrder(
        {
          buyerVendorName: buyerVendorName.trim(),
          buyerPhone: buyerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          items: wholesaleCart.map((entry) => ({
            rawMaterialId: entry.material.id,
            quantity: entry.quantity,
          })),
        },
        idempotencyKey
      );
      setWholesaleCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      await refreshLive();
      pushToast(
        `Wholesale order ${res.data.orderNumber} authorized via ${paymentMethod.toUpperCase()}!`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Could not place wholesale order.', 'error');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCreateMaterialListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingListing(true);
    try {
      const res = await wawApi.createRawMaterial({
        wholesalerVendorProfileId: 'v-dhamrai-clay',
        supplierName: 'Dhamrai Clay & Artisan Guild Supply',
        name: newMatName.trim(),
        category: newMatCategory,
        description: newMatDesc.trim(),
        priceBdt: Number(newMatPrice),
        unit: newMatUnit.trim(),
        moq: Number(newMatMoq),
        stockQuantity: Number(newMatStock),
        imageUrl: LOCAL_MATERIAL_IMAGES[newMatCategory],
      });
      setMaterials((prev) => [res.data, ...prev]);
      setIsAddingMaterial(false);
      setNewMatName('');
      setNewMatDesc('');
      pushToast(
        `${res.data.name} is now live on the wholesale raw material marketplace.`,
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Failed to save material listing.', 'error');
    } finally {
      setCreatingListing(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: WholesaleOrderStatus
  ) => {
    try {
      const res = await wawApi.updateWholesaleOrderStatus(orderId, status);
      setWholesaleOrders((prev) =>
        prev.map((o) => (o.id === res.data.id ? res.data : o))
      );
      pushToast(
        `Wholesale order ${res.data.orderNumber} updated to ${status}.`,
        'info'
      );
    } catch (err) {
      const msg =
        err instanceof ApiProblemError
          ? err.problem.detail
          : (err as Error).message;
      pushToast(msg || 'Could not update wholesale order status.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Emerald B2B Wholesale Portal Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-emerald-50 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-800/80 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-700/50">
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              B2B Wholesale Supply Portal
            </span>

            {isApprovedVendor ? (
              <span className="bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                Verified Artisan Access ({activeRole.replace('_', ' ')})
              </span>
            ) : (
              <span className="bg-rose-500/20 text-rose-200 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                Shopper Preview (Switch to Wholesale Mode)
              </span>
            )}
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight">
            Raw Craft Materials &amp; Wholesale Supplies
          </h1>
          <p className="text-emerald-200/90 text-sm leading-relaxed">
            Source bulk alluvial clay, kiln-dried Chittagong teak timber,
            80-count muslin yarn spools, 925 sterling silver wire, vegetable-tanned
            hides, and eco jute packaging directly from verified regional
            cooperatives.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Wholesale Cart ({wholesaleCart.length})
            </button>

            {isApprovedVendor ? (
              <button
                type="button"
                onClick={() => setIsSupplierTabOpen((prev) => !prev)}
                className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/50 text-emerald-100 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Store className="w-4 h-4 text-emerald-300" />
                {isSupplierTabOpen
                  ? 'Back to Wholesale Catalogue'
                  : 'Supplier Dashboard & Orders'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveRole('wholesaler');
                  pushToast(
                    'Wholesale Supplier & Artisan Procurement Mode unlocked.',
                    'success'
                  );
                }}
                className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/50 text-emerald-100 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Store className="w-4 h-4 text-emerald-300" />
                Unlock Wholesale Mode
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Access Control Gate Banner (Shopper Mode) */}
      {!isApprovedVendor && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-xs">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="font-editorial font-bold text-base text-amber-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-800" />
              Seller-Only Access Notice
            </h2>
            <p className="text-amber-900 leading-relaxed">
              Wholesale material purchases and bulk trade pricing are reserved
              for approved artisan workshops on The Artisan&apos;s Market. Switch to
              Wholesale Mode above or apply to register your craft studio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveRole('wholesaler');
                pushToast('Wholesale Raw Supply mode activated.', 'success');
              }}
              className="px-4 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-sm"
            >
              Switch to Wholesale Mode
            </button>
            <a
              href={storefrontPath('/sell')}
              className="px-5 py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
            >
              Apply for Artisan Status
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </a>
          </div>
        </div>
      )}

      {/* 3. Wholesale Supplier Dashboard (Listings + Received Orders) */}
      {isSupplierTabOpen && isApprovedVendor && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-editorial font-bold text-xl text-stone-900">
                Wholesale Supplier Portal
              </h2>
              <p className="text-xs text-stone-500">
                Publish new raw material lots and fulfill wholesale B2B
                consignments via REST v1.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingMaterial((prev) => !prev)}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Material Listing
            </button>
          </div>

          {isAddingMaterial && (
            <form
              onSubmit={handleCreateMaterialListing}
              className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4 text-xs"
            >
              <h3 className="font-bold text-stone-900 text-sm">
                Create Raw Material Listing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Material Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="e.g. Natural Indigo Vat Dye Powder (5 kg)"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={newMatCategory}
                    onChange={(e) =>
                      setNewMatCategory(e.target.value as RawMaterialCategory)
                    }
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  >
                    <option value="Beads">Beads</option>
                    <option value="Yarn">Yarn</option>
                    <option value="Clay">Clay</option>
                    <option value="Wood">Wood</option>
                    <option value="Leather">Leather</option>
                    <option value="Metals">Metals</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Price per Unit (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMatPrice}
                    onChange={(e) => setNewMatPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Unit Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    placeholder="e.g. kg, spool, bag, bundle"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Minimum Order Quantity (MOQ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMatMoq}
                    onChange={(e) => setNewMatMoq(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Available Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">
                    Description &amp; Specifications
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newMatDesc}
                    onChange={(e) => setNewMatDesc(e.target.value)}
                    placeholder="Provide grade specifications, origin cluster, and bulk packaging notes..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMaterial(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingListing}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer"
                >
                  {creatingListing ? 'Saving...' : 'Save Material Listing'}
                </button>
              </div>
            </form>
          )}

          {/* Received Wholesale Orders */}
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">
              Wholesale Orders Received ({wholesaleOrders.length})
            </h3>
            {wholesaleOrders.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 italic">
                No wholesale orders received yet.
              </p>
            ) : (
              <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden text-xs">
                {wholesaleOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-stone-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">
                          {order.orderNumber}
                        </span>
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase text-[10px]">
                          {order.status}
                        </span>
                      </div>
                      <p className="font-bold text-emerald-950">
                        {order.items
                          .map((it) => `${it.name} (${it.quantity} ${it.unit})`)
                          .join(', ')}
                      </p>
                      <p className="text-stone-500 text-[11px]">
                        Ordered by: {order.buyerVendorName} • Payment:{' '}
                        {order.paymentMethod.toUpperCase()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-editorial font-bold text-base text-stone-900 tabular-nums">
                        {formatMoney(order.totalAmountBdt, currency)}
                      </p>
                      <select
                        value={order.status}
                        aria-label={`Update status for ${order.orderNumber}`}
                        onChange={(e) =>
                          handleUpdateOrderStatus(
                            order.id,
                            e.target.value as WholesaleOrderStatus
                          )
                        }
                        className="mt-1 px-2.5 py-1 bg-white border border-stone-300 rounded-lg font-bold text-[11px]"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clay, timber, silk yarn, silver, jute..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-emerald-900 rounded"
            />
            Show In-Stock Only
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-stone-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-900 text-emerald-100 shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat === 'all' ? 'All Raw Materials' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Raw Material Catalogue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-stone-100">
                <img
                  src={material.imageUrl}
                  alt={material.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-emerald-950/85 backdrop-blur-xs text-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {material.category}
                </span>

                {material.stockQuantity > 0 ? (
                  <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {material.stockQuantity} {material.unit}s left
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-stone-500 block font-medium">
                  Supplier:{' '}
                  <strong className="text-stone-800">
                    {material.supplierName}
                  </strong>
                </span>
                <h3 className="font-editorial font-bold text-stone-900 text-base leading-snug mt-0.5">
                  {material.name}
                </h3>
                <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                  {material.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-stone-400 block font-mono">
                    Wholesale Rate
                  </span>
                  <span className="font-editorial font-bold text-emerald-950 text-lg tabular-nums">
                    {formatMoney(material.priceBdt, currency)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {' '}
                    / {material.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 block">
                    MOQ: {material.moq} {material.unit}s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(material)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => addToWholesaleCart(material, material.moq)}
                  disabled={material.stockQuantity <= 0}
                  className="w-full py-2 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Order Bulk
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Material Detail Modal */}
      {selectedMaterial && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedMaterial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedMaterial(null)}
              aria-label="Close material details"
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <img
                src={selectedMaterial.imageUrl}
                alt={selectedMaterial.name}
                referrerPolicy="no-referrer"
                className="w-full h-48 object-cover rounded-2xl border border-stone-200"
              />
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {selectedMaterial.category}
              </span>
              <h2 className="font-editorial text-xl font-bold text-stone-900">
                {selectedMaterial.name}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {selectedMaterial.description}
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Supplier:</span>
                <span className="font-bold text-stone-900">
                  {selectedMaterial.supplierName}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Minimum Order Quantity (MOQ):</span>
                <span className="font-bold text-amber-800">
                  {selectedMaterial.moq} {selectedMaterial.unit}s
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Unit Price:</span>
                <span className="font-bold text-emerald-900 tabular-nums">
                  {formatMoney(selectedMaterial.priceBdt, currency)} /{' '}
                  {selectedMaterial.unit}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Select Quantity ({selectedMaterial.unit}s)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={selectedMaterial.moq}
                  max={selectedMaterial.stockQuantity}
                  value={modalQty}
                  onChange={(e) =>
                    setModalQty(
                      Math.max(selectedMaterial.moq, Number(e.target.value))
                    )
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold"
                />
                <span className="text-xs text-stone-500 whitespace-nowrap tabular-nums">
                  Total:{' '}
                  <strong className="text-stone-900 text-base">
                    {formatMoney(
                      selectedMaterial.priceBdt * modalQty,
                      currency
                    )}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCartFromModal}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Add to Wholesale Order Cart
            </button>
          </div>
        </div>
      )}

      {/* 7. Wholesale Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <h3 className="font-editorial font-bold text-lg text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-800" />
                  Wholesale Order Cart ({wholesaleCart.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close wholesale cart"
                  className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wholesaleCart.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center italic">
                  Your wholesale cart is empty. Select any material lot to add
                  bulk stock.
                </p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  {wholesaleCart.map((entry) => (
                    <div
                      key={entry.material.id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex justify-between items-center text-xs gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-stone-900 truncate">
                          {entry.material.name}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate">
                          Supplier: {entry.material.supplierName}
                        </p>
                        <p className="font-bold text-emerald-900 tabular-nums">
                          {formatMoney(entry.material.priceBdt, currency)} x{' '}
                          {entry.quantity} {entry.material.unit}s
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQty(
                              entry.material.id,
                              entry.quantity - 1
                            )
                          }
                          className="w-6 h-6 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold tabular-nums w-6 text-center">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQty(
                              entry.material.id,
                              entry.quantity + 1
                            )
                          }
                          className="w-6 h-6 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {wholesaleCart.length > 0 && (
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-stone-600">
                    Total Wholesale Order:
                  </span>
                  <span className="font-editorial font-bold text-emerald-950 text-lg tabular-nums">
                    {formatMoney(cartTotalBdt, currency)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  Proceed to B2B Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Wholesale B2B Checkout Modal (Online Payment Only — No COD) */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              aria-label="Close B2B checkout"
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="font-editorial text-xl font-bold text-stone-900">
                Wholesale B2B Checkout
              </h2>
              <p className="text-xs text-stone-500">
                Workshop delivery verification and online-only B2B settlement.
              </p>
            </div>

            <form
              onSubmit={handleExecuteWholesaleCheckout}
              className="space-y-4 text-xs"
            >
              <div className="space-y-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-900">
                  Workshop Delivery Details
                </h4>
                <input
                  type="text"
                  required
                  value={buyerVendorName}
                  onChange={(e) => setBuyerVendorName(e.target.value)}
                  placeholder="Artisan Studio / Workshop Name"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                />
                <input
                  type="text"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono"
                />
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Full Workshop Shipping Address"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                />
              </div>

              {/* Online Only Payment Selector */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900">
                  Online B2B Payment Gateway (No COD)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'bkash', label: 'bKash Merchant' },
                      { id: 'nagad', label: 'Nagad B2B' },
                      { id: 'sslcommerz', label: 'SSLCommerz' },
                      { id: 'amarpay', label: 'aamarPay' },
                    ] as const
                  ).map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setPaymentMethod(gw.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                        paymentMethod === gw.id
                          ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{gw.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center font-bold text-emerald-950">
                <span>Grand Total:</span>
                <span className="font-editorial text-lg tabular-nums">
                  {formatMoney(cartTotalBdt, currency)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessingCheckout}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isProcessingCheckout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Transmitting Wholesale Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Confirm &amp; Authorize Payment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
