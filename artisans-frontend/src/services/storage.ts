import { 
  User, VendorProfile, Product, RawMaterial, CartItem, Order, 
  ProductReview, VendorSettlement, VendorStatus, OrderStatus,
  Coupon, CouponRedemption, Notification, AuditLog, AdminNote, UserTrustProfile, UserTrustEvent,
  PaymentAttempt, PaymentRecord, PaymentProviderEvent, Refund, RefundItem,
  WalletAccount, WalletTransaction, VendorSettlementItem, VendorPayoutAccount,
  PaymentAttemptProvider, PaymentAttemptStatus, RefundMethod, RefundStatus, PayoutMethod,
  WholesaleCartItem, WholesaleOrder, WholesaleOrderStatus, Address, PaymentMethod,
  DeliveryZone, DeliveryLocation, Shipment, ShipmentEvent, DeliverySuggestion, ZoneCode,
  WishlistItem, ReviewStatusEvent, UserStyleProfile
} from '../types';
import { 
  INITIAL_USERS, INITIAL_VENDORS, INITIAL_PRODUCTS, 
  INITIAL_RAW_MATERIALS, INITIAL_ORDERS, INITIAL_REVIEWS,
  INITIAL_COUPONS, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS,
  INITIAL_DELIVERY_ZONES, INITIAL_DELIVERY_LOCATIONS, INITIAL_COURIER_PROVIDERS,
  INITIAL_SHIPMENTS, INITIAL_SHIPMENT_EVENTS, INITIAL_WISHLIST, INITIAL_USER_STYLE_PROFILES
} from '../data/mockData';
import { createCuid } from '../utils/cuid';
import { TrustService } from './trustService';

const KEYS = {
  CURRENT_USER: 'artisan_market_current_user',
  USERS: 'artisan_market_users',
  VENDORS: 'artisan_market_vendors',
  VENDOR_STATUS_EVENTS: 'artisan_market_vendor_status_events',
  ADMIN_NOTES: 'artisan_market_admin_notes',
  PRODUCTS: 'artisan_market_products',
  RAW_MATERIALS: 'artisan_market_raw_materials',
  WHOLESALE_CART: 'artisan_market_wholesale_cart',
  WHOLESALE_ORDERS: 'artisan_market_wholesale_orders',
  CART: 'artisan_market_cart',
  WISHLIST: 'artisan_market_wishlist',
  ORDERS: 'artisan_market_orders',
  REVIEWS: 'artisan_market_reviews',
  REVIEW_EVENTS: 'artisan_market_review_events',
  STYLE_PROFILES: 'artisan_market_style_profiles',
  SETTLEMENTS: 'artisan_market_settlements',
  SETTLEMENT_ITEMS: 'artisan_market_settlement_items',
  COUPONS: 'artisan_market_coupons',
  COUPON_REDEMPTIONS: 'artisan_market_coupon_redemptions',
  NOTIFICATIONS: 'artisan_market_notifications',
  AUDIT_LOGS: 'artisan_market_audit_logs',
  TRUST_PROFILES: 'artisan_market_trust_profiles',
  TRUST_EVENTS: 'artisan_market_trust_events',
  PAYMENT_ATTEMPTS: 'artisan_market_payment_attempts',
  PAYMENTS: 'artisan_market_payments',
  PROVIDER_EVENTS: 'artisan_market_provider_events',
  REFUNDS: 'artisan_market_refunds',
  WALLETS: 'artisan_market_wallets',
  WALLET_TRANSACTIONS: 'artisan_market_wallet_transactions',
  PAYOUT_ACCOUNTS: 'artisan_market_payout_accounts',
  DELIVERY_ZONES: 'artisan_market_delivery_zones',
  DELIVERY_LOCATIONS: 'artisan_market_delivery_locations',
  COURIERS: 'artisan_market_couriers',
  SHIPMENTS: 'artisan_market_shipments',
  SHIPMENT_EVENTS: 'artisan_market_shipment_events',
  DELIVERY_SUGGESTIONS: 'artisan_market_delivery_suggestions'
};

