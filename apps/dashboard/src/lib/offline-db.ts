/**
 * WAW-POS Offline-First IndexedDB Store
 * High-performance durable local storage for offline sales, inventory mutations,
 * product catalogs, expenses, and synchronization history logs.
 */

export interface OfflineSaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OfflineSaleRecord {
  id: string; // offline unique client ID e.g. off_sale_1720000000000_123
  invoiceNumber: string;
  storeId: string;
  tenantId: string;
  cashierName: string;
  cashierRole: string;
  paymentMethod: string;
  items: OfflineSaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  tenderedAmount?: number;
  changeDue?: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string; // ISO string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface OfflineInventoryMutation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  storeId: string;
  tenantId: string;
  previousStock: number;
  changeAmount: number;
  newStock: number;
  adjustmentType: string;
  reason: string;
  userId: string;
  userName: string;
  userRole: string;
  notes?: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface OfflineExpenseRecord {
  id: string;
  storeId: string;
  tenantId: string;
  category: string;
  amount: number;
  description: string;
  recordedBy: string;
  expenseDate: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface SyncHistoryLog {
  id: string;
  timestamp: string;
  trigger: 'automatic_reconnect' | 'background_sync' | 'manual' | 'periodic';
  status: 'success' | 'partial' | 'failed';
  salesCount: number;
  inventoryCount: number;
  expensesCount: number;
  details: string;
  errorMessage?: string;
}

const DB_NAME = 'waw_pos_offline_db';
const DB_VERSION = 1;

const STORES = {
  SALES: 'sales_queue',
  INVENTORY: 'inventory_queue',
  EXPENSES: 'expenses_queue',
  PRODUCTS_CACHE: 'products_cache',
  SYNC_LOGS: 'sync_logs',
};

// Open or upgrade IndexedDB safely
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported or running on server.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Sales queue store
      if (!db.objectStoreNames.contains(STORES.SALES)) {
        const salesStore = db.createObjectStore(STORES.SALES, { keyPath: 'id' });
        salesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        salesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Inventory mutations queue
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const invStore = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
        invStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        invStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Expenses queue
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // Products catalog cache
      if (!db.objectStoreNames.contains(STORES.PRODUCTS_CACHE)) {
        const prodStore = db.createObjectStore(STORES.PRODUCTS_CACHE, { keyPath: 'id' });
        prodStore.createIndex('sku', 'sku', { unique: false });
        prodStore.createIndex('barcode', 'barcode', { unique: false });
        prodStore.createIndex('category', 'category', { unique: false });
      }

      // Sync audit logs
      if (!db.objectStoreNames.contains(STORES.SYNC_LOGS)) {
        const logsStore = db.createObjectStore(STORES.SYNC_LOGS, { keyPath: 'id' });
        logsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Queue a new sale into local IndexedDB
 */
export async function queueOfflineSale(sale: Omit<OfflineSaleRecord, 'syncStatus' | 'retryCount'>): Promise<OfflineSaleRecord> {
  const record: OfflineSaleRecord = {
    ...sale,
    syncStatus: 'pending',
    retryCount: 0,
  };

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SALES, 'readwrite');
      const store = tx.objectStore(STORES.SALES);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to LocalStorage mirror
    if (typeof window !== 'undefined') {
      try {
        const existing: OfflineSaleRecord[] = JSON.parse(localStorage.getItem('waw_offline_sales_queue') || '[]');
        existing.push(record);
        localStorage.setItem('waw_offline_sales_queue', JSON.stringify(existing));
      } catch (lsErr) {
        console.error('LocalStorage fallback error for sale queue:', lsErr);
      }
    }
    return record;
  }
}

/**
 * Retrieve all pending sales from IndexedDB
 */
export async function getPendingSales(): Promise<OfflineSaleRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SALES, 'readonly');
      const store = tx.objectStore(STORES.SALES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('waw_offline_sales_queue') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Remove a specific sale from queue after successful sync
 */
export async function removePendingSale(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SALES, 'readwrite');
      const store = tx.objectStore(STORES.SALES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // LocalStorage fallback cleanup
  }

  if (typeof window !== 'undefined') {
    try {
      const existing: OfflineSaleRecord[] = JSON.parse(localStorage.getItem('waw_offline_sales_queue') || '[]');
      const filtered = existing.filter((s) => s.id !== id);
      localStorage.setItem('waw_offline_sales_queue', JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * Queue an inventory mutation (e.g. stock count change, damage, restock)
 */
export async function queueOfflineInventory(
  mutation: Omit<OfflineInventoryMutation, 'syncStatus' | 'retryCount'>
): Promise<OfflineInventoryMutation> {
  const record: OfflineInventoryMutation = {
    ...mutation,
    syncStatus: 'pending',
    retryCount: 0,
  };

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('waw_offline_inventory_queue') || '[]');
        existing.push(record);
        localStorage.setItem('waw_offline_inventory_queue', JSON.stringify(existing));
      } catch {}
    }
    return record;
  }
}

/**
 * Retrieve all pending inventory adjustments
 */
export async function getPendingInventory(): Promise<OfflineInventoryMutation[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY, 'readonly');
      const store = tx.objectStore(STORES.INVENTORY);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('waw_offline_inventory_queue') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function removePendingInventory(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const existing: OfflineInventoryMutation[] = JSON.parse(localStorage.getItem('waw_offline_inventory_queue') || '[]');
      const filtered = existing.filter((i) => i.id !== id);
      localStorage.setItem('waw_offline_inventory_queue', JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * Queue an expense recorded while offline
 */
export async function queueOfflineExpense(
  expense: Omit<OfflineExpenseRecord, 'syncStatus' | 'retryCount'>
): Promise<OfflineExpenseRecord> {
  const record: OfflineExpenseRecord = {
    ...expense,
    syncStatus: 'pending',
    retryCount: 0,
  };

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXPENSES, 'readwrite');
      const store = tx.objectStore(STORES.EXPENSES);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('waw_offline_expenses_queue') || '[]');
        existing.push(record);
        localStorage.setItem('waw_offline_expenses_queue', JSON.stringify(existing));
      } catch {}
    }
    return record;
  }
}

