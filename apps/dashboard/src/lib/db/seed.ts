import { db } from './index';
import {
  tenants,
  stores,
  categories,
  products,
  users,
  subscriptions,
  storeStock,
} from './schema';
import { DEFAULT_TENANT } from './products';

export interface SeedOptions {
  cleanFirst?: boolean;
}

export const INITIAL_SEED_CATEGORIES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Handicrafts & Textiles',
    slug: 'handicrafts-textiles',
    colorCode: '#4f46e5',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Electronics & Gadgets',
    slug: 'electronics-gadgets',
    colorCode: '#0891b2',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Office & Furniture',
    slug: 'office-furniture',
    colorCode: '#ca8a04',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Home & Living',
    slug: 'home-living',
    colorCode: '#059669',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    name: 'Groceries & Spices',
    slug: 'groceries-spices',
    colorCode: '#ea580c',
  },
];

export const INITIAL_SEED_STORES = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    storeId: 'b0000000-0000-0000-0000-000000000001',
    name: 'Sylhet Flagship Outlet (Zindabazar)',
    code: 'SYL-01',
    address: 'Level 2, City Center, Zindabazar, Sylhet',
    phone: '+880 1711-000001',
    isMainBranch: true,
    isActive: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    storeId: 'b0000000-0000-0000-0000-000000000002',
    name: 'Dhaka Banani Concept Branch',
    code: 'DHK-02',
    address: 'Road 11, Block D, Banani, Dhaka',
    phone: '+880 1711-000002',
    isMainBranch: false,
    isActive: true,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    storeId: 'b0000000-0000-0000-0000-000000000003',
    name: 'Chittagong GEC Circle Outlet',
    code: 'CTG-03',
    address: 'CDA Avenue, GEC Circle, Chittagong',
    phone: '+880 1711-000003',
    isMainBranch: false,
    isActive: true,
  },
];

export const INITIAL_SEED_PRODUCTS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Wireless ANC Headphones',
    categoryId: 'a0000000-0000-0000-0000-000000000002',
    description: 'High-quality active noise-cancelling headphones with 40-hour battery',
    sku: 'ANC-8801',
    barcode: '8901234567890',
    unitCost: '45.00',
    unitPrice: '45.00',
    sellingPrice: '89.99',
    currentStock: 45,
    reorderLevel: 10,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_8801',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Ergonomic Optical Gaming Mouse',
    categoryId: 'a0000000-0000-0000-0000-000000000002',
    description: 'Precision 16,000 DPI sensor with customizable RGB illumination',
    sku: 'GMS-2044',
    barcode: '8901234567891',
    unitCost: '22.50',
    unitPrice: '22.50',
    sellingPrice: '49.99',
    currentStock: 8,
    reorderLevel: 15,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'woo_prod_2044',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Executive Mesh Office Chair',
    categoryId: 'a0000000-0000-0000-0000-000000000003',
    description: 'Ergonomic lumbar support with 4D armrests and breathable mesh',
    sku: 'CHR-9903',
    barcode: '8901234567892',
    unitCost: '120.00',
    unitPrice: '120.00',
    sellingPrice: '249.99',
    currentStock: 0,
    reorderLevel: 5,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: false,
    externalEcommerceId: null,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Adjustable LED Smart Desk Lamp',
    categoryId: 'a0000000-0000-0000-0000-000000000004',
    description: 'Touch-sensitive dimming with USB-C wireless charging base',
    sku: 'LMP-3011',
    barcode: '8901234567893',
    unitCost: '28.00',
    unitPrice: '28.00',
    sellingPrice: '59.99',
    currentStock: 25,
    reorderLevel: 8,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_3011',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    name: 'Handcrafted Shital Pati Bamboo Mat',
    categoryId: 'a0000000-0000-0000-0000-000000000001',
    description: 'Authentic Sylhet cool-cane weaving by master rural artisans',
    sku: 'SPM-1001',
    barcode: '8901234567894',
    unitCost: '18.00',
    unitPrice: '18.00',
    sellingPrice: '45.00',
    currentStock: 35,
    reorderLevel: 10,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'waw_market_1001',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    name: 'Embroidered Nakshi Kantha Blanket',
    categoryId: 'a0000000-0000-0000-0000-000000000001',
    description: 'Pure cotton heritage quilted throw blanket with traditional folk motifs',
    sku: 'NKB-5022',
    barcode: '8901234567895',
    unitCost: '32.00',
    unitPrice: '32.00',
    sellingPrice: '75.00',
    currentStock: 18,
    reorderLevel: 6,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'waw_market_5022',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    name: 'Organic Sylhet Seven-Layer Tea Leaves (250g)',
    categoryId: 'a0000000-0000-0000-0000-000000000005',
    description: 'First-flush premium aromatic estate blend from Sreemangal tea valleys',
    sku: 'TEA-7001',
    barcode: '8901234567896',
    unitCost: '4.50',
    unitPrice: '4.50',
    sellingPrice: '12.99',
    currentStock: 90,
    reorderLevel: 20,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_tea7',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000008',
    name: 'Raw Sundarbans Wild Honey (500g)',
    categoryId: 'a0000000-0000-0000-0000-000000000005',
    description: 'Unfiltered, unprocessed 100% natural mangrove wild forest honey',
    sku: 'HNY-8002',
    barcode: '8901234567897',
    unitCost: '7.00',
    unitPrice: '7.00',
    sellingPrice: '18.50',
    currentStock: 4,
    reorderLevel: 10,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: false,
    externalEcommerceId: null,
  },
];