class StorageService {
  private listeners: Array<() => void> = [];

  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(KEYS.ADMIN_NOTES)) {
      localStorage.setItem(KEYS.ADMIN_NOTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.VENDOR_STATUS_EVENTS)) {
      localStorage.setItem(KEYS.VENDOR_STATUS_EVENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.VENDORS)) {
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
    } else {
      try {
        const storedVendors = JSON.parse(localStorage.getItem(KEYS.VENDORS) || '[]');
        if (Array.isArray(storedVendors)) {
          const storedIds = new Set(storedVendors.map((v: any) => v.id));
          const missingVendors = INITIAL_VENDORS.filter(v => !storedIds.has(v.id));
          if (missingVendors.length > 0) {
            localStorage.setItem(KEYS.VENDORS, JSON.stringify([...storedVendors, ...missingVendors]));
          }
        }
      } catch (e) {
        localStorage.setItem(KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
      }
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    } else {
      try {
        const storedProds = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
        if (Array.isArray(storedProds)) {
          const storedIds = new Set(storedProds.map((p: any) => p.id));
          const missingProds = INITIAL_PRODUCTS.filter(p => !storedIds.has(p.id));
          if (missingProds.length > 0) {
            localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([...storedProds, ...missingProds]));
          }
        }
      } catch (e) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      }
    }
    if (!localStorage.getItem(KEYS.RAW_MATERIALS)) {
      localStorage.setItem(KEYS.RAW_MATERIALS, JSON.stringify(INITIAL_RAW_MATERIALS));
    }
    if (!localStorage.getItem(KEYS.CART)) {
      localStorage.setItem(KEYS.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.WISHLIST)) {
      localStorage.setItem(KEYS.WISHLIST, JSON.stringify([INITIAL_PRODUCTS[0].id]));
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(KEYS.REVIEWS)) {
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    }
    if (!localStorage.getItem(KEYS.SETTLEMENTS)) {
      const demoSettlements: VendorSettlement[] = [
        {
          id: createCuid('set_'),
          vendorProfileId: INITIAL_VENDORS[0].id,
          vendorName: INITIAL_VENDORS[0].displayName,
          periodStart: '2026-07-01T00:00:00Z',
          periodEnd: '2026-07-25T00:00:00Z',
          grossAmountCents: 1540000, // ৳15,400
          commissionCents: 77000,    // 5% commission = ৳770
          netAmountCents: 1463000,   // ৳14,630
          status: 'paid',
          paidAt: '2026-07-26T10:00:00Z',
          createdAt: '2026-07-25T18:00:00Z'
        }
      ];
      localStorage.setItem(KEYS.SETTLEMENTS, JSON.stringify(demoSettlements));
    }
    if (!localStorage.getItem(KEYS.COUPONS)) {
      localStorage.setItem(KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(KEYS.TRUST_PROFILES)) {
      const demoTrust: UserTrustProfile = {
        id: createCuid('tp_'),
        userId: INITIAL_USERS[0].id,
        score: 85,
        codEligible: true,
        riskLevel: 'low',
        manualReviewRequired: false,
        lastEvaluatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.TRUST_PROFILES, JSON.stringify([demoTrust]));
    }
    if (!localStorage.getItem(KEYS.TRUST_EVENTS)) {
      const demoEvents: UserTrustEvent[] = [
        {
          id: createCuid('te_1'),
          userId: INITIAL_USERS[0].id,
          eventType: 'phone_verified',
          scoreDelta: 10,
          reason: 'Verified Bangladesh Mobile Number (+8801712345678)',
          createdAt: '2026-01-15T10:05:00Z'
        },
        {
          id: createCuid('te_2'),
          userId: INITIAL_USERS[0].id,
          eventType: 'order_completed',
          scoreDelta: 25,
          reason: 'Completed 5 orders without COD refusal or disputes',
          createdAt: '2026-07-25T09:00:00Z'
        }
      ];
      localStorage.setItem(KEYS.TRUST_EVENTS, JSON.stringify(demoEvents));
    }
    if (!localStorage.getItem(KEYS.PAYMENT_ATTEMPTS)) {
      const demoAttempts: PaymentAttempt[] = [
        {
          id: createCuid('payatt_1'),
          orderId: INITIAL_ORDERS[0].id,
          provider: 'bkash',
          status: 'succeeded',
          amountCents: INITIAL_ORDERS[0].totalAmountCents,
          currency: 'BDT',
          gatewayReference: 'BKASH_GW_991823',
          metadata: { senderPhone: '01712345678', paymentType: 'checkout' },
          createdAt: '2026-07-28T14:30:00Z',
          updatedAt: '2026-07-28T14:31:00Z'
        }
      ];
      localStorage.setItem(KEYS.PAYMENT_ATTEMPTS, JSON.stringify(demoAttempts));
    }
    if (!localStorage.getItem(KEYS.PAYMENTS)) {
      const demoPayments: PaymentRecord[] = [
        {
          id: createCuid('pay_1'),
          paymentAttemptId: 'payatt_1',
          orderId: INITIAL_ORDERS[0].id,
          provider: 'bkash',
          status: 'paid',
          amountCents: INITIAL_ORDERS[0].totalAmountCents,
          currency: 'BDT',
          transactionId: 'TRX_BKASH_991823',
          providerSignatureHash: 'sha256_bkash_sig_991823_valid',
          paidAt: '2026-07-28T14:31:00Z',
          createdAt: '2026-07-28T14:31:00Z'
        }
      ];
      localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(demoPayments));
    }
    if (!localStorage.getItem(KEYS.PROVIDER_EVENTS)) {
      const demoEvents: PaymentProviderEvent[] = [
        {
          id: createCuid('p_evt_1'),
          provider: 'bkash',
          eventType: 'bkash.payment.success',
          eventId: 'EVT_BKASH_991823',
          rawPayload: { trxID: 'TRX_BKASH_991823', amount: '1240.00', status: 'Completed' },
          signatureValid: true,
          processedAt: '2026-07-28T14:31:00Z',
          createdAt: '2026-07-28T14:31:00Z'
        }
      ];
      localStorage.setItem(KEYS.PROVIDER_EVENTS, JSON.stringify(demoEvents));
    }
    if (!localStorage.getItem(KEYS.REFUNDS)) {
      localStorage.setItem(KEYS.REFUNDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.WALLETS)) {
      const demoWallet: WalletAccount = {
        id: createCuid('wlt_'),
        userId: INITIAL_USERS[0].id,
        balanceCents: 50000, // ৳500 initial wallet balance credit
        currency: 'BDT',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.WALLETS, JSON.stringify([demoWallet]));
    }
    if (!localStorage.getItem(KEYS.WALLET_TRANSACTIONS)) {
      const demoTx: WalletTransaction = {
        id: createCuid('wtx_'),
        walletAccountId: 'wlt_usr1',
        type: 'credit',
        amountCents: 50000,
        balanceAfterCents: 50000,
        referenceType: 'admin_adjustment',
        referenceId: 'welcome_gift',
        description: 'Welcome artisan store credit',
        createdAt: '2026-07-01T10:00:00Z'
      };
      localStorage.setItem(KEYS.WALLET_TRANSACTIONS, JSON.stringify([demoTx]));
    }
    if (!localStorage.getItem(KEYS.PAYOUT_ACCOUNTS)) {
      const demoPayout: VendorPayoutAccount = {
        id: createCuid('payout_'),
        vendorProfileId: INITIAL_VENDORS[0].id,
        payoutMethod: 'bkash',
        detailsEncrypted: 'enc_aes256_bKash_01811223344_salt991',
        maskedIdentifier: 'bKash Merchant *******3344',
        isDefault: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.PAYOUT_ACCOUNTS, JSON.stringify([demoPayout]));
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- USER & ROLE MANAGEMENT ---
  public getCurrentUser(): User {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  }

  public setCurrentUserRole(role: User['role']) {
    const user = this.getCurrentUser();
    user.role = role;
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    this.notify();
  }

  // --- VENDORS ---
  public getVendors(): VendorProfile[] {
    const raw = localStorage.getItem(KEYS.VENDORS);
    return raw ? JSON.parse(raw) : INITIAL_VENDORS;
  }

  public getVendorByUserId(userId: string): VendorProfile | undefined {
    return this.getVendors().find(v => v.ownerUserId === userId);
  }

  public submitVendorApplication(appData: {
    displayName: string;
    publicSlug: string;
    craftSpecialty: string;
    description: string;
    workshopLocation: string;
    supportEmail: string;
    supportPhone: string;
    allowCod: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
  }): VendorProfile {
    const user = this.getCurrentUser();
    const existingVendors = this.getVendors();

    const newVendor: VendorProfile = {
      id: createCuid('v_'),
      organizationId: createCuid('org_'),
      ownerUserId: user.id,
      publicSlug: appData.publicSlug || appData.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      displayName: appData.displayName,
      legalName: appData.displayName,
      status: 'approved', // Auto-approved for smooth demonstration
      craftSpecialty: appData.craftSpecialty,
      description: appData.description,
      workshopLocation: appData.workshopLocation,
      supportEmail: appData.supportEmail,
      supportPhone: appData.supportPhone,
      allowCod: appData.allowCod,
      rating: 5.0,
      reviewCount: 0,
      verifiedArtisan: true,
      avatarUrl: appData.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      bannerUrl: appData.bannerUrl || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
      submittedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    existingVendors.unshift(newVendor);
    localStorage.setItem(KEYS.VENDORS, JSON.stringify(existingVendors));

    // Update current user role to vendor_user
    this.setCurrentUserRole('vendor_user');
    this.notify();
    return newVendor;
  }

  public updateVendorStatus(vendorId: string, status: VendorStatus, reason?: string, opts?: { publicMessage?: string; privateNote?: string }) {
    const vendors = this.getVendors();
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      const prevStatus = vendor.status;
      vendor.status = status;
      if (reason) vendor.statusReason = reason;
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(vendors));

      if (opts?.privateNote) {
        this.addAdminNote('vendor', vendorId, opts.privateNote);
      }

      this.addVendorStatusEvent(vendorId, prevStatus, status, reason || '', opts?.publicMessage, opts?.privateNote);

      this.addAuditLog(`vendor_${status}`, reason || `Vendor status changed to ${status}`, 'vendor', vendorId, {
        publicMessage: opts?.publicMessage || `Vendor application ${status}`,
        privateNote: opts?.privateNote
      });

      this.sendNotification(vendor.ownerUserId, 'vendor_status', `Vendor Account ${status.toUpperCase()}`, opts?.publicMessage || `Your vendor account status has been updated to ${status}.`);
      this.notify();
    }
  }

  public approveVendor(vendorId: string, note?: string) {
    this.updateVendorStatus(vendorId, 'approved', 'Vendor credentials and application verified', {
      publicMessage: 'Congratulations! Your vendor profile has been approved and published.',
      privateNote: note
    });
  }

  public rejectVendor(vendorId: string, reason: string, privateNote?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is strictly required for vendor rejection.');
    }
    // Sanitised public message for seller visibility
    const publicMsg = `Your vendor application requires revision: ${reason.trim()}`;
    this.updateVendorStatus(vendorId, 'rejected', reason, {
      publicMessage: publicMsg,
      privateNote
    });
  }

  public suspendVendor(vendorId: string, reason: string, privateNote?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is strictly required for vendor suspension.');
    }
    this.updateVendorStatus(vendorId, 'suspended', reason, {
      publicMessage: `Storefront temporarily suspended by administration: ${reason.trim()}`,
      privateNote
    });
  }

  public reapproveVendor(vendorId: string, reason: string, privateNote?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is strictly required for vendor reapproval.');
    }
    this.updateVendorStatus(vendorId, 'approved', reason, {
      publicMessage: 'Your vendor account has been re-approved and un-suspended.',
      privateNote
    });
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  }

  public addProduct(product: Omit<Product, 'id' | 'currentVersionId' | 'latestVersionId' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const id = createCuid('prod_');
    const newProduct: Product = {
      ...product,
      id,
      currentVersionId: 'v1',
      latestVersionId: 'v1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    this.notify();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    products[idx] = {
      ...products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    this.notify();
    return products[idx];
  }

  public approveProduct(productId: string, note?: string) {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.currentVersionId = product.latestVersionId || 'v1';
      product.status = 'approved';
      product.rejectionReason = undefined;
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

      if (note) {
        this.addAdminNote('product', productId, note);
      }

      this.addAuditLog('product_approved', 'Product version approved for catalog publication', 'product', productId, {
        publicMessage: `Product '${product.title}' approved (Version ${product.currentVersionId}).`,
        privateNote: note
      });

      const vendor = this.getVendors().find(v => v.id === product.vendorProfileId);
      if (vendor) {
        this.sendNotification(vendor.ownerUserId, 'product_approved', 'Product Approved', `Your product "${product.title}" has been approved and published to the catalog.`);
      }

      this.notify();
    }
  }

  public rejectProduct(productId: string, reason: string, privateNote?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is required for product rejection.');
    }
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.status = 'rejected';
      product.rejectionReason = reason;
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

      if (privateNote) {
        this.addAdminNote('product', productId, privateNote);
      }

      this.addAuditLog('product_rejected', reason, 'product', productId, {
        publicMessage: `Product rejected: ${reason}`,
        privateNote
      });

      const vendor = this.getVendors().find(v => v.id === product.vendorProfileId);
      if (vendor) {
        this.sendNotification(vendor.ownerUserId, 'product_rejected', 'Product Rejection Notice', `Your product "${product.title}" was rejected. Reason: ${reason}`);
      }

      this.notify();
    }
  }

  public requestProductChanges(productId: string, reason: string, privateNote?: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A reason is required to request changes on a product.');
    }
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.status = 'pending';
      product.rejectionReason = `Changes requested: ${reason}`;
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

      if (privateNote) {
        this.addAdminNote('product', productId, privateNote);
      }

      this.addAuditLog('product_changes_requested', reason, 'product', productId, {
        publicMessage: `Changes requested on product: ${reason}`,
        privateNote
      });

      const vendor = this.getVendors().find(v => v.id === product.vendorProfileId);
      if (vendor) {
        this.sendNotification(vendor.ownerUserId, 'system', 'Product Changes Requested', `Please revise "${product.title}". Feedback: ${reason}`);
      }

      this.notify();
    }
  }

  public updateVendorProfile(vendorId: string, updates: Partial<VendorProfile>): VendorProfile | undefined {
    const vendors = this.getVendors();
    const idx = vendors.findIndex(v => v.id === vendorId);
    if (idx === -1) return undefined;
    vendors[idx] = {
      ...vendors[idx],
      ...updates
    };
    localStorage.setItem(KEYS.VENDORS, JSON.stringify(vendors));
    this.notify();
    return vendors[idx];
  }

  // --- RAW MATERIALS ---
  public getRawMaterials(): RawMaterial[] {
    const raw = localStorage.getItem(KEYS.RAW_MATERIALS);
    return raw ? JSON.parse(raw) : INITIAL_RAW_MATERIALS;
  }

  public addRawMaterial(material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>): RawMaterial {
    const materials = this.getRawMaterials();
    const id = createCuid('raw_');
    const newMaterial: RawMaterial = {
      ...material,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    materials.unshift(newMaterial);
    localStorage.setItem(KEYS.RAW_MATERIALS, JSON.stringify(materials));
    this.notify();
    return newMaterial;
  }

  public updateRawMaterial(id: string, updates: Partial<RawMaterial>): RawMaterial | undefined {
    const materials = this.getRawMaterials();
    const idx = materials.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    materials[idx] = {
      ...materials[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.RAW_MATERIALS, JSON.stringify(materials));
    this.notify();
    return materials[idx];
  }

  // --- WHOLESALE CART ---
  public getWholesaleCart(): WholesaleCartItem[] {
    const raw = localStorage.getItem(KEYS.WHOLESALE_CART);
    return raw ? JSON.parse(raw) : [];
  }

  public addToWholesaleCart(rawMaterial: RawMaterial, quantity: number) {
    const cart = this.getWholesaleCart();
    const existingIndex = cart.findIndex(c => c.rawMaterial.id === rawMaterial.id);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ rawMaterial, quantity: Math.max(rawMaterial.moq, quantity) });
    }
    localStorage.setItem(KEYS.WHOLESALE_CART, JSON.stringify(cart));
    this.notify();
  }

  public updateWholesaleCartQuantity(rawMaterialId: string, quantity: number) {
    let cart = this.getWholesaleCart();
    const item = cart.find(c => c.rawMaterial.id === rawMaterialId);
    if (item) {
      if (quantity < item.rawMaterial.moq) {
        cart = cart.filter(c => c.rawMaterial.id !== rawMaterialId);
      } else {
        item.quantity = quantity;
      }
    }
    localStorage.setItem(KEYS.WHOLESALE_CART, JSON.stringify(cart));
    this.notify();
  }

  public removeFromWholesaleCart(rawMaterialId: string) {
    const cart = this.getWholesaleCart().filter(c => c.rawMaterial.id !== rawMaterialId);
    localStorage.setItem(KEYS.WHOLESALE_CART, JSON.stringify(cart));
    this.notify();
  }

  public clearWholesaleCart() {
    localStorage.setItem(KEYS.WHOLESALE_CART, JSON.stringify([]));
    this.notify();
  }

  // --- WHOLESALE ORDERS ---
  public getWholesaleOrders(): WholesaleOrder[] {
    const raw = localStorage.getItem(KEYS.WHOLESALE_ORDERS);
    return raw ? JSON.parse(raw) : [];
  }

  public createWholesaleOrder(
    buyerVendorProfileId: string,
    buyerName: string,
    items: WholesaleCartItem[],
    paymentMethod: PaymentMethod,
    shippingAddress: Address
  ): WholesaleOrder[] {
    const existingOrders = this.getWholesaleOrders();
    const createdOrders: WholesaleOrder[] = [];

    items.forEach(item => {
      const id = createCuid('wsord_');
      const totalAmountCents = item.rawMaterial.priceCents * item.quantity;

      const order: WholesaleOrder = {
        id,
        buyerVendorProfileId,
        buyerName,
        supplierVendorProfileId: item.rawMaterial.wholesalerVendorProfileId,
        supplierName: item.rawMaterial.supplierName,
        rawMaterialId: item.rawMaterial.id,
        materialName: item.rawMaterial.name,
        unitPriceCents: item.rawMaterial.priceCents,
        quantity: item.quantity,
        totalAmountCents,
        status: 'pending',
        paymentMethod,
        shippingAddressSnapshot: shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      createdOrders.push(order);
      existingOrders.unshift(order);
    });

    localStorage.setItem(KEYS.WHOLESALE_ORDERS, JSON.stringify(existingOrders));
    this.clearWholesaleCart();
    this.notify();
    return createdOrders;
  }

  public updateWholesaleOrderStatus(orderId: string, status: WholesaleOrderStatus): WholesaleOrder | undefined {
    const orders = this.getWholesaleOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return undefined;

    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(KEYS.WHOLESALE_ORDERS, JSON.stringify(orders));
    this.notify();
    return orders[idx];
  }

  // --- CART ---
  public getCart(): CartItem[] {
    const raw = localStorage.getItem(KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  }

  public addToCart(item: Omit<CartItem, 'id'>) {
    const cart = this.getCart();
    const id = createCuid('cart_');
    
    // Check if identical item already in cart
    const existingIndex = cart.findIndex(c => 
      c.productId === item.productId && 
      c.rawMaterialId === item.rawMaterialId &&
      JSON.stringify(c.customSelections) === JSON.stringify(item.customSelections)
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push({ ...item, id });
    }

    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
    this.notify();
  }

  public updateCartQuantity(cartItemId: string, quantity: number) {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter(i => i.id !== cartItemId);
    } else {
      const item = cart.find(i => i.id === cartItemId);
      if (item) item.quantity = quantity;
    }
    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
    this.notify();
  }

  public removeFromCart(cartItemId: string) {
    const cart = this.getCart().filter(i => i.id !== cartItemId);
    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
    this.notify();
  }

  public clearCart() {
    localStorage.setItem(KEYS.CART, JSON.stringify([]));
    this.notify();
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    const raw = localStorage.getItem(KEYS.ORDERS);
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  }

  public placeOrder(
    buyerName: string,
    buyerEmail: string,
    buyerPhone: string,
    shippingAddress: Order['shippingAddressSnapshot'],
    paymentMethod: Order['paymentMethod'],
    courierName: string
  ): Order {
    const cart = this.getCart();
    const user = this.getCurrentUser();
    const orders = this.getOrders();

    // Group cart items by vendor
    const itemsByVendor: Record<string, CartItem[]> = {};
    cart.forEach(item => {
      if (!itemsByVendor[item.vendorId]) {
        itemsByVendor[item.vendorId] = [];
      }
      itemsByVendor[item.vendorId].push(item);
    });

    const vendorOrders = Object.entries(itemsByVendor).map(([vendorId, items]) => {
      const vendorName = items[0].vendorName;
      const subtotalCents = items.reduce((sum, item) => {
        const itemCustoms = item.customSelections?.reduce((s, c) => s + c.priceModifierCents, 0) || 0;
        return sum + (item.unitPriceCents + itemCustoms) * item.quantity;
      }, 0);
      const shippingFeeCents = 6000; // ৳60 per vendor

      return {
        id: createCuid('vord_'),
        vendorProfileId: vendorId,
        vendorName,
        items: items.map(i => ({
          id: createCuid('item_'),
          itemType: i.itemType,
          title: i.title,
          image: i.image,
          unitPriceCents: i.unitPriceCents,
          quantity: i.quantity,
          vendorId: i.vendorId,
          vendorName: i.vendorName,
          customSelections: i.customSelections,
          customNote: i.customNote
        })),
        subtotalCents,
        shippingFeeCents,
        status: 'placed' as OrderStatus,
        courierName,
        estimatedDelivery: '3-4 Days Doorstep'
      };
    });

    const subtotalCents = vendorOrders.reduce((sum, vo) => sum + vo.subtotalCents, 0);
    const totalShippingCents = vendorOrders.reduce((sum, vo) => sum + vo.shippingFeeCents, 0);
    const totalAmountCents = subtotalCents + totalShippingCents;

    const newOrder: Order = {
      id: createCuid('ord_'),
      buyerUserId: user.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      shippingAddressSnapshot: { ...shippingAddress },
      vendorOrders,
      subtotalCents,
      totalShippingCents,
      totalAmountCents,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'placed',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

    // Trust Event: First Purchase
    const buyerPriorOrders = orders.filter(o => o.buyerUserId === user.id);
    if (buyerPriorOrders.length === 1) {
      TrustService.addEvent(user.id, 'first_purchase');
    }

    this.clearCart();
    this.notify();
    return newOrder;
  }

  public updateVendorOrderStatus(orderId: string, vendorOrderId: string, status: OrderStatus, trackingNumber?: string) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const vOrder = order.vendorOrders.find(v => v.id === vendorOrderId);
      if (vOrder) {
        const prevStatus = vOrder.status;
        vOrder.status = status;
        if (trackingNumber) vOrder.trackingNumber = trackingNumber;
        
        // Derive master order status
        const allStatus = order.vendorOrders.map(v => v.status);
        if (allStatus.every(s => s === 'delivered')) {
          if (order.status !== 'delivered') {
            order.status = 'delivered';
            // Trigger Trust Event for delivered order
            TrustService.addEvent(order.buyerUserId, 'order_delivered');
            if (order.paymentMethod === 'cod') {
              TrustService.addEvent(order.buyerUserId, 'cod_delivered');
            }
          }
        } else if (allStatus.some(s => s === 'shipped' || s === 'crafting')) {
          order.status = 'shipped';
        } else if (status === 'cancelled' && prevStatus !== 'cancelled' && order.paymentMethod === 'cod') {
          // COD Refused / Uncollected event
          TrustService.addEvent(order.buyerUserId, 'cod_refused');
        }

        localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
        this.notify();
      }
    }
  }

  // --- REVIEWS ---
  public getReviews(): ProductReview[] {
    const raw = localStorage.getItem(KEYS.REVIEWS);
    return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
  }

  public addReview(review: Omit<ProductReview, 'id' | 'createdAt' | 'status'>): ProductReview {
    const reviews = this.getReviews();
    const newRev: ProductReview = {
      ...review,
      id: createCuid('rev_'),
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newRev);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
    this.notify();
    return newRev;
  }

  // --- SETTLEMENTS ---
  public getSettlements(): VendorSettlement[] {
    const raw = localStorage.getItem(KEYS.SETTLEMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public addCoupon(coupon: Omit<Coupon, 'id' | 'usageCount' | 'createdAt'>): Coupon {
    const coupons = this.getCoupons();
    const newCoupon: Coupon = {
      ...coupon,
      id: createCuid('cpn_'),
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    coupons.unshift(newCoupon);
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
    this.addAuditLog('create_coupon', `Created platform coupon ${newCoupon.code}`, 'coupon', newCoupon.id);
    this.notify();
    return newCoupon;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  }

  public addAuditLog(
    action: string, 
    reason: string, 
    entityType: AuditLog['entityType'], 
    entityId: string,
    opts?: {
      publicMessage?: string;
      privateNote?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      impersonatedUserId?: string;
    }
  ) {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: createCuid('audit_'),
      actorUserId: user.id,
      actorRole: user.role,
      action,
      entityType,
      entityId,
      reason,
      publicMessage: opts?.publicMessage,
      privateNote: opts?.privateNote,
      metadata: opts?.metadata,
      ipAddress: opts?.ipAddress || '127.0.0.1 (Internal Admin Container)',
      userAgent: opts?.userAgent || 'ArtisanMarket-AdminCenter/1.0',
      impersonatedUserId: opts?.impersonatedUserId,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
    this.notify();
  }

  // --- ADMIN NOTES ---
  public getAdminNotes(entityType?: string, entityId?: string): AdminNote[] {
    const raw = localStorage.getItem(KEYS.ADMIN_NOTES);
    const notes: AdminNote[] = raw ? JSON.parse(raw) : [];
    if (entityType && entityId) {
      return notes.filter(n => n.entityType === entityType && n.entityId === entityId);
    }
    return notes;
  }

  public addAdminNote(entityType: AdminNote['entityType'], entityId: string, noteText: string): AdminNote {
    const currentUser = this.getCurrentUser();
    const notes = this.getAdminNotes();
    const newNote: AdminNote = {
      id: createCuid('anote_'),
      entityType,
      entityId,
      adminUserId: currentUser.id,
      adminEmail: currentUser.email,
      note: noteText,
      createdAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    localStorage.setItem(KEYS.ADMIN_NOTES, JSON.stringify(notes));
    this.notify();
    return newNote;
  }

  // --- VENDOR STATUS EVENTS ---
  public getVendorStatusEvents(vendorProfileId?: string): any[] {
    const raw = localStorage.getItem(KEYS.VENDOR_STATUS_EVENTS);
    const events: any[] = raw ? JSON.parse(raw) : [];
    return vendorProfileId ? events.filter(e => e.vendorProfileId === vendorProfileId) : events;
  }

  public addVendorStatusEvent(vendorProfileId: string, previousStatus: string, newStatus: string, reason: string, publicMessage?: string, privateNote?: string) {
    const currentUser = this.getCurrentUser();
    const events = this.getVendorStatusEvents();
    const newEvt = {
      id: createCuid('vse_'),
      vendorProfileId,
      actorUserId: currentUser.id,
      previousStatus,
      newStatus,
      reason,
      publicMessage,
      privateNote,
      createdAt: new Date().toISOString()
    };
    events.unshift(newEvt);
    localStorage.setItem(KEYS.VENDOR_STATUS_EVENTS, JSON.stringify(events));
  }

  // --- USER MANAGEMENT ---
  public getUsers(): User[] {
    const raw = localStorage.getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  public banUser(userId: string, reason: string, privateNote?: string) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].isBanned = true;
      users[idx].banReason = reason;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    if (privateNote) {
      this.addAdminNote('user', userId, privateNote);
    }
    this.addAuditLog('user_banned', reason, 'user', userId, {
      publicMessage: `User account suspended: ${reason}`,
      privateNote
    });
    this.sendNotification(userId, 'system', 'Account Suspended', `Your account has been restricted by platform administration. Reason: ${reason}`);
    this.notify();
  }

  public unbanUser(userId: string, reason: string, privateNote?: string) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].isBanned = false;
      users[idx].banReason = undefined;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    if (privateNote) {
      this.addAdminNote('user', userId, privateNote);
    }
    this.addAuditLog('user_unbanned', reason, 'user', userId, {
      publicMessage: `User account status reinstated: ${reason}`,
      privateNote
    });
    this.sendNotification(userId, 'system', 'Account Reinstated', `Your account restriction has been lifted.`);
    this.notify();
  }

  public toggleCodEligibilityOverride(userId: string, override: boolean, reason: string) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].codEligibilityOverride = override;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    this.addAuditLog('cod_override_updated', reason, 'user', userId, {
      publicMessage: `COD Eligibility Override set to ${override}`,
      privateNote: `Reason: ${reason}`
    });
    this.notify();
  }

  public verifyUserPhone(userId: string) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].phoneNumberVerified = true;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      this.notify();
    }
  }

  // --- TRUST PROFILES ---
  public getTrustProfiles(): UserTrustProfile[] {
    const raw = localStorage.getItem(KEYS.TRUST_PROFILES);
    return raw ? JSON.parse(raw) : [];
  }

  public getTrustEvents(userId?: string): UserTrustEvent[] {
    const raw = localStorage.getItem(KEYS.TRUST_EVENTS);
    const events: UserTrustEvent[] = raw ? JSON.parse(raw) : [];
    return userId ? events.filter(e => e.userId === userId) : events;
  }

  public adjustTrustScore(userId: string, delta: number, reason: string) {
    const actorId = this.getCurrentUser().id;
    TrustService.addEvent(userId, 'manual_adjustment', delta, reason, actorId);
    this.sendNotification(userId, 'trust_update', 'Trust Profile Updated', `Your account trust score was updated. Reason: ${reason}`);
    this.notify();
  }

  // --- PHASE 14: MARKETING & COUPONS ---
  public getCoupons(): Coupon[] {
    const raw = localStorage.getItem(KEYS.COUPONS);
    return raw ? JSON.parse(raw) : INITIAL_COUPONS;
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const coupons = this.getCoupons();
    const idx = coupons.findIndex(c => c.id === coupon.id);
    if (idx !== -1) {
      coupons[idx] = { ...coupon, updatedAt: new Date().toISOString() };
    } else {
      coupons.unshift(coupon);
    }
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
    this.notify();
    return coupon;
  }

  public getCouponRedemptions(couponId?: string, userId?: string): CouponRedemption[] {
    const raw = localStorage.getItem(KEYS.COUPON_REDEMPTIONS);
    const list: CouponRedemption[] = raw ? JSON.parse(raw) : [];
    return list.filter(r => {
      if (couponId && r.couponId !== couponId) return false;
      if (userId && r.userId !== userId) return false;
      return true;
    });
  }

  public addCouponRedemption(redemption: CouponRedemption): CouponRedemption {
    const list = this.getCouponRedemptions();
    list.unshift(redemption);
    localStorage.setItem(KEYS.COUPON_REDEMPTIONS, JSON.stringify(list));

    // Increment usage count
    const coupons = this.getCoupons();
    const cIdx = coupons.findIndex(c => c.id === redemption.couponId);
    if (cIdx !== -1) {
      coupons[cIdx].usageCount = (coupons[cIdx].usageCount || 0) + 1;
      coupons[cIdx].updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
    }

    this.notify();
    return redemption;
  }

  // --- PHASE 7: PAYMENTS, WEBHOOKS, REFUNDS & SETTLEMENTS ---

  // 1. Payment Attempts & Payments
  public getPaymentAttempts(): PaymentAttempt[] {
    const raw = localStorage.getItem(KEYS.PAYMENT_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  }

  public createPaymentAttempt(
    orderId: string, 
    provider: PaymentAttemptProvider, 
    amountCents: number, 
    metadata?: Record<string, unknown>
  ): PaymentAttempt {
    const attempts = this.getPaymentAttempts();
    const newAttempt: PaymentAttempt = {
      id: createCuid('payatt_'),
      orderId,
      provider,
      status: 'created',
      amountCents,
      currency: 'BDT',
      gatewayReference: `${provider.toUpperCase()}_GW_${Date.now().toString().slice(-6)}`,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    attempts.unshift(newAttempt);
    localStorage.setItem(KEYS.PAYMENT_ATTEMPTS, JSON.stringify(attempts));
    this.notify();
    return newAttempt;
  }

  public getPayments(): PaymentRecord[] {
    const raw = localStorage.getItem(KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  public getProviderEvents(): PaymentProviderEvent[] {
    const raw = localStorage.getItem(KEYS.PROVIDER_EVENTS);
    return raw ? JSON.parse(raw) : [];
  }

  /**
   * Idempotent Webhook Processing
   * Enforces UNIQUE(provider, event_id) and validates signature.
   */
  public processWebhookCallback(
    provider: PaymentAttemptProvider,
    eventType: string,
    eventId: string,
    rawPayload: Record<string, unknown>,
    signature: string,
    orderId: string
  ): { success: boolean; message: string; duplicate?: boolean; paymentRecord?: PaymentRecord } {
    const events = this.getProviderEvents();

    // 1. Idempotency Check: Reject duplicate event IDs
    const existingEvent = events.find(e => e.provider === provider && e.eventId === eventId);
    if (existingEvent) {
      return {
        success: false,
        duplicate: true,
        message: `Idempotency guard: Webhook event '${eventId}' from ${provider.toUpperCase()} has already been processed.`
      };
    }

    // 2. Validate Signature
    const signatureValid = Boolean(signature && signature.length >= 8);
    if (!signatureValid) {
      return {
        success: false,
        message: `Security alert: Invalid provider signature hash for ${provider.toUpperCase()} webhook.`
      };
    }

    // 3. Store Event Log
    const newEvent: PaymentProviderEvent = {
      id: createCuid('p_evt_'),
      provider,
      eventType,
      eventId,
      rawPayload,
      signatureValid: true,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    events.unshift(newEvent);
    localStorage.setItem(KEYS.PROVIDER_EVENTS, JSON.stringify(events));

    // 4. Update Payment Attempt & Create Authoritative Payment Record
    const attempts = this.getPaymentAttempts();
    const attempt = attempts.find(a => a.orderId === orderId && a.provider === provider);
    if (attempt) {
      attempt.status = 'succeeded';
      attempt.updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.PAYMENT_ATTEMPTS, JSON.stringify(attempts));
    }

    const payments = this.getPayments();
    const transactionId = `TRX_${provider.toUpperCase()}_${Date.now().toString().slice(-6)}`;
    const newPayment: PaymentRecord = {
      id: createCuid('pay_'),
      paymentAttemptId: attempt?.id || createCuid('payatt_'),
      orderId,
      provider,
      status: 'paid',
      amountCents: attempt?.amountCents || 0,
      currency: 'BDT',
      transactionId,
      providerSignatureHash: signature,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    payments.unshift(newPayment);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));

    // 5. Fulfill Order Status
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'placed';
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    }

    this.addAuditLog('webhook_processed', `Successfully processed ${provider.toUpperCase()} payment webhook ${eventId}`, 'order', orderId);
    this.sendNotification(order?.buyerUserId || '', 'order_update', 'Payment Confirmed', `Your payment for order ${orderId} via ${provider.toUpperCase()} (Trx #${transactionId}) was successfully verified!`);
    this.notify();

    return {
      success: true,
      message: `Payment verified and completed via ${provider.toUpperCase()} webhook!`,
      paymentRecord: newPayment
    };
  }

  // 2. COD Eligibility Validation
  public checkCodEligibility(userId: string, vendorIds: string[]): { eligible: boolean; reason?: string } {
    const trustProfile = this.getTrustProfiles().find(p => p.userId === userId);
    if (!trustProfile || trustProfile.score < 65 || !trustProfile.codEligible) {
      return {
        eligible: false,
        reason: `Your Trust Score (${trustProfile?.score || 50}/100) is below the minimum 65 threshold required for Cash on Delivery.`
      };
    }

    const vendors = this.getVendors();
    for (const vId of vendorIds) {
      const vendor = vendors.find(v => v.id === vId);
      if (vendor && !vendor.allowCod) {
        return {
          eligible: false,
          reason: `Vendor '${vendor.displayName}' has disabled Cash on Delivery for their shop items.`
        };
      }
    }

    return { eligible: true };
  }

  // 3. Customer Wallet System
  public getWallet(userId: string): WalletAccount {
    const raw = localStorage.getItem(KEYS.WALLETS);
    const wallets: WalletAccount[] = raw ? JSON.parse(raw) : [];
    let wallet = wallets.find(w => w.userId === userId);
    if (!wallet) {
      wallet = {
        id: createCuid('wlt_'),
        userId,
        balanceCents: 0,
        currency: 'BDT',
        updatedAt: new Date().toISOString()
      };
      wallets.push(wallet);
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));
    }
    return wallet;
  }

  public getWalletTransactions(userId: string): WalletTransaction[] {
    const wallet = this.getWallet(userId);
    const raw = localStorage.getItem(KEYS.WALLET_TRANSACTIONS);
    const txs: WalletTransaction[] = raw ? JSON.parse(raw) : [];
    return txs.filter(t => t.walletAccountId === wallet.id);
  }

  public creditWallet(
    userId: string, 
    amountCents: number, 
    description: string, 
    referenceType: WalletTransaction['referenceType'], 
    referenceId: string
  ): WalletAccount {
    const wallet = this.getWallet(userId);
    const rawWallets = localStorage.getItem(KEYS.WALLETS);
    const wallets: WalletAccount[] = rawWallets ? JSON.parse(rawWallets) : [];
    
    const target = wallets.find(w => w.id === wallet.id) || wallet;
    target.balanceCents += amountCents;
    target.updatedAt = new Date().toISOString();
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets));

    const rawTxs = localStorage.getItem(KEYS.WALLET_TRANSACTIONS);
    const txs: WalletTransaction[] = rawTxs ? JSON.parse(rawTxs) : [];
    const newTx: WalletTransaction = {
      id: createCuid('wtx_'),
      walletAccountId: target.id,
      type: 'credit',
      amountCents,
      balanceAfterCents: target.balanceCents,
      referenceType,
      referenceId,
      description,
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    localStorage.setItem(KEYS.WALLET_TRANSACTIONS, JSON.stringify(txs));

    this.notify();
    return target;
  }

  // 4. Refunds & Item-Level Refunds
  public getRefunds(): Refund[] {
    const raw = localStorage.getItem(KEYS.REFUNDS);
    return raw ? JSON.parse(raw) : [];
  }

  public requestRefund(
    orderId: string, 
    paymentId: string | undefined, 
    refundMethod: RefundMethod, 
    amountCents: number, 
    reason: string,
    items?: RefundItem[]
  ): Refund {
    const refunds = this.getRefunds();
    const newRefund: Refund = {
      id: createCuid('ref_'),
      orderId,
      paymentId,
      refundMethod,
      status: 'requested',
      amountCents,
      reason,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    refunds.unshift(newRefund);
    localStorage.setItem(KEYS.REFUNDS, JSON.stringify(refunds));

    const user = this.getCurrentUser();
    this.addAuditLog('request_refund', `Requested ${refundMethod} refund for order ${orderId}: ৳${Math.round(amountCents / 100)}`, 'order', orderId);
    this.sendNotification(user.id, 'order_update', 'Refund Request Submitted', `Your refund request for ৳${Math.round(amountCents / 100)} on order ${orderId} is currently under admin review.`);
    this.notify();

    return newRefund;
  }

  public approveRefund(refundId: string, approvedByUserId: string): Refund | undefined {
    const refunds = this.getRefunds();
    const refund = refunds.find(r => r.id === refundId);
    if (!refund) return undefined;

    refund.status = 'succeeded';
    refund.approvedByUserId = approvedByUserId;
    refund.approvedAt = new Date().toISOString();
    refund.updatedAt = new Date().toISOString();

    localStorage.setItem(KEYS.REFUNDS, JSON.stringify(refunds));

    // Update order payment status
    const orders = this.getOrders();
    const order = orders.find(o => o.id === refund.orderId);
    if (order) {
      order.paymentStatus = 'refunded';
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

      // Execute wallet credit if refundMethod === 'wallet_credit'
      if (refund.refundMethod === 'wallet_credit') {
        this.creditWallet(
          order.buyerUserId,
          refund.amountCents,
          `Approved refund credit for order #${order.id}`,
          'refund',
          refund.id
        );
      }
    }

    this.addAuditLog('approve_refund', `Approved ${refund.refundMethod} refund #${refund.id}`, 'order', refund.orderId);
    this.sendNotification(order?.buyerUserId || '', 'order_update', 'Refund Approved', `Your refund of ৳${Math.round(refund.amountCents / 100)} for order ${refund.orderId} has been successfully executed via ${refund.refundMethod.replace('_', ' ')}.`);
    this.notify();

    return refund;
  }

  // 5. Vendor Payout Accounts (Encrypted Details)
  public getVendorPayoutAccount(vendorProfileId: string): VendorPayoutAccount | undefined {
    const raw = localStorage.getItem(KEYS.PAYOUT_ACCOUNTS);
    const accounts: VendorPayoutAccount[] = raw ? JSON.parse(raw) : [];
    return accounts.find(a => a.vendorProfileId === vendorProfileId && a.isDefault);
  }

  public saveVendorPayoutAccount(vendorProfileId: string, payoutMethod: PayoutMethod, accountDetails: string): VendorPayoutAccount {
    const raw = localStorage.getItem(KEYS.PAYOUT_ACCOUNTS);
    const accounts: VendorPayoutAccount[] = raw ? JSON.parse(raw) : [];

    const maskedIdentifier = payoutMethod === 'bkash' 
      ? `bKash Merchant *******${accountDetails.slice(-4)}`
      : `Bank Account ****${accountDetails.slice(-4)}`;

    const newAccount: VendorPayoutAccount = {
      id: createCuid('payout_'),
      vendorProfileId,
      payoutMethod,
      detailsEncrypted: `enc_aes256_${payoutMethod}_${accountDetails}_salt${Date.now()}`,
      maskedIdentifier,
      isDefault: true,
      createdAt: new Date().toISOString()
    };

    // Deactivate previous defaults
    accounts.forEach(a => {
      if (a.vendorProfileId === vendorProfileId) a.isDefault = false;
    });

    accounts.unshift(newAccount);
    localStorage.setItem(KEYS.PAYOUT_ACCOUNTS, JSON.stringify(accounts));
    this.notify();
    return newAccount;
  }

  // 6. Vendor Settlements
  public generateVendorSettlement(vendorProfileId: string, periodStart: string, periodEnd: string): VendorSettlement {
    const vendors = this.getVendors();
    const vendor = vendors.find(v => v.id === vendorProfileId);
    const orders = this.getOrders();

    // Filter relevant vendor orders
    const vendorOrders = orders.flatMap(o => o.vendorOrders.filter(vo => vo.vendorProfileId === vendorProfileId));
    
    const items: VendorSettlementItem[] = vendorOrders.map(vo => ({
      id: createCuid('sitem_'),
      vendorSettlementId: '',
      vendorOrderId: vo.id,
      lineType: 'sale',
      amountCents: vo.subtotalCents,
      note: `Order #${vo.id} gross sales`
    }));

    const grossAmountCents = vendorOrders.reduce((sum, vo) => sum + vo.subtotalCents, 0);
    const commissionCents = Math.round(grossAmountCents * 0.10); // 10% platform commission
    const netAmountCents = grossAmountCents - commissionCents;

    const settlementId = createCuid('set_');
    items.forEach(i => i.vendorSettlementId = settlementId);

    const settlements = this.getSettlements();
    const newSettlement: VendorSettlement = {
      id: settlementId,
      vendorProfileId,
      vendorName: vendor?.displayName || 'Artisan Vendor',
      periodStart,
      periodEnd,
      grossAmountCents,
      commissionCents,
      netAmountCents,
      status: 'pending_review',
      items,
      createdAt: new Date().toISOString()
    };

    settlements.unshift(newSettlement);
    localStorage.setItem(KEYS.SETTLEMENTS, JSON.stringify(settlements));
    this.addAuditLog('settlement_generated', `Generated settlement for ${vendor?.displayName}`, 'settlement', newSettlement.id);
    this.notify();
    return newSettlement;
  }

  public generateSettlementBatch(periodStart: string, periodEnd: string): VendorSettlement[] {
    const vendors = this.getVendors().filter(v => v.status === 'approved');
    const createdBatch: VendorSettlement[] = [];
    for (const v of vendors) {
      const set = this.generateVendorSettlement(v.id, periodStart, periodEnd);
      createdBatch.push(set);
    }
    this.addAuditLog('settlement_batch_generated', `Generated settlement batch for period ${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)} (${createdBatch.length} vendors)`, 'settlement', 'batch_' + Date.now());
    return createdBatch;
  }

  public approveSettlement(settlementId: string): VendorSettlement | undefined {
    const settlements = this.getSettlements();
    const settlement = settlements.find(s => s.id === settlementId);
    if (!settlement) return undefined;

    settlement.status = 'paid';
    settlement.paidAt = new Date().toISOString();
    localStorage.setItem(KEYS.SETTLEMENTS, JSON.stringify(settlements));

    const vendor = this.getVendors().find(v => v.id === settlement.vendorProfileId);
    if (vendor) {
      this.sendNotification(vendor.ownerUserId, 'payout', 'Settlement Payout Dispatched', `Your bi-weekly settlement of ৳${Math.round(settlement.netAmountCents / 100).toLocaleString()} has been approved and paid.`);
    }

    this.addAuditLog('approve_settlement', `Paid bi-weekly settlement of ৳${Math.round(settlement.netAmountCents / 100)} to vendor ${settlement.vendorName}`, 'settlement', settlementId);
    this.notify();
    return settlement;
  }

  // --- PHASE 9: SHIPPING, DELIVERY ZONES & COURIER METHODS ---

  public getDeliveryZones(): DeliveryZone[] {
    const raw = localStorage.getItem(KEYS.DELIVERY_ZONES);
    return raw ? JSON.parse(raw) : INITIAL_DELIVERY_ZONES;
  }

  public updateDeliveryZone(id: string, updates: Partial<DeliveryZone>): DeliveryZone | undefined {
    const zones = this.getDeliveryZones();
    const idx = zones.findIndex(z => z.id === id);
    if (idx === -1) return undefined;
    zones[idx] = { ...zones[idx], ...updates };
    localStorage.setItem(KEYS.DELIVERY_ZONES, JSON.stringify(zones));
    this.notify();
    return zones[idx];
  }

  public getDeliveryLocations(): DeliveryLocation[] {
    const raw = localStorage.getItem(KEYS.DELIVERY_LOCATIONS);
    return raw ? JSON.parse(raw) : INITIAL_DELIVERY_LOCATIONS;
  }

  public addDeliveryLocation(loc: Omit<DeliveryLocation, 'id'>): DeliveryLocation {
    const locations = this.getDeliveryLocations();
    const newLoc: DeliveryLocation = {
      ...loc,
      id: createCuid('loc_')
    };
    locations.unshift(newLoc);
    localStorage.setItem(KEYS.DELIVERY_LOCATIONS, JSON.stringify(locations));
    this.notify();
    return newLoc;
  }

  public getCourierProviders() {
    const raw = localStorage.getItem(KEYS.COURIERS);
    return raw ? JSON.parse(raw) : INITIAL_COURIER_PROVIDERS;
  }

  public getShipments(): Shipment[] {
    const raw = localStorage.getItem(KEYS.SHIPMENTS);
    return raw ? JSON.parse(raw) : INITIAL_SHIPMENTS;
  }

  public getShipmentByVendorOrderId(vendorOrderId: string): Shipment | undefined {
    return this.getShipments().find(s => s.vendorOrderId === vendorOrderId);
  }

  public getShipmentEvents(shipmentId: string): ShipmentEvent[] {
    const raw = localStorage.getItem(KEYS.SHIPMENT_EVENTS);
    const events: ShipmentEvent[] = raw ? JSON.parse(raw) : INITIAL_SHIPMENT_EVENTS;
    return events.filter(e => e.shipmentId === shipmentId);
  }

  public bookShipment(
    vendorOrderId: string,
    courierCode: 'pathao' | 'redx' | 'steadfast' | string,
    customTrackingNumber?: string,
    overrideUserId?: string,
    overrideReason?: string
  ): { shipment: Shipment; event: ShipmentEvent } {
    const shipments = this.getShipments();
    const couriers = this.getCourierProviders();
    const courier = couriers.find(c => c.code === courierCode) || couriers[0];

    const prefix = courierCode.toUpperCase().slice(0, 3);
    const trackingNumber = customTrackingNumber?.trim() || `${prefix}-BD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newShipment: Shipment = {
      id: createCuid('shp_'),
      vendorOrderId,
      courierProviderId: courier.id,
      courierName: courier.name,
      trackingNumber,
      shippingFeeCents: 6000,
      codAmountCents: 0,
      status: 'booked',
      courierOverriddenByUserId: overrideUserId,
      courierOverrideReason: overrideReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shipments.unshift(newShipment);
    localStorage.setItem(KEYS.SHIPMENTS, JSON.stringify(shipments));

    const events = (localStorage.getItem(KEYS.SHIPMENT_EVENTS) ? JSON.parse(localStorage.getItem(KEYS.SHIPMENT_EVENTS)!) : INITIAL_SHIPMENT_EVENTS) as ShipmentEvent[];
    const initialEvent: ShipmentEvent = {
      id: createCuid('shpevt_'),
      shipmentId: newShipment.id,
      status: 'booked',
      location: 'Seller Warehouse / Workshop',
      description: `Shipment booked successfully with ${courier.name}. Tracking ID: ${trackingNumber}`,
      eventTimestamp: new Date().toISOString()
    };

    events.unshift(initialEvent);
    localStorage.setItem(KEYS.SHIPMENT_EVENTS, JSON.stringify(events));

    this.addAuditLog('shipment_booked', `Booked courier shipment ${trackingNumber} via ${courier.name} for vendor order ${vendorOrderId}`, 'order', vendorOrderId);
    this.notify();

    return { shipment: newShipment, event: initialEvent };
  }

  public addShipmentEvent(shipmentId: string, status: string, location: string, description: string): ShipmentEvent {
    const events = (localStorage.getItem(KEYS.SHIPMENT_EVENTS) ? JSON.parse(localStorage.getItem(KEYS.SHIPMENT_EVENTS)!) : INITIAL_SHIPMENT_EVENTS) as ShipmentEvent[];
    const newEvent: ShipmentEvent = {
      id: createCuid('shpevt_'),
      shipmentId,
      status,
      location,
      description,
      eventTimestamp: new Date().toISOString()
    };
    events.unshift(newEvent);
    localStorage.setItem(KEYS.SHIPMENT_EVENTS, JSON.stringify(events));

    const shipments = this.getShipments();
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment && ['booked', 'picked_up', 'in_transit', 'delivered', 'returned'].includes(status)) {
      shipment.status = status as any;
      shipment.updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.SHIPMENTS, JSON.stringify(shipments));
    }

    this.notify();
    return newEvent;
  }

  public resolveDeliverySuggestion(district: string, upazila: string) {
    const isDhaka = district.toLowerCase().includes('dhaka');
    const isRemote = ['rangamati', 'bandarban', 'khagrachhari', 'cox'].some(r => district.toLowerCase().includes(r) || upazila.toLowerCase().includes(r));

    let zoneCode: ZoneCode = 'outside_dhaka';
    let basePriceCents = 12000; // ৳120
    let estimatedDays = '2-4 Days';

    if (isDhaka) {
      zoneCode = 'dhaka_metro';
      basePriceCents = 6000; // ৳60
      estimatedDays = '1-2 Days';
    } else if (isRemote) {
      zoneCode = 'remote_area';
      basePriceCents = 18000; // ৳180
      estimatedDays = '4-7 Days';
    }

    const suggestions = [
      {
        courierCode: 'pathao',
        courierName: 'Pathao Logistics Express',
        confidenceScore: isDhaka ? 95 : 88,
        priceCents: basePriceCents,
        estimatedDays,
        supportsCod: true,
        recommendedReason: isDhaka ? 'Fastest same-day & 24h express pickup in Dhaka Metro' : 'Strong nationwide logistics courier network'
      },
      {
        courierCode: 'redx',
        courierName: 'RedX Delivery Network',
        confidenceScore: isRemote ? 92 : 86,
        priceCents: basePriceCents + 1000,
        estimatedDays,
        supportsCod: true,
        recommendedReason: 'Deepest coverage in remote & district upazilas'
      },
      {
        courierCode: 'steadfast',
        courierName: 'Steadfast Courier',
        confidenceScore: 85,
        priceCents: basePriceCents,
        estimatedDays,
        supportsCod: true,
        recommendedReason: 'COD payment collection specialist'
      }
    ];

    suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return {
      zoneCode,
      basePriceCents,
      estimatedDays,
      topSuggestion: suggestions[0],
      allSuggestions: suggestions
    };
  }

  // --- PHASE 10: CUSTOMER ENGAGEMENT, WISHLIST, REVIEWS, NOTIFICATIONS & STYLE PROFILES ---

  // 1. WISHLIST
  public getWishlist(userId: string): WishlistItem[] {
    const raw = localStorage.getItem(KEYS.WISHLIST);
    const list: WishlistItem[] = raw ? JSON.parse(raw) : INITIAL_WISHLIST;
    return list.filter(w => w.userId === userId);
  }

  public isInWishlist(userId: string, productId: string): boolean {
    return this.getWishlist(userId).some(w => w.productId === productId);
  }

  public toggleWishlist(userId: string, productId: string): { isWishlisted: boolean } {
    const raw = localStorage.getItem(KEYS.WISHLIST);
    let list: WishlistItem[] = raw ? JSON.parse(raw) : INITIAL_WISHLIST;
    const existingIndex = list.findIndex(w => w.userId === userId && w.productId === productId);

    let isWishlisted = false;
    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      isWishlisted = false;
    } else {
      const newItem: WishlistItem = {
        id: createCuid('wsh_'),
        userId,
        productId,
        createdAt: new Date().toISOString()
      };
      list.unshift(newItem);
      isWishlisted = true;
    }

    localStorage.setItem(KEYS.WISHLIST, JSON.stringify(list));
    this.notify();
    return { isWishlisted };
  }

  public getWishlistedProducts(userId: string): Product[] {
    const wishItems = this.getWishlist(userId);
    const productIds = new Set(wishItems.map(w => w.productId));
    const allProducts = this.getProducts();
    return allProducts.filter(p => productIds.has(p.id));
  }

  public checkWishlistRestock(productId: string, newStock: number) {
    if (newStock <= 0) return;
    const product = this.getProducts().find(p => p.id === productId);
    if (!product) return;

    const raw = localStorage.getItem(KEYS.WISHLIST);
    const list: WishlistItem[] = raw ? JSON.parse(raw) : INITIAL_WISHLIST;
    const wishers = list.filter(w => w.productId === productId);

    for (const w of wishers) {
      this.sendNotification(
        w.userId,
        'wishlist_restock',
        'Wishlisted Item Back in Stock!',
        `Good news! "${product.title}" is back in stock (${newStock} available). Grab yours before it runs out.`,
        'product',
        product.id
      );
    }
  }

  // 2. PRODUCT REVIEWS & MODERATION
  public getAllReviews(): ProductReview[] {
    const raw = localStorage.getItem(KEYS.REVIEWS);
    return raw ? JSON.parse(raw) : INITIAL_REVIEWS;
  }

  public getProductReviews(productId: string): ProductReview[] {
    return this.getAllReviews().filter(r => r.productId === productId && r.status === 'approved');
  }

  public getVendorReviews(vendorProfileId: string): ProductReview[] {
    return this.getAllReviews().filter(r => r.vendorProfileId === vendorProfileId);
  }

  public submitReview(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    productId: string,
    vendorProfileId: string,
    orderItemId: string,
    rating: number,
    title: string,
    comment: string
  ): ProductReview {
    const reviews = this.getAllReviews();

    // Check duplicate review for same order item
    const existing = reviews.find(r => r.userId === userId && r.orderItemId === orderItemId);
    if (existing) {
      throw new Error('You have already submitted a review for this purchased item.');
    }

    const newReview: ProductReview = {
      id: createCuid('rev_'),
      productId,
      userId,
      userName,
      userAvatar,
      orderItemId,
      vendorProfileId,
      rating,
      title,
      comment,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };

    reviews.unshift(newReview);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));

    // Audit Event
    const eventsRaw = localStorage.getItem(KEYS.REVIEW_EVENTS);
    const events: ReviewStatusEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];
    events.unshift({
      id: createCuid('revevt_'),
      reviewId: newReview.id,
      actionByUserId: userId,
      previousStatus: 'none',
      newStatus: 'submitted',
      notes: 'Submitted by verified buyer',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(KEYS.REVIEW_EVENTS, JSON.stringify(events));

    this.addAuditLog('review_submitted', `Buyer ${userName} submitted review for product ${productId}`, 'product', productId);
    this.notify();
    return newReview;
  }

  public updateReviewStatus(
    reviewId: string,
    status: 'approved' | 'rejected' | 'hidden',
    actionByUserId: string,
    notes?: string,
    rejectionReason?: string
  ): ProductReview | undefined {
    const reviews = this.getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return undefined;

    const prevStatus = reviews[idx].status;
    reviews[idx].status = status;
    if (status === 'approved') reviews[idx].approvedAt = new Date().toISOString();
    if (status === 'rejected') {
      reviews[idx].rejectedAt = new Date().toISOString();
      reviews[idx].rejectionReason = rejectionReason || 'Content did not comply with moderation guidelines.';
    }

    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalculate product rating
    if (status === 'approved') {
      const prodReviews = reviews.filter(r => r.productId === reviews[idx].productId && r.status === 'approved');
      if (prodReviews.length > 0) {
        const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
        const products = this.getProducts();
        const pIdx = products.findIndex(p => p.id === reviews[idx].productId);
        if (pIdx !== -1) {
          products[pIdx].rating = Number(avg.toFixed(1));
          products[pIdx].reviewCount = prodReviews.length;
          localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
        }
      }
    }

    // Append Audit Event
    const eventsRaw = localStorage.getItem(KEYS.REVIEW_EVENTS);
    const events: ReviewStatusEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];
    events.unshift({
      id: createCuid('revevt_'),
      reviewId,
      actionByUserId,
      previousStatus: prevStatus,
      newStatus: status,
      notes: notes || rejectionReason,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(KEYS.REVIEW_EVENTS, JSON.stringify(events));

    // Notify reviewer if rejected
    if (status === 'rejected') {
      this.sendNotification(
        reviews[idx].userId,
        'system',
        'Review Moderation Notice',
        `Your review for "${reviews[idx].title}" was rejected. Reason: ${rejectionReason || 'Moderation policy guidelines'}`,
        'review',
        reviewId
      );
    }

    this.addAuditLog('review_moderated', `Review ${reviewId} status updated from ${prevStatus} to ${status}`, 'product', reviews[idx].productId);
    this.notify();
    return reviews[idx];
  }

  public getReviewStatusEvents(reviewId: string): ReviewStatusEvent[] {
    const eventsRaw = localStorage.getItem(KEYS.REVIEW_EVENTS);
    const events: ReviewStatusEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];
    return events.filter(e => e.reviewId === reviewId);
  }

  // 3. NOTIFICATIONS
  public getNotifications(userId: string): Notification[] {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    const list: Notification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    return list.filter(n => n.userId === userId);
  }

  public getUnreadNotificationCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  public markNotificationRead(id: string) {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    const list: Notification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  public markAllNotificationsRead(userId: string) {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    const list: Notification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    let changed = false;
    for (const n of list) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify();
    }
  }

  public sendNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    body: string,
    entityType?: string,
    entityId?: string
  ): Notification {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    const list: Notification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const newNotif: Notification = {
      id: createCuid('notif_'),
      userId,
      type,
      title,
      body,
      entityType,
      entityId,
      read: false,
      createdAt: new Date().toISOString()
    };
    list.unshift(newNotif);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
    this.notify();
    return newNotif;
  }

  // 4. USER STYLE PROFILE
  public getUserStyleProfile(userId: string): UserStyleProfile | undefined {
    const raw = localStorage.getItem(KEYS.STYLE_PROFILES);
    const profiles: UserStyleProfile[] = raw ? JSON.parse(raw) : INITIAL_USER_STYLE_PROFILES;
    return profiles.find(p => p.userId === userId && !p.deletedAt);
  }

  public saveUserStyleProfile(userId: string, data: Partial<UserStyleProfile>): UserStyleProfile {
    const raw = localStorage.getItem(KEYS.STYLE_PROFILES);
    let profiles: UserStyleProfile[] = raw ? JSON.parse(raw) : INITIAL_USER_STYLE_PROFILES;
    const idx = profiles.findIndex(p => p.userId === userId);

    if (idx !== -1) {
      profiles[idx] = {
        ...profiles[idx],
        ...data,
        userId,
        consentedAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.STYLE_PROFILES, JSON.stringify(profiles));
      this.notify();
      return profiles[idx];
    } else {
      const newProfile: UserStyleProfile = {
        id: createCuid('usp_'),
        userId,
        department: data.department || 'Women',
        sizeTops: data.sizeTops || 'M',
        sizeBottoms: data.sizeBottoms || 'M',
        sizeShoes: data.sizeShoes || '38 EU',
        preferences: data.preferences || { favoriteCrafts: ['Jamdani Weaving'], preferredColors: ['Indigo'] },
        consentVersion: 'v1.0',
        consentedAt: new Date().toISOString()
      };
      profiles.unshift(newProfile);
      localStorage.setItem(KEYS.STYLE_PROFILES, JSON.stringify(profiles));
      this.notify();
      return newProfile;
    }
  }
}

export const storageService = new StorageService();
