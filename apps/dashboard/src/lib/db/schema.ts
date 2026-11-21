import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ============================================================================
// 1. ENUMS
// ============================================================================
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'starter',
  'pro',
  'enterprise',
  'custom',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'past_due',
  'canceled',
  'suspended',
  'expired',
]);

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'admin',
  'manager',
  'store_manager',
  'cashier',
  'vendor',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'upi',
  'bkash',
  'nagad',
  'uddoktapay',
  'amarpay',
  'cod',
  'mobile_banking',
  'split',
  'external',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'paid',
  'partial',
  'unpaid',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'completed',
  'refunded',
  'voided',
  'partially_refunded',
  'incomplete',
  'cancelled',
]);

export const courierServiceEnum = pgEnum('courier_service', [
  'pathao',
  'steadfast',
]);

export const cartRecoveryStatusEnum = pgEnum('cart_recovery_status', [
  'pending',
  'recovered',
  'lost',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'synced',
  'failed',
  'retrying',
]);

export const integrationPlatformEnum = pgEnum('integration_platform', [
  'shopify',
  'woocommerce',
  'custom_webhook',
  'waw_marketplace',
]);

// ============================================================================
// 2. TENANCY & STORES (Multi-Tenant Isolation with store_id)
// ============================================================================
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  contactEmail: text('contact_email').notNull(),
  currency: text('currency').default('BDT').notNull(),
  timezone: text('timezone').default('Asia/Dhaka').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id'), // Multi-tenant store identifier alias
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(), // e.g. "Sylhet Flagship Outlet", "Zindabazar Branch"
    code: text('code').notNull(),
    address: text('address'),
    phone: text('phone'),
    isMainBranch: boolean('is_main_branch').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantIdx: index('store_tenant_idx').on(table.tenantId),
    storeIdIdx: index('store_id_idx').on(table.storeId),
    tenantStoreCodeUnique: uniqueIndex('tenant_store_code_idx').on(table.tenantId, table.code),
  })
);

// ============================================================================
// 3. ROLES & USERS (Multi-Tenant Isolation with store_id)
// ============================================================================
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g. "Owner", "Administrator", "Branch Manager", "Cashier"
    slug: userRoleEnum('slug').default('cashier').notNull(),
    description: text('description'),
    permissions: jsonb('permissions')
      .default([
        'pos:checkout',
        'pos:discount:basic',
        'pos:shift_audit',
        'inventory:view',
        'reports:basic_sales',
      ])
      .notNull(),
    isSystemRole: boolean('is_system_role').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantRoleIdx: index('role_tenant_idx').on(table.tenantId),
  })
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }), // Multi-tenant store isolation (null = tenant-wide access)
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passcodeHash: text('passcode_hash'), // Fast PIN for cashier shifts
    role: userRoleEnum('role').default('cashier').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantEmailUnique: uniqueIndex('tenant_user_email_idx').on(table.tenantId, table.email),
    userTenantIdx: index('user_tenant_idx').on(table.tenantId),
    userStoreIdx: index('user_store_idx').on(table.storeId),
  })
);

// Alias for backwards compatibility
export const storeUsers = users;

// ============================================================================
// 4. SUBSCRIPTIONS (Multi-Tenant Isolation with store_id)
// ============================================================================
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }), // Multi-tenant store-level subscription link
    tier: subscriptionTierEnum('tier').default('starter').notNull(), // 'free', 'starter', 'pro', 'enterprise', 'custom'
    status: subscriptionStatusEnum('status').default('active').notNull(), // 'trial', 'active', 'past_due', 'canceled', 'suspended', 'expired'
    currentPeriodStart: timestamp('current_period_start', { mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }).notNull(),
    maxStores: integer('max_stores').default(1).notNull(),
    maxRegisters: integer('max_registers').default(1).notNull(),
    // Enabled Modules JSON (e.g. { ecommerce_bridge: true, barcodes: true, multi_store: true })
    enabledModules: jsonb('enabled_modules')
      .default({
        core_pos: true,
        inventory: true,
        expenses: true,
        shift_auditing: true,
        barcodes: false,
        ecommerce_bridge: false,
        multi_store: false,
        advanced_reports: false,
        user_management: false,
        api_access: false,
      })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantSubIdx: uniqueIndex('sub_tenant_idx').on(table.tenantId),
    subStoreIdx: index('sub_store_idx').on(table.storeId),
  })
);

// Alias for backwards compatibility
export const tenantSubscriptions = subscriptions;

