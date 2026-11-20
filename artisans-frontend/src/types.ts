/**
 * Core Data Models for The Artisan's Market
 * E-Commerce Architecture adhering to CUID2 keys, Integer Cents monetary storage,
 * application-level ENUMs, and immutable JSON commerce snapshots.
 */

export type UserRole = 'user' | 'vendor_user' | 'wholesaler' | 'admin';

export interface User {
  id: string; // CUID2
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  isBanned?: boolean;
  banReason?: string;
  codEligibilityOverride?: boolean;
  createdAt: string;
}

export interface UserTrustProfile {
  id: string;
  userId: string;
  score: number; // 0-100 score
  codEligible: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  manualReviewRequired: boolean;
  lastEvaluatedAt: string;
}

export interface UserTrustEvent {
  id: string;
  userId: string;
  eventType: string;
  scoreDelta: number;
  reason: string;
  createdAt: string;
}

export interface CouponRules {
  discount: {
    type: 'percentage' | 'fixed';
    value: number; // percentage (e.g., 15 = 15%) or fixed amount in Cents
  };
  conditions?: {
    min_order_amount?: number; // in Cents
    max_discount_cap?: number; // max cap in Cents (for percentage)
    applicable_categories?: string[];
    first_order_only?: boolean;
    max_uses_per_user?: number;
    specific_vendor_id?: string;
  };
}

