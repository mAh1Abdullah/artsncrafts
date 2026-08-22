import { InferInsertModel, InferSelectModel, eq } from 'drizzle-orm';
import { db } from './';
import { products } from './schema';

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

// In-memory mock store initialized with sample products for when DATABASE_URL is not configured
let inMemoryProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality noise cancelling headphones',
    sku: 'WH-001',
    unitPrice: '65.00',
    sellingPrice: '99.99',
    currentStock: 45,
    reorderLevel: 10,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Gaming Mouse',
    description: 'Ergonomic optical gaming mouse',
    sku: 'GM-002',
    unitPrice: '35.00',
    sellingPrice: '59.99',
    currentStock: 5,
    reorderLevel: 15,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'Office Chair',
    description: 'Ergonomic mesh executive office chair',
    sku: 'OC-003',
    unitPrice: '180.00',
    sellingPrice: '299.99',
    currentStock: 0,
    reorderLevel: 5,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '4',
    name: 'Desk Lamp',
    description: 'Adjustable LED desk lamp with dimming',
    sku: 'DL-004',
    unitPrice: '45.00',
    sellingPrice: '79.99',
    currentStock: 23,
    reorderLevel: 8,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    name: 'Notebook Set',
    description: 'Set of 3 premium hardcover ruled journals',
    sku: 'NS-005',
    unitPrice: '9.50',
    sellingPrice: '19.99',
    currentStock: 120,
    reorderLevel: 25,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
];

export async function getProducts(): Promise<Product[]> {
  if (db) {
    try {
      return await db.select().from(products);
    } catch (error) {
      console.warn('Database query failed, returning in-memory products:', error);
    }
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
    name: product.name,
    description: product.description ?? null,
    sku: product.sku,
    unitPrice: String(product.unitPrice),
    sellingPrice: String(product.sellingPrice),
    currentStock: Number(product.currentStock),
    reorderLevel: Number(product.reorderLevel),
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
      unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : existing.unitPrice,
      sellingPrice: product.sellingPrice !== undefined ? String(product.sellingPrice) : existing.sellingPrice,
      currentStock: product.currentStock !== undefined ? Number(product.currentStock) : existing.currentStock,
      reorderLevel: product.reorderLevel !== undefined ? Number(product.reorderLevel) : existing.reorderLevel,
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