// ============================================================================
// 5. PRODUCTS & CATALOG (Multi-Tenant Isolation with store_id)
// ============================================================================
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    parentId: uuid('parent_id'),
    colorCode: text('color_code'), // for quick grid POS category buttons
  },
  (table) => ({
    tenantCategoryIdx: index('cat_tenant_idx').on(table.tenantId),
  })
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }), // Multi-tenant store isolation
    vendorId: uuid('vendor_id').references(() => users.id, { onDelete: 'set null' }), // Multi-vendor support
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    brand: text('brand'), // Optional brand identifier for marketing & categorization
    name: text('name').notNull(),
    description: text('description'),
    sku: text('sku').notNull(),
    barcode: text('barcode'), // EAN-13, Code128 or UPC
    imageUrl: text('image_url'), // Product thumbnail & high-res image URL
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).default('0.00'),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }), // backward compatibility alias
    sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
    currentStock: integer('current_stock').default(0), // global stock cache
    reorderLevel: integer('reorder_level').default(5),
    taxRatePercentage: numeric('tax_rate_percentage', { precision: 5, scale: 2 }).default('0.00'),
    isTaxInclusive: boolean('is_tax_inclusive').default(false),
    isSyncedToEcommerce: boolean('is_synced_to_ecommerce').default(false),
    externalEcommerceId: text('external_ecommerce_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantSkuIdx: index('tenant_sku_idx').on(table.tenantId, table.sku),
    tenantBarcodeIdx: index('tenant_barcode_idx').on(table.tenantId, table.barcode),
    tenantNameIdx: index('tenant_prod_name_idx').on(table.tenantId, table.name),
    productStoreIdx: index('product_store_idx').on(table.storeId),
    productVendorIdx: index('product_vendor_idx').on(table.vendorId),
  })
);

export const stockAuditLogs = pgTable(
  'stock_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    productName: text('product_name').notNull(),
    sku: text('sku').notNull(),
    previousStock: integer('previous_stock').notNull(),
    changeAmount: integer('change_amount').notNull(), // positive or negative delta
    newStock: integer('new_stock').notNull(),
    reason: text('reason').notNull(), // e.g. "Restock shipment received", "Damaged packaging", "Physical count reconciliation"
    adjustmentType: text('adjustment_type').default('correction').notNull(), // 'restock', 'damage_waste', 'physical_count', 'return_restock', 'theft_loss', 'correction'
    userId: text('user_id').default('usr_admin_01').notNull(),
    userName: text('user_name').default('Admin Manager').notNull(),
    userRole: text('user_role').default('Manager').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    stockAuditProductIdx: index('stock_audit_product_idx').on(table.productId),
    stockAuditTenantIdx: index('stock_audit_tenant_idx').on(table.tenantId),
    stockAuditDateIdx: index('stock_audit_date_idx').on(table.createdAt),
  })
);

export const storeStock = pgTable(
  'store_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    currentStock: integer('current_stock').default(0).notNull(),
    reorderLevel: integer('reorder_level').default(5).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    storeProductUnique: uniqueIndex('store_product_idx').on(table.storeId, table.productId),
  })
);

// ============================================================================
// 6. POS SESSIONS, SALES & CHECKOUT (Fast Cashier Workflows)
// ============================================================================
export const registerShifts = pgTable('register_shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  cashierId: uuid('cashier_id').references(() => users.id).notNull(),
  openingCash: numeric('opening_cash', { precision: 10, scale: 2 }).notNull(),
  expectedClosingCash: numeric('expected_closing_cash', { precision: 10, scale: 2 }),
  actualClosingCash: numeric('actual_closing_cash', { precision: 10, scale: 2 }),
  cashDifference: numeric('cash_difference', { precision: 10, scale: 2 }),
  notes: text('notes'),
  openedAt: timestamp('opened_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
});

export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
    storeId: uuid('store_id').references(() => stores.id).notNull(),
    shiftId: uuid('shift_id').references(() => registerShifts.id),
    cashierId: uuid('cashier_id').references(() => users.id),
    invoiceNumber: text('invoice_number').notNull(),
    status: orderStatusEnum('status').default('completed').notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    notes: text('notes'),
    source: text('source').default('pos_terminal').notNull(), // 'pos_terminal', 'ecommerce_sync', 'phone_order'
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    tenantInvoiceUnique: uniqueIndex('tenant_invoice_idx').on(table.tenantId, table.invoiceNumber),
    salesStoreIdx: index('sales_store_idx').on(table.storeId),
    salesDateIdx: index('sales_date_idx').on(table.createdAt),
  })
);

export const saleItems = pgTable(
  'sale_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    productName: text('product_name').notNull(),
    sku: text('sku').notNull(),
    quantity: integer('quantity').notNull(),
    unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => ({
    saleItemSaleIdx: index('sale_item_sale_idx').on(table.saleId),
  })
);

