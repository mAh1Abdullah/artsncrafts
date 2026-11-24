import { z } from 'zod';

/**
 * Shared HTTP Transport DTOs & Zod Validators (@waw/contracts)
 * Zero database/ORM coupling — safe for both Astro 7.4 storefront and Next.js 16 API.
 */

export const ProductCategorySchema = z.enum([
  'pottery',
  'textiles',
  'woodwork',
  'jewelry',
  'leatherwork',
  'paintings',
  'handicrafts',
  'custom_gifts',
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const CustomizationOptionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'select', 'color', 'checkbox']),
  label: z.string(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  priceModifierBdt: z.number().nonnegative().default(0),
});
export type CustomizationOptionDTO = z.infer<typeof CustomizationOptionSchema>;

export const ProductDTOSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable().optional(),
  storeId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  vendorName: z.string(),
  vendorSlug: z.string(),
  vendorLocation: z.string(),
  categoryId: z.string().nullable().optional(),
  category: ProductCategorySchema,
  brand: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  unitCost: z.number().nonnegative(),
  sellingPrice: z.number().positive(), // USD reference
  priceBdt: z.number().nonnegative(), // BDT authoritative storefront price
  compareAtPriceBdt: z.number().nonnegative().optional(),
  currentStock: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  isSyncedToEcommerce: z.boolean(),
  isCustomizable: z.boolean().default(false),
  customizationOptions: z.array(CustomizationOptionSchema).default([]),
  materialsUsed: z.array(z.string()).default([]),
  craftTimeDays: z.number().int().positive().default(3),
  tags: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(4.8),
  reviewCount: z.number().int().nonnegative().default(0),
  moderationStatus: z.enum(['draft', 'pending', 'approved', 'rejected']).default('approved'),
  rejectionReason: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductDTO = z.infer<typeof ProductDTOSchema>;

export const CreateProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(2).max(64),
  description: z.string().trim().max(2000).optional().nullable(),
  brand: z.string().trim().max(120).optional().nullable(),
  vendorId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  category: ProductCategorySchema.optional(),
  barcode: z.string().trim().max(64).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  unitCost: z.coerce.number().nonnegative().default(0),
  sellingPrice: z.coerce.number().positive(),
  priceBdt: z.coerce.number().positive().optional(),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(5),
  isSyncedToEcommerce: z.boolean().default(true),
  isCustomizable: z.boolean().default(false),
  craftTimeDays: z.coerce.number().int().positive().default(4),
  materialsUsed: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  moderationStatus: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial().extend({
  rejectionReason: z.string().max(500).optional().nullable(),
});
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

// ============================================================================
// VENDORS / ARTISAN STUDIOS
// ============================================================================
export const VendorStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'suspended',
]);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VendorDTOSchema = z.object({
  id: z.string(),
  publicSlug: z.string(),
  displayName: z.string(),
  legalName: z.string().optional(),
  status: VendorStatusSchema,
  statusReason: z.string().optional(),
  craftSpecialty: z.string(),
  description: z.string(),
  workshopLocation: z.string(),
  supportEmail: z.string().email(),
  supportPhone: z.string(),
  allowCod: z.boolean(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  verifiedArtisan: z.boolean(),
  avatarUrl: z.string(),
  bannerUrl: z.string(),
  createdAt: z.string(),
});
export type VendorDTO = z.infer<typeof VendorDTOSchema>;

export const CreateVendorApplicationSchema = z.object({
  displayName: z.string().trim().min(3).max(120),
  legalName: z.string().trim().max(120).optional(),
  craftSpecialty: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(1500),
  workshopLocation: z.string().trim().min(3).max(160),
  supportEmail: z.string().trim().email(),
  supportPhone: z.string().trim().min(8).max(24),
  allowCod: z.boolean().default(true),
});
export type CreateVendorApplication = z.infer<typeof CreateVendorApplicationSchema>;

export const UpdateVendorSchema = z.object({
  status: VendorStatusSchema.optional(),
  statusReason: z.string().max(500).optional(),
  privateNote: z.string().max(500).optional(),
  displayName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1500).optional(),
  workshopLocation: z.string().trim().max(160).optional(),
  supportEmail: z.string().trim().email().optional(),
  supportPhone: z.string().trim().max(24).optional(),
  allowCod: z.boolean().optional(),
});
export type UpdateVendorRequest = z.infer<typeof UpdateVendorSchema>;

