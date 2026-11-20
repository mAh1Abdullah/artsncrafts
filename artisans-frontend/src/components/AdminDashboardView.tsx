import React, { useState } from 'react';
import { 
  ShieldCheck, Store, Package, Users, Tag, CreditCard, FileText, 
  CheckCircle2, XCircle, AlertTriangle, Search, Plus, Sparkles, 
  Clock, Eye, Sliders, Ban, UserCheck, Lock, RefreshCw, 
  Calendar, Filter, CornerDownRight, Info, ShieldAlert, ArrowUpRight,
  FileSpreadsheet, MessageSquare, UserX, Globe
} from 'lucide-react';
import { storageService } from '../services/storage';
import { CouponService } from '../services/couponService';
import { LaunchQADashboard } from './LaunchQADashboard';
import { Phase16ScalingDashboard } from './Phase16ScalingDashboard';
import { VendorProfile, Product, Coupon, AuditLog, UserTrustProfile, User, AdminNote, VendorSettlement } from '../types';

interface AdminDashboardViewProps {
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'products' | 'users' | 'settlements' | 'coupons' | 'audit' | 'qa' | 'scaling'>('overview');
  
  // Storage state bindings
  const vendors = storageService.getVendors();
  const products = storageService.getProducts();
  const coupons = storageService.getCoupons();
  const auditLogs = storageService.getAuditLogs();
  const settlements = storageService.getSettlements();
  const users = storageService.getUsers();
  const currentUser = storageService.getCurrentUser();

  // Search & Filter state
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<string>('all');
  
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('all');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('all');