// ============================================================================
// 7. EXPENSES
// ============================================================================
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  category: text('category').notNull(), // e.g. "Rent", "Utilities", "Packaging", "Tea/Refreshments"
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  recordedById: uuid('recorded_by_id').references(() => users.id),
  expenseDate: timestamp('expense_date', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================================
// 8. E-COMMERCE ORDERS, LOGISTICS & ABANDONED CARTS
// ============================================================================
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    customerId: uuid('customer_id'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    advanceAmount: numeric('advance_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
    dueBalance: numeric('due_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').default('cod').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
    status: orderStatusEnum('status').default('pending').notNull(),
    courierService: courierServiceEnum('courier_service'),
    trackingCode: text('tracking_code'),
    fraudRiskScore: numeric('fraud_risk_score', { precision: 4, scale: 2 }),
    customerPhone: text('customer_phone'),
    shippingAddress: text('shipping_address'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    orderStoreIdx: index('order_store_idx').on(table.storeId),
    orderStatusIdx: index('order_status_idx').on(table.status),
    orderPaymentStatusIdx: index('order_payment_status_idx').on(table.paymentStatus),
    orderTrackingIdx: index('order_tracking_idx').on(table.trackingCode),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }),
  },
  (table) => ({
    orderItemOrderIdx: index('order_item_order_idx').on(table.orderId),
  })
);

export const abandonedCarts = pgTable(
  'abandoned_carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email'),
    cartData: jsonb('cart_data').notNull(), // items, quantities, pricing JSON
    recoveryStatus: cartRecoveryStatusEnum('recovery_status').default('pending').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    cartStoreIdx: index('cart_store_idx').on(table.storeId),
    cartPhoneIdx: index('cart_phone_idx').on(table.customerPhone),
  })
);

// ============================================================================
// 9. UNIVERSAL E-COMMERCE INTEGRATIONS & WEBHOOKS
// ============================================================================
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // e.g. "Shopify Sync App", "WooCommerce Plugin"
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // e.g. "waw_live_abc..."
  permissions: jsonb('permissions').default(['read:products', 'write:orders', 'read:inventory']).notNull(),
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  targetUrl: text('target_url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').default(['order.created', 'inventory.updated', 'product.created']).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const syncEvents = pgTable('sync_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  platform: integrationPlatformEnum('platform').notNull(),
  eventType: text('event_type').notNull(), // 'inventory_delta', 'order_push', 'catalog_pull'
  payload: jsonb('payload').notNull(),
  status: syncStatusEnum('status').default('pending').notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  processedAt: timestamp('processed_at', { mode: 'date' }),
});