// ============================================================================
// RAW MATERIALS WHOLESALE
// ============================================================================
export const RawMaterialCategorySchema = z.enum([
  'Beads',
  'Yarn',
  'Clay',
  'Wood',
  'Leather',
  'Metals',
  'Packaging',
]);
export type RawMaterialCategory = z.infer<typeof RawMaterialCategorySchema>;

export const RawMaterialDTOSchema = z.object({
  id: z.string(),
  wholesalerVendorProfileId: z.string(),
  supplierName: z.string(),
  name: z.string(),
  category: RawMaterialCategorySchema,
  description: z.string(),
  priceBdt: z.number().positive(),
  unit: z.string(),
  moq: z.number().int().positive(),
  stockQuantity: z.number().int().nonnegative(),
  status: z.enum(['active', 'inactive', 'out_of_stock']),
  imageUrl: z.string(),
  createdAt: z.string(),
});
export type RawMaterialDTO = z.infer<typeof RawMaterialDTOSchema>;

export const CreateRawMaterialSchema = z.object({
  wholesalerVendorProfileId: z.string().default('v-dhamrai-clay'),
  supplierName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(160),
  category: RawMaterialCategorySchema,
  description: z.string().trim().min(5).max(1200),
  priceBdt: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(32),
  moq: z.coerce.number().int().positive().default(5),
  stockQuantity: z.coerce.number().int().nonnegative().default(50),
  imageUrl: z.string().trim().optional(),
});
export type CreateRawMaterialRequest = z.infer<typeof CreateRawMaterialSchema>;