export async function getPendingExpenses(): Promise<OfflineExpenseRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXPENSES, 'readonly');
      const store = tx.objectStore(STORES.EXPENSES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('waw_offline_expenses_queue') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function removePendingExpense(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.EXPENSES, 'readwrite');
      const store = tx.objectStore(STORES.EXPENSES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const existing: OfflineExpenseRecord[] = JSON.parse(localStorage.getItem('waw_offline_expenses_queue') || '[]');
      const filtered = existing.filter((e) => e.id !== id);
      localStorage.setItem('waw_offline_expenses_queue', JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * Cache complete product catalog for instant offline POS cashier search & barcode lookups
 */
export async function cacheProductCatalog(productList: unknown[]): Promise<void> {
  if (!Array.isArray(productList) || productList.length === 0) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.PRODUCTS_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCTS_CACHE);
    // Clear and repopulate
    store.clear();
    for (const item of productList) {
      store.put(item);
    }
  } catch {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('waw_cached_products', JSON.stringify(productList));
      } catch {}
    }
  }
}

export async function getCachedProductCatalog<T = unknown>(): Promise<T[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS_CACHE, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS_CACHE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('waw_cached_products') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Record a persistent synchronization log
 */
export async function saveSyncLog(log: Omit<SyncHistoryLog, 'id'>): Promise<SyncHistoryLog> {
  const record: SyncHistoryLog = {
    ...log,
    id: `synclog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOGS, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_LOGS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('waw_sync_logs') || '[]');
        logs.unshift(record);
        localStorage.setItem('waw_sync_logs', JSON.stringify(logs.slice(0, 50)));
      } catch {}
    }
  }
  return record;
}

export async function getSyncLogsHistory(): Promise<SyncHistoryLog[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOGS, 'readonly');
      const store = tx.objectStore(STORES.SYNC_LOGS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as SyncHistoryLog[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results.slice(0, 50));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('waw_sync_logs') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Aggregate counts of all items pending sync in local storage / IndexedDB
 */
export async function getAllQueueCounts(): Promise<{
  salesCount: number;
  inventoryCount: number;
  expensesCount: number;
  totalCount: number;
}> {
  const [sales, inv, exp] = await Promise.all([
    getPendingSales(),
    getPendingInventory(),
    getPendingExpenses(),
  ]);

  return {
    salesCount: sales.length,
    inventoryCount: inv.length,
    expensesCount: exp.length,
    totalCount: sales.length + inv.length + exp.length,
  };
}