  // Modal / Detail Selection states
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [vendorActionType, setVendorActionType] = useState<'approve' | 'reject' | 'suspend' | 'reapprove' | null>(null);
  const [vendorReason, setVendorReason] = useState('');
  const [vendorPrivateNote, setVendorPrivateNote] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productActionType, setProductActionType] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [productReason, setProductReason] = useState('');
  const [productPrivateNote, setProductPrivateNote] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionType, setUserActionType] = useState<'ban' | 'unban' | 'trust_adjust' | 'cod_override' | 'impersonate' | null>(null);
  const [userReason, setUserReason] = useState('');
  const [userPrivateNote, setUserPrivateNote] = useState('');
  const [userTrustDelta, setUserTrustDelta] = useState<number>(10);
  const [userCodOverride, setUserCodOverride] = useState<boolean>(true);

  // Settlement Batch modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [settlementStart, setSettlementStart] = useState('2026-07-01');
  const [settlementEnd, setSettlementEnd] = useState('2026-07-30');
  const [selectedSettlement, setSelectedSettlement] = useState<VendorSettlement | null>(null);

  // Admin note input state in details
  const [newAdminNoteText, setNewAdminNoteText] = useState('');

  // Coupon Creation Form state
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(15);
  const [newMinOrderBdt, setNewMinOrderBdt] = useState<number>(2000);

  // Derived metrics & queues
  const pendingVendors = vendors.filter(v => v.status === 'submitted' || v.status === 'under_review');
  const pendingProducts = products.filter(p => p.status === 'pending' || p.currentVersionId !== p.latestVersionId);
  const totalVendorCount = vendors.length;
  const approvedVendorCount = vendors.filter(v => v.status === 'approved').length;

  // Filtered lists
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.displayName.toLowerCase().includes(vendorSearch.toLowerCase()) || 
                          v.craftSpecialty.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                          v.workshopLocation.toLowerCase().includes(vendorSearch.toLowerCase());
    const matchesStatus = vendorStatusFilter === 'all' || v.status === vendorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.vendorName.toLowerCase().includes(productSearch.toLowerCase());
    const status = p.status || (p.currentVersionId === p.latestVersionId ? 'approved' : 'pending');
    const matchesStatus = productStatusFilter === 'all' || status === productStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.phoneNumber && u.phoneNumber.includes(userSearch));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredAuditLogs = auditLogs.filter(a => {
    const matchesSearch = a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (a.reason && a.reason.toLowerCase().includes(auditSearch.toLowerCase())) ||
                          (a.publicMessage && a.publicMessage.toLowerCase().includes(auditSearch.toLowerCase())) ||
                          (a.privateNote && a.privateNote.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesEntity = auditEntityFilter === 'all' || a.entityType === auditEntityFilter;
    return matchesSearch && matchesEntity;
  });

  // --- ACTIONS ---

  // Vendor Actions
  const handleExecuteVendorAction = () => {
    if (!selectedVendor || !vendorActionType) return;

    try {
      if (vendorActionType === 'approve') {
        storageService.approveVendor(selectedVendor.id, vendorPrivateNote);
        onShowToast('success', 'Vendor Approved', `'${selectedVendor.displayName}' has been published to the marketplace.`);
      } else if (vendorActionType === 'reject') {
        if (!vendorReason.trim()) {
          onShowToast('warning', 'Reason Required', 'You must provide a reason for rejecting vendor applications.');
          return;
        }
        storageService.rejectVendor(selectedVendor.id, vendorReason, vendorPrivateNote);
        onShowToast('warning', 'Vendor Application Rejected', `Rejection notice logged and sent to ${selectedVendor.displayName}.`);
      } else if (vendorActionType === 'suspend') {
        if (!vendorReason.trim()) {
          onShowToast('warning', 'Reason Required', 'You must specify a sensitive action reason for vendor suspension.');
          return;
        }
        storageService.suspendVendor(selectedVendor.id, vendorReason, vendorPrivateNote);
        onShowToast('warning', 'Vendor Suspended', `'${selectedVendor.displayName}' storefront is now suspended.`);
      } else if (vendorActionType === 'reapprove') {
        if (!vendorReason.trim()) {
          onShowToast('warning', 'Reason Required', 'You must state a reason for vendor account re-approval.');
          return;
        }
        storageService.reapproveVendor(selectedVendor.id, vendorReason, vendorPrivateNote);
        onShowToast('success', 'Vendor Reapproved', `'${selectedVendor.displayName}' account is reinstated.`);
      }

      setVendorActionType(null);
      setSelectedVendor(null);
      setVendorReason('');
      setVendorPrivateNote('');
    } catch (err: any) {
      onShowToast('warning', 'Action Failed', err.message || 'Operation failed');
    }
  };

  // Product Actions
  const handleExecuteProductAction = () => {
    if (!selectedProduct || !productActionType) return;

    try {
      if (productActionType === 'approve') {
        storageService.approveProduct(selectedProduct.id, productPrivateNote);
        onShowToast('success', 'Product Approved', `'${selectedProduct.title}' is now live in the catalog.`);
      } else if (productActionType === 'reject') {
        if (!productReason.trim()) {
          onShowToast('warning', 'Reason Required', 'A rejection reason is strictly required.');
          return;
        }
        storageService.rejectProduct(selectedProduct.id, productReason, productPrivateNote);
        onShowToast('warning', 'Product Rejected', `Rejection notice logged for '${selectedProduct.title}'.`);
      } else if (productActionType === 'request_changes') {
        if (!productReason.trim()) {
          onShowToast('warning', 'Reason Required', 'Specify requested changes for the artisan.');
          return;
        }
        storageService.requestProductChanges(selectedProduct.id, productReason, productPrivateNote);
        onShowToast('info', 'Changes Requested', `Revision request sent to artisan for '${selectedProduct.title}'.`);
      }

      setProductActionType(null);
      setSelectedProduct(null);
      setProductReason('');
      setProductPrivateNote('');
    } catch (err: any) {
      onShowToast('warning', 'Action Failed', err.message);
    }
  };

  // User Actions
  const handleExecuteUserAction = () => {
    if (!selectedUser || !userActionType) return;

    try {
      if (userActionType === 'ban') {
        if (!userReason.trim()) {
          onShowToast('warning', 'Reason Required', 'You must enter a reason to suspend/ban a user.');
          return;
        }
        storageService.banUser(selectedUser.id, userReason, userPrivateNote);
        onShowToast('warning', 'User Suspended', `Account for ${selectedUser.name} has been banned.`);
      } else if (userActionType === 'unban') {
        if (!userReason.trim()) {
          onShowToast('warning', 'Reason Required', 'Enter a reason for lifting the account ban.');
          return;
        }
        storageService.unbanUser(selectedUser.id, userReason, userPrivateNote);
        onShowToast('success', 'User Reinstated', `Ban lifted for ${selectedUser.name}.`);
      } else if (userActionType === 'trust_adjust') {
        if (!userReason.trim()) {
          onShowToast('warning', 'Reason Required', 'Provide an audit reason for adjusting user trust score.');
          return;
        }
        storageService.adjustTrustScore(selectedUser.id, userTrustDelta, userReason);
        onShowToast('success', 'Trust Adjusted', `Trust score updated by ${userTrustDelta > 0 ? '+' : ''}${userTrustDelta}.`);
      } else if (userActionType === 'cod_override') {
        if (!userReason.trim()) {
          onShowToast('warning', 'Reason Required', 'Specify reason for overriding Cash on Delivery eligibility.');
          return;
        }
        storageService.toggleCodEligibilityOverride(selectedUser.id, userCodOverride, userReason);
        onShowToast('info', 'COD Eligibility Updated', `COD override set to ${userCodOverride ? 'Enabled' : 'Disabled'}.`);
      } else if (userActionType === 'impersonate') {
        if (!userReason.trim()) {
          onShowToast('warning', 'Reason Required', 'Admin impersonation of a user requires a mandatory audit reason.');
          return;
        }
        storageService.addAuditLog('admin_impersonation', userReason, 'impersonation', selectedUser.id, {
          publicMessage: `Master Admin impersonated user '${selectedUser.email}'`,
          privateNote: userPrivateNote,
          impersonatedUserId: selectedUser.id
        });
        onShowToast('info', 'Admin Impersonation Logged', `Audit log recorded for inspecting session as '${selectedUser.email}'.`);
      }

      setUserActionType(null);
      setSelectedUser(null);
      setUserReason('');
      setUserPrivateNote('');
    } catch (err: any) {
      onShowToast('warning', 'Action Failed', err.message);
    }
  };

  // Admin Note Submission
  const handleAddAdminNote = (entityType: AdminNote['entityType'], entityId: string) => {
    if (!newAdminNoteText.trim()) return;
    storageService.addAdminNote(entityType, entityId, newAdminNoteText.trim());
    onShowToast('success', 'Admin Note Added', 'Internal note recorded securely.');
    setNewAdminNoteText('');
  };

  // Generate Settlement Batch
  const handleGenerateSettlementBatch = () => {
    const batch = storageService.generateSettlementBatch(settlementStart, settlementEnd);
    onShowToast('success', 'Settlement Batch Generated', `Generated ${batch.length} vendor settlement statements for review.`);
    setShowBatchModal(false);
  };

  // Coupon Creation
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDescription.trim()) return;

    try {
      CouponService.createCoupon({
        code: newCode.toUpperCase().trim(),
        description: newDescription,
        status: 'active',
        type: 'platform',
        vendorProfileId: null,
        rules: {
          discount: {
            type: newDiscountType,
            value: newDiscountType === 'percentage' ? newDiscountValue : newDiscountValue * 100
          },
          conditions: {
            min_order_amount: newMinOrderBdt ? newMinOrderBdt * 100 : undefined
          }
        },
        usageLimit: null,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdByUserId: currentUser.id
      }, currentUser.id);

      onShowToast('success', 'Coupon Created', `Promotion '${newCode.toUpperCase()}' is now active.`);
      setShowAddCouponModal(false);
      setNewCode('');
      setNewDescription('');
    } catch (err: any) {
      onShowToast('warning', 'Creation Failed', err.message);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-8 border-b border-[#E5E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E2D9]">
          <div>
            <div className="flex items-center gap-2 text-[#8B4513] text-[10px] font-bold uppercase tracking-[0.2em]">
              <ShieldCheck className="w-4 h-4 text-[#8B4513]" />
              Platform Moderation & Administrative Command Center
            </div>
            <h1 className="text-3xl font-serif italic font-bold text-[#1A1A1A] mt-1">
              Marketplace Command Center
            </h1>
            <p className="text-xs text-[#5C5A52] mt-0.5">
              Logged in as Master Administrator ({currentUser.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Immutable Audit Engine Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-[#E5E2D9] text-xs">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Sliders },
            { id: 'vendors', label: `Vendor Queue (${pendingVendors.length})`, icon: Store },
            { id: 'products', label: `Product Moderation (${pendingProducts.length})`, icon: Package },
            { id: 'users', label: 'User Directory & Risk', icon: Users },
            { id: 'settlements', label: 'Settlement Batches', icon: CreditCard },
            { id: 'coupons', label: 'Promotions Engine', icon: Tag },
            { id: 'audit', label: 'Audit Log Viewer', icon: FileText },
            { id: 'qa', label: 'Phase 15 QA & Launch', icon: ShieldCheck },
            { id: 'scaling', label: 'Phase 16 Post-Launch & Architecture', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white border border-[#E5E2D9] text-[#5C5A52] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-[#E5E2D9] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8C82]">Active Vendor Stores</p>
                <p className="text-3xl font-serif font-bold text-[#1A1A1A]">{approvedVendorCount} / {totalVendorCount}</p>
                <p className="text-[11px] text-amber-700 font-semibold">{pendingVendors.length} applications pending approval</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5E2D9] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8C82]">Catalog Items</p>
                <p className="text-3xl font-serif font-bold text-[#1A1A1A]">{products.length}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">{pendingProducts.length} pending moderation review</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5E2D9] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8C82]">Total GMV Executed</p>
                <p className="text-3xl font-serif font-bold text-[#8B4513]">৳32,450</p>
                <p className="text-[11px] text-[#5C5A52]">10% Platform Commission Model</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E5E2D9] space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8C82]">User Accounts</p>
                <p className="text-3xl font-serif font-bold text-[#1A1A1A]">{users.length}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">Average Buyer Trust: 85/100</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1A1A1A] text-white p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B4513]">Vendor Moderation</p>
                  <Store className="w-4 h-4 text-[#8B4513]" />
                </div>
                <h3 className="font-serif italic text-xl font-bold">Vendor Queue Review</h3>
                <p className="text-xs text-[#9E9C96]">
                  {pendingVendors.length > 0 
                    ? `${pendingVendors.length} vendor applications are awaiting document & workshop verification.` 
                    : 'All vendor applications are currently reviewed and up to date.'}
                </p>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="bg-[#8B4513] hover:bg-[#72370f] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Inspect Vendor Queue
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E2D9] space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B4513]">Product Quality</p>
                  <Package className="w-4 h-4 text-[#8B4513]" />
                </div>
                <h3 className="font-serif italic text-xl font-bold text-[#1A1A1A]">Product Catalog Queue</h3>
                <p className="text-xs text-[#5C5A52]">
                  {pendingProducts.length > 0
                    ? `${pendingProducts.length} new product submissions or revisions require version approval.`
                    : 'No pending product submissions in moderation queue.'}
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Review Products
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E2D9] space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B4513]">Payouts Engine</p>
                  <CreditCard className="w-4 h-4 text-[#8B4513]" />
                </div>
                <h3 className="font-serif italic text-xl font-bold text-[#1A1A1A]">Bi-Weekly Settlements</h3>
                <p className="text-xs text-[#5C5A52]">
                  Generate automated bi-weekly settlement statements, review line items, and mark payouts as paid.
                </p>
                <button
                  onClick={() => setActiveTab('settlements')}
                  className="border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Manage Settlements
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VENDOR MANAGEMENT */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">Vendor Management & Queue</h2>
                <p className="text-xs text-[#5C5A52]">Verify trade licenses, workshop credentials, and enforce lifecycle status rules.</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C82]" />
                  <input
                    type="text"
                    placeholder="Search vendor name, specialty, workshop..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                  />
                </div>

                <select
                  value={vendorStatusFilter}
                  onChange={(e) => setVendorStatusFilter(e.target.value)}
                  className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] overflow-hidden divide-y divide-[#E5E2D9]">
              {filteredVendors.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8E8C82]">No vendor profiles match the selected criteria.</div>
              ) : (
                filteredVendors.map(vendor => (
                  <div key={vendor.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#FAF9F6] transition-colors">
                    <div className="flex items-start gap-4">
                      <img
                        src={vendor.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'}
                        alt={vendor.displayName}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E5E2D9]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-[#1A1A1A]">{vendor.displayName}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            vendor.status === 'approved' ? 'bg-emerald-100 text-emerald-900' :
                            vendor.status === 'suspended' ? 'bg-rose-100 text-rose-900' :
                            vendor.status === 'rejected' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                          }`}>
                            {vendor.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B4513] font-semibold">{vendor.craftSpecialty}</p>
                        <p className="text-xs text-[#5C5A52] mt-1">{vendor.description}</p>
                        <p className="text-[11px] text-[#8E8C82] mt-1">
                          Workshop: {vendor.workshopLocation} • Contact: {vendor.supportEmail} • Submitted: {vendor.submittedAt ? new Date(vendor.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details & Notes
                      </button>

                      {vendor.status !== 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setVendorActionType('approve');
                          }}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}

                      {vendor.status !== 'rejected' && vendor.status !== 'suspended' && (
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setVendorActionType('reject');
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}

                      {vendor.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setVendorActionType('suspend');
                          }}
                          className="bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}

                      {vendor.status === 'suspended' && (
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setVendorActionType('reapprove');
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Re-Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT MODERATION */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">Product Review & Moderation Queue</h2>
                <p className="text-xs text-[#5C5A52]">Review imagery, descriptions, prices, variants, and materials for catalog safety.</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C82]" />
                  <input
                    type="text"
                    placeholder="Search product title or vendor..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                  />
                </div>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                >
                  <option value="all">All Products</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map(prod => {
                const isPending = prod.status === 'pending' || prod.currentVersionId !== prod.latestVersionId;
                return (
                  <div key={prod.id} className="bg-white rounded-2xl border border-[#E5E2D9] p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="relative">
                        <img src={prod.images[0]} alt={prod.title} className="w-full h-40 object-cover rounded-xl border border-[#E5E2D9]" />
                        <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          prod.status === 'approved' ? 'bg-emerald-900 text-white' :
                          prod.status === 'rejected' ? 'bg-rose-900 text-white' : 'bg-amber-600 text-white animate-pulse'
                        }`}>
                          {prod.status || (isPending ? 'Pending Review' : 'Approved')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B4513]">{prod.vendorName}</p>
                      <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">{prod.title}</h3>
                      <p className="text-xs text-[#5C5A52] line-clamp-2">{prod.description}</p>
                      <div className="flex flex-wrap gap-1 text-[10px] text-[#8E8C82]">
                        <span>Materials: {prod.materialsUsed.join(', ')}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5E2D9] flex items-center justify-between">
                      <span className="font-serif font-bold text-sm">৳{Math.round(prod.priceCents / 100).toLocaleString()}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedProduct(prod)}
                          className="px-2.5 py-1.5 border border-[#E5E2D9] hover:bg-[#FAF9F6] rounded-lg text-[10px] font-bold uppercase text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setProductActionType('approve');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: USER DIRECTORY & RISK */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">User Directory & Risk Management</h2>
                <p className="text-xs text-[#5C5A52]">Search platform accounts, manage trust scores, override Cash on Delivery, and execute audit actions.</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C82]" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Buyer (User)</option>
                  <option value="vendor_user">Vendor User</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] overflow-hidden divide-y divide-[#E5E2D9]">
              {filteredUsers.map(usr => {
                const trustProfile = storageService.getTrustProfiles().find(t => t.userId === usr.id);
                return (
                  <div key={usr.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#FAF9F6]">
                    <div className="flex items-center gap-4">
                      <img
                        src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                        alt={usr.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E5E2D9]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">{usr.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[9px] font-bold uppercase tracking-wider text-stone-800">
                            {usr.role}
                          </span>
                          {usr.isBanned && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[9px] font-bold uppercase">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5C5A52]">{usr.email} • Phone: {usr.phoneNumber || 'N/A'}</p>
                        <p className="text-[10px] text-[#8E8C82] mt-0.5">
                          Trust Score: <strong className="text-[#8B4513]">{trustProfile?.score || 50}/100</strong> • COD Eligible: {trustProfile?.codEligible || usr.codEligibilityOverride ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedUser(usr)}
                        className="px-3 py-1.5 border border-[#E5E2D9] hover:bg-stone-100 rounded-lg text-[10px] font-bold uppercase text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        User Profile & Risk
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(usr);
                          setUserActionType('trust_adjust');
                        }}
                        className="px-3 py-1.5 bg-[#8B4513] hover:bg-[#72370f] text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Adjust Score
                      </button>

                      {!usr.isBanned ? (
                        <button
                          onClick={() => {
                            setSelectedUser(usr);
                            setUserActionType('ban');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ban User
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(usr);
                            setUserActionType('unban');
                          }}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Lift Ban
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: SETTLEMENT BATCHES */}
        {activeTab === 'settlements' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">Bi-Weekly Settlement Engine</h2>
                <p className="text-xs text-[#5C5A52]">Batch generate settlement line items per vendor, review 10% platform commission, and dispatch payout approval.</p>
              </div>

              <button
                onClick={() => setShowBatchModal(true)}
                className="bg-[#8B4513] hover:bg-[#72370f] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate New Settlement Batch
              </button>
            </div>

            <div className="space-y-4">
              {settlements.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#E5E2D9] text-center text-xs text-[#8E8C82]">
                  No settlement records found. Click 'Generate New Settlement Batch' above.
                </div>
              ) : (
                settlements.map(set => (
                  <div key={set.id} className="bg-white p-5 rounded-2xl border border-[#E5E2D9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-base text-[#1A1A1A]">{set.vendorName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          set.status === 'paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {set.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E8C82] mt-0.5">
                        Period: {new Date(set.periodStart).toLocaleDateString()} to {new Date(set.periodEnd).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-[#5C5A52] mt-1">
                        Gross Sales: ৳{(set.grossAmountCents / 100).toLocaleString()} • Commission (10%): -৳{(set.commissionCents / 100).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E8C82] uppercase block font-bold">Net Vendor Payout</span>
                        <span className="font-serif font-bold text-lg text-[#8B4513]">৳{(set.netAmountCents / 100).toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => setSelectedSettlement(set)}
                        className="px-3.5 py-2 border border-[#E5E2D9] hover:bg-stone-100 rounded-xl text-[10px] font-bold uppercase text-[#1A1A1A] cursor-pointer"
                      >
                        Review Line Items
                      </button>

                      {set.status !== 'paid' && (
                        <button
                          onClick={() => {
                            storageService.approveSettlement(set.id);
                            onShowToast('success', 'Settlement Paid', `Dispatched net payout of ৳${(set.netAmountCents / 100).toLocaleString()} to ${set.vendorName}`);
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          Approve Payout
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">Promotional Coupons & Rules Engine</h2>
                <p className="text-xs text-[#5C5A52]">Configure JSONB coupon rules, percentage discounts, minimum order criteria, and usages.</p>
              </div>

              <button
                onClick={() => setShowAddCouponModal(true)}
                className="bg-[#8B4513] hover:bg-[#72370f] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {coupons.map(cpn => (
                <div key={cpn.id} className="bg-white p-5 rounded-2xl border border-[#E5E2D9] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold bg-[#1A1A1A] text-white px-3 py-1 rounded-lg">
                      {cpn.code}
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {cpn.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5A52] font-medium">{cpn.description}</p>
                  <div className="pt-2 border-t border-[#E5E2D9] text-[11px] text-[#8E8C82] space-y-1">
                    <p>
                      Type: <strong className="text-[#1A1A1A] uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">{cpn.type}</strong>
                    </p>
                    <p>
                      Discount: <strong className="text-[#1A1A1A]">
                        {cpn.rules.discount.type === 'percentage' 
                          ? `${cpn.rules.discount.value}% OFF` 
                          : `৳${(cpn.rules.discount.value / 100).toLocaleString()} OFF`}
                      </strong>
                    </p>
                    {cpn.rules.conditions?.min_order_amount && (
                      <p>Min Order: ৳{(cpn.rules.conditions.min_order_amount / 100).toLocaleString()}</p>
                    )}
                    {cpn.rules.conditions?.max_discount_cap && (
                      <p>Max Cap: ৳{(cpn.rules.conditions.max_discount_cap / 100).toLocaleString()}</p>
                    )}
                    {cpn.rules.conditions?.first_order_only && (
                      <p className="text-amber-800 font-semibold">★ First Order Only</p>
                    )}
                    <p>Usage: <strong className="text-[#1A1A1A]">{cpn.usageCount}</strong> {cpn.usageLimit ? `/ ${cpn.usageLimit}` : 'redemptions'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: IMMUTABLE AUDIT LOG VIEWER */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">Immutable Platform Audit Trail Log</h2>
                <p className="text-xs text-[#5C5A52]">Searchable, non-deletable append-only ledger recording sensitive admin decisions, reason fields, and actor IP logs.</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8C82]" />
                  <input
                    type="text"
                    placeholder="Search audit action, reason, actor..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                  />
                </div>

                <select
                  value={auditEntityFilter}
                  onChange={(e) => setAuditEntityFilter(e.target.value)}
                  className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                >
                  <option value="all">All Entity Types</option>
                  <option value="vendor">Vendor</option>
                  <option value="product">Product</option>
                  <option value="user">User</option>
                  <option value="settlement">Settlement</option>
                  <option value="trust">Trust System</option>
                  <option value="order">Order</option>
                  <option value="impersonation">Impersonation</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] overflow-hidden">
              <div className="p-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest grid grid-cols-12 gap-2">
                <span className="col-span-2">Timestamp</span>
                <span className="col-span-2">Action</span>
                <span className="col-span-2">Entity & ID</span>
                <span className="col-span-4">Audit Justification & Notes</span>
                <span className="col-span-2 text-right">Actor & IP</span>
              </div>
              <div className="divide-y divide-[#E5E2D9] text-xs">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8E8C82]">No audit records match the selected filter.</div>
                ) : (
                  filteredAuditLogs.map(log => (
                    <div key={log.id} className="p-4 grid grid-cols-12 gap-2 items-start hover:bg-[#FAF9F6]">
                      <span className="col-span-2 text-[#8E8C82] font-mono text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                      <span className="col-span-2 font-bold text-[#8B4513] uppercase text-[10px]">{log.action}</span>
                      <span className="col-span-2 font-mono text-[11px] text-[#5C5A52]">{log.entityType}:{log.entityId.slice(0, 8)}</span>
                      <div className="col-span-4 space-y-1">
                        <p className="text-[#1A1A1A] font-medium">{log.reason || log.publicMessage}</p>
                        {log.privateNote && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-mono">
                            Internal Note: {log.privateNote}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-[10px] text-[#8E8C82]">
                        <p className="font-bold text-[#1A1A1A]">{log.actorRole.toUpperCase()}</p>
                        <p className="font-mono">{log.ipAddress || '127.0.0.1'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: PHASE 15 QA & LAUNCH */}
        {activeTab === 'qa' && (
          <LaunchQADashboard onShowToast={onShowToast} />
        )}

        {/* TAB 9: PHASE 16 POST-LAUNCH SCALING & ARCHITECTURE */}
        {activeTab === 'scaling' && (
          <Phase16ScalingDashboard onShowToast={onShowToast} />
        )}

      </div>

      {/* VENDOR DETAIL & ACTION MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2D9] pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedVendor.avatarUrl} alt={selectedVendor.displayName} className="w-12 h-12 rounded-xl object-cover border border-[#E5E2D9]" />
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#1A1A1A]">{selectedVendor.displayName}</h3>
                  <p className="text-xs text-[#8B4513] font-semibold">{selectedVendor.craftSpecialty} • {selectedVendor.workshopLocation}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedVendor(null); setVendorActionType(null); }} className="text-[#8E8C82] hover:text-[#1A1A1A] cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8E8C82] block">Current Status</span>
                  <span className="font-bold uppercase text-[#8B4513]">{selectedVendor.status}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8E8C82] block">Support Contact</span>
                  <span>{selectedVendor.supportEmail} • {selectedVendor.supportPhone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-1">Artisan Story & Application</h4>
                <p className="text-[#5C5A52] bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E2D9]">{selectedVendor.description}</p>
              </div>

              {/* Status History Events */}
              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8B4513]" />
                  Vendor Status Event History
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {storageService.getVendorStatusEvents(selectedVendor.id).length === 0 ? (
                    <p className="text-[11px] text-[#8E8C82] italic">No prior status transition events logged.</p>
                  ) : (
                    storageService.getVendorStatusEvents(selectedVendor.id).map(evt => (
                      <div key={evt.id} className="p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-lg flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{evt.previousStatus} &rarr; {evt.newStatus}</p>
                          <p className="text-[#5C5A52]">{evt.reason}</p>
                        </div>
                        <span className="text-[10px] text-[#8E8C82] font-mono">{new Date(evt.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#8B4513]" />
                  Internal Admin Notes (Never exposed to Vendor)
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                  {storageService.getAdminNotes('vendor', selectedVendor.id).map(n => (
                    <div key={n.id} className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[11px]">
                      <p className="text-[#1A1A1A] font-medium">{n.note}</p>
                      <p className="text-[9px] text-amber-800 font-mono mt-0.5">By {n.adminEmail} • {new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add private internal note on vendor..."
                    value={newAdminNoteText}
                    onChange={(e) => setNewAdminNoteText(e.target.value)}
                    className="flex-1 p-2 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                  />
                  <button
                    onClick={() => handleAddAdminNote('vendor', selectedVendor.id)}
                    className="px-3 py-2 bg-[#1A1A1A] text-white font-bold rounded-xl text-[10px] uppercase cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Action Form inputs if an action button was selected */}
              {vendorActionType && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 pt-3">
                  <h4 className="font-bold text-[#1A1A1A] uppercase text-[10px] tracking-wider">
                    Confirm Action: {vendorActionType.toUpperCase()}
                  </h4>

                  {vendorActionType !== 'approve' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">
                        Reason for {vendorActionType} (Strictly Required) *
                      </label>
                      <input
                        type="text"
                        value={vendorReason}
                        onChange={(e) => setVendorReason(e.target.value)}
                        placeholder="e.g. Unverified trade license or workshop address discrepancy"
                        className="w-full p-2.5 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">
                      Private Admin Note (Internal Audit Only)
                    </label>
                    <input
                      type="text"
                      value={vendorPrivateNote}
                      onChange={(e) => setVendorPrivateNote(e.target.value)}
                      placeholder="e.g. Verified via local district administration call"
                      className="w-full p-2.5 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setVendorActionType(null)}
                      className="px-3 py-1.5 border border-[#E5E2D9] rounded-lg text-xs font-bold text-[#5C5A52]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteVendorAction}
                      className="px-4 py-1.5 bg-[#8B4513] text-white rounded-lg text-xs font-bold uppercase"
                    >
                      Confirm {vendorActionType}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL & MODERATION MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2D9] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#8B4513]">{selectedProduct.vendorName}</span>
                <h3 className="font-serif font-bold text-xl text-[#1A1A1A]">{selectedProduct.title}</h3>
              </div>
              <button onClick={() => { setSelectedProduct(null); setProductActionType(null); }} className="text-[#8E8C82] hover:text-[#1A1A1A] cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <img src={selectedProduct.images[0]} alt={selectedProduct.title} className="w-full h-48 object-cover rounded-xl border border-[#E5E2D9]" />
                <div className="space-y-2 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9]">
                  <p><strong>Price:</strong> ৳{Math.round(selectedProduct.priceCents / 100).toLocaleString()}</p>
                  <p><strong>Stock Quantity:</strong> {selectedProduct.inStockQuantity} units</p>
                  <p><strong>Category:</strong> {selectedProduct.category}</p>
                  <p><strong>Materials:</strong> {selectedProduct.materialsUsed.join(', ')}</p>
                  <p><strong>Craft Time:</strong> {selectedProduct.craftTimeDays} Days</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#1A1A1A] mb-1">Product Description</h4>
                <p className="text-[#5C5A52] bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E2D9]">{selectedProduct.description}</p>
              </div>

              {/* Action options */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider">Moderation Decision</h4>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setProductActionType('approve')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                      productActionType === 'approve' ? 'bg-emerald-800 text-white' : 'bg-white border border-[#E5E2D9] text-[#1A1A1A]'
                    }`}
                  >
                    Approve & Publish
                  </button>

                  <button
                    onClick={() => setProductActionType('request_changes')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                      productActionType === 'request_changes' ? 'bg-amber-700 text-white' : 'bg-white border border-[#E5E2D9] text-[#1A1A1A]'
                    }`}
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => setProductActionType('reject')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                      productActionType === 'reject' ? 'bg-rose-800 text-white' : 'bg-white border border-[#E5E2D9] text-[#1A1A1A]'
                    }`}
                  >
                    Reject Product
                  </button>
                </div>

                {productActionType && (
                  <div className="space-y-2 pt-2">
                    {productActionType !== 'approve' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">
                          Reason / Feedback for Seller (Strictly Required) *
                        </label>
                        <input
                          type="text"
                          value={productReason}
                          onChange={(e) => setProductReason(e.target.value)}
                          placeholder="e.g. Image resolution insufficient or misleading materials claim"
                          className="w-full p-2.5 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">
                        Private Admin Note (Internal Audit Only)
                      </label>
                      <input
                        type="text"
                        value={productPrivateNote}
                        onChange={(e) => setProductPrivateNote(e.target.value)}
                        placeholder="Internal quality check note..."
                        className="w-full p-2.5 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={handleExecuteProductAction}
                        className="px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                      >
                        Submit {productActionType.replace('_', ' ')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL & ACTION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2D9] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">{selectedUser.name}</h3>
                <p className="text-xs text-[#5C5A52]">{selectedUser.email} • Role: {selectedUser.role}</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setUserActionType(null); }} className="text-[#8E8C82] hover:text-[#1A1A1A] cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9] space-y-2">
                <p><strong>Account ID:</strong> <span className="font-mono">{selectedUser.id}</span></p>
                <p><strong>Phone:</strong> {selectedUser.phoneNumber || 'Not provided'} ({selectedUser.phoneNumberVerified ? 'Verified' : 'Unverified'})</p>
                <p><strong>COD Override:</strong> {selectedUser.codEligibilityOverride ? 'Enabled (Overridden)' : 'Default Score Rules'}</p>
                <p><strong>Account Status:</strong> {selectedUser.isBanned ? `Banned (${selectedUser.banReason})` : 'Active'}</p>
              </div>

              {/* Action selection */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h4 className="font-bold text-[#1A1A1A] uppercase text-[10px] tracking-wider">Select User Action</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUserActionType('trust_adjust')}
                    className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Adjust Trust Score
                  </button>

                  <button
                    onClick={() => setUserActionType('cod_override')}
                    className="p-2 bg-white border border-[#E5E2D9] rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                  >
                    COD Eligibility Override
                  </button>

                  <button
                    onClick={() => setUserActionType('impersonate')}
                    className="p-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Admin Impersonation
                  </button>

                  {!selectedUser.isBanned ? (
                    <button
                      onClick={() => setUserActionType('ban')}
                      className="p-2 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Ban User
                    </button>
                  ) : (
                    <button
                      onClick={() => setUserActionType('unban')}
                      className="p-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Lift Ban
                    </button>
                  )}
                </div>

                {userActionType && (
                  <div className="space-y-3 pt-2">
                    <h5 className="font-bold uppercase text-[10px] text-[#8B4513]">Executing: {userActionType.toUpperCase()}</h5>

                    {userActionType === 'trust_adjust' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Points Delta (+ / -)</label>
                        <select
                          value={userTrustDelta}
                          onChange={(e) => setUserTrustDelta(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs"
                        >
                          <option value={15}>+15 Points (Verified Identity)</option>
                          <option value={10}>+10 Points (Successful Order)</option>
                          <option value={-15}>-15 Points (COD Refusal / Unclaimed Courier)</option>
                          <option value={-25}>-25 Points (Fraud Flag / Policy Violation)</option>
                        </select>
                      </div>
                    )}

                    {userActionType === 'cod_override' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">COD Eligibility Override</label>
                        <select
                          value={userCodOverride ? 'true' : 'false'}
                          onChange={(e) => setUserCodOverride(e.target.value === 'true')}
                          className="w-full p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs"
                        >
                          <option value="true">Enable COD (Bypass Trust Score Limit)</option>
                          <option value="false">Disable COD Override</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Audit Reason (Strictly Required) *</label>
                      <input
                        type="text"
                        value={userReason}
                        onChange={(e) => setUserReason(e.target.value)}
                        placeholder="Reason for audit log ledger..."
                        className="w-full p-2 bg-white border border-[#E5E2D9] rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleExecuteUserAction}
                        className="px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                      >
                        Submit Action
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTLEMENT BATCH MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Generate Settlement Batch</h3>
            <p className="text-xs text-[#5C5A52]">
              Select period dates to calculate 10% platform commission and generate net payout statements for active vendors.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Period Start Date</label>
                <input
                  type="date"
                  value={settlementStart}
                  onChange={(e) => setSettlementStart(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Period End Date</label>
                <input
                  type="date"
                  value={settlementEnd}
                  onChange={(e) => setSettlementEnd(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 border border-[#E5E2D9] rounded-xl text-xs font-bold uppercase text-[#5C5A52]"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSettlementBatch}
                className="px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Generate Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLEMENT LINE ITEMS REVIEW MODAL */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-[#E5E2D9] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Settlement Line Items</h3>
                <p className="text-xs text-[#8E8C82]">{selectedSettlement.vendorName} • ID: {selectedSettlement.id}</p>
              </div>
              <button onClick={() => setSelectedSettlement(null)} className="text-[#8E8C82] hover:text-[#1A1A1A] cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E2D9] space-y-1">
                <p>Gross Sales: ৳{(selectedSettlement.grossAmountCents / 100).toLocaleString()}</p>
                <p>Platform Commission (10%): -৳{(selectedSettlement.commissionCents / 100).toLocaleString()}</p>
                <p className="font-bold text-[#8B4513]">Net Payout: ৳{(selectedSettlement.netAmountCents / 100).toLocaleString()}</p>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedSettlement.items?.map(item => (
                  <div key={item.id} className="p-2 bg-stone-50 border border-stone-200 rounded-lg flex justify-between items-center text-[11px]">
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{item.note}</p>
                      <p className="text-[10px] text-[#8E8C82]">Type: {item.lineType}</p>
                    </div>
                    <span className="font-bold text-[#8B4513]">৳{(item.amountCents / 100).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#8E8C82] italic">
                Protection policy: Settlement statements cannot be altered or deleted once approved and paid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">Create Rules Engine Coupon</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. CRAFT2026"
                  required
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. 15% Off Handcrafted Heritage Ceramics"
                  required
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Value</label>
                  <input
                    type="number"
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8E8C82] block mb-1">Minimum Order Amount (৳ BDT)</label>
                <input
                  type="number"
                  value={newMinOrderBdt}
                  onChange={(e) => setNewMinOrderBdt(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCouponModal(false)}
                className="px-4 py-2 border border-[#E5E2D9] rounded-xl text-xs font-bold uppercase text-[#5C5A52]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
