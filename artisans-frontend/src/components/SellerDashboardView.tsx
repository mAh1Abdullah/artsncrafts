import React, { useState } from 'react';
import { VendorProfile, Product, Order, VendorSettlement, OrderStatus } from '../types';
import { formatPrice } from '../utils/cuid';
import { storageService } from '../services/storage';
import { 
  Store, Package, Plus, Truck, DollarSign, 
  MapPin, Clock, Sparkles, CheckCircle, Sliders, Shield,
  Edit2, AlertTriangle, Download, UserPlus, Trash2, Eye,
  RefreshCw, Check, X, FileText, ChevronRight, Building, Settings
} from 'lucide-react';

interface SellerDashboardViewProps {
  vendorProfile: VendorProfile | undefined;
  products: Product[];
  orders: Order[];
  settlements: VendorSettlement[];
  onAddProduct: (productData: any) => void;
  onUpdateOrderStatus: (orderId: string, vendorOrderId: string, status: OrderStatus, trackingNumber?: string) => void;
  onApplySeller: () => void;
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({
  vendorProfile,
  products,
  orders,
  settlements,
  onAddProduct,
  onUpdateOrderStatus,
  onApplySeller,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'payouts' | 'settings'>('overview');
  
  // Product Modals & Filters State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'approved' | 'pending' | 'draft' | 'rejected'>('all');

  // Product Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<any>('pottery');
  const [priceBDT, setPriceBDT] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [craftDays, setCraftDays] = useState('3');
  const [inStockQuantity, setInStockQuantity] = useState('15');
  const [isCustomizable, setIsCustomizable] = useState(true);
  const [customTextLabel, setCustomTextLabel] = useState('Custom Engraved Name / Date');

  // Order Details Modal State
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<{
    order: Order;
    vOrder: any;
  } | null>(null);

  // Selected Courier Override State
  const [selectedCourier, setSelectedCourier] = useState<string>('Pathao Express');

  // Shop Settings State
  const [shopName, setShopName] = useState(vendorProfile?.displayName || '');
  const [shopDescription, setShopDescription] = useState(vendorProfile?.description || '');
  const [supportEmail, setSupportEmail] = useState(vendorProfile?.supportEmail || '');
  const [supportPhone, setSupportPhone] = useState(vendorProfile?.supportPhone || '');
  const [avatarUrl, setAvatarUrl] = useState(vendorProfile?.avatarUrl || '');
  const [allowCod, setAllowCod] = useState(vendorProfile?.allowCod ?? true);
  const [workshopAddress, setWorkshopAddress] = useState(vendorProfile?.workshopLocation || '');

  // Payout Account Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutType, setPayoutType] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [payoutName, setPayoutName] = useState(vendorProfile?.displayName || '');
  const [payoutNumber, setPayoutNumber] = useState('01711223344');

  // Slug Request Modal State
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [requestedSlug, setRequestedSlug] = useState('');

  // Team Member Management State
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string; role: 'owner' | 'manager' | 'craftsman' }>>([
    { id: 'tm_1', name: vendorProfile?.displayName || 'Lead Artisan', email: vendorProfile?.supportEmail || 'artisan@market.bd', role: 'owner' },
    { id: 'tm_2', name: 'Master Pottery Apprentice', email: 'studio.apprentice@market.bd', role: 'craftsman' }
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'manager' | 'craftsman'>('craftsman');

  if (!vendorProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Become a Seller on The Artisan's Market
        </h1>
        <p className="text-stone-600 max-w-md mx-auto text-sm">
          You haven't registered an artisan shop profile yet. Apply today to showcase your pottery, weavers, carvings, or wholesale raw materials to nationwide buyers.
        </p>
        <button
          onClick={onApplySeller}
          className="px-6 py-3 bg-amber-950 text-amber-100 rounded-xl font-bold text-sm hover:bg-amber-900 transition-colors cursor-pointer"
        >
          Apply for Seller Profile
        </button>
      </div>
    );
  }

  // Filter vendor's own orders
  const vendorOrdersList: Array<{
    orderId: string;
    vendorOrderId: string;
    buyerName: string;
    buyerPhone: string;
    maskedPhone: string;
    items: any[];
    status: OrderStatus;
    subtotalCents: number;
    courierName: string;
    trackingNumber?: string;
    createdAt: string;
    fullOrder: Order;
    vOrderRaw: any;
  }> = [];

  orders.forEach(o => {
    o.vendorOrders.forEach(v => {
      if (v.vendorProfileId === vendorProfile.id || true) { // demo view
        const phone = o.buyerPhone || '01711002233';
        const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2');
        vendorOrdersList.push({
          orderId: o.id,
          vendorOrderId: v.id,
          buyerName: o.buyerName,
          buyerPhone: phone,
          maskedPhone,
          items: v.items,
          status: v.status,
          subtotalCents: v.subtotalCents,
          courierName: v.courierName,
          trackingNumber: v.trackingNumber,
          createdAt: o.createdAt,
          fullOrder: o,
          vOrderRaw: v
        });
      }
    });
  });

  // Seller's products
  const vendorProducts = products.filter(p => p.vendorProfileId === vendorProfile.id || true).map(p => ({
    ...p,
    status: (p.status || 'approved') as 'draft' | 'pending' | 'approved' | 'rejected'
  }));

  const filteredProducts = vendorProducts.filter(p => {
    if (productStatusFilter === 'all') return true;
    return p.status === productStatusFilter;
  });

  // Calculate metrics
  const totalRevenueCents = vendorOrdersList.reduce((sum, o) => sum + o.subtotalCents, 0);
  const pendingPayoutCents = Math.round(totalRevenueCents * 0.90); // 90% net after 10% commission
  const totalOrdersThisMonth = vendorOrdersList.length;
  const lastPayout = settlements.length > 0 ? settlements[0] : null;

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setDescription(prod.description);
    setCategory(prod.category);
    setPriceBDT((prod.priceCents / 100).toString());
    setImageUrl(prod.images[0] || '');
    setCraftDays(prod.craftTimeDays.toString());
    setInStockQuantity(prod.inStockQuantity.toString());
    setIsCustomizable(prod.isCustomizable);
    setCustomTextLabel(prod.customizationOptions?.[0]?.label || 'Custom Engraved Name / Date');
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setCategory('pottery');
    setPriceBDT('');
    setImageUrl('');
    setCraftDays('3');
    setInStockQuantity('15');
    setIsCustomizable(true);
    setCustomTextLabel('Custom Engraved Name / Date');
    setShowAddProductModal(true);
  };

  // Submit Add / Edit Product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceBDT || !imageUrl) return;

    const priceCents = Math.round(parseFloat(priceBDT) * 100);

    if (editingProduct) {
      storageService.updateProduct(editingProduct.id, {
        title,
        description: description || 'Beautiful handcrafted piece created with authentic materials.',
        category,
        priceCents,
        images: [imageUrl],
        inStockQuantity: parseInt(inStockQuantity) || 10,
        craftTimeDays: parseInt(craftDays) || 3,
        isCustomizable,
        status: 'approved', // re-approved on save
        customizationOptions: isCustomizable ? [
          {
            id: 'opt_1',
            type: 'text',
            label: customTextLabel,
            placeholder: 'e.g. "Anika & Fahim - 2026"',
            required: false,
            priceModifierCents: 20000
          }
        ] : []
      });
      onShowToast('success', 'Listing Updated', `Successfully updated listing "${title}".`);
      setEditingProduct(null);
    } else {
      onAddProduct({
        vendorProfileId: vendorProfile.id,
        vendorName: vendorProfile.displayName,
        vendorSlug: vendorProfile.publicSlug,
        vendorLocation: vendorProfile.workshopLocation,
        title,
        description: description || 'Beautiful handcrafted piece created with authentic materials.',
        category,
        tags: [category, 'Handcrafted', 'Artisan'],
        priceCents,
        images: [imageUrl],
        inStockQuantity: parseInt(inStockQuantity) || 15,
        isCustomizable,
        status: 'pending', // new listings pending review
        customizationOptions: isCustomizable ? [
          {
            id: 'opt_1',
            type: 'text',
            label: customTextLabel,
            placeholder: 'e.g. "Anika & Fahim - 2026"',
            required: false,
            priceModifierCents: 20000
          }
        ] : [],
        materialsUsed: ['Authentic Natural Materials'],
        craftTimeDays: parseInt(craftDays) || 3,
        rating: 5.0,
        reviewCount: 0
      });
      onShowToast('info', 'Listing Submitted', `Listing "${title}" submitted for admin verification.`);
      setShowAddProductModal(false);
    }
  };

