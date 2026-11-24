import { InferInsertModel, InferSelectModel, eq, inArray, desc } from 'drizzle-orm';
import { db } from './';
import {
  products,
  tenants,
  stores,
  tenantSubscriptions,
  sales,
  saleItems,
  categories,
  apiKeys,
  syncEvents,
  stockAuditLogs,
} from './schema';

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
export type Tenant = InferSelectModel<typeof tenants>;
export type Store = InferSelectModel<typeof stores>;
export type TenantSubscription = InferSelectModel<typeof tenantSubscriptions>;
export type Sale = InferSelectModel<typeof sales>;
export type SaleItem = InferSelectModel<typeof saleItems>;
export type Category = InferSelectModel<typeof categories>;
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type SyncEvent = InferSelectModel<typeof syncEvents>;
export type StockAuditLog = InferSelectModel<typeof stockAuditLogs>;
export type NewStockAuditLog = InferInsertModel<typeof stockAuditLogs>;

// Sample default tenant & store for standalone/preview operations
export const DEFAULT_TENANT: Tenant = {
  id: 'tenant-waw-sylhet-001',
  name: 'Sylhet Artisans & Crafts',
  slug: 'sylhet-crafts',
  contactEmail: 'contact@sylhetcrafts.com',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const DEFAULT_STORE: Store = {
  id: 'store-sylhet-flagship-01',
  storeId: 'store-sylhet-flagship-01',
  tenantId: 'tenant-waw-sylhet-001',
  name: 'Sylhet Flagship Outlet (Zindabazar)',
  code: 'SYL-01',
  address: 'Level 2, City Center, Zindabazar, Sylhet',
  phone: '+880 1711-000000',
  isMainBranch: true,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const DEFAULT_SUBSCRIPTION: TenantSubscription = {
  id: 'sub-pro-001',
  tenantId: 'tenant-waw-sylhet-001',
  storeId: 'store-sylhet-flagship-01',
  tier: 'pro',
  status: 'active',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2026-12-31'),
  maxStores: 3,
  maxRegisters: 5,
  enabledModules: {
    core_pos: true,
    inventory: true,
    expenses: true,
    barcodes: true,
    ecommerce_bridge: true,
    multi_store: true,
    advanced_reports: true,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-handicrafts', tenantId: 'tenant-waw-sylhet-001', name: 'Handicrafts', slug: 'handicrafts', parentId: null, colorCode: '#10b981' },
  { id: 'cat-electronics', tenantId: 'tenant-waw-sylhet-001', name: 'Electronics', slug: 'electronics', parentId: null, colorCode: '#3b82f6' },
  { id: 'cat-furniture', tenantId: 'tenant-waw-sylhet-001', name: 'Furniture', slug: 'furniture', parentId: null, colorCode: '#8b5cf6' },
  { id: 'cat-lighting', tenantId: 'tenant-waw-sylhet-001', name: 'Lighting', slug: 'lighting', parentId: null, colorCode: '#f59e0b' },
  { id: 'cat-accessories', tenantId: 'tenant-waw-sylhet-001', name: 'Accessories', slug: 'accessories', parentId: null, colorCode: '#ec4899' },
  { id: 'cat-apparel', tenantId: 'tenant-waw-sylhet-001', name: 'Apparel', slug: 'apparel', parentId: null, colorCode: '#06b6d4' },
  { id: 'cat-groceries', tenantId: 'tenant-waw-sylhet-001', name: 'Groceries', slug: 'groceries', parentId: null, colorCode: '#84cc16' },
  { id: 'cat-stationery', tenantId: 'tenant-waw-sylhet-001', name: 'Stationery', slug: 'stationery', parentId: null, colorCode: '#6366f1' },
  { id: 'cat-home-living', tenantId: 'tenant-waw-sylhet-001', name: 'Home & Living', slug: 'home-living', parentId: null, colorCode: '#14b8a6' },
];

const inMemoryCategories: Category[] = [...DEFAULT_CATEGORIES];

let dbUnavailableUntil = 0;
const DB_BACKOFF_MS = 60_000;

function canQueryDb(): boolean {
  return Boolean(db) && Date.now() >= dbUnavailableUntil;
}

function markDbQueryFailed(context: string, error: unknown): void {
  if (Date.now() >= dbUnavailableUntil) {
    console.warn(`[WAW-POS Database] ${context} failed, falling back to in-memory store for 60s:`, error);
  }
  dbUnavailableUntil = Date.now() + DB_BACKOFF_MS;
}

export async function getCategories(tenantId?: string): Promise<Category[]> {
  if (canQueryDb() && db) {
    try {
      if (tenantId) {
        return await db.select().from(categories).where(eq(categories.tenantId, tenantId));
      }
      return await db.select().from(categories);
    } catch (error) {
      markDbQueryFailed('getCategories', error);
    }
  }
  if (tenantId) {
    return inMemoryCategories.filter((c) => !c.tenantId || c.tenantId === tenantId);
  }
  return [...inMemoryCategories];
}

// In-memory store initialized with Artisans Market & Sylhet Craft products shared between storefront and WAW-POS
let inMemoryProducts: Product[] = [
  {
    id: 'art-1',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-dhamrai-clay',
    categoryId: 'cat-handicrafts',
    brand: 'Dhamrai Clay Heritage Studio',
    name: 'Hand-Carved Earthen Water Pitcher & Tumbler Set',
    description: 'Hand-thrown Dhamrai terracotta pitcher with two matching tumblers. Naturally cools drinking water and supports custom base calligraphy engraving.',
    sku: 'DC-101',
    barcode: '8901234567101',
    imageUrl: '/images/artisans/product_dhamrai_pitcher_1795182076610.jpg',
    unitCost: '14.50',
    unitPrice: '14.50',
    sellingPrice: '24.50',
    currentStock: 18,
    reorderLevel: 5,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_101',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'art-2',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-sonargaon-loom',
    categoryId: 'cat-apparel',
    brand: 'Sonargaon Royal Jamdani Weavers',
    name: 'Heritage 80-Count Royal Handloom Jamdani Saree',
    description: 'UNESCO-recognized handwoven Jamdani muslin silk saree with geometric Panna Hazar gold zari and crimson floral motifs woven over 45 days on pit looms.',
    sku: 'SJ-102',
    barcode: '8901234567102',
    imageUrl: '/images/artisans/product_jamdani_saree_1795182003387.jpg',
    unitCost: '115.00',
    unitPrice: '115.00',
    sellingPrice: '185.00',
    currentStock: 6,
    reorderLevel: 2,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_102',
    createdAt: new Date('2026-02-02'),
    updatedAt: new Date('2026-02-02'),
  },
  {
    id: 'art-3',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-hill-woodcraft',
    categoryId: 'cat-home-living',
    brand: 'Chittagong Hill Woodcraft Guild',
    name: 'Hand-Carved Teak Serving Platter & Condiment Bowls',
    description: 'Sustainably harvested Burmese teak oval serving board paired with two hand-turned mahogany bowls, finished in food-safe organic beeswax.',
    sku: 'HT-103',
    barcode: '8901234567103',
    imageUrl: '/images/artisans/product_teak_woodcraft_1795181990491.jpg',
    unitCost: '24.00',
    unitPrice: '24.00',
    sellingPrice: '42.00',
    currentStock: 14,
    reorderLevel: 4,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_103',
    createdAt: new Date('2026-02-03'),
    updatedAt: new Date('2026-02-03'),
  },
  {
    id: 'art-4',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-sylhet-filigree',
    categoryId: 'cat-accessories',
    brand: 'Sylhet Filigree & Silver Studio',
    name: 'Tarkashi Heritage Silver Filigree Pendant & Earrings',
    description: 'Centuries-old Tarkashi fine silver wirework hand-soldered into an heirloom floral medallion pendant with matching drop earrings.',
    sku: 'SF-104',
    barcode: '8901234567104',
    imageUrl: '/images/artisans/product_sylhet_filigree_1795181988445.jpg',
    unitCost: '48.00',
    unitPrice: '48.00',
    sellingPrice: '88.00',
    currentStock: 9,
    reorderLevel: 3,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_104',
    createdAt: new Date('2026-02-04'),
    updatedAt: new Date('2026-02-04'),
  },
  {
    id: 'art-5',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-hazaribagh-leather',
    categoryId: 'cat-accessories',
    brand: 'Hazaribagh Heritage Leather Guild',
    name: 'Full-Grain Cognac Leather Briefcase & Card Wallet',
    description: 'Vegetable-tanned full-grain cowhide messenger briefcase with solid brushed brass hardware and saddle-stitched companion card wallet.',
    sku: 'HL-105',
    barcode: '8901234567105',
    imageUrl: '/images/artisans/product_heritage_leather_1795182012960.jpg',
    unitCost: '62.00',
    unitPrice: '62.00',
    sellingPrice: '118.00',
    currentStock: 11,
    reorderLevel: 4,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_105',
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-05'),
  },
  {
    id: 'art-6',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-dhaka-rickshaw',
    categoryId: 'cat-handicrafts',
    brand: 'Old Dhaka Rickshaw Art Atelier',
    name: 'Hand-Painted Peacock & Lotus Rickshaw Art Serving Tray',
    description: 'Vibrant UNESCO-celebrated Old Dhaka rickshaw folk art hand-painted in weatherproof enamel over spun brass-rimmed steel.',
    sku: 'DR-106',
    barcode: '8901234567106',
    imageUrl: '/images/artisans/product_rickshaw_art_1795181989402.jpg',
    unitCost: '18.00',
    unitPrice: '18.00',
    sellingPrice: '36.00',
    currentStock: 22,
    reorderLevel: 6,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_106',
    createdAt: new Date('2026-02-06'),
    updatedAt: new Date('2026-02-06'),
  },
  {
    id: '5',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-sylhet-weaves',
    categoryId: 'cat-handicrafts',
    brand: 'Balaganj Weaves & Sylhet Artisans',
    name: 'Sylhet Cane Basket, Shital Pati Mat & Khadi Tunic Set',
    description: 'Signature Sylhet craft trio combining a handwoven bamboo cane market basket, natural cool water-reed Shital Pati mat, and organic handspun Khadi cloth.',
    sku: 'HC-005',
    barcode: '8901234567894',
    imageUrl: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    unitCost: '19.50',
    unitPrice: '19.50',
    sellingPrice: '39.99',
    currentStock: 35,
    reorderLevel: 10,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_107',
    createdAt: new Date('2026-01-11'),
    updatedAt: new Date('2026-01-11'),
  },
  {
    id: '8',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    vendorId: 'v-sonargaon-loom',
    categoryId: 'cat-apparel',
    brand: 'Sonargaon Royal Jamdani Weavers',
    name: 'Artisan Handspun Organic Khadi Cotton Tunic',
    description: '100% handspun organic breathable khadi summer tunic with hand-finished seams and natural undyed cotton drape.',
    sku: 'AK-008',
    barcode: '8901234567897',
    imageUrl: '/images/artisans/product_cane_shitalpati_1795181993727.jpg',
    unitCost: '18.00',
    unitPrice: '18.00',
    sellingPrice: '45.00',
    currentStock: 18,
    reorderLevel: 6,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'artisans_prod_108',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
  },
];

// Initial in-memory stock audit logs
let inMemoryAuditLogs: StockAuditLog[] = [
  {
    id: 'audit-001',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    productId: '1',
    productName: 'Wireless Headphones',
    sku: 'WH-001',
    previousStock: 25,
    changeAmount: 20,
    newStock: 45,
    reason: 'Restock shipment received from supplier (PO-4491)',
    adjustmentType: 'restock',
    userId: 'usr_mgr_01',
    userName: 'Tanvir Hasan',
    userRole: 'Store Manager',
    notes: 'Batch #2024-A inspected and verified in warehouse',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'audit-002',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    productId: '2',
    productName: 'Gaming Mouse',
    sku: 'GM-002',
    previousStock: 8,
    changeAmount: -3,
    newStock: 5,
    reason: 'Damaged display unit & return waste write-off',
    adjustmentType: 'damage_waste',
    userId: 'usr_lead_02',
    userName: 'Ayesha Rahman',
    userRole: 'Lead Cashier',
    notes: '2 units defective optical sensor, 1 dropped during shelf setup',
    createdAt: new Date(Date.now() - 86400000 * 4),
  },
  {
    id: 'audit-003',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    productId: '3',
    productName: 'Office Chair',
    sku: 'OC-003',
    previousStock: 2,
    changeAmount: -2,
    newStock: 0,
    reason: 'Physical inventory cycle count reconciliation',
    adjustmentType: 'physical_count',
    userId: 'usr_mgr_01',
    userName: 'Tanvir Hasan',
    userRole: 'Store Manager',
    notes: 'Sold on showroom floor during weekend rush, zero stock alert triggered',
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'audit-004',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    productId: '5',
    productName: 'Handcrafted Cane Basket',
    sku: 'HC-005',
    previousStock: 70,
    changeAmount: 50,
    newStock: 120,
    reason: 'Artisan cooperative batch delivery from Moulvibazar',
    adjustmentType: 'restock',
    userId: 'usr_mgr_01',
    userName: 'Tanvir Hasan',
    userRole: 'Store Manager',
    notes: 'Special festival season inventory stockup',
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'audit-005',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    productId: '4',
    productName: 'Desk Lamp',
    sku: 'DL-004',
    previousStock: 20,
    changeAmount: 3,
    newStock: 23,
    reason: 'Customer return (Unopened box, restocked)',
    adjustmentType: 'return_restock',
    userId: 'usr_cashier_03',
    userName: 'Faisal Karim',
    userRole: 'Cashier',
    notes: 'Customer exchanged for warmer light tone, item in pristine condition',
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
];

export async function getProducts(tenantId?: string): Promise<Product[]> {
  if (canQueryDb() && db) {
    try {
      if (tenantId) {
        return await db.select().from(products).where(eq(products.tenantId, tenantId));
      }
      return await db.select().from(products);
    } catch (error) {
      markDbQueryFailed('getProducts', error);
    }
  }
  if (tenantId) {
    return inMemoryProducts.filter((p) => !p.tenantId || p.tenantId === tenantId);
  }
  return [...inMemoryProducts];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (canQueryDb() && db) {
    try {
      const results = await db.select().from(products).where(eq(products.id, id));
      if (results.length > 0) return results[0];
    } catch (error) {
      markDbQueryFailed('getProductById', error);
    }
  }
  return inMemoryProducts.find((p) => p.id === id);
}

export async function getProductByBarcode(barcode: string, tenantId?: string): Promise<Product | undefined> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return undefined;

  if (canQueryDb() && db) {
    try {
      if (tenantId) {
        const results = await db
          .select()
          .from(products)
          .where(eq(products.barcode, cleanBarcode));
        const matched = results.find((p) => p.tenantId === tenantId);
        if (matched) return matched;
      } else {
        const results = await db
          .select()
          .from(products)
          .where(eq(products.barcode, cleanBarcode));
        if (results.length > 0) return results[0];
      }
    } catch (error) {
      markDbQueryFailed('getProductByBarcode', error);
    }
  }

  return inMemoryProducts.find((p) => {
    if (tenantId && p.tenantId && p.tenantId !== tenantId) return false;
    return p.barcode?.trim() === cleanBarcode;
  });
}

export async function createProduct(product: NewProduct): Promise<Product> {
  if (db) {
    try {
      const result = await db.insert(products).values(product).returning();
      if (result.length > 0) return result[0];
    } catch (error) {
      console.warn('Database insert failed, adding to in-memory store:', error);
    }
  }

  const newProd: Product = {
    id: product.id || String(Date.now()),
    tenantId: product.tenantId || DEFAULT_TENANT.id,
    storeId: product.storeId || DEFAULT_STORE.id,
    vendorId: product.vendorId || null,
    categoryId: product.categoryId || null,
    brand: product.brand || null,
    name: product.name,
    description: product.description ?? null,
    sku: product.sku,
    barcode: product.barcode ?? null,
    imageUrl: product.imageUrl ?? null,
    unitCost: product.unitCost ? String(product.unitCost) : '0.00',
    unitPrice: product.unitPrice ? String(product.unitPrice) : '0.00',
    sellingPrice: String(product.sellingPrice),
    currentStock: Number(product.currentStock ?? 0),
    reorderLevel: Number(product.reorderLevel ?? 5),
    taxRatePercentage: product.taxRatePercentage ? String(product.taxRatePercentage) : '0.00',
    isTaxInclusive: product.isTaxInclusive ?? false,
    isSyncedToEcommerce: product.isSyncedToEcommerce ?? false,
    externalEcommerceId: product.externalEcommerceId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryProducts = [newProd, ...inMemoryProducts];
  return newProd;
}

export async function updateProduct(id: string, product: Partial<NewProduct>): Promise<Product | undefined> {
  if (db) {
    try {
      const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
      if (result.length > 0) return result[0];
    } catch (error) {
      console.warn('Database update failed, updating in-memory store:', error);
    }
  }

  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    const existing = inMemoryProducts[index];
    const updated: Product = {
      ...existing,
      name: product.name !== undefined ? product.name : existing.name,
      description: product.description !== undefined ? (product.description ?? null) : existing.description,
      brand: product.brand !== undefined ? (product.brand ?? null) : existing.brand,
      vendorId: product.vendorId !== undefined ? (product.vendorId ?? null) : existing.vendorId,
      sku: product.sku !== undefined ? product.sku : existing.sku,
      barcode: product.barcode !== undefined ? (product.barcode ?? null) : existing.barcode,
      imageUrl: product.imageUrl !== undefined ? (product.imageUrl ?? null) : existing.imageUrl,
      unitCost: product.unitCost !== undefined ? String(product.unitCost) : existing.unitCost,
      unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : existing.unitPrice,
      sellingPrice: product.sellingPrice !== undefined ? String(product.sellingPrice) : existing.sellingPrice,
      currentStock: product.currentStock !== undefined ? Number(product.currentStock) : existing.currentStock,
      reorderLevel: product.reorderLevel !== undefined ? Number(product.reorderLevel) : existing.reorderLevel,
      isSyncedToEcommerce: product.isSyncedToEcommerce !== undefined ? Boolean(product.isSyncedToEcommerce) : existing.isSyncedToEcommerce,
      updatedAt: new Date(),
    };
    inMemoryProducts[index] = updated;
    return updated;
  }
  return undefined;
}

export async function deleteProduct(id: string): Promise<void> {
  if (db) {
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (error) {
      console.warn('Database delete failed, deleting from in-memory store:', error);
    }
  }
  inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ count: number }> {
  if (!ids || ids.length === 0) return { count: 0 };
  if (db) {
    try {
      await db.delete(products).where(inArray(products.id, ids));
    } catch (error) {
      console.warn('Database bulk delete failed, deleting from in-memory store:', error);
    }
  }
  const idSet = new Set(ids);
  const beforeCount = inMemoryProducts.length;
  inMemoryProducts = inMemoryProducts.filter((p) => !idSet.has(p.id));
  return { count: beforeCount - inMemoryProducts.length || ids.length };
}

export async function bulkUpdateStock(
  ids: string[],
  newStock: number,
  userId: string = 'usr_mgr_01',
  userName: string = 'Store Manager',
  reason: string = 'Bulk stock quantity update'
): Promise<{ count: number }> {
  if (!ids || ids.length === 0) return { count: 0 };
  const validStock = Math.max(0, Math.floor(newStock));
  if (db) {
    try {
      await db
        .update(products)
        .set({ currentStock: validStock, updatedAt: new Date() })
        .where(inArray(products.id, ids));
    } catch (error) {
      console.warn('Database bulk stock update failed, updating in-memory store:', error);
    }
  }
  const idSet = new Set(ids);
  let updatedCount = 0;
  inMemoryProducts = inMemoryProducts.map((p) => {
    if (idSet.has(p.id)) {
      updatedCount++;
      const prev = p.currentStock ?? 0;
      const delta = validStock - prev;
      if (delta !== 0) {
        // Record audit entry
        recordStockAuditLogInStore({
          tenantId: p.tenantId || DEFAULT_TENANT.id,
          storeId: p.storeId || DEFAULT_STORE.id,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          previousStock: prev,
          changeAmount: delta,
          newStock: validStock,
          reason: reason,
          adjustmentType: 'physical_count',
          userId: userId,
          userName: userName,
          userRole: 'Manager',
          notes: `Bulk reset to ${validStock} units`,
        });
      }
      return { ...p, currentStock: validStock, updatedAt: new Date() };
    }
    return p;
  });
  return { count: updatedCount || ids.length };
}

export async function bulkAdjustStock(
  ids: string[],
  delta: number,
  userId: string = 'usr_mgr_01',
  userName: string = 'Store Manager',
  reason: string = 'Bulk stock delta adjustment'
): Promise<{ count: number }> {
  if (!ids || ids.length === 0) return { count: 0 };
  const idSet = new Set(ids);
  let updatedCount = 0;

  for (const id of ids) {
    const existing = inMemoryProducts.find((p) => p.id === id);
    if (existing) {
      const updatedStock = Math.max(0, (existing.currentStock ?? 0) + delta);
      if (db) {
        try {
          await db
            .update(products)
            .set({ currentStock: updatedStock, updatedAt: new Date() })
            .where(eq(products.id, id));
        } catch (error) {
          console.warn('Database stock adjust failed:', error);
        }
      }
    }
  }

  inMemoryProducts = inMemoryProducts.map((p) => {
    if (idSet.has(p.id)) {
      updatedCount++;
      const prev = p.currentStock ?? 0;
      const updatedStock = Math.max(0, prev + delta);
      const actualDelta = updatedStock - prev;
      if (actualDelta !== 0) {
        recordStockAuditLogInStore({
          tenantId: p.tenantId || DEFAULT_TENANT.id,
          storeId: p.storeId || DEFAULT_STORE.id,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          previousStock: prev,
          changeAmount: actualDelta,
          newStock: updatedStock,
          reason: reason,
          adjustmentType: actualDelta > 0 ? 'restock' : 'damage_waste',
          userId: userId,
          userName: userName,
          userRole: 'Manager',
          notes: `Bulk delta of ${delta > 0 ? `+${delta}` : delta} units applied`,
        });
      }
      return { ...p, currentStock: updatedStock, updatedAt: new Date() };
    }
    return p;
  });

  return { count: updatedCount || ids.length };
}

export async function bulkUpdateReorderLevel(
  ids: string[],
  reorderLevel: number
): Promise<{ count: number }> {
  if (!ids || ids.length === 0) return { count: 0 };
  const validLevel = Math.max(0, Math.floor(reorderLevel));
  if (db) {
    try {
      await db
        .update(products)
        .set({ reorderLevel: validLevel, updatedAt: new Date() })
        .where(inArray(products.id, ids));
    } catch (error) {
      console.warn('Database bulk reorder level update failed:', error);
    }
  }
  const idSet = new Set(ids);
  let updatedCount = 0;
  inMemoryProducts = inMemoryProducts.map((p) => {
    if (idSet.has(p.id)) {
      updatedCount++;
      return { ...p, reorderLevel: validLevel, updatedAt: new Date() };
    }
    return p;
  });
  return { count: updatedCount || ids.length };
}

// Single product manual stock adjustment with complete audit logging
export interface SingleStockAdjustmentParams {
  productId: string;
  changeAmount?: number; // delta e.g. +10 or -5
  newStock?: number; // target count if directly specified
  reason: string;
  adjustmentType: 'restock' | 'damage_waste' | 'physical_count' | 'return_restock' | 'theft_loss' | 'correction';
  userId?: string;
  userName?: string;
  userRole?: string;
  notes?: string;
}

export async function adjustProductStock(params: SingleStockAdjustmentParams): Promise<{ product: Product; log: StockAuditLog }> {
  const prod = inMemoryProducts.find((p) => p.id === params.productId);
  if (!prod) {
    throw new Error(`Product with ID "${params.productId}" not found.`);
  }

  const previousStock = prod.currentStock ?? 0;
  let finalStock: number;
  let finalDelta: number;

  if (params.newStock !== undefined) {
    finalStock = Math.max(0, Math.floor(params.newStock));
    finalDelta = finalStock - previousStock;
  } else if (params.changeAmount !== undefined) {
    finalStock = Math.max(0, previousStock + Math.floor(params.changeAmount));
    finalDelta = finalStock - previousStock;
  } else {
    throw new Error('Either changeAmount or newStock must be provided.');
  }

  // Update DB if connected
  if (db) {
    try {
      await db
        .update(products)
        .set({ currentStock: finalStock, updatedAt: new Date() })
        .where(eq(products.id, prod.id));
    } catch (error) {
      console.warn('Database stock update failed, using in-memory store:', error);
    }
  }

  // Update in-memory product
  prod.currentStock = finalStock;
  prod.updatedAt = new Date();

  // Create audit log
  const newLog = await recordStockAuditLogInStore({
    tenantId: prod.tenantId || DEFAULT_TENANT.id,
    storeId: prod.storeId || DEFAULT_STORE.id,
    productId: prod.id,
    productName: prod.name,
    sku: prod.sku,
    previousStock,
    changeAmount: finalDelta,
    newStock: finalStock,
    reason: params.reason || 'Manual inventory adjustment',
    adjustmentType: params.adjustmentType || 'correction',
    userId: params.userId || 'usr_mgr_01',
    userName: params.userName || 'Store Manager',
    userRole: params.userRole || 'Manager',
    notes: params.notes ?? null,
  });

  return { product: { ...prod }, log: newLog };
}

function recordStockAuditLogInStore(logData: Omit<StockAuditLog, 'id' | 'createdAt'>): StockAuditLog {
  const log: StockAuditLog = {
    ...logData,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date(),
  };

  if (db) {
    db.insert(stockAuditLogs).values(log).catch((err) => {
      console.warn('Database insert failed for audit log:', err);
    });
  }

  inMemoryAuditLogs = [log, ...inMemoryAuditLogs];
  return log;
}

export async function getStockAuditLogs(filters?: {
  tenantId?: string;
  productId?: string;
  adjustmentType?: string;
  limit?: number;
}): Promise<StockAuditLog[]> {
  if (canQueryDb() && db) {
    try {
      const results = filters?.productId
        ? await db
            .select()
            .from(stockAuditLogs)
            .where(eq(stockAuditLogs.productId, filters.productId))
            .orderBy(desc(stockAuditLogs.createdAt))
            .limit(filters?.limit || 100)
        : await db
            .select()
            .from(stockAuditLogs)
            .orderBy(desc(stockAuditLogs.createdAt))
            .limit(filters?.limit || 100);
      if (results.length > 0) return results;
    } catch (error) {
      markDbQueryFailed('getStockAuditLogs', error);
    }
  }

  let list = [...inMemoryAuditLogs];
  if (filters?.productId) {
    list = list.filter((l) => l.productId === filters.productId);
  }
  if (filters?.adjustmentType && filters.adjustmentType !== 'all') {
    list = list.filter((l) => l.adjustmentType === filters.adjustmentType);
  }
  if (filters?.tenantId) {
    list = list.filter((l) => !l.tenantId || l.tenantId === filters.tenantId);
  }
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

export async function getProductStockHistory(productId: string): Promise<StockAuditLog[]> {
  return getStockAuditLogs({ productId });
}

export async function recordStockAuditLog(log: Omit<StockAuditLog, 'id' | 'createdAt'>): Promise<StockAuditLog> {
  return recordStockAuditLogInStore(log);
}

// In-memory Sales & Expenses store
export interface StoredSale {
  id: string;
  tenantId: string;
  storeId: string;
  invoiceNumber: string;
  status: 'completed' | 'refunded' | 'voided';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  createdAt: Date;
}

export interface StoredExpense {
  id: string;
  tenantId: string;
  storeId: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  expenseDate: Date;
  createdAt: Date;
}

let inMemorySales: StoredSale[] = [
  {
    id: 'sale-001',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'SYL-01',
    invoiceNumber: 'INV-889101',
    status: 'completed',
    subtotal: 119.98,
    discountAmount: 10.0,
    taxAmount: 5.5,
    totalAmount: 115.48,
    paymentMethod: 'cash',
    customerName: 'Rahim Ahmed',
    items: [
      {
        productId: '1',
        productName: 'Wireless Headphones',
        sku: 'WH-001',
        quantity: 1,
        unitCost: 65.0,
        unitPrice: 99.99,
        totalPrice: 99.99,
      },
      {
        productId: '5',
        productName: 'Handcrafted Cane Basket',
        sku: 'HC-005',
        quantity: 1,
        unitCost: 9.5,
        unitPrice: 19.99,
        totalPrice: 19.99,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: 'sale-002',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'SYL-01',
    invoiceNumber: 'INV-889102',
    status: 'completed',
    subtotal: 59.99,
    discountAmount: 0,
    taxAmount: 3.0,
    totalAmount: 62.99,
    paymentMethod: 'card',
    customerName: 'Tasnim Begum',
    items: [
      {
        productId: '2',
        productName: 'Gaming Mouse',
        sku: 'GM-002',
        quantity: 1,
        unitCost: 35.0,
        unitPrice: 59.99,
        totalPrice: 59.99,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
];

let inMemoryExpenses: StoredExpense[] = [
  {
    id: 'exp-001',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'SYL-01',
    category: 'Rent & Utilities',
    amount: 150.0,
    description: 'Electricity bill for Zindabazar Outlet (Month of August)',
    recordedBy: 'Store Manager',
    expenseDate: new Date(Date.now() - 86400000 * 2),
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'exp-002',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'SYL-01',
    category: 'Packaging & Bags',
    amount: 35.0,
    description: 'Eco-friendly jute shopping bags replenishment',
    recordedBy: 'Lead Cashier',
    expenseDate: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'exp-003',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'SYL-01',
    category: 'Refreshments',
    amount: 12.5,
    description: 'Staff tea and snacks',
    recordedBy: 'Shift Cashier',
    expenseDate: new Date(),
    createdAt: new Date(),
  },
];

export async function getSales(storeId?: string): Promise<StoredSale[]> {
  if (storeId) {
    return inMemorySales.filter((s) => s.storeId === storeId);
  }
  return [...inMemorySales];
}

export async function recordSale(sale: Omit<StoredSale, 'id' | 'createdAt'>): Promise<StoredSale> {
  const newSale: StoredSale = {
    ...sale,
    id: `sale-${Date.now()}`,
    createdAt: new Date(),
  };
  inMemorySales = [newSale, ...inMemorySales];
  return newSale;
}

export async function getExpenses(storeId?: string): Promise<StoredExpense[]> {
  if (storeId) {
    return inMemoryExpenses.filter((e) => e.storeId === storeId);
  }
  return [...inMemoryExpenses];
}

export async function recordExpense(expense: Omit<StoredExpense, 'id' | 'createdAt'>): Promise<StoredExpense> {
  const newExpense: StoredExpense = {
    ...expense,
    id: `exp-${Date.now()}`,
    createdAt: new Date(),
  };
  inMemoryExpenses = [newExpense, ...inMemoryExpenses];
  return newExpense;
}