export const CreateWholesaleOrderSchema = z.object({
  buyerVendorName: z.string().trim().min(2),
  buyerPhone: z.string().trim().min(8),
  shippingAddress: z.string().trim().min(5),
  paymentMethod: z.enum(['bkash', 'nagad', 'sslcommerz', 'amarpay']), // Online only (no COD)
  items: z
    .array(
      z.object({
        rawMaterialId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});
export type CreateWholesaleOrderRequest = z.infer<typeof CreateWholesaleOrderSchema>;

export const WholesaleOrderStatusSchema = z.enum([
  'pending',
  'accepted',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export type WholesaleOrderStatus = z.infer<typeof WholesaleOrderStatusSchema>;

export const UpdateWholesaleOrderStatusSchema = z.object({
  status: WholesaleOrderStatusSchema,
});
export type UpdateWholesaleOrderStatusRequest = z.infer<typeof UpdateWholesaleOrderStatusSchema>;

export interface WholesaleOrderDTO {
  id: string;
  orderNumber: string;
  buyerVendorName: string;
  buyerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  totalAmountBdt: number;
  status: WholesaleOrderStatus;
  items: Array<{
    rawMaterialId: string;
    name: string;
    supplierName: string;
    unit: string;
    unitPriceBdt: number;
    quantity: number;
    lineTotalBdt: number;
  }>;
  createdAt: string;
}

// ============================================================================
// ORDERS & CHECKOUT
// ============================================================================
export const PaymentMethodSchema = z.enum([
  'bkash',
  'nagad',
  'uddoktapay',
  'amarpay',
  'sslcommerz',
  'cod',
  'card',
  'cash',
]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const OrderItemInputSchema = z.object({
  productId: z.string(),
  productName: z.string().min(1),
  sku: z.string().optional(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  customSelections: z
    .array(
      z.object({
        optionLabel: z.string(),
        value: z.string(),
        priceModifierBdt: z.number().default(0),
      })
    )
    .optional(),
  customNote: z.string().max(400).optional(),
});

export const CreateOrderRequestSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().min(8).max(24),
  shippingAddress: z.string().trim().min(5).max(500),
  district: z.string().trim().optional(),
  items: z.array(OrderItemInputSchema).min(1),
  subtotalAmount: z.coerce.number().nonnegative().optional(),
  shippingFee: z.coerce.number().nonnegative().default(0),
  discountAmount: z.coerce.number().nonnegative().default(0),
  couponCode: z.string().trim().optional(),
  totalAmount: z.coerce.number().nonnegative().optional(),
  advanceAmount: z.coerce.number().nonnegative().default(0),
  paymentMethod: PaymentMethodSchema.default('cod'),
  courierService: z.enum(['pathao', 'steadfast', 'redx']).nullable().optional(),
  notes: z.string().max(500).optional(),
  buyerUserId: z.string().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export interface OrderDTO {
  id: string;
  orderNumber: string;
  buyerUserId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    vendorId?: string;
    vendorName?: string;
    quantity: number;
    unitPrice: number;
    customSelections?: Array<{ optionLabel: string; value: string; priceModifierBdt: number }>;
    customNote?: string;
  }>;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string | null;
  totalAmount: number;
  advanceAmount: number;
  dueBalance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'pending' | 'processing' | 'crafting' | 'shipped' | 'delivered' | 'completed' | 'voided' | 'incomplete' | 'cancelled';
  courierService: 'pathao' | 'steadfast' | 'redx' | null;
  trackingCode: string | null;
  courierStatus?: 'pending_pickup' | 'in_transit' | 'delivered' | 'returned';
  fraudRiskScore: number;
  fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudSignals?: string[];
  notes?: string;
  createdAt: string;
}

export const UpdateOrderRequestSchema = z.object({
  status: z
    .enum([
      'pending',
      'processing',
      'crafting',
      'shipped',
      'delivered',
      'completed',
      'voided',
      'incomplete',
      'cancelled',
    ])
    .optional(),
  courierService: z.enum(['pathao', 'steadfast', 'redx']).nullable().optional(),
  trackingCode: z.string().max(80).nullable().optional(),
  courierStatus: z.enum(['pending_pickup', 'in_transit', 'delivered', 'returned']).optional(),
  advanceAmount: z.coerce.number().nonnegative().optional(),
});
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

// ============================================================================
// COUPONS, REVIEWS, SHIPPING, SETTLEMENTS, BUYER PROFILE & AUDIT LOGS
// ============================================================================
export interface CouponDTO {
  id: string;
  code: string;
  description: string;
  status: 'active' | 'inactive' | 'expired';
  type: 'platform' | 'vendor';
  discountType: 'percentage' | 'fixed';
  discountValue: number; // % or BDT
  minOrderBdt: number;
  maxDiscountCapBdt?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  createdAt: string;
}

export const CreateCouponSchema = z.object({
  code: z.string().trim().min(3).max(32),
  description: z.string().trim().min(3).max(240),
  type: z.enum(['platform', 'vendor']).default('platform'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive(),
  minOrderBdt: z.coerce.number().nonnegative().default(0),
  maxDiscountCapBdt: z.coerce.number().positive().nullable().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
});
export type CreateCouponRequest = z.infer<typeof CreateCouponSchema>;

export const ValidateCouponSchema = z.object({
  code: z.string().trim().min(1),
  subtotalBdt: z.coerce.number().nonnegative(),
});

export interface CouponValidationResultDTO {
  valid: boolean;
  code: string;
  discountBdt: number;
  message: string;
  coupon?: CouponDTO;
}

export interface ReviewDTO {
  id: string;
  productId: string;
  vendorProfileId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'submitted' | 'approved' | 'rejected' | 'hidden';
  rejectionReason?: string | null;
  createdAt: string;
}

export const CreateReviewSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().default('buyer-anika'),
  userName: z.string().trim().min(2).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(140),
  comment: z.string().trim().min(5).max(1200),
});
export type CreateReviewRequest = z.infer<typeof CreateReviewSchema>;

export interface DeliveryZoneDTO {
  id: string;
  code: 'dhaka_metro' | 'outside_dhaka' | 'remote_area';
  name: string;
  basePriceBdt: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  isActive: boolean;
}

export interface CourierProviderDTO {
  id: string;
  code: 'pathao' | 'steadfast' | 'redx';
  name: string;
  supportsCod: boolean;
  avgDeliveryHours: number;
  basePriceBdt: number;
  isActive: boolean;
}

export interface CourierSuggestionDTO {
  district: string;
  upazila: string;
  zone: DeliveryZoneDTO;
  recommendedCourier: CourierProviderDTO;
  confidenceScore: number;
  estimatedFeeBdt: number;
  scoringBreakdown: {
    codScore: number;
    priceScore: number;
    speedScore: number;
    availabilityScore: number;
  };
}

export interface ShipmentEventDTO {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  eventTimestamp: string;
}

export interface ShipmentDTO {
  id: string;
  orderId: string;
  orderNumber: string;
  courierCode: 'pathao' | 'steadfast' | 'redx';
  courierName: string;
  trackingNumber: string;
  shippingFeeBdt: number;
  codAmountBdt: number;
  status: 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'returned';
  overrideReason?: string | null;
  events: ShipmentEventDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorSettlementDTO {
  id: string;
  vendorProfileId: string;
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  grossAmountBdt: number;
  commissionBdt: number;
  netAmountBdt: number;
  status: 'draft' | 'pending_review' | 'approved' | 'paid' | 'cancelled';
  payoutAccountMasked: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface BuyerTrustEventDTO {
  id: string;
  eventType: string;
  reason: string;
  scoreDelta: number;
  createdAt: string;
}

export interface BuyerStyleProfileDTO {
  department: string;
  sizeTops?: string;
  sizeBottoms?: string;
  sizeShoes?: string;
  favoriteCrafts: string[];
  preferredColors: string[];
  consentVersion?: string | null;
}

export interface BuyerProfileDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneNumberVerified: boolean;
  walletBalanceBdt: number;
  trustScore: number;
  codEligible: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  wishlistProductIds: string[];
  savedAddresses: Array<{
    id: string;
    label: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    district: string;
    division: string;
    postalCode: string;
    isDefault: boolean;
  }>;
  styleProfile: BuyerStyleProfileDTO;
  trustEvents: BuyerTrustEventDTO[];
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

export const UpdateBuyerProfileRequestSchema = z.object({
  trustScore: z.coerce.number().min(0).max(100).optional(),
  codEligible: z.boolean().optional(),
  styleProfile: z
    .object({
      department: z.string().trim().min(1).max(120),
      sizeTops: z.string().trim().max(32).optional(),
      sizeBottoms: z.string().trim().max(32).optional(),
      sizeShoes: z.string().trim().max(32).optional(),
      favoriteCrafts: z.array(z.string().trim().max(60)).max(12),
      preferredColors: z.array(z.string().trim().max(60)).max(12).optional(),
      consentVersion: z.string().trim().max(32).nullable().optional(),
    })
    .optional(),
});
export type UpdateBuyerProfileRequest = z.infer<typeof UpdateBuyerProfileRequestSchema>;

export const MarkNotificationsReadSchema = z.object({
  notificationId: z.string().trim().min(1).optional(),
  all: z.boolean().optional(),
});
export type MarkNotificationsReadRequest = z.infer<typeof MarkNotificationsReadSchema>;

export interface AdminAuditLogDTO {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'vendor' | 'product' | 'review' | 'coupon' | 'settlement' | 'order' | 'shipment' | 'user';
  entityId: string;
  reason?: string;
  createdAt: string;
}

// ============================================================================
// AI SERVICES (Gemini 4 Hydrogen — Server-Side Next.js API)
// ============================================================================
export const CraftAdvisorRequestSchema = z.object({
  prompt: z.string().trim().min(5, 'Please describe the craft item you have in mind.').max(1000),
});
export type CraftAdvisorRequest = z.infer<typeof CraftAdvisorRequestSchema>;

export interface CraftAdvisorResponseDTO {
  craftRecommendation: string;
  recommendedMaterials: string[];
  suggestedCustomizations: string[];
  artisanMatchNote: string;
}

export const ProductStoryRequestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(60),
  materials: z.string().trim().min(2).max(300),
});
export type ProductStoryRequest = z.infer<typeof ProductStoryRequestSchema>;

export interface ProductStoryResponseDTO {
  craftedTitle: string;
  engagingStory: string;
  suggestedTags: string[];
  careInstructions: string;
}