  // Resubmit Rejected Product
  const handleResubmitProduct = (product: Product) => {
    storageService.updateProduct(product.id, {
      status: 'pending',
      rejectionReason: undefined
    });
    onShowToast('info', 'Resubmitted for Review', `Product "${product.title}" has been resubmitted to admin review queue.`);
  };

  // Mark Order as Shipped (with generated courier tracking)
  const handleShipOrder = (vOrder: any) => {
    const trackingNo = `${selectedCourier === 'Pathao Express' ? 'PTH' : 'STDF'}-BD-${Math.floor(100000 + Math.random() * 900000)}`;
    onUpdateOrderStatus(vOrder.orderId, vOrder.vendorOrderId, 'shipped', trackingNo);
    onShowToast('success', 'Shipment Booked', `Order handed to ${selectedCourier}. Waybill tracking #${trackingNo} generated.`);
  };

  // Export Settlement Report CSV
  const handleDownloadSettlementCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Settlement ID,Gross Amount (BDT),Commission 10% (BDT),Net Payout (BDT),Status,Date\n";
    settlements.forEach(s => {
      csvContent += `${s.id},${s.grossAmountCents / 100},${s.commissionCents / 100},${s.netAmountCents / 100},${s.status},${s.createdAt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Artisan_Settlement_Report_${vendorProfile.publicSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('success', 'Report Generated', 'Settlement CSV report downloaded.');
  };

  // Save Shop Settings
  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateVendorProfile(vendorProfile.id, {
      displayName: shopName,
      description: shopDescription,
      supportEmail,
      supportPhone,
      avatarUrl,
      allowCod,
      workshopLocation: workshopAddress
    });
    onShowToast('success', 'Settings Updated', 'Artisan shop profile and pickup parameters updated.');
  };

  // Add Team Member
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;
    const newMember = {
      id: `tm_${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole
    };
    setTeamMembers([...teamMembers, newMember]);
    setNewMemberName('');
    setNewMemberEmail('');
    onShowToast('success', 'Team Member Invited', `Invitation sent to ${newMemberEmail} as ${newMemberRole}.`);
  };

  // Remove Team Member
  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    onShowToast('info', 'Team Member Removed', 'Member access revoked.');
  };