/**
 * Seeds the database with default tenants, stores, categories, and products.
 * Handles both connected Neon/Postgres SQL and graceful logging for offline modes.
 */
export async function seedDatabase(options: SeedOptions = {}) {
  console.log('[Seed] Starting database initialization...', options.cleanFirst ? '(Clean mode requested)' : '');

  if (!db) {
    console.info('[Seed] DATABASE_URL not detected. In-memory data structures are ready for offline development.');
    return {
      success: true,
      seededStoresCount: INITIAL_SEED_STORES.length,
      seededProductsCount: INITIAL_SEED_PRODUCTS.length,
      message: 'Seeded in-memory fallback stores and products for local development.',
    };
  }

  try {
    const tenantId = '00000000-0000-0000-0000-000000000001';

    // 1. Ensure Tenant exists
    await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: DEFAULT_TENANT.name,
        slug: DEFAULT_TENANT.slug,
        contactEmail: DEFAULT_TENANT.contactEmail,
        currency: DEFAULT_TENANT.currency,
        timezone: DEFAULT_TENANT.timezone,
      })
      .onConflictDoNothing();

    // 2. Seed Stores
    let insertedStores = 0;
    for (const st of INITIAL_SEED_STORES) {
      await db
        .insert(stores)
        .values({
          id: st.id,
          storeId: st.storeId,
          tenantId: tenantId,
          name: st.name,
          code: st.code,
          address: st.address,
          phone: st.phone,
          isMainBranch: st.isMainBranch,
          isActive: st.isActive,
        })
        .onConflictDoNothing();
      insertedStores++;
    }

    // 3. Seed Subscription
    await db
      .insert(subscriptions)
      .values({
        id: 'e0000000-0000-0000-0000-000000000001',
        tenantId: tenantId,
        storeId: INITIAL_SEED_STORES[0].id,
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2027-12-31'),
        maxStores: 5,
        maxRegisters: 10,
        enabledModules: {
          core_pos: true,
          inventory: true,
          expenses: true,
          shift_auditing: true,
          barcodes: true,
          ecommerce_bridge: true,
          multi_store: true,
          advanced_reports: true,
          user_management: true,
          api_access: true,
        },
      })
      .onConflictDoNothing();

    // 4. Seed Categories
    for (const cat of INITIAL_SEED_CATEGORIES) {
      await db
        .insert(categories)
        .values({
          id: cat.id,
          tenantId: tenantId,
          name: cat.name,
          slug: cat.slug,
          colorCode: cat.colorCode,
        })
        .onConflictDoNothing();
    }

    // 5. Seed Products & Stock Allocations
    let insertedProducts = 0;
    const primaryStoreId = INITIAL_SEED_STORES[0].id;

    for (const prod of INITIAL_SEED_PRODUCTS) {
      await db
        .insert(products)
        .values({
          id: prod.id,
          tenantId: tenantId,
          storeId: primaryStoreId,
          categoryId: prod.categoryId,
          name: prod.name,
          description: prod.description,
          sku: prod.sku,
          barcode: prod.barcode,
          unitCost: prod.unitCost,
          unitPrice: prod.unitPrice,
          sellingPrice: prod.sellingPrice,
          currentStock: prod.currentStock,
          reorderLevel: prod.reorderLevel,
          taxRatePercentage: prod.taxRatePercentage,
          isTaxInclusive: prod.isTaxInclusive,
          isSyncedToEcommerce: prod.isSyncedToEcommerce,
          externalEcommerceId: prod.externalEcommerceId,
        })
        .onConflictDoNothing();

      // Allocate multi-store stock
      await db
        .insert(storeStock)
        .values({
          id: `f0000000-${prod.id.substring(9)}`,
          storeId: primaryStoreId,
          productId: prod.id,
          currentStock: prod.currentStock,
          reorderLevel: prod.reorderLevel,
        })
        .onConflictDoNothing();

      insertedProducts++;
    }

    // 6. Seed Sample Users (Owner & Cashier)
    await db
      .insert(users)
      .values([
        {
          id: 'd0000000-0000-0000-0000-000000000001',
          tenantId: tenantId,
          storeId: primaryStoreId,
          name: 'Rahim Chowdhury (Admin)',
          email: 'admin@sylhetcrafts.com',
          role: 'owner',
          isActive: true,
        },
        {
          id: 'd0000000-0000-0000-0000-000000000002',
          tenantId: tenantId,
          storeId: primaryStoreId,
          name: 'Nusrat Jahan (Cashier)',
          email: 'cashier1@sylhetcrafts.com',
          role: 'cashier',
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    console.log(
      `[Seed] Database seeded successfully with ${insertedStores} stores and ${insertedProducts} products.`
    );

    return {
      success: true,
      seededStoresCount: insertedStores,
      seededProductsCount: insertedProducts,
      message: `Database successfully seeded with ${insertedStores} stores and ${insertedProducts} products.`,
    };
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    throw error;
  }
}

export default seedDatabase;

// Support direct command-line execution (e.g. via `npm run db:seed`)
if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('✅ Seed completed:', result.message);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
