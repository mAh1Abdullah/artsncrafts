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
  'cashier',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'upi',
  'mobile_banking',
  'split',
  'external',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'completed',
  'refunded',
  'voided',
  'partially_refunded',
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
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
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
// 8. UNIVERSAL E-COMMERCE INTEGRATIONS & WEBHOOKS
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
