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

export async function getCategories(tenantId?: string): Promise<Category[]> {
  if (db) {
    try {
      if (tenantId) {
        return await db.select().from(categories).where(eq(categories.tenantId, tenantId));
      }
      return await db.select().from(categories);
    } catch (error) {
      console.warn('Database query failed for categories, returning in-memory:', error);
    }
  }
  if (tenantId) {
    return inMemoryCategories.filter((c) => !c.tenantId || c.tenantId === tenantId);
  }
  return [...inMemoryCategories];
}

// In-memory mock store initialized with sample products for when DATABASE_URL is not configured
let inMemoryProducts: Product[] = [
  {
    id: '1',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-electronics',
    name: 'Wireless Headphones',
    description: 'High-quality noise cancelling Bluetooth headphones with deep bass',
    sku: 'WH-001',
    barcode: '8901234567890',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    unitCost: '65.00',
    unitPrice: '65.00',
    sellingPrice: '99.99',
    currentStock: 45,
    reorderLevel: 10,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99182',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-electronics',
    name: 'Gaming Mouse',
    description: 'Ergonomic optical gaming mouse with customizable RGB',
    sku: 'GM-002',
    barcode: '8901234567891',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=80',
    unitCost: '35.00',
    unitPrice: '35.00',
    sellingPrice: '59.99',
    currentStock: 5,
    reorderLevel: 15,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'woo_prod_4412',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-furniture',
    name: 'Office Chair',
    description: 'Ergonomic mesh executive office chair with lumbar support',
    sku: 'OC-003',
    barcode: '8901234567892',
    imageUrl: 'https://images.unsplash.com/photo-1580481077195-c54d372e987c?w=500&auto=format&fit=crop&q=80',
    unitCost: '180.00',
    unitPrice: '180.00',
    sellingPrice: '299.99',
    currentStock: 0,
    reorderLevel: 5,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: false,
    externalEcommerceId: null,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '4',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-lighting',
    name: 'Desk Lamp',
    description: 'Adjustable LED desk lamp with touch dimming & USB charging',
    sku: 'DL-004',
    barcode: '8901234567893',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
    unitCost: '45.00',
    unitPrice: '45.00',
    sellingPrice: '79.99',
    currentStock: 23,
    reorderLevel: 8,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99183',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-handicrafts',
    name: 'Handcrafted Cane Basket',
    description: 'Traditional Sylhet artisanal bamboo cane basket',
    sku: 'HC-005',
    barcode: '8901234567894',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
    unitCost: '9.50',
    unitPrice: '9.50',
    sellingPrice: '19.99',
    currentStock: 120,
    reorderLevel: 25,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99184',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: '6',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-handicrafts',
    name: 'Traditional Shital Pati Mat',
    description: 'Natural cool water-reed cane weave mat from Balaganj',
    sku: 'SP-006',
    barcode: '8901234567895',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80',
    unitCost: '14.00',
    unitPrice: '14.00',
    sellingPrice: '34.99',
    currentStock: 35,
    reorderLevel: 10,
    taxRatePercentage: '0.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99185',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '7',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-accessories',
    name: 'Leather Keyholder & Card Case',
    description: 'Handcrafted full-grain genuine leather key & card holder',
    sku: 'LK-007',
    barcode: '8901234567896',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80',
    unitCost: '6.00',
    unitPrice: '6.00',
    sellingPrice: '15.99',
    currentStock: 50,
    reorderLevel: 12,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99186',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: '8',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    categoryId: 'cat-apparel',
    name: 'Artisan Khadi Cotton Shirt',
    description: '100% handspun organic breathable khadi summer shirt',
    sku: 'AK-008',
    barcode: '8901234567897',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80',
    unitCost: '18.00',
    unitPrice: '18.00',
    sellingPrice: '45.00',
    currentStock: 18,
    reorderLevel: 6,
    taxRatePercentage: '5.00',
    isTaxInclusive: true,
    isSyncedToEcommerce: true,
    externalEcommerceId: 'shopify_prod_99187',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
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
  if (db) {
    try {
      if (tenantId) {
        return await db.select().from(products).where(eq(products.tenantId, tenantId));
      }
      return await db.select().from(products);
    } catch (error) {
      console.warn('Database query failed, returning in-memory products:', error);
    }
  }
  if (tenantId) {
    return inMemoryProducts.filter((p) => !p.tenantId || p.tenantId === tenantId);
  }
  return [...inMemoryProducts];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (db) {
    try {
      const results = await db.select().from(products).where(eq(products.id, id));
      if (results.length > 0) return results[0];
    } catch (error) {
      console.warn('Database query failed, falling back to in-memory:', error);
    }
  }
  return inMemoryProducts.find((p) => p.id === id);
}

export async function getProductByBarcode(barcode: string, tenantId?: string): Promise<Product | undefined> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return undefined;

  if (db) {
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
      console.warn('Database barcode query failed, falling back to in-memory:', error);
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
    categoryId: product.categoryId || null,
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
  if (db) {
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
      console.warn('Database query failed for audit logs, using in-memory store:', error);
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



