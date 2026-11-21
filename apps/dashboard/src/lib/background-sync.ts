/**
 * WAW-POS Background Sync & Service Worker Manager
 * Handles Service Worker registration, Background Sync API integration,
 * network reconnect listening, and atomic batch sync to backend endpoints.
 */

import {
  getPendingSales,
  getPendingInventory,
  getPendingExpenses,
  removePendingSale,
  removePendingInventory,
  removePendingExpense,
  saveSyncLog,
  cacheProductCatalog,
  getAllQueueCounts,
} from './offline-db';

export interface SyncResult {
  success: boolean;
  salesSynced: number;
  inventorySynced: number;
  expensesSynced: number;
  totalSynced: number;
  errors: string[];
  serverTimestamp?: string;
}

type SyncListener = (status: {
  isSyncing: boolean;
  lastResult?: SyncResult;
  queueCounts: { salesCount: number; inventoryCount: number; expensesCount: number; totalCount: number };
}) => void;

const listeners = new Set<SyncListener>();
let isSyncInProgress = false;

export function subscribeToSyncEvents(listener: SyncListener): () => void {
  listeners.add(listener);
  // Send current state
  getAllQueueCounts().then((queueCounts) => {
    listener({ isSyncing: isSyncInProgress, queueCounts });
  });
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(lastResult?: SyncResult) {
  getAllQueueCounts().then((queueCounts) => {
    listeners.forEach((fn) => fn({ isSyncing: isSyncInProgress, lastResult, queueCounts }));
  });
}

/**
 * Register Service Worker and Background Sync
 */
export async function registerServiceWorkerAndSync(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered with scope:', registration.scope);

    // Register Background Sync once the service worker is active
    const readyRegistration = await navigator.serviceWorker.ready;
    if ('sync' in readyRegistration) {
      try {
        // @ts-expect-error SyncManager is standard in PWAs but omitted in basic TS DOM types
        await readyRegistration.sync.register('waw-pos-sync');
        console.log('[PWA] Background Sync registered tag: waw-pos-sync');
      } catch (syncErr) {
        console.log('[PWA] Background Sync registration deferred:', syncErr);
      }
    }

    // Listen for Service Worker postMessages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED' || event.data?.type === 'PERIODIC_SYNC_TRIGGERED') {
        performFullSync('background_sync');
      }
    });

    return registration;
  } catch (error) {
    console.warn('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Perform a full bidirectional synchronization between local IndexedDB and server database
 */
export async function performFullSync(
  trigger: 'automatic_reconnect' | 'background_sync' | 'manual' | 'periodic' = 'manual'
): Promise<SyncResult> {
  if (isSyncInProgress) {
    return {
      success: false,
      salesSynced: 0,
      inventorySynced: 0,
      expensesSynced: 0,
      totalSynced: 0,
      errors: ['A synchronization cycle is already in progress.'],
    };
  }

  // Check if browser is online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      salesSynced: 0,
      inventorySynced: 0,
      expensesSynced: 0,
      totalSynced: 0,
      errors: ['Device is offline. Will automatically synchronize upon reconnection.'],
    };
  }

  isSyncInProgress = true;
  notifyListeners();

  const errors: string[] = [];
  let salesSynced = 0;
  let inventorySynced = 0;
  let expensesSynced = 0;

  try {
    const [pendingSales, pendingInventory, pendingExpenses] = await Promise.all([
      getPendingSales(),
      getPendingInventory(),
      getPendingExpenses(),
    ]);

    const totalToSync = pendingSales.length + pendingInventory.length + pendingExpenses.length;

    if (totalToSync === 0) {
      isSyncInProgress = false;
      notifyListeners();
      return {
        success: true,
        salesSynced: 0,
        inventorySynced: 0,
        expensesSynced: 0,
        totalSynced: 0,
        errors: [],
      };
    }

    // Call unified batch sync endpoint with Idempotency-Key
    const idempotencyKey = `sync-${Date.now()}-${totalToSync}`;
    const response = await fetch('/api/v1/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        sales: pendingSales,
        inventory: pendingInventory,
        expenses: pendingExpenses,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || errData.error || `Server responded with status ${response.status}`);
    }

    const envelope = await response.json();
    const data = envelope?.data ?? envelope;

    // Process synced sales
    if (data.syncedSales && Array.isArray(data.syncedSales)) {
      for (const synced of data.syncedSales) {
        if (synced.id) {
          await removePendingSale(synced.id);
          salesSynced++;
        }
      }
    } else if (pendingSales.length > 0) {
      for (const sale of pendingSales) {
        await removePendingSale(sale.id);
        salesSynced++;
      }
    }

    // Process synced inventory mutations
    if (data.syncedInventory && Array.isArray(data.syncedInventory)) {
      for (const synced of data.syncedInventory) {
        if (synced.id) {
          await removePendingInventory(synced.id);
          inventorySynced++;
        }
      }
    } else if (pendingInventory.length > 0) {
      for (const inv of pendingInventory) {
        await removePendingInventory(inv.id);
        inventorySynced++;
      }
    }

    // Process synced expenses
    if (data.syncedExpenses && Array.isArray(data.syncedExpenses)) {
      for (const synced of data.syncedExpenses) {
        if (synced.id) {
          await removePendingExpense(synced.id);
          expensesSynced++;
        }
      }
    } else if (pendingExpenses.length > 0) {
      for (const exp of pendingExpenses) {
        await removePendingExpense(exp.id);
        expensesSynced++;
      }
    }

    // Refresh cached products catalog if server returned latest catalog
    if (data.products && Array.isArray(data.products)) {
      await cacheProductCatalog(data.products);
    }

    const totalSynced = salesSynced + inventorySynced + expensesSynced;

    // Record persistent sync audit log
    await saveSyncLog({
      timestamp: new Date().toISOString(),
      trigger,
      status: errors.length > 0 ? (totalSynced > 0 ? 'partial' : 'failed') : 'success',
      salesCount: salesSynced,
      inventoryCount: inventorySynced,
      expensesCount: expensesSynced,
      details: `Successfully synchronized ${totalSynced} pending item(s) to PostgreSQL (${salesSynced} sales, ${inventorySynced} stock updates, ${expensesSynced} expenses).`,
    });

    const result: SyncResult = {
      success: true,
      salesSynced,
      inventorySynced,
      expensesSynced,
      totalSynced,
      errors,
      serverTimestamp: envelope?.meta?.timestamp ?? data.timestamp,
    };

    isSyncInProgress = false;
    notifyListeners(result);

    // Dispatch window event for open UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('waw-pos-sync-completed', {
          detail: result,
        })
      );
    }

    return result;
  } catch (error) {
    const errorMsg = (error as Error).message || 'Unknown synchronization error occurred';
    errors.push(errorMsg);

    await saveSyncLog({
      timestamp: new Date().toISOString(),
      trigger,
      status: 'failed',
      salesCount: salesSynced,
      inventoryCount: inventorySynced,
      expensesCount: expensesSynced,
      details: `Synchronization failed: ${errorMsg}`,
      errorMessage: errorMsg,
    });

    const result: SyncResult = {
      success: false,
      salesSynced,
      inventorySynced,
      expensesSynced,
      totalSynced: salesSynced + inventorySynced + expensesSynced,
      errors,
    };

    isSyncInProgress = false;
    notifyListeners(result);
    return result;
  }
}

/**
 * Initialize automatic listeners for browser online event & periodic background checks
 */
export function initAutoSyncLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Listen for browser returning online
  const handleOnline = () => {
    console.log('[Sync Engine] Internet connection restored. Initiating automatic background sync...');
    performFullSync('automatic_reconnect');
  };

  window.addEventListener('online', handleOnline);

  // 2. Periodic background check timer (runs every 45s if online and items exist)
  const intervalId = setInterval(() => {
    if (navigator.onLine && !isSyncInProgress) {
      getAllQueueCounts().then((counts) => {
        if (counts.totalCount > 0) {
          performFullSync('periodic');
        }
      });
    }
  }, 45000);

  // 3. Register service worker
  registerServiceWorkerAndSync();

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}
