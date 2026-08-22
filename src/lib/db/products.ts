import { InferInsertModel, InferSelectModel, eq } from 'drizzle-orm';
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

// In-memory mock store initialized with sample products for when DATABASE_URL is not configured
let inMemoryProducts: Product[] = [
  {
    id: '1',
    tenantId: 'tenant-waw-sylhet-001',
    categoryId: null,
    name: 'Wireless Headphones',
    description: 'High-quality noise cancelling headphones',
    sku: 'WH-001',
    barcode: '8901234567890',
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
    categoryId: null,
    name: 'Gaming Mouse',
    description: 'Ergonomic optical gaming mouse',
    sku: 'GM-002',
    barcode: '8901234567891',
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
    categoryId: null,
    name: 'Office Chair',
    description: 'Ergonomic mesh executive office chair',
    sku: 'OC-003',
    barcode: '8901234567892',
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
    categoryId: null,
    name: 'Desk Lamp',
    description: 'Adjustable LED desk lamp with dimming',
    sku: 'DL-004',
    barcode: '8901234567893',
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
    categoryId: null,
    name: 'Handcrafted Cane Basket',
    description: 'Traditional Sylhet artisanal bamboo basket',
    sku: 'HC-005',
    barcode: '8901234567894',
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
    categoryId: product.categoryId || null,
    name: product.name,
    description: product.description ?? null,
    sku: product.sku,
    barcode: product.barcode ?? null,
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