  // Submit Slug Change Request
  const handleSubmitSlugRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedSlug) return;
    setShowSlugModal(false);
    onShowToast('info', 'Slug Request Submitted', `Request to change shop slug to "${requestedSlug}" sent to admin review queue.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Artisan Shop Banner Header */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 text-amber-100 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={vendorProfile.avatarUrl || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=300'}
            alt={vendorProfile.displayName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-white">{vendorProfile.displayName}</h1>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-amber-400/30">
                {vendorProfile.status}
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">{vendorProfile.craftSpecialty} • {vendorProfile.workshopLocation}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-amber-900/60 p-1 rounded-2xl border border-amber-800/60 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-100 text-amber-950 shadow-xs' : 'text-amber-200 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-amber-100 text-amber-950 shadow-xs' : 'text-amber-200 hover:text-white'
            }`}
          >
            My Products ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-amber-100 text-amber-950 shadow-xs' : 'text-amber-200 hover:text-white'
            }`}
          >
            Orders ({vendorOrdersList.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payouts' ? 'bg-amber-100 text-amber-950 shadow-xs' : 'text-amber-200 hover:text-white'
            }`}
          >
            Settlements
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-amber-100 text-amber-950 shadow-xs' : 'text-amber-200 hover:text-white'
            }`}
          >
            Shop Settings
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-stone-500 text-xs font-medium block">Total Revenue</span>
              <span className="font-serif text-2xl font-bold text-stone-900">{formatPrice(totalRevenueCents)}</span>
              <span className="text-[11px] text-emerald-700 font-semibold block">+14.2% vs last month</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-stone-500 text-xs font-medium block">Last Payout</span>
              <span className="font-serif text-2xl font-bold text-stone-900">
                {lastPayout ? formatPrice(lastPayout.netAmountCents) : '৳0'}
              </span>
              <span className="text-[11px] text-stone-500 block">Bi-weekly Auto Dispatched</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-stone-500 text-xs font-medium block">Pending Payout</span>
              <span className="font-serif text-2xl font-bold text-amber-900">{formatPrice(pendingPayoutCents)}</span>
              <span className="text-[11px] text-amber-800 font-semibold block">Net 90% after commission</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-stone-500 text-xs font-medium block">Orders This Month</span>
              <span className="font-serif text-2xl font-bold text-stone-900">{totalOrdersThisMonth}</span>
              <span className="text-[11px] text-stone-500 block">4 awaiting crafting</span>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-serif text-sm font-bold text-stone-900">Seller Quick Shortcuts</h3>
              <p className="text-xs text-stone-500">Manage listings, track settlements, and configure workshop team access.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Add Product
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className="px-4 py-2 bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <DollarSign className="w-4 h-4 text-emerald-700" />
                View Payouts
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-4 py-2 bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Settings className="w-4 h-4 text-amber-800" />
                Shop Settings
              </button>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-lg font-bold text-stone-900">Recent Customer Custom Orders</h2>
              <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1">
                View All Orders <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Buyer</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {vendorOrdersList.slice(0, 5).map((o) => (
                    <tr key={o.vendorOrderId} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">{o.orderId.substring(0, 10)}...</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-stone-900 block">{o.buyerName}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{o.maskedPhone}</span>
                      </td>
                      <td className="py-3 px-3 text-stone-700 max-w-xs truncate">
                        {o.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-bold text-stone-900">{formatPrice(o.subtotalCents)}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrderDetail({ order: o.fullOrder, vOrder: o.vOrderRaw })}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MY PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Your Handcrafted Product Listings</h2>
              <p className="text-xs text-stone-500">Filter by status or update product customization parameters.</p>
            </div>
            
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Add New Product
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'approved', 'pending', 'draft', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setProductStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full font-bold uppercase text-[11px] transition-all cursor-pointer ${
                  productStatusFilter === st
                    ? 'bg-amber-950 text-amber-100 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'all' ? 'All Products' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3 relative group">
                <div className="relative">
                  <img src={p.images[0]} alt={p.title} className="w-full h-44 object-cover rounded-xl bg-stone-100 border border-stone-200" />
                  <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-xs ${
                    p.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    p.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    p.status === 'rejected' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-stone-200 text-stone-800'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">{p.category}</span>
                  <h3 className="font-serif font-bold text-stone-900 text-sm line-clamp-1">{p.title}</h3>
                  <p className="font-serif font-bold text-amber-950 text-base mt-1">{formatPrice(p.priceCents)}</p>
                </div>

                {/* Rejection Notice */}
                {p.status === 'rejected' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                    <p className="font-bold text-rose-900">Rejection Reason:</p>
                    <p className="text-rose-700 text-[11px]">{p.rejectionReason || 'Requires clearer craft process images.'}</p>
                    <button
                      onClick={() => handleResubmitProduct(p)}
                      className="mt-1 px-3 py-1 bg-rose-900 text-rose-50 hover:bg-rose-950 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resubmit for Admin Review
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 text-stone-500">
                  <span>Stock: {p.inStockQuantity} pcs</span>
                  <button
                    onClick={() => handleOpenEditProduct(p)}
                    className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-amber-800" /> Edit Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl font-bold text-stone-900">Customer Custom Orders Received</h2>
            <p className="text-xs text-stone-500">Manage order status, custom notes, and courier dispatch.</p>
          </div>

          {vendorOrdersList.length === 0 ? (
            <p className="text-xs text-stone-500">No orders received yet.</p>
          ) : (
            <div className="space-y-4">
              {vendorOrdersList.map((vOrder) => (
                <div key={vOrder.vendorOrderId} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
                  
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Buyer Name & Phone</span>
                      <span className="font-bold text-stone-900">{vOrder.buyerName}</span> ({vOrder.maskedPhone})
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Assigned Courier</span>
                      <span className="font-semibold text-stone-800">{vOrder.courierName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Order Subtotal</span>
                      <span className="font-serif font-bold text-amber-950 text-base">{formatPrice(vOrder.subtotalCents)}</span>
                    </div>
                    
                    {/* Status Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-600">Status:</span>
                      <select
                        value={vOrder.status}
                        onChange={(e) => onUpdateOrderStatus(vOrder.orderId, vOrder.vendorOrderId, e.target.value as OrderStatus, vOrder.trackingNumber || 'PTH-BD-998811')}
                        className="px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
                      >
                        <option value="placed">Placed (Pending)</option>
                        <option value="processing">Processing (Accepted)</option>
                        <option value="crafting">Handcrafting in Studio</option>
                        <option value="ready_for_pickup">Ready for Courier Pickup</option>
                        <option value="shipped">Handed to Courier (Shipped)</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Purchased Items & Custom Selections */}
                  <div className="space-y-3">
                    {vOrder.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                        <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
                        <div className="flex-1">
                          <p className="font-bold text-stone-900">{item.title} x {item.quantity}</p>
                          {item.customSelections && item.customSelections.length > 0 && (
                            <div className="flex flex-wrap gap-1 text-[11px] text-amber-950 mt-1">
                              {item.customSelections.map((sel: any, idx: number) => (
                                <span key={idx} className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-medium">
                                  Custom {sel.optionLabel}: "{sel.value}"
                                </span>
                              ))}
                            </div>
                          )}
                          {item.customNote && (
                            <p className="text-[11px] text-stone-600 italic mt-1">
                              Custom Instructions: "{item.customNote}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions & Waybill Booking */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-stone-700">Courier Partner Override:</span>
                      <select
                        value={selectedCourier}
                        onChange={(e) => setSelectedCourier(e.target.value)}
                        className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="Pathao Express">Pathao Express (Hub Pickup)</option>
                        <option value="Steadfast Courier">Steadfast Courier (Doorstep)</option>
                        <option value="eCourier BD">eCourier BD (Eco Express)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {vOrder.status !== 'shipped' && vOrder.status !== 'delivered' && (
                        <button
                          onClick={() => handleShipOrder(vOrder)}
                          className="px-4 py-1.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-400" /> Dispatch & Generate Waybill
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderDetail({ order: vOrder.fullOrder, vOrder: vOrder.vOrderRaw })}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Full Delivery Address
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PAYOUTS & SETTLEMENTS TAB */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Artisan Payouts & Settlement Ledgers</h2>
              <p className="text-xs text-stone-500">Bi-weekly platform payouts with 10% platform fee calculation.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadSettlementCSV}
                className="px-4 py-2 bg-emerald-900 text-emerald-100 hover:bg-emerald-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                Download CSV Report
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-4 py-2 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Update Payout Account
              </button>
            </div>
          </div>

          {/* Settlement Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-stone-400 text-[11px] font-semibold uppercase">Gross Sales Revenue</span>
              <span className="font-serif text-2xl font-bold text-stone-900">{formatPrice(totalRevenueCents)}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-stone-400 text-[11px] font-semibold uppercase">Platform Fee (10%)</span>
              <span className="font-serif text-2xl font-bold text-rose-800">-{formatPrice(Math.round(totalRevenueCents * 0.10))}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-stone-400 text-[11px] font-semibold uppercase">Refund Deductions</span>
              <span className="font-serif text-2xl font-bold text-stone-900">৳0</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1 shadow-xs">
              <span className="text-amber-800 text-[11px] font-semibold uppercase">Net Payout Owed</span>
              <span className="font-serif text-2xl font-bold text-emerald-900">{formatPrice(pendingPayoutCents)}</span>
            </div>
          </div>

          {/* Settlement Ledger Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-stone-900">Settlement History</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Settlement ID</th>
                    <th className="py-2.5 px-3">Gross Amount</th>
                    <th className="py-2.5 px-3">Commission (10%)</th>
                    <th className="py-2.5 px-3">Net Payout</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">{s.id}</td>
                      <td className="py-3 px-3 font-semibold text-stone-800">{formatPrice(s.grossAmountCents)}</td>
                      <td className="py-3 px-3 text-rose-700">-{formatPrice(s.commissionCents)}</td>
                      <td className="py-3 px-3 font-serif font-bold text-emerald-900">{formatPrice(s.netAmountCents)}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-stone-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SHOP SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-xs max-w-4xl">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Artisan Shop Profile & Operational Parameters</h2>
              <p className="text-xs text-stone-500">Configure public shop profile, support hotline, COD preferences, and team roles.</p>
            </div>

            <form onSubmit={handleSaveShopSettings} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Display Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Public Shop URL Slug</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      value={vendorProfile.publicSlug}
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl text-stone-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSlugModal(true)}
                      className="px-3 py-2 bg-amber-950 text-amber-100 rounded-xl font-bold cursor-pointer hover:bg-amber-900 whitespace-nowrap"
                    >
                      Request Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Support Email Hotline</label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Support Phone Number</label>
                  <input
                    type="text"
                    required
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Shop Logo / Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Workshop Pickup Address</label>
                <textarea
                  rows={2}
                  value={workshopAddress}
                  onChange={(e) => setWorkshopAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              {/* COD Toggle */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900">Cash on Delivery (COD) Acceptance</h4>
                  <p className="text-[11px] text-stone-500">Allow buyers to pay via Cash on Delivery for custom crafted orders.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowCod}
                  onChange={(e) => setAllowCod(e.target.checked)}
                  className="w-5 h-5 text-amber-900 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-amber-950 text-amber-100 font-bold rounded-xl uppercase tracking-wider shadow-md hover:bg-amber-900 transition-colors"
              >
                Save Shop Settings
              </button>
            </form>
          </div>

          {/* Team Member Management */}
          <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-xs max-w-4xl">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-stone-900">Studio Team Members & Roles</h3>
              <p className="text-xs text-stone-500">Invite master craftsmen, studio managers, or fulfillment apprentices.</p>
            </div>

            <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Member Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
              />
              <input
                type="email"
                required
                placeholder="member@studio.bd"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              >
                <option value="manager">Studio Manager</option>
                <option value="craftsman">Craftsman / Apprentice</option>
              </select>
              <button
                type="submit"
                className="py-2 px-4 bg-amber-950 text-amber-100 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer hover:bg-amber-900"
              >
                <UserPlus className="w-4 h-4 text-amber-400" /> Invite Member
              </button>
            </form>

            <div className="space-y-2">
              {teamMembers.map((m) => (
                <div key={m.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-stone-900">{m.name} <span className="text-[10px] text-stone-400 font-mono">({m.email})</span></p>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {m.role}
                    </span>
                  </div>

                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveTeamMember(m.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {(showAddProductModal || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              {editingProduct ? 'Edit Handcrafted Product' : 'List New Handcrafted Product'}
            </h3>

            <form onSubmit={handleSaveProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-800 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hand-Carved Teak Water Pitcher"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                >
                  <option value="pottery">Pottery & Clay</option>
                  <option value="woodwork">Teak & Woodcraft</option>
                  <option value="textiles">Jamdani & Textiles</option>
                  <option value="glass_resin">Resin & Botanical</option>
                  <option value="jewelry">Silver & Jewelry</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2450"
                    value={priceBDT}
                    onChange={(e) => setPriceBDT(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Lead Days</label>
                  <input
                    type="number"
                    value={craftDays}
                    onChange={(e) => setCraftDays(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={inStockQuantity}
                    onChange={(e) => setInStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">Product Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">Description & Craft Story</label>
                <textarea
                  rows={2}
                  placeholder="Describe kiln process, clay origin, wood grain finish..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCustomizableCheck"
                  checked={isCustomizable}
                  onChange={(e) => setIsCustomizable(e.target.checked)}
                  className="w-4 h-4 text-amber-900 rounded cursor-pointer"
                />
                <label htmlFor="isCustomizableCheck" className="font-semibold text-stone-800 cursor-pointer">
                  Allow Custom Engraving / Monogram Text Option
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-950 text-amber-100 rounded-xl font-bold cursor-pointer hover:bg-amber-900"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAIL MODAL */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold text-lg"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="bg-amber-100 text-amber-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Order #{selectedOrderDetail.order.id.substring(0, 10)}
              </span>
              <h3 className="font-serif text-xl font-bold text-stone-900">Delivery Address & Custom Specs</h3>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900">Recipient Information</h4>
              <p className="font-semibold text-stone-800">{selectedOrderDetail.order.buyerName}</p>
              <p className="text-stone-600">Phone: {selectedOrderDetail.order.buyerPhone}</p>
              <div className="pt-2 border-t border-stone-200 text-stone-600 leading-relaxed">
                <p>{selectedOrderDetail.order.shippingAddressSnapshot.addressLine}</p>
                <p>
                  {selectedOrderDetail.order.shippingAddressSnapshot.upazila},{' '}
                  {selectedOrderDetail.order.shippingAddressSnapshot.district},{' '}
                  {selectedOrderDetail.order.shippingAddressSnapshot.division} - {selectedOrderDetail.order.shippingAddressSnapshot.postalCode}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900">Items Ordered</h4>
              {selectedOrderDetail.vOrder.items.map((item: any) => (
                <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                  <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-stone-900">{item.title} x {item.quantity}</p>
                    {item.customNote && <p className="text-amber-950 italic text-[11px]">"{item.customNote}"</p>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="w-full py-2.5 bg-stone-900 text-stone-100 font-bold rounded-xl uppercase tracking-wider text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* UPDATE PAYOUT ACCOUNT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Update Payout Account</h3>
            <p className="text-xs text-stone-500">Provide verified bKash / Nagad or Bank account for bi-weekly disbursements.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowPayoutModal(false);
              onShowToast('success', 'Account Request Submitted', `Payout account updated to ${payoutType.toUpperCase()} ${payoutNumber}.`);
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Account Type</label>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="bkash">bKash Personal / Merchant</option>
                  <option value="nagad">Nagad Personal</option>
                  <option value="bank">Brac / Dutch-Bangla Bank</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={payoutName}
                  onChange={(e) => setPayoutName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Account / Phone Number</label>
                <input
                  type="text"
                  required
                  value={payoutNumber}
                  onChange={(e) => setPayoutNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-950 text-amber-100 font-bold rounded-xl cursor-pointer hover:bg-amber-900"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST SLUG CHANGE MODAL */}
      {showSlugModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Request Shop URL Slug Change</h3>
            <p className="text-xs text-stone-500">Public shop URL updates require brief admin verification to protect brand integrity.</p>

            <form onSubmit={handleSubmitSlugRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Requested New Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dhamrai-heritage-pottery"
                  value={requestedSlug}
                  onChange={(e) => setRequestedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSlugModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-950 text-amber-100 font-bold rounded-xl cursor-pointer hover:bg-amber-900"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
