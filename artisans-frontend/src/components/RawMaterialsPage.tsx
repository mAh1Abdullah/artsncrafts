import React, { useState, useEffect } from 'react';
import { RawMaterial, RawMaterialCategory, WholesaleCartItem, WholesaleOrder, User, VendorProfile, Address, PaymentMethod } from '../types';
import { storageService } from '../services/storage';
import { formatPrice } from '../utils/cuid';
import { 
  Package, Layers, ShieldCheck, MapPin, Truck, Plus, ShoppingBag, 
  Search, Filter, Lock, Store, CheckCircle, AlertCircle, ArrowRight,
  CreditCard, Smartphone, RefreshCw, Eye, Edit3, X, FileText
} from 'lucide-react';

interface RawMaterialsPageProps {
  currentUser: User;
  onNavigateToSignup?: () => void;
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

export const RawMaterialsPage: React.FC<RawMaterialsPageProps> = ({
  currentUser,
  onNavigateToSignup,
  onShowToast
}) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [wholesaleCart, setWholesaleCart] = useState<WholesaleCartItem[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([]);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modals
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSupplierTabOpen, setIsSupplierTabOpen] = useState<boolean>(false);

  // Supplier listing creation form
  const [isAddingMaterial, setIsAddingMaterial] = useState<boolean>(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<RawMaterialCategory>('Clay');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [newMatPrice, setNewMatPrice] = useState(1000); // ৳1,000
  const [newMatUnit, setNewMatUnit] = useState('pack');
  const [newMatMoq, setNewMatMoq] = useState(5);
  const [newMatStock, setNewMatStock] = useState(100);
  const [newMatImage, setNewMatImage] = useState('https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=800');

  // Checkout form state
  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: currentUser.displayName,
    phone: currentUser.phone || '+8801700000000',
    addressLine: '12 Artisan Hub Road, Workshop Sector 4',
    district: 'Dhaka',
    division: 'Dhaka',
    postalCode: '1212'
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [bKashNumber, setBKashNumber] = useState('01712345678');
  const [bKashPin, setBKashPin] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Check vendor status
  const currentVendor = storageService.getVendorByUserId(currentUser.id);
  const isApprovedVendor = currentVendor?.status === 'approved' || currentUser.role === 'admin';

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setRawMaterials(storageService.getRawMaterials());
    setWholesaleCart(storageService.getWholesaleCart());
    setWholesaleOrders(storageService.getWholesaleOrders());
  };

  const categories: string[] = ['all', 'Beads', 'Yarn', 'Clay', 'Wood', 'Leather', 'Metals', 'Packaging'];