export interface Coupon {
  id: string; // CUID2
  code: string; // uppercase unique coupon code
  description: string;
  status: 'active' | 'inactive' | 'expired';
  type: 'platform' | 'vendor';
  vendorProfileId?: string | null; // null = platform-wide
  rules: CouponRules;
  usageLimit?: number | null; // null = unlimited
  usageCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRedemption {
  id: string; // CUID2
  couponId: string;
  userId: string;
  orderId: string;
  discountAmountCents: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order_placed' | 'order_shipped' | 'order_delivered' | 'review_request' | 'wishlist_restock' | 'vendor_approved' | 'vendor_rejected' | 'product_approved' | 'product_rejected' | 'seller_new_order' | 'payout_sent' | 'order_update' | 'trust_update' | 'vendor_status' | 'payout' | 'system';
  entityType?: 'order' | 'product' | 'review' | 'payout' | string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  entityType: 'vendor' | 'product' | 'user' | 'settlement' | 'coupon' | 'trust' | 'order' | 'wallet' | 'refund' | 'impersonation';
  entityId: string;
  reason?: string;
  publicMessage?: string;
  privateNote?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  impersonatedUserId?: string;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  entityType: 'vendor' | 'product' | 'user' | 'order';
  entityId: string;
  adminUserId: string;
  adminEmail: string;
  note: string;
  createdAt: string;
}

export type VendorStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface VendorProfile {
  id: string; // CUID2
  organizationId: string;
  ownerUserId: string;
  publicSlug: string;
  displayName: string;
  legalName?: string;
  status: VendorStatus;
  statusReason?: string;
  craftSpecialty: string; // e.g. "Terracotta & Earthenware Pottery", "Handloom Muslin & Jamdani Weaving"
  description: string;
  workshopLocation: string; // e.g. "Dhamrai, Dhaka", "Srimangal, Moulvibazar"
  supportEmail: string;
  supportPhone: string;
  allowCod: boolean;
  rating: number;
  reviewCount: number;
  verifiedArtisan: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  portfolioImages?: string[];
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export type ProductCategory = 
  | 'pottery' 
  | 'woodwork' 
  | 'jewelry' 
  | 'textiles' 
  | 'paintings' 
  | 'leatherwork' 
  | 'glass_resin' 
  | 'custom_gifts' 
  | 'raw_materials';

export interface CustomizationOption {
  id: string;
  type: 'text' | 'select' | 'color' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: string[]; // for 'select'
  required: boolean;
  priceModifierCents: number; // Integer cents added when selected/filled
}

export interface Product {
  id: string; // CUID2
  vendorProfileId: string;
  vendorName: string;
  vendorSlug: string;
  vendorLocation: string;
  title: string;
  description: string;
  category: ProductCategory;
  tags: string[];
  priceCents: number; // Integer cents
  compareAtPriceCents?: number;
  images: string[];
  inStockQuantity: number;
  isCustomizable: boolean;
  customizationOptions?: CustomizationOption[];
  materialsUsed: string[];
  craftTimeDays: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  currentVersionId: string;
  latestVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleTier {
  minQuantity: number;
  pricePerUnitCents: number;
}

export interface RawMaterial {
  id: string; // CUID2
  wholesalerVendorProfileId: string;
  supplierName: string;
  name: string;
  category: RawMaterialCategory;
  description: string;
  priceCents: number;
  unit: string; // 'pack' | 'spool' | 'bag' | 'set' | 'kg'
  moq: number; // minimum order quantity
  stockQuantity: number;
  status: RawMaterialStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartCustomSelection {
  optionLabel: string;
  value: string;
  priceModifierCents: number;
}

export interface CartItem {
  id: string; // CUID2
  productId?: string;
  rawMaterialId?: string;
  itemType: 'product' | 'raw_material';
  title: string;
  image: string;
  unitPriceCents: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  isCustomizable?: boolean;
  customSelections?: CartCustomSelection[];
  customNote?: string;
  unitLabel?: string; // for raw materials e.g. "kg"
}

export interface Address {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  division: string;
  district: string;
  upazila: string;
  postalCode: string;
  isDefault?: boolean;
  deliveryNote?: string;
}

export interface CourierProvider {
  id: string;
  code: string;
  name: string;
  logo: string;
  estimatedDeliveryDays: string;
  basePriceCents: number;
  codSupported: boolean;
}

export type PaymentMethod = 'cod' | 'bkash' | 'sslcommerz';
export type OrderStatus = 'placed' | 'processing' | 'crafting' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export interface OrderItemSnapshot {
  id: string;
  itemType: 'product' | 'raw_material';
  title: string;
  image: string;
  unitPriceCents: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  customSelections?: CartCustomSelection[];
  customNote?: string;
}

export interface VendorOrder {
  id: string; // CUID2
  vendorProfileId: string;
  vendorName: string;
  items: OrderItemSnapshot[];
  subtotalCents: number;
  shippingFeeCents: number;
  status: OrderStatus;
  courierName: string;
  trackingNumber?: string;
  estimatedDelivery: string;
}

export interface Order {
  id: string; // CUID2 order transaction ID
  buyerUserId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddressSnapshot: Address;
  vendorOrders: VendorOrder[];
  totalAmountCents: number;
  subtotalCents: number;
  totalShippingCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}

export interface ProductReview {
  id: string; // CUID2
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  orderItemId: string; // Verified purchase check
  vendorProfileId: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  status: 'submitted' | 'approved' | 'rejected' | 'hidden';
  rejectionReason?: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export type PaymentAttemptProvider = 'cod' | 'bkash' | 'sslcommerz';
export type PaymentAttemptStatus = 'created' | 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
export type RefundStatus = 'requested' | 'approved' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type RefundMethod = 'original_payment_source' | 'manual_bank_transfer' | 'mobile_wallet' | 'wallet_credit' | 'gift_credit';
export type SettlementStatus = 'draft' | 'pending_review' | 'approved' | 'paid' | 'cancelled';
export type SettlementLineType = 'sale' | 'commission' | 'refund_deduction' | 'adjustment' | 'shipping_fee';
export type PayoutMethod = 'bkash' | 'bank_transfer';

export interface PaymentAttempt {
  id: string; // CUID2
  orderId: string;
  provider: PaymentAttemptProvider;
  status: PaymentAttemptStatus;
  amountCents: number;
  currency: string;
  gatewayReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string; // CUID2
  paymentAttemptId: string;
  orderId: string;
  provider: PaymentAttemptProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  transactionId: string; // e.g. TRX_BKASH_984321
  providerSignatureHash?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentProviderEvent {
  id: string; // CUID2
  provider: PaymentAttemptProvider;
  eventType: string;
  eventId: string; // Unique webhook event ID
  rawPayload: Record<string, unknown>;
  signatureValid: boolean;
  processedAt: string;
  createdAt: string;
}

export interface RefundItem {
  id: string;
  refundId: string;
  orderItemId: string;
  quantity: number;
  amountCents: number;
}

export interface Refund {
  id: string; // CUID2
  orderId: string;
  paymentId?: string;
  refundMethod: RefundMethod;
  status: RefundStatus;
  amountCents: number;
  reason: string;
  approvedByUserId?: string;
  approvedAt?: string;
  items?: RefundItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletAccount {
  id: string; // CUID2
  userId: string;
  balanceCents: number;
  currency: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string; // CUID2
  walletAccountId: string;
  type: 'credit' | 'debit';
  amountCents: number;
  balanceAfterCents: number;
  referenceType: 'refund' | 'order_payment' | 'admin_adjustment';
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface VendorSettlementItem {
  id: string;
  vendorSettlementId: string;
  vendorOrderId: string;
  lineType: SettlementLineType;
  amountCents: number;
  note?: string;
}

export interface VendorSettlement {
  id: string;
  vendorProfileId: string;
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  grossAmountCents: number;
  commissionCents: number; // 10% platform commission
  netAmountCents: number;
  status: SettlementStatus;
  approvedByUserId?: string;
  paidAt?: string;
  createdAt: string;
  items?: VendorSettlementItem[];
}

export interface VendorPayoutAccount {
  id: string; // CUID2
  vendorProfileId: string;
  payoutMethod: PayoutMethod;
  detailsEncrypted: string;
  maskedIdentifier: string; // e.g. "bKash *******5678" or "City Bank ****4321"
  isDefault: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

// --- PHASE 8: RAW MATERIALS WHOLESALE MARKETPLACE TYPES ---

export type RawMaterialCategory = 'Beads' | 'Yarn' | 'Clay' | 'Wood' | 'Leather' | 'Metals' | 'Packaging';
export type RawMaterialStatus = 'active' | 'inactive' | 'out_of_stock';
export type WholesaleOrderStatus = 'pending' | 'accepted' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface WholesaleCartItem {
  rawMaterial: RawMaterial;
  quantity: number;
}

export interface WholesaleOrder {
  id: string; // CUID2
  buyerVendorProfileId: string;
  buyerName: string;
  supplierVendorProfileId: string;
  supplierName: string;
  rawMaterialId: string;
  materialName: string;
  unitPriceCents: number;
  quantity: number;
  totalAmountCents: number;
  status: WholesaleOrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddressSnapshot: Address;
  createdAt: string;
  updatedAt: string;
}

// --- PHASE 9: SHIPPING, DELIVERY ZONES & COURIER TYPES ---

export type ZoneCode = 'dhaka_metro' | 'outside_dhaka' | 'remote_area';

export interface DeliveryZone {
  id: string;
  code: ZoneCode;
  name: string;
  basePriceCents: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  isActive: boolean;
}

export interface DeliveryLocation {
  id: string;
  division: string;
  district: string;
  upazilaThana: string;
  postalCode?: string;
  isRemote: boolean;
}

export interface CourierServiceArea {
  id: string;
  courierProviderId: string;
  deliveryLocationId: string;
  isPickupAvailable: boolean;
  isDeliveryAvailable: boolean;
  isCodAvailable: boolean;
  surchargeCents: number;
}

export interface Shipment {
  id: string;
  vendorOrderId: string;
  courierProviderId: string;
  courierName: string;
  trackingNumber: string;
  shippingFeeCents: number;
  codAmountCents: number;
  status: 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'returned';
  courierOverriddenByUserId?: string;
  courierOverrideReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  eventTimestamp: string;
}

export interface DeliverySuggestion {
  id: string;
  buyerAddressId?: string;
  deliveryLocationId: string;
  recommendedCourierId: string;
  confidenceScore: number;
  scoringBreakdown: {
    codScore: number;
    priceScore: number;
    speedScore: number;
    availabilityScore: number;
  };
  createdAt: string;
}

// --- PHASE 10: CUSTOMER ENGAGEMENT, WISHLIST, REVIEWS & NOTIFICATIONS TYPES ---

export interface WishlistItem {
  id: string; // CUID2
  userId: string;
  productId: string;
  createdAt: string;
}

export interface ReviewStatusEvent {
  id: string; // CUID2
  reviewId: string;
  actionByUserId: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
  createdAt: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: 'in_app' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed';
  sentAt: string;
}

export interface UserStyleProfile {
  id: string; // CUID2
  userId: string;
  department?: string;
  sizeTops?: string;
  sizeBottoms?: string;
  sizeShoes?: string;
  preferences?: {
    favoriteCrafts?: string[];
    preferredColors?: string[];
    styleCategories?: string[];
  };
  consentVersion: string;
  consentedAt: string;
  deletedAt?: string;
}