// ============================================================================
// 10. MARKETPLACE ARTISAN VENDORS, COUPONS & TRUST GOVERNANCE
// ============================================================================
export const vendorProfiles = pgTable('vendor_profiles', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull(),
  publicSlug: text('public_slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  legalName: text('legal_name'),
  status: text('status').notNull().default('submitted'),
  statusReason: text('status_reason'),
  craftSpecialty: text('craft_specialty').notNull(),
  description: text('description').notNull(),
  workshopLocation: text('workshop_location').notNull(),
  supportEmail: text('support_email').notNull(),
  supportPhone: text('support_phone').notNull(),
  allowCod: boolean('allow_cod').notNull().default(true),
  verifiedArtisan: boolean('verified_artisan').notNull().default(false),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'),
  type: text('type').notNull().default('platform'),
  vendorProfileId: text('vendor_profile_id'),
  rules: jsonb('rules').notNull(),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userTrustProfiles = pgTable('user_trust_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  score: integer('score').notNull().default(85),
  codEligible: boolean('cod_eligible').notNull().default(true),
  riskLevel: text('risk_level').notNull().default('low'),
  manualReviewRequired: boolean('manual_review_required').notNull().default(false),
  lastEvaluatedAt: timestamp('last_evaluated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  reason: text('reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================================
// 11. PAYMENTS, REFUNDS, WALLETS & VENDOR SETTLEMENTS
// ============================================================================
export const paymentAttempts = pgTable('payment_attempts', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull().default('created'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('BDT'),
  gatewayReference: text('gateway_reference'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  paymentAttemptId: text('payment_attempt_id').notNull(),
  orderId: text('order_id').notNull(),
  provider: text('provider').notNull(),
  status: text('status').notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('BDT'),
  transactionId: text('transaction_id').notNull(),
  providerSignatureHash: text('provider_signature_hash'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const paymentProviderEvents = pgTable(
  'payment_provider_events',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull(),
    eventType: text('event_type').notNull(),
    eventId: text('event_id').notNull(),
    rawPayload: jsonb('raw_payload').notNull(),
    signatureValid: boolean('signature_valid').notNull().default(false),
    processedAt: timestamp('processed_at', { mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueProviderEvent: uniqueIndex('idx_provider_event_id').on(t.provider, t.eventId),
  })
);

export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  paymentId: text('payment_id'),
  refundMethod: text('refund_method').notNull().default('original_payment_source'),
  status: text('status').notNull().default('requested'),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  approvedByUserId: text('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const walletAccounts = pgTable('wallet_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  balanceCents: integer('balance_cents').notNull().default(0),
  currency: text('currency').notNull().default('BDT'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(),
  walletAccountId: text('wallet_account_id').notNull(),
  type: text('type').notNull(),
  amountCents: integer('amount_cents').notNull(),
  balanceAfterCents: integer('balance_after_cents').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: text('reference_id').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const vendorSettlements = pgTable('vendor_settlements', {
  id: text('id').primaryKey(),
  vendorProfileId: text('vendor_profile_id').notNull(),
  periodStart: timestamp('period_start', { mode: 'date' }).notNull(),
  periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),
  grossAmountCents: integer('gross_amount_cents').notNull(),
  commissionCents: integer('commission_cents').notNull(),
  netAmountCents: integer('net_amount_cents').notNull(),
  status: text('status').notNull().default('draft'),
  approvedByUserId: text('approved_by_user_id'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const vendorPayoutAccounts = pgTable('vendor_payout_accounts', {
  id: text('id').primaryKey(),
  vendorProfileId: text('vendor_profile_id').notNull(),
  payoutMethod: text('payout_method').notNull(),
  detailsEncrypted: text('details_encrypted').notNull(),
  maskedIdentifier: text('masked_identifier').notNull(),
  isDefault: boolean('is_default').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================================
// 12. RAW MATERIALS WHOLESALE MARKETPLACE
// ============================================================================
export const rawMaterials = pgTable('raw_materials', {
  id: text('id').primaryKey(),
  wholesalerVendorProfileId: text('wholesaler_vendor_profile_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  unit: text('unit').notNull(),
  moq: integer('moq').notNull().default(10),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  status: text('status').notNull().default('active'),
  images: jsonb('images').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const wholesaleOrders = pgTable('wholesale_orders', {
  id: text('id').primaryKey(),
  buyerVendorProfileId: text('buyer_vendor_profile_id').notNull(),
  supplierVendorProfileId: text('supplier_vendor_profile_id').notNull(),
  rawMaterialId: text('raw_material_id').notNull(),
  materialName: text('material_name').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('bkash'),
  shippingAddressSnapshot: jsonb('shipping_address_snapshot').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================================
// 13. BANGLADESH SHIPPING, DELIVERY ZONES, COURIERS & TRACKING EVENTS
// ============================================================================
export const userAddresses = pgTable('user_addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  label: text('label').notNull().default('Home'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  addressLine: text('address_line').notNull(),
  upazilaThana: text('upazila_thana').notNull(),
  district: text('district').notNull(),
  division: text('division').notNull(),
  postalCode: text('postal_code').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const deliveryZones = pgTable('delivery_zones', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  basePriceCents: integer('base_price_cents').notNull(),
  estimatedDeliveryDaysMin: integer('estimated_delivery_days_min').notNull(),
  estimatedDeliveryDaysMax: integer('estimated_delivery_days_max').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const courierProviders = pgTable('courier_providers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  supportsCod: boolean('supports_cod').notNull().default(true),
  avgDeliveryHours: integer('avg_delivery_hours').notNull(),
  apiEndpoint: text('api_endpoint').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  vendorOrderId: text('vendor_order_id').notNull(),
  courierProviderId: text('courier_provider_id').notNull(),
  courierName: text('courier_name').notNull(),
  trackingNumber: text('tracking_number').notNull(),
  shippingFeeCents: integer('shipping_fee_cents').notNull(),
  codAmountCents: integer('cod_amount_cents').notNull().default(0),
  status: text('status').notNull().default('booked'),
  courierOverriddenByUserId: text('courier_overridden_by_user_id'),
  courierOverrideReason: text('courier_override_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const shipmentEvents = pgTable('shipment_events', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id').notNull(),
  status: text('status').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  eventTimestamp: timestamp('event_timestamp', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================================
// 14. CUSTOMER ENGAGEMENT: WISHLIST, REVIEWS, NOTIFICATIONS & STYLE PROFILES
// ============================================================================
export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    productId: text('product_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => ({
    userProductUnique: uniqueIndex('wishlist_user_product_unique').on(t.userId, t.productId),
  })
);

export const productReviews = pgTable('product_reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull(),
  orderItemId: text('order_item_id').notNull(),
  vendorProfileId: text('vendor_profile_id').notNull(),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('submitted'),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { mode: 'date' }).defaultNow().notNull(),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  readAt: timestamp('read_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userStyleProfiles = pgTable('user_style_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  department: text('department'),
  preferences: jsonb('preferences'),
  consentVersion: text('consent_version').notNull().default('v1.0'),
  consentedAt: timestamp('consented_at', { mode: 'date' }).defaultNow().notNull(),
});