  const filteredMaterials = rawMaterials.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !inStockOnly || m.stockQuantity > 0;
    return matchesCategory && matchesSearch && matchesStock;
  });

  const handleOpenDetailModal = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setModalQty(material.moq);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedMaterial) return;
    if (modalQty < selectedMaterial.moq) {
      onShowToast('warning', 'MOQ Limit Enforced', `Minimum order quantity for this item is ${selectedMaterial.moq} ${selectedMaterial.unit}s.`);
      return;
    }
    storageService.addToWholesaleCart(selectedMaterial, modalQty);
    onShowToast('success', 'Added to Wholesale Cart', `${modalQty} ${selectedMaterial.unit}s of ${selectedMaterial.name} added.`);
    setSelectedMaterial(null);
  };

  const cartTotalCents = wholesaleCart.reduce((acc, item) => acc + (item.rawMaterial.priceCents * item.quantity), 0);

  const handleExecuteWholesaleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (wholesaleCart.length === 0) return;
    if (!currentVendor && currentUser.role !== 'admin') {
      onShowToast('warning', 'Artisan Verification Required', 'Only registered artisan vendors can execute wholesale orders.');
      return;
    }

    setIsProcessingCheckout(true);
    setTimeout(() => {
      const buyerProfileId = currentVendor?.id || 'v_admin';
      const buyerName = currentVendor?.displayName || currentUser.displayName;

      storageService.createWholesaleOrder(
        buyerProfileId,
        buyerName,
        wholesaleCart,
        paymentMethod,
        shippingAddress
      );

      setIsProcessingCheckout(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      onShowToast('success', 'Wholesale Order Placed!', 'Your order has been transmitted directly to verified material wholesalers.');
    }, 1200);
  };

  const handleCreateMaterialListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) {
      onShowToast('warning', 'Vendor Required', 'You must have an approved vendor account to list materials.');
      return;
    }

    storageService.addRawMaterial({
      wholesalerVendorProfileId: currentVendor.id,
      supplierName: currentVendor.displayName,
      name: newMatName,
      category: newMatCategory,
      description: newMatDesc,
      priceCents: newMatPrice * 100,
      unit: newMatUnit,
      moq: newMatMoq,
      stockQuantity: newMatStock,
      status: 'active',
      images: [newMatImage]
    });

    onShowToast('success', 'Wholesale Material Listed', `${newMatName} is now live on the raw material marketplace.`);
    setIsAddingMaterial(false);
    setNewMatName('');
    setNewMatDesc('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Page Header & Access Badge */}
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
                Verified Artisan Access ({currentVendor?.displayName || 'Admin Store'})
              </span>
            ) : (
              <span className="bg-rose-500/20 text-rose-200 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                Restricted Access (Buyer Account)
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            Raw Craft Materials & Wholesale Supplies
          </h1>
          <p className="text-emerald-200/90 text-sm leading-relaxed">
            Source bulk clay powders, kiln-dried teak timber, raw handspun mulberry silk spools, brass sheets, craft beads, and eco jute packaging directly from verified primary producers.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Wholesale Cart ({wholesaleCart.length})
            </button>

            {isApprovedVendor && (
              <button
                onClick={() => setIsSupplierTabOpen(!isSupplierTabOpen)}
                className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/50 text-emerald-100 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Store className="w-4 h-4 text-emerald-300" />
                {isSupplierTabOpen ? 'Back to Wholesale Catalogue' : 'Supplier Dashboard & Orders'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Access Control Gate Banner (If NOT approved vendor) */}
      {!isApprovedVendor && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-xs">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="font-serif font-bold text-base text-amber-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-800" />
              Seller-Only Access Notice
            </h3>
            <p className="text-amber-900 leading-relaxed">
              Wholesale material purchases and bulk trade pricing are exclusively restricted to approved artisan vendors on The Artisan Market. Register your craft store to unlock wholesale supply procurement.
            </p>
          </div>
          {onNavigateToSignup && (
            <button
              onClick={onNavigateToSignup}
              className="px-5 py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              Apply for Artisan Status
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      )}

      {/* 3. Supplier Management Tab (If toggled) */}
      {isSupplierTabOpen && isApprovedVendor && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">Wholesale Supplier Portal</h2>
              <p className="text-xs text-stone-500">Manage your raw material listings and fulfill wholesale B2B orders.</p>
            </div>
            <button
              onClick={() => setIsAddingMaterial(!isAddingMaterial)}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Material Listing
            </button>
          </div>

          {/* Add Listing Form */}
          {isAddingMaterial && (
            <form onSubmit={handleCreateMaterialListing} className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4 text-xs">
              <h3 className="font-bold text-stone-900 text-sm">Create Raw Material Listing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Material Name</label>
                  <input
                    type="text"
                    required
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    placeholder="e.g. Natural Indigo Dye Powder"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as RawMaterialCategory)}
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
                  <label className="block text-stone-700 font-semibold mb-1">Price per Unit (BDT ৳)</label>
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
                  <label className="block text-stone-700 font-semibold mb-1">Unit Label</label>
                  <input
                    type="text"
                    required
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    placeholder="e.g. kg, spool, bag, set"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Minimum Order Quantity (MOQ)</label>
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
                  <label className="block text-stone-700 font-semibold mb-1">Available Stock Quantity</label>
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
                  <label className="block text-stone-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={newMatDesc}
                    onChange={(e) => setNewMatDesc(e.target.value)}
                    placeholder="Provide full technical specifications and sourcing notes..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMaterial(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Material Listing
                </button>
              </div>
            </form>
          )}

          {/* Supplier Orders List */}
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Wholesale Orders Received</h3>
            {wholesaleOrders.filter(o => o.supplierVendorProfileId === currentVendor?.id || currentUser.role === 'admin').length === 0 ? (
              <p className="text-xs text-stone-500 py-4 italic">No wholesale orders received yet.</p>
            ) : (
              <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden text-xs">
                {wholesaleOrders
                  .filter(o => o.supplierVendorProfileId === currentVendor?.id || currentUser.role === 'admin')
                  .map(order => (
                    <div key={order.id} className="p-4 bg-stone-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{order.id}</span>
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase text-[10px]">
                            {order.status}
                          </span>
                        </div>
                        <p className="font-bold text-emerald-950 mt-1">{order.materialName} ({order.quantity} units)</p>
                        <p className="text-stone-500 text-[11px]">Ordered by: {order.buyerName} • Payment: {order.paymentMethod.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif font-bold text-base text-stone-900">{formatPrice(order.totalAmountCents)}</p>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            storageService.updateWholesaleOrderStatus(order.id, e.target.value as any);
                            onShowToast('info', 'Status Updated', `Order ${order.id} status changed to ${e.target.value}`);
                          }}
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
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clay, timber, silk yarn, brass..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-hidden"
            />
          </div>

          {/* In Stock Toggle */}
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

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-stone-100">
          {categories.map((cat) => (
            <button
              key={cat}
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
              <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-stone-100">
                <img
                  src={material.images[0]}
                  alt={material.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-xs text-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
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
                <span className="text-[11px] text-stone-500 block font-medium">Supplier: <strong className="text-stone-800">{material.supplierName}</strong></span>
                <h3 className="font-serif font-bold text-stone-900 text-base leading-snug mt-0.5">
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
                  <span className="text-xs text-stone-400 block font-mono">Wholesale Rate</span>
                  <span className="font-serif font-bold text-emerald-950 text-lg">
                    {formatPrice(material.priceCents)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium"> / {material.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 block">
                    MOQ: {material.moq} {material.unit}s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleOpenDetailModal(material)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Details
                </button>
                <button
                  onClick={() => {
                    if (!isApprovedVendor) {
                      onShowToast('warning', 'Artisan Only', 'Wholesale orders require an approved artisan vendor account.');
                      return;
                    }
                    storageService.addToWholesaleCart(material, material.moq);
                    onShowToast('success', 'Added to Wholesale Cart', `${material.moq} ${material.unit}s of ${material.name} added.`);
                  }}
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
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedMaterial(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <img
                src={selectedMaterial.images[0]}
                alt={selectedMaterial.name}
                className="w-full h-48 object-cover rounded-2xl border border-stone-200"
              />
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {selectedMaterial.category}
              </span>
              <h2 className="font-serif text-xl font-bold text-stone-900">{selectedMaterial.name}</h2>
              <p className="text-xs text-stone-600 leading-relaxed">{selectedMaterial.description}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Supplier:</span>
                <span className="font-bold text-stone-900">{selectedMaterial.supplierName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Minimum Order Quantity (MOQ):</span>
                <span className="font-bold text-amber-800">{selectedMaterial.moq} {selectedMaterial.unit}s</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Unit Price:</span>
                <span className="font-bold text-emerald-900">{formatPrice(selectedMaterial.priceCents)} / {selectedMaterial.unit}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Select Quantity ({selectedMaterial.unit}s)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={selectedMaterial.moq}
                  value={modalQty}
                  onChange={(e) => setModalQty(Math.max(selectedMaterial.moq, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold"
                />
                <span className="text-xs text-stone-500 whitespace-nowrap">Total: <strong className="text-stone-900 text-base">{formatPrice(selectedMaterial.priceCents * modalQty)}</strong></span>
              </div>
            </div>

            <button
              onClick={handleAddToCartFromModal}
              className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Add to Wholesale Order Cart
            </button>
          </div>
        </div>
      )}

      {/* 7. Wholesale Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-800" />
                  Wholesale Order Cart ({wholesaleCart.length})
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wholesaleCart.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center italic">Your wholesale cart is empty.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  {wholesaleCart.map((item) => (
                    <div key={item.rawMaterial.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex justify-between items-center text-xs">
                      <div className="space-y-1 max-w-[200px]">
                        <p className="font-bold text-stone-900 truncate">{item.rawMaterial.name}</p>
                        <p className="text-[10px] text-stone-500">Supplier: {item.rawMaterial.supplierName}</p>
                        <p className="font-bold text-emerald-900">{formatPrice(item.rawMaterial.priceCents)} x {item.quantity} {item.rawMaterial.unit}s</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => storageService.updateWholesaleCartQuantity(item.rawMaterial.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button
                          onClick={() => storageService.updateWholesaleCartQuantity(item.rawMaterial.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white border border-stone-300 rounded-lg flex items-center justify-center font-bold"
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
                  <span className="font-semibold text-stone-600">Total Wholesale Order:</span>
                  <span className="font-serif font-bold text-emerald-950 text-lg">{formatPrice(cartTotalCents)}</span>
                </div>
                <button
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

      {/* 8. Wholesale B2B Checkout Modal (Online Payment Only) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-stone-900">Wholesale B2B Checkout</h2>
              <p className="text-xs text-stone-500">Order verification and online payment authorization.</p>
            </div>

            <form onSubmit={handleExecuteWholesaleCheckout} className="space-y-4 text-xs">
              {/* Delivery Address */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-900">Workshop Delivery Address</h4>
                <input
                  type="text"
                  required
                  value={shippingAddress.addressLine}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine: e.target.value })}
                  placeholder="Workshop Address"
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
                />
              </div>

              {/* Payment Method — Online Only (No COD for Wholesale) */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900">Online B2B Payment Authorization (No COD)</h4>
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pink-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-pink-700" />
                      bKash Merchant Gateway
                    </span>
                    <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      B2B Direct
                    </span>
                  </div>
                  <input
                    type="text"
                    value={bKashNumber}
                    onChange={(e) => setBKashNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center font-bold text-emerald-950">
                <span>Grand Total:</span>
                <span className="font-serif text-lg">{formatPrice(cartTotalCents)}</span>
              </div>

              <button
                type="submit"
                disabled={isProcessingCheckout}
                className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isProcessingCheckout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Transmitting Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Confirm & Authorize Payment
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
