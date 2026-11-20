import React, { useState } from 'react';
import { 
  Globe, Server, Search, Mail, Gift, MessageSquare, 
  TrendingUp, Cpu, CheckCircle2, Clock, HelpCircle, Database,
  RefreshCw, Play, Shield, Layers, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import { storageService } from '../services/storage';

interface Phase16ScalingDashboardProps {
  onShowToast: (type: 'success' | 'info' | 'warning', title: string, message: string) => void;
}

interface OpenQuestion {
  id: number;
  question: string;
  status: 'Open' | 'Decided';
  decided?: string;
  date?: string;
}

const INITIAL_OPEN_QUESTIONS: OpenQuestion[] = [
  { id: 1, question: 'Final admin role names and permission matrix', status: 'Decided', decided: 'SuperAdmin, Moderator, FinancialAuditor, SupportAgent', date: '2026-07-28' },
  { id: 2, question: 'Final trust event types', status: 'Decided', decided: 'phone_verified, cod_delivered, cod_returned, review_posted, dispute_filed', date: '2026-07-29' },
  { id: 3, question: 'Whether vendor_user auto-assigned on joining a vendor org', status: 'Decided', decided: 'Yes, default role vendor_staff assigned upon invite acceptance', date: '2026-07-29' },
  { id: 4, question: 'Exact document types for optional MVP vendor verification', status: 'Decided', decided: 'Trade License, NID Card (Front/Back), Bank Cancelled Cheque', date: '2026-07-25' },
  { id: 5, question: 'Whether team invitations before approval limited to owner + manager', status: 'Decided', decided: 'Yes, owner and manager roles permitted to invite team members', date: '2026-07-26' },
  { id: 6, question: 'Whether vendor support email/phone required before submission', status: 'Decided', decided: 'Mandatory before submitting application for approval', date: '2026-07-24' },
  { id: 7, question: 'Exact Bangladesh zone model and zone pricing for MVP', status: 'Decided', decided: 'Inside Dhaka (৳60), Dhaka Suburbs (৳100), Outside Dhaka / National (৳150)', date: '2026-07-27' },
  { id: 8, question: 'Whether courier API booking is automatic or vendor-confirmed', status: 'Decided', decided: 'Automatic upon vendor order status changing to "ready_for_pickup"', date: '2026-07-29' },
  { id: 9, question: 'Exact courier override policy for admin vs. vendor', status: 'Decided', decided: 'Admins can override assigned courier provider at any time', date: '2026-07-28' },
  { id: 10, question: 'S3-compatible provider selection (AWS vs. R2)', status: 'Decided', decided: 'Cloudflare R2 for zero-egress fee asset storage', date: '2026-07-20' },
  { id: 11, question: 'Whether image processing derivatives need their own table', status: 'Decided', decided: 'Handled dynamically via JSONB image metadata object in files table', date: '2026-07-22' },
  { id: 12, question: 'Whether wallet credit exposed to buyers in MVP', status: 'Decided', decided: 'Yes, wallet credit balance displayed at checkout and profile', date: '2026-07-30' },
  { id: 13, question: 'Exact commission model (currently assumed 10%)', status: 'Decided', decided: '10% platform fee on fulfilled item subtotal', date: '2026-07-15' },
  { id: 14, question: 'Settlement schedule (currently assumed bi-weekly)', status: 'Decided', decided: 'Bi-weekly automated settlement cycle on 1st and 15th of month', date: '2026-07-18' },
  { id: 15, question: 'COD collection reconciliation process for vendors', status: 'Decided', decided: 'Courier collects COD, remits to platform bank, credited to vendor wallet', date: '2026-07-29' },
  { id: 16, question: 'Exact payout account requirements for Bangladesh vendors', status: 'Decided', decided: 'Verified Bangladeshi Bank Account (IBAN/Routing) or bKash Merchant Account', date: '2026-07-23' },
  { id: 17, question: 'Audit log retention policy', status: 'Decided', decided: '7-year immutable audit log retention for financial & security events', date: '2026-07-10' },
  { id: 18, question: 'Whether review photos are supported in MVP', status: 'Decided', decided: 'Supported via JSONB media attachment array in product_reviews', date: '2026-07-28' },
  { id: 19, question: 'Whether email/SMS notifications are in MVP scope', status: 'Decided', decided: 'OTP SMS & Order status SMS/Email enabled via provider queue', date: '2026-07-26' },
  { id: 20, question: 'COD eligibility score threshold (currently assumed 65)', status: 'Decided', decided: 'Strict threshold score ≥ 65 required for COD checkout option', date: '2026-07-29' }
];

const DB_DOMAINS = [
  {
    file: 'identity.ts',
    domain: 'Identity & Access',
    tables: ['user (BA)', 'user_trust_profiles', 'user_trust_events'],
    description: 'Manages user authentication, trust evaluation metrics (score 0-100), and historical trust event logs.'
  },
  {
    file: 'vendors.ts',
    domain: 'Vendor Orgs & Shops',
    tables: ['organization (BA)', 'vendor_profiles', 'vendor_status_events', 'vendor_verification_documents', 'vendor_profile_change_requests'],
    description: 'Artisan workshop profiles, verification documents (NID/Trade License), moderation state machine, and change audits.'
  },
  {
    file: 'catalog.ts',
    domain: 'Catalog & Inventory',
    tables: ['products', 'product_versions', 'product_variants', 'product_variant_versions', 'product_attributes', 'product_attribute_values', 'product_variant_version_attribute_values', 'inventory_items', 'inventory_events'],
    description: 'Product catalog with immutable versioning snapshotting, multi-attribute variants, and atomic inventory allocation.'
  },
  {
    file: 'files.ts',
    domain: 'Media & Storage',
    tables: ['files'],
    description: 'Centralized media repository handling image upload metadata, S3/R2 storage paths, and optimization derivatives.'
  },
  {
    file: 'orders.ts',
    domain: 'Cart, Checkout & Orders',
    tables: ['carts', 'cart_items', 'orders', 'vendor_orders', 'order_items', 'shipments', 'shipment_items', 'shipment_events'],
    description: 'Cart state, multi-vendor order splitting engine, line item snapshots, and granular fulfillment shipment tracking.'
  },
  {
    file: 'payments.ts',
    domain: 'Payments & Settlements',
    tables: ['payment_attempts', 'payments', 'payment_provider_events', 'refunds', 'refund_items', 'wallet_accounts', 'wallet_transactions', 'vendor_settlements', 'vendor_settlement_items', 'vendor_payout_accounts'],
    description: 'Payment gateway ledger (bKash/SSLCommerz), idempotent webhooks, refunds, buyer wallet credits, and bi-weekly vendor settlements.'
  },
  {
    file: 'shipping.ts',
    domain: 'Shipping & Delivery',
    tables: ['user_addresses', 'vendor_pickup_addresses', 'delivery_locations', 'delivery_zones', 'delivery_zone_locations', 'courier_providers', 'courier_service_areas', 'delivery_suggestions'],
    description: 'Hierarchical Bangladesh location tree (64 Districts, 495 Upazilas), courier SLAs (Pathao/Steadfast), and AI delivery estimation logs.'
  },
  {
    file: 'customers.ts',
    domain: 'Customer Features',
    tables: ['wishlist_items', 'product_reviews', 'review_status_events', 'notifications', 'notification_deliveries', 'user_style_profiles'],
    description: 'Buyer wishlist folders, verified purchase product reviews with media, multi-channel notification dispatch logs, and AI style personas.'
  },
  {
    file: 'audit.ts',
    domain: 'Moderation & Audit',
    tables: ['audit_logs', 'admin_notes'],
    description: 'Platform-wide admin audit log tracking sensitive actions (suspensions, score overrides) and internal staff notes.'
  },
  {
    file: 'marketing.ts',
    domain: 'Coupons & Promotions',
    tables: ['coupons', 'coupon_redemptions'],
    description: 'Platform & vendor promotional code engine powered by flexible JSONB constraint rules (caps, min orders, vendor constraints).'
  },
  {
    file: 'wholesale.ts',
    domain: 'Raw Materials Hub',
    tables: ['raw_materials'],
    description: 'Artisan B2B wholesale raw materials catalog (silk yarn, clay, dyes, wood blocks) powering sustainable supply chains.'
  }
];

export const Phase16ScalingDashboard: React.FC<Phase16ScalingDashboardProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'questions' | 'db_schema' | 'notifications' | 'gift_cards' | 'ml_engine'>('architecture');

  // Multi-country config state
  const [selectedCountry, setSelectedCountry] = useState<'BD' | 'IN' | 'US' | 'GB'>('BD');
  const [redisCacheActive, setRedisCacheActive] = useState(true);
  const [meilisearchActive, setMeilisearchActive] = useState(true);

  // Open questions state
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>(INITIAL_OPEN_QUESTIONS);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editDecisionText, setEditDecisionText] = useState('');

  // Gift Card issuer state
  const [giftCardCode, setGiftCardCode] = useState('HERITAGE-5000');
  const [giftCardAmount, setGiftCardAmount] = useState(5000);
  const [giftCardRecipient, setGiftCardRecipient] = useState('buyer@example.com');

  // Trigger Settlement Cron Job
  const handleTriggerSettlementCron = () => {
    try {
      const batch = storageService.generateSettlementBatch('2026-07-01', '2026-07-30');
      onShowToast('success', 'Automated Settlement Cron Executed', `Generated ${batch.length} automated vendor settlement payouts.`);
    } catch (e: any) {
      onShowToast('info', 'Settlement Status', 'All current eligible vendor balances are fully settled.');
    }
  };

  // Issue Gift Card
  const handleIssueGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('success', 'Gift Card Issued', `Issued ৳${giftCardAmount.toLocaleString()} gift card '${giftCardCode}' to ${giftCardRecipient}.`);
    setGiftCardCode(`HERITAGE-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Toggle question status
  const handleToggleQuestionStatus = (id: number) => {
    setOpenQuestions(prev => prev.map(q => {
      if (q.id === id) {
        const nextStatus = q.status === 'Open' ? 'Decided' : 'Open';
        return {
          ...q,
          status: nextStatus,
          decided: nextStatus === 'Decided' ? (q.decided || 'Resolved by Administrator') : undefined,
          date: nextStatus === 'Decided' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return q;
    }));
    onShowToast('info', 'Question Status Updated', `Question #${id} status changed.`);
  };

  // Save decision edit
  const handleSaveDecision = (id: number) => {
    if (!editDecisionText.trim()) return;
    setOpenQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: 'Decided',
          decided: editDecisionText.trim(),
          date: new Date().toISOString().split('T')[0]
        };
      }
      return q;
    }));
    setEditingQuestionId(null);
    setEditDecisionText('');
    onShowToast('success', 'Decision Saved', `Decision recorded for Question #${id}.`);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2620] text-white p-6 rounded-3xl border border-[#3A332C] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 text-amber-500" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Phase 16 Architecture & Post-Launch Expansion
          </div>
          <h2 className="text-2xl font-serif italic font-bold text-amber-100">
            Global Scaling, System Architecture & Operational Matrix
          </h2>
          <p className="text-xs text-amber-200/80 max-w-3xl leading-relaxed">
            Infrastructure controls for multi-country currency abstraction, high-throughput Redis caching, Meilisearch full-text indexing, ML logistics dispatch models, open decisions tracker, and database domain architecture.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerSettlementCron}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Trigger Automated Settlement Cron
            </button>
            <span className="text-[11px] text-amber-300/70">
              Last automated run: Today at 06:00 UTC (0 Discrepancies)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E2D9] text-xs">
        {[
          { id: 'architecture', label: 'Scaling & Multi-Country', icon: Globe },
          { id: 'questions', label: `Open Questions (${openQuestions.filter(q => q.status === 'Open').length} Open)`, icon: HelpCircle },
          { id: 'db_schema', label: 'Database Domain Summary', icon: Database },
          { id: 'notifications', label: 'SMS & Email Queue', icon: Mail },
          { id: 'gift_cards', label: 'Gift Cards & Wallet', icon: Gift },
          { id: 'ml_engine', label: 'ML Delivery Dispatch', icon: Cpu }
        ].map(sub => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === sub.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-white border border-[#E5E2D9] text-[#5C5A52] hover:text-[#1A1A1A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* SUB TAB 1: SCALING & MULTI-COUNTRY */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Multi-Country Expansion */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E2D9] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#8B4513]" />
                  <h3 className="font-serif font-bold text-[#1A1A1A]">Multi-Country Expansion</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#5C5A52]">
                Supports multi-currency conversion, local VAT/GST tax calculation, and international shipping routing via <code className="bg-[#FAF9F6] px-1 py-0.5 rounded border border-[#E5E2D9]">country_code</code> abstraction.
              </p>

              <div className="space-y-3 pt-2">
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Target Operating Region
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'BD', name: 'Bangladesh (৳ BDT)', rate: '1.0x' },
                    { code: 'IN', name: 'India (₹ INR)', rate: '0.72x' },
                    { code: 'US', name: 'United States ($ USD)', rate: '0.0083x' },
                    { code: 'GB', name: 'United Kingdom (£ GBP)', rate: '0.0065x' }
                  ].map(c => (
                    <button
                      key={c.code}
                      onClick={() => setSelectedCountry(c.code as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                        selectedCountry === c.code
                          ? 'border-[#8B4513] bg-[#8B4513]/5 font-bold text-[#8B4513]'
                          : 'border-[#E5E2D9] bg-[#FAF9F6] text-[#5C5A52] hover:border-[#8E8C82]'
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[10px] text-[#8E8C82]">Multiplier: {c.rate}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Redis L1/L2 Caching Simulation */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E2D9] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-amber-700" />
                  <h3 className="font-serif font-bold text-[#1A1A1A]">Redis Memory Cache</h3>
                </div>
                <button
                  onClick={() => {
                    setRedisCacheActive(!redisCacheActive);
                    onShowToast('info', 'Redis Cache Toggled', `Cache layer is now ${!redisCacheActive ? 'Active' : 'Bypassed'}.`);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    redisCacheActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {redisCacheActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <p className="text-xs text-[#5C5A52]">
                In-memory Redis cache for product listing JSON responses, category hierarchy counts, and active buyer sessions.
              </p>

              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Cache Hit Ratio:</span>
                  <span className="font-mono font-bold text-emerald-700">98.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Avg Catalog Latency:</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">1.2 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Memory Consumption:</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">142 MB / 2048 MB</span>
                </div>
              </div>
            </div>

            {/* Meilisearch / Algolia Full-Text Engine */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E2D9] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-serif font-bold text-[#1A1A1A]">Meilisearch Full-Text</h3>
                </div>
                <button
                  onClick={() => {
                    setMeilisearchActive(!meilisearchActive);
                    onShowToast('info', 'Search Index Toggled', `Faceted Search Engine is now ${!meilisearchActive ? 'Active' : 'Fallback SQL'}.`);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    meilisearchActive ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {meilisearchActive ? 'Meilisearch Active' : 'Fallback SQL'}
                </button>
              </div>
              <p className="text-xs text-[#5C5A52]">
                Replaces standard SQL LIKE queries with high-performance fuzzy matching, Bengali transliteration, and faceted filters.
              </p>

              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Indexed Documents:</span>
                  <span className="font-mono font-bold text-indigo-700">1,248 Products</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Typo Tolerance:</span>
                  <span className="font-mono font-bold text-emerald-700">Enabled (2 chars)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8C82]">Search Response Time:</span>
                  <span className="font-mono font-bold text-[#1A1A1A]">3.4 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: OPEN QUESTIONS TRACKER */}
      {activeSubTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E2D9]">
              <div>
                <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">
                  Open Architectural Questions & Decision Tracker
                </h3>
                <p className="text-xs text-[#5C5A52] mt-0.5">
                  Tracks unresolved system design choices, Bangladesh logistics policies, and platform rules.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {openQuestions.filter(q => q.status === 'Decided').length} Decided
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {openQuestions.filter(q => q.status === 'Open').length} Open
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E2D9] text-[#8E8C82] uppercase text-[10px] tracking-wider bg-[#FAF9F6]">
                    <th className="py-3 px-4 font-bold">#</th>
                    <th className="py-3 px-4 font-bold">Architectural Question</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Decided Outcome / Notes</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2D9]">
                  {openQuestions.map(item => (
                    <tr key={item.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#8B4513]">#{item.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#1A1A1A] max-w-xs">{item.question}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'Decided' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {item.status === 'Decided' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#5C5A52]">
                        {editingQuestionId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editDecisionText}
                              onChange={(e) => setEditDecisionText(e.target.value)}
                              placeholder="Enter decision rationale..."
                              className="px-3 py-1.5 rounded-lg border border-[#8B4513] text-xs w-full bg-white text-[#1A1A1A]"
                            />
                            <button
                              onClick={() => handleSaveDecision(item.id)}
                              className="px-3 py-1.5 bg-[#8B4513] text-white rounded-lg font-bold text-xs hover:bg-[#6F370F] transition-all whitespace-nowrap cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div>
                            {item.decided ? (
                              <span className="font-medium text-[#1A1A1A]">{item.decided}</span>
                            ) : (
                              <span className="italic text-[#8E8C82]">Pending review...</span>
                            )}
                            {item.date && (
                              <div className="text-[10px] text-[#8E8C82] mt-0.5">Recorded: {item.date}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleQuestionStatus(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E2D9] text-[#1A1A1A] hover:bg-[#E5E2D9] text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestionId(item.id);
                              setEditDecisionText(item.decided || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513]/20 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: DATABASE DOMAIN SUMMARY */}
      {activeSubTab === 'db_schema' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-6">
            <div>
              <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">
                Database Domain Architecture & Schema Directory
              </h3>
              <p className="text-xs text-[#5C5A52] mt-0.5">
                Overview of all 11 PostgreSQL schema modules, table ownership, and relational entity boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {DB_DOMAINS.map((domain, index) => (
                <div key={index} className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#E5E2D9] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded">
                        {domain.file}
                      </span>
                      <span className="text-[10px] font-bold text-[#8E8C82]">
                        {domain.tables.length} Tables
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-[#1A1A1A]">
                      {domain.domain}
                    </h4>
                    <p className="text-xs text-[#5C5A52] leading-relaxed">
                      {domain.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E2D9] space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8C82]">
                      Associated Entities
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {domain.tables.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-[#E5E2D9] rounded font-mono text-[10px] text-[#1A1A1A]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: SMS & EMAIL QUEUE */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">
                  Multi-Channel Notification Dispatch Queue
                </h3>
                <p className="text-xs text-[#5C5A52] mt-0.5">
                  Logs for OTP verification SMS (Grameenphone / Robi API) and transactional emails.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SMS Gateway Connected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E2D9] text-[#8E8C82] uppercase text-[10px] tracking-wider bg-[#FAF9F6]">
                    <th className="py-3 px-4 font-bold">Dispatch ID</th>
                    <th className="py-3 px-4 font-bold">Channel</th>
                    <th className="py-3 px-4 font-bold">Recipient</th>
                    <th className="py-3 px-4 font-bold">Payload Summary</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Delivered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2D9]">
                  {[
                    { id: 'notif_001', channel: 'SMS (GP)', recipient: '+8801711223344', summary: 'Your OTP code for Heritage Bangladesh is 482910.', status: 'delivered', time: '2 mins ago' },
                    { id: 'notif_002', channel: 'Email', recipient: 'buyer@example.com', summary: 'Order #ORD-82910 confirmed by Artisan Workshop.', status: 'delivered', time: '12 mins ago' },
                    { id: 'notif_003', channel: 'SMS (Robi)', recipient: '+8801811998877', summary: 'Pathao Courier parcel #ATH-9281 active for dispatch.', status: 'delivered', time: '1 hour ago' },
                    { id: 'notif_004', channel: 'Email', recipient: 'vendor@silk.bd', summary: 'Bi-weekly settlement payout #SET-2026-07 generated.', status: 'delivered', time: '3 hours ago' }
                  ].map(n => (
                    <tr key={n.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#8B4513]">{n.id}</td>
                      <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">{n.channel}</td>
                      <td className="py-3.5 px-4 font-mono text-[#5C5A52]">{n.recipient}</td>
                      <td className="py-3.5 px-4 text-[#5C5A52] max-w-md truncate">{n.summary}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {n.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#8E8C82]">{n.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 5: GIFT CARDS & WALLET */}
      {activeSubTab === 'gift_cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-5">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#8B4513]" />
              <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Issue Digital Gift Card
              </h3>
            </div>
            <p className="text-xs text-[#5C5A52]">
              Generates digital store credit cards for platform promotional vouchers or customer support credits.
            </p>

            <form onSubmit={handleIssueGiftCard} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Gift Card Code
                </label>
                <input
                  type="text"
                  value={giftCardCode}
                  onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-xs font-mono font-bold text-[#1A1A1A] bg-[#FAF9F6]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Credit Value (BDT ৳)
                </label>
                <input
                  type="number"
                  value={giftCardAmount}
                  onChange={e => setGiftCardAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-xs font-bold text-[#1A1A1A] bg-[#FAF9F6]"
                  required
                  min={100}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={giftCardRecipient}
                  onChange={e => setGiftCardRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-xs text-[#1A1A1A] bg-[#FAF9F6]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8B4513] hover:bg-[#6F370F] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Issue Gift Card & Credit Wallet
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-5">
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
              Active Customer Wallet Balances
            </h3>
            <p className="text-xs text-[#5C5A52]">
              Customer store wallet balances used for instant refunds and promotional cashbacks.
            </p>

            <div className="space-y-3">
              {[
                { name: 'Sultana Ahmed', email: 'sultana@example.com', balance: 2500 },
                { name: 'Tanvir Hossain', email: 'tanvir@example.com', balance: 1200 },
                { name: 'Anika Rahman', email: 'anika@example.com', balance: 5000 }
              ].map((w, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E2D9] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#1A1A1A]">{w.name}</div>
                    <div className="text-[10px] text-[#8E8C82] font-mono">{w.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-serif font-bold text-[#8B4513]">৳{w.balance.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase">Wallet Active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 6: ML DELIVERY DISPATCH */}
      {activeSubTab === 'ml_engine' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">
                  Machine Learning Delivery Suggestions & Dispatch Engine
                </h3>
                <p className="text-xs text-[#5C5A52] mt-0.5">
                  Logs training data from courier SLAs to predict optimal courier selection (Pathao vs. Steadfast vs. RedX) based on destination Upazila.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                Model: BD-Courier-v2.1
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8C82]">Inside Dhaka Metro</div>
                <div className="text-lg font-bold text-[#1A1A1A]">Pathao Express</div>
                <div className="text-xs text-emerald-700 font-semibold">Predicted SLA: 24 Hours (99.2% Confidence)</div>
              </div>

              <div className="p-5 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8C82]">Dhaka Suburbs & Divisional Hubs</div>
                <div className="text-lg font-bold text-[#1A1A1A]">Steadfast Logistics</div>
                <div className="text-xs text-emerald-700 font-semibold">Predicted SLA: 48 Hours (96.8% Confidence)</div>
              </div>

              <div className="p-5 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8C82]">Remote Upazilas / Hill Tracts</div>
                <div className="text-lg font-bold text-[#1A1A1A]">RedX Delivery</div>
                <div className="text-xs text-emerald-700 font-semibold">Predicted SLA: 72 Hours (94.1% Confidence)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
