"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cacheProductCatalog,
  getAllQueueCounts,
  getPendingExpenses,
  getPendingInventory,
  getPendingSales,
  getSyncLogsHistory,
  queueOfflineExpense,
  queueOfflineInventory,
  queueOfflineSale,
  type OfflineExpenseRecord,
  type OfflineInventoryMutation,
  type OfflineSaleRecord,
  type SyncHistoryLog,
} from "@/lib/offline-db";
import {
  initAutoSyncLifecycle,
  performFullSync,
  subscribeToSyncEvents,
} from "@/lib/background-sync";
import {
  DEFAULT_USERS,
  SUBSCRIPTION_TIERS,
  evaluateAccess,
  type PermissionAction,
  type SubscriptionTier,
  type UserRole,
} from "@/lib/permissions";
import {
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SYNC_LOGS,
  STORES_LIST,
} from "../data/initial-data";
import type {
  AccessDeniedModalState,
  BeforeInstallPromptEvent,
  BusinessExpense,
  CartItem,
  OfflineQueueCounts,
  POSProduct,
  PosNotification,
  PosTabId,
  SaleTransaction,
  ShiftAuditResult,
  SyncLog,
} from "../types";

export function usePosWorkspace() {
  const [activeTab, setActiveTab] = useState<PosTabId>("pos");
  const [tenantName] = useState("Sylhet Artisans & Retail Network");
  const [selectedStore, setSelectedStore] = useState("SYL-01");
  const storesList = STORES_LIST;

  const [activeCashier, setActiveCashier] = useState("Tanvir Hasan (Lead Cashier)");
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [notification, setNotification] = useState<PosNotification | null>(null);

  const notify = useCallback((message: string, tone: PosNotification["tone"] = "info") => {
    setNotification({ id: Date.now(), tone, message });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // RBAC & Subscription Tier state
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("pro");
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({
    core_pos: true,
    inventory: true,
    barcodes: true,
    ecommerce_bridge: true,
    multi_store: true,
    advanced_reports: true,
    shift_auditing: true,
  });

  const [accessDeniedModal, setAccessDeniedModal] = useState<AccessDeniedModalState>({
    isOpen: false,
    title: "Access Restricted",
    reason: "",
  });

  const [receiptPaperSize, setReceiptPaperSize] = useState<"80mm" | "58mm">("80mm");

  // PWA Background Sync & Offline Storage State
  const [isOfflineSyncModalOpen, setIsOfflineSyncModalOpen] = useState(false);
  const [queueCounts, setQueueCounts] = useState<OfflineQueueCounts>({
    salesCount: 0,
    inventoryCount: 0,
    expensesCount: 0,
    totalCount: 0,
  });
  const [pendingSalesList, setPendingSalesList] = useState<OfflineSaleRecord[]>([]);
  const [pendingInventoryList, setPendingInventoryList] = useState<OfflineInventoryMutation[]>([]);
  const [pendingExpensesList, setPendingExpensesList] = useState<OfflineExpenseRecord[]>([]);
  const [offlineSyncHistory, setOfflineSyncHistory] = useState<SyncHistoryLog[]>([]);
  const [isSyncEngineRunning, setIsSyncEngineRunning] = useState(false);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [offlineModalTab, setOfflineModalTab] = useState<"queue" | "history" | "pwa">("queue");

  // Shift Drawer State
  const [shiftOpeningCash, setShiftOpeningCash] = useState<number>(100.0);
  const [isShiftAuditOpen, setIsShiftAuditOpen] = useState(false);
  const [shiftCountedCash, setShiftCountedCash] = useState<string>("");
  const [shiftAuditResult, setShiftAuditResult] = useState<ShiftAuditResult | null>(null);

  // Products & Cart State
  const [products, setProducts] = useState<POSProduct[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_banking" | "upi">("cash");
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [lastInvoice, setLastInvoice] = useState<SaleTransaction | null>(null);

  // Sales History State
  const [salesList, setSalesList] = useState<SaleTransaction[]>(INITIAL_SALES);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [salesPaymentFilter, setSalesPaymentFilter] = useState("all");
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleTransaction | null>(null);

  // Expenses State
  const [expenses, setExpenses] = useState<BusinessExpense[]>(INITIAL_EXPENSES);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseSearchTerm, setExpenseSearchTerm] = useState("");

  // Inventory & Transfer State
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set());
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [bulkStockMode, setBulkStockMode] = useState<"set" | "add" | "subtract">("set");
  const [bulkStockValue, setBulkStockValue] = useState<number>(25);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferProductId, setTransferProductId] = useState<string>("");
  const [transferTargetStore, setTransferTargetStore] = useState<string>("ZIN-02");
  const [transferQty, setTransferQty] = useState<number>(5);

  // Barcode Label Generator State
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<POSProduct | null>(null);
  const [labelPrintCount, setLabelPrintCount] = useState<number>(4);

  // E-commerce & Sync State
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiResponseTest, setApiResponseTest] = useState<string | null>(null);

  const loadOfflineQueueData = useCallback(async () => {
    try {
      const [sales, inv, exp, logs, counts] = await Promise.all([
        getPendingSales(),
        getPendingInventory(),
        getPendingExpenses(),
        getSyncLogsHistory(),
        getAllQueueCounts(),
      ]);
      setPendingSalesList(sales);
      setPendingInventoryList(inv);
      setPendingExpensesList(exp);
      setOfflineSyncHistory(logs);
      setQueueCounts(counts);
      setOfflineQueue(counts.totalCount);
    } catch (e) {
      console.error("Failed loading offline queue details", e);
    }
  }, []);

  const handleTriggerFullSync = useCallback(async () => {
    setIsSyncEngineRunning(true);
    try {
      const result = await performFullSync("manual");
      await loadOfflineQueueData();
      if (result.success) {
        if (result.totalSynced > 0) {
          notify(
            `Synchronization complete! Pushed ${result.totalSynced} transaction(s) to Cloud D1 Database.`,
            "success"
          );
        } else {
          notify("All offline queues are up-to-date. Database is fully synchronized.", "info");
        }
      } else {
        notify(`Sync warning: ${result.errors.join(", ")}`, "warning");
      }
    } catch (err) {
      notify(`Sync failed: ${(err as Error).message}`, "error");
    } finally {
      setIsSyncEngineRunning(false);
    }
  }, [loadOfflineQueueData, notify]);

  // Sync role and tier into cookies for backend middleware & API routes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = `waw_role=${userRole}; path=/; max-age=86400`;
      document.cookie = `waw_tier=${subscriptionTier}; path=/; max-age=86400`;
    }
  }, [userRole, subscriptionTier]);

  // Hydrate live catalog from WAW-POS backend API so Artisans Market storefront stock stays synced
  useEffect(() => {
    let active = true;
    const fetchLiveCatalog = async () => {
      try {
        const res = await fetch("/api/v1/products?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (!active || !res.ok || !Array.isArray(json?.data) || json.data.length === 0) {
          return;
        }
        const categoryNames: Record<string, string> = {
          "cat-handicrafts": "Handicrafts",
          "cat-apparel": "Textiles & Apparel",
          "cat-home-living": "Woodcraft & Home",
          "cat-accessories": "Jewelry & Leather",
          "cat-furniture": "Furniture",
          "cat-electronics": "Electronics",
          "cat-lighting": "Lighting",
        };
        const mapped: POSProduct[] = json.data.map(
          (raw: {
            id: string;
            name: string;
            sku: string;
            barcode?: string | null;
            categoryId?: string | null;
            currentStock?: number | null;
            reorderLevel?: number | null;
            unitCost?: string | number | null;
            sellingPrice?: string | number | null;
            taxRatePercentage?: string | number | null;
            isSyncedToEcommerce?: boolean | null;
            externalEcommerceId?: string | null;
          }) => {
            const stock = Number(raw.currentStock ?? 0);
            const minStock = Number(raw.reorderLevel ?? 5);
            const status: POSProduct["status"] =
              stock <= 0 ? "Out of Stock" : stock <= minStock ? "Low Stock" : "In Stock";
            return {
              id: raw.id,
              name: raw.name,
              sku: raw.sku,
              barcode: raw.barcode || `890${raw.sku}`,
              category: (raw.categoryId && categoryNames[raw.categoryId]) || "Handicrafts",
              stock,
              minStock,
              unitCost: Number(raw.unitCost ?? 0),
              price: Number(raw.sellingPrice ?? 0),
              taxRate: Number(raw.taxRatePercentage ?? 0),
              status,
              syncedToEcommerce: raw.isSyncedToEcommerce !== false,
              externalId: raw.externalEcommerceId || undefined,
              storeStocks: {
                "SYL-01": stock,
                "ZIN-02": Math.max(0, Math.floor(stock * 0.35)),
                "DHK-03": Math.max(0, Math.floor(stock * 0.25)),
              },
            };
          }
        );
        setProducts(mapped);
        cacheProductCatalog(mapped);
      } catch {
        // Keep cached/fallback products offline
      }
    };
    fetchLiveCatalog();
    return () => {
      active = false;
    };
  }, []);

  // Synchronize network online/offline listeners, IndexedDB background sync, and PWA install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribeSync = subscribeToSyncEvents(({ isSyncing: syncingNow, queueCounts: counts }) => {
      setIsSyncEngineRunning(syncingNow);
      setQueueCounts(counts);
      setOfflineQueue(counts.totalCount);
    });

    const cleanupAutoSync = initAutoSyncLifecycle();

    const handleSyncDone = () => {
      loadOfflineQueueData();
    };
    window.addEventListener("waw-pos-sync-completed", handleSyncDone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setPwaInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    loadOfflineQueueData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeSync();
      cleanupAutoSync();
      window.removeEventListener("waw-pos-sync-completed", handleSyncDone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [loadOfflineQueueData]);

  // Synchronize active cashier name when user role changes
  useEffect(() => {
    const user = DEFAULT_USERS[userRole];
    if (user) {
      setActiveCashier(`${user.name} (${user.role.toUpperCase()})`);
    }
  }, [userRole]);

  const buildSession = useCallback(() => {
    return {
      ...DEFAULT_USERS[userRole],
      role: userRole,
      tier: subscriptionTier,
      enabledModules: {
        ...DEFAULT_USERS[userRole].enabledModules,
        ...SUBSCRIPTION_TIERS[subscriptionTier]?.allowedModules.reduce((acc, mod) => {
          acc[mod] = true;
          return acc;
        }, {} as Record<string, boolean>),
        ...enabledModules,
      },
    };
  }, [userRole, subscriptionTier, enabledModules]);

  const canPerform = useCallback(
    (action: PermissionAction): boolean => {
      return evaluateAccess(buildSession(), action).allowed;
    },
    [buildSession]
  );

  const checkAction = useCallback(
    (action: PermissionAction, onAllowed: () => void) => {
      const evalResult = evaluateAccess(buildSession(), action);
      if (!evalResult.allowed) {
        setAccessDeniedModal({
          isOpen: true,
          title: evalResult.requiredTier
            ? "Subscription Tier Upgrade Required"
            : "Role Clearance Required",
          reason:
            evalResult.reason ||
            "Your current role or subscription plan does not allow this operation.",
          requiredRole: evalResult.requiredRole,
          requiredTier: evalResult.requiredTier,
          requiredModule: evalResult.requiredModule,
          targetAction: action,
        });
        return false;
      }
      onAllowed();
      return true;
    },
    [buildSession]
  );

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartTax = cart.reduce(
    (sum, item) => sum + (item.product.price * item.quantity * item.product.taxRate) / 100,
    0
  );
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + cartTax);

  // Shift Cash Accumulator
  const shiftCashSales = salesList
    .filter((s) => s.paymentMethod === "cash" && s.storeId === selectedStore)
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const expectedDrawerCash = shiftOpeningCash + shiftCashSales;

  // Cart Operations
  const addToCart = (product: POSProduct) => {
    const currentStoreStock = product.storeStocks[selectedStore] ?? product.stock;
    if (currentStoreStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStoreStock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const currentStoreStock = item.product.storeStocks[selectedStore] ?? item.product.stock;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > currentStoreStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setTenderedAmount("");
    setCustomerName("");
    setCustomerPhone("");
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = products.find(
      (p) =>
        p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (match) {
      addToCart(match);
      setBarcodeInput("");
    } else {
      notify(`No product found for barcode/SKU: ${barcodeInput}`, "warning");
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((item) => item.product.id === p.id);
      if (cartItem) {
        const currentStoreQty = p.storeStocks[selectedStore] ?? p.stock;
        const newStoreQty = Math.max(0, currentStoreQty - cartItem.quantity);
        const newTotalStock = Math.max(0, p.stock - cartItem.quantity);
        return {
          ...p,
          stock: newTotalStock,
          storeStocks: {
            ...p.storeStocks,
            [selectedStore]: newStoreQty,
          },
          status: (newTotalStock === 0
            ? "Out of Stock"
            : newTotalStock <= p.minStock
            ? "Low Stock"
            : "In Stock") as POSProduct["status"],
        };
      }
      return p;
    });

    setProducts(updatedProducts);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNo: invoiceNumber,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", Today",
      storeId: selectedStore,
      cashierName: activeCashier,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount,
      discountPercent,
      taxAmount: cartTax,
      totalAmount: cartTotal,
      paymentMethod,
      status: "completed",
      source: "pos_terminal",
    };

    setSalesList((prev) => [newSale, ...prev]);
    setLastInvoice(newSale);

    const offlinePayload = {
      id: newSale.id,
      invoiceNumber: newSale.invoiceNo,
      storeId: selectedStore,
      tenantId: "tenant-waw-sylhet-001",
      cashierName: activeCashier,
      cashierRole: userRole,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unitCost: i.product.unitCost,
        unitPrice: i.product.price,
        totalPrice: i.product.price * i.quantity,
      })),
      subtotal: cartSubtotal,
      discountAmount,
      taxAmount: cartTax,
      totalAmount: cartTotal,
      tenderedAmount: Number(tenderedAmount) || cartTotal,
      changeDue: Number(tenderedAmount) > cartTotal ? Number(tenderedAmount) - cartTotal : 0,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    cacheProductCatalog(updatedProducts);

    if (isOffline) {
      queueOfflineSale(offlinePayload).then(() => {
        loadOfflineQueueData();
      });
    } else {
      queueOfflineSale(offlinePayload).then(() => {
        performFullSync("automatic_reconnect").then(() => {
          loadOfflineQueueData();
        });
      });

      if (enabledModules.ecommerce_bridge) {
        const newLog: SyncLog = {
          id: `log-${Date.now()}`,
          timestamp: "Just now",
          platform: "Shopify",
          eventType: "inventory.synced",
          details: `POS Sale #${invoiceNumber} (-${cart.reduce((s, i) => s + i.quantity, 0)} items) broadcasted to e-commerce bridge`,
          status: "success",
        };
        setSyncLogs((prev) => [newLog, ...prev]);
      }
    }

    setIsCheckoutOpen(false);
    clearCart();
  };

  const syncQueuedOfflineSales = () => {
    handleTriggerFullSync();
  };

  const handleStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || transferTargetStore === selectedStore || transferQty <= 0) return;

    let insufficient = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === transferProductId) {
          const fromStock = p.storeStocks[selectedStore] ?? 0;
          const toStock = p.storeStocks[transferTargetStore] ?? 0;
          if (fromStock < transferQty) {
            insufficient = true;
            return p;
          }
          return {
            ...p,
            storeStocks: {
              ...p.storeStocks,
              [selectedStore]: fromStock - transferQty,
              [transferTargetStore]: toStock + transferQty,
            },
          };
        }
        return p;
      })
    );

    if (insufficient) {
      notify("Cannot transfer more stock than available in source store.", "warning");
      return;
    }

    setIsTransferOpen(false);
    notify(`Successfully transferred ${transferQty} units to ${transferTargetStore}.`, "success");
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const barcode = (formData.get("barcode") as string) || `890${Date.now().toString().slice(-9)}`;
    const category = formData.get("category") as string;
    const stock = Number.parseInt(formData.get("stock") as string) || 0;
    const minStock = Number.parseInt(formData.get("minStock") as string) || 5;
    const price = Number.parseFloat(formData.get("price") as string) || 0;
    const unitCost = Number.parseFloat(formData.get("unitCost") as string) || 0;
    const syncEcommerce = formData.get("syncedToEcommerce") === "on";

    const newProd: POSProduct = {
      id: String(Date.now()),
      name,
      sku,
      barcode,
      category,
      stock,
      minStock,
      unitCost,
      price,
      taxRate: 5,
      status: stock === 0 ? "Out of Stock" : stock <= minStock ? "Low Stock" : "In Stock",
      syncedToEcommerce: syncEcommerce,
      externalId: syncEcommerce ? `ext_${sku.toLowerCase()}` : undefined,
      storeStocks: { [selectedStore]: stock, "ZIN-02": 0, "DHK-03": 0 },
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    cacheProductCatalog(updated);

    if (isOffline) {
      queueOfflineInventory({
        id: `inv-${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        storeId: selectedStore,
        tenantId: "tenant-waw-sylhet-001",
        previousStock: 0,
        changeAmount: stock,
        newStock: stock,
        adjustmentType: "create_product",
        reason: "New catalog SKU added offline",
        userId: `user-${userRole}`,
        userName: activeCashier,
        userRole,
        createdAt: new Date().toISOString(),
      }).then(() => loadOfflineQueueData());
    }

    setIsAddProductOpen(false);
    notify(`Added "${name}" (${sku}) to inventory.`, "success");
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get("category") as string;
    const amount = Number.parseFloat(formData.get("amount") as string) || 0;
    const description = formData.get("description") as string;
    const paymentMethodExp = formData.get("paymentMethod") as string;

    const newExp: BusinessExpense = {
      id: `exp-${Date.now()}`,
      storeId: selectedStore,
      category,
      amount,
      date: new Date().toISOString().split("T")[0],
      description,
      recordedBy: activeCashier.split(" ")[0],
      paymentMethod: paymentMethodExp,
    };

    setExpenses([newExp, ...expenses]);

    if (isOffline) {
      queueOfflineExpense({
        id: newExp.id,
        storeId: selectedStore,
        tenantId: "tenant-waw-sylhet-001",
        category,
        amount,
        description,
        recordedBy: activeCashier,
        expenseDate: newExp.date,
        createdAt: new Date().toISOString(),
      }).then(() => loadOfflineQueueData());
    }

    setIsAddExpenseOpen(false);
    notify(`Recorded expense of $${amount.toFixed(2)} under ${category}.`, "success");
  };

  const triggerManualSync = async () => {
    setIsSyncing(true);
    setApiResponseTest("Sending inventory sync payload to /api/v1/inventory/sync...");
    try {
      const res = await fetch("/api/v1/inventory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "shopify",
          items: products
            .filter((p) => p.syncedToEcommerce)
            .map((p) => ({
              sku: p.sku,
              barcode: p.barcode,
              newStock: p.stock,
              externalId: p.externalId,
            })),
        }),
      });
      const envelope = await res.json();
      const data = envelope?.data ?? envelope;
      setApiResponseTest(JSON.stringify(envelope, null, 2));
      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: "Just now",
        platform: "Shopify",
        eventType: "inventory.synced",
        details: `Successfully synced ${data.syncedCount || products.length} catalog items with external channel`,
        status: "success",
      };
      setSyncLogs((prev) => [newLog, ...prev]);
    } catch (err) {
      setApiResponseTest(`Sync error: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const simulateExternalOrder = async () => {
    setIsSyncing(true);
    setApiResponseTest("Simulating inbound e-commerce order via /api/v1/orders/webhook...");
    try {
      const res = await fetch("/api/v1/orders/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "shopify",
          orderNumber: `SHOPIFY-${Math.floor(1000 + Math.random() * 9000)}`,
          lineItems: [{ sku: "HC-005", quantity: 2 }],
          totalAmount: "39.98",
          paymentMethod: "online_card",
        }),
      });
      const data = await res.json();
      setApiResponseTest(JSON.stringify(data, null, 2));

      setProducts((prev) =>
        prev.map((p) => {
          if (p.sku === "HC-005") {
            const remaining = Math.max(0, p.stock - 2);
            return {
              ...p,
              stock: remaining,
              storeStocks: {
                ...p.storeStocks,
                [selectedStore]: Math.max(0, (p.storeStocks[selectedStore] ?? 0) - 2),
              },
            };
          }
          return p;
        })
      );

      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: "Just now",
        platform: "Shopify",
        eventType: "order.created",
        details: `Inbound Webhook: Order #${data.orderNumber} received, deducted 2 units of HC-005`,
        status: "success",
      };
      setSyncLogs((prev) => [newLog, ...prev]);
    } catch (err) {
      setApiResponseTest(`Simulation error: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const exportCSV = (type: "sales" | "expenses" | "inventory") => {
    let csvContent = "";
    const fileName = `waw-pos-${type}-${Date.now()}.csv`;

    if (type === "sales") {
      csvContent = "Invoice No,Date,Store,Cashier,Customer,Items Count,Total ($),Method,Status\n";
      salesList.forEach((s) => {
        csvContent += `"${s.invoiceNo}","${s.date}","${s.storeId}","${s.cashierName}","${s.customerName || "Walk-in"}",${s.items.reduce((c, i) => c + i.quantity, 0)},${s.totalAmount.toFixed(2)},"${s.paymentMethod}","${s.status}"\n`;
      });
    } else if (type === "expenses") {
      csvContent = "ID,Date,Store,Category,Amount ($),Description,Recorded By,Payment Method\n";
      expenses.forEach((e) => {
        csvContent += `"${e.id}","${e.date}","${e.storeId}","${e.category}",${e.amount.toFixed(2)},"${e.description}","${e.recordedBy}","${e.paymentMethod}"\n`;
      });
    } else {
      csvContent = "SKU,Barcode,Product Name,Category,Cost ($),Price ($),Stock,Status,Synced Ecommerce\n";
      products.forEach((p) => {
        csvContent += `"${p.sku}","${p.barcode}","${p.name}","${p.category}",${p.unitCost.toFixed(2)},${p.price.toFixed(2)},${p.stock},"${p.status}",${p.syncedToEcommerce}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Aggregations
  const totalRevenue = salesList.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCOGS = salesList.reduce((sum, s) => {
    const saleCost = s.items.reduce((c, i) => c + (i.product.unitCost || 0) * i.quantity, 0);
    return sum + saleCost;
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpensesAmount;
  const avgOrderValue = salesList.length > 0 ? totalRevenue / salesList.length : 0;
  const totalInventoryCost = products.reduce((sum, p) => sum + p.unitCost * p.stock, 0);
  const totalInventoryRetail = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const posFilteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
      p.barcode.includes(posSearchTerm);
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return {
    // Workspace navigation & tenant
    activeTab,
    setActiveTab,
    tenantName,
    selectedStore,
    setSelectedStore,
    storesList,
    activeCashier,
    isOffline,
    setIsOffline,
    offlineQueue,
    notification,
    setNotification,
    notify,

    // RBAC & SaaS tiers
    subscriptionTier,
    setSubscriptionTier,
    userRole,
    setUserRole,
    enabledModules,
    setEnabledModules,
    accessDeniedModal,
    setAccessDeniedModal,
    canPerform,
    checkAction,

    // Receipt settings
    receiptPaperSize,
    setReceiptPaperSize,

    // Offline PWA sync
    isOfflineSyncModalOpen,
    setIsOfflineSyncModalOpen,
    queueCounts,
    pendingSalesList,
    pendingInventoryList,
    pendingExpensesList,
    offlineSyncHistory,
    isSyncEngineRunning,
    pwaInstallPrompt,
    setPwaInstallPrompt,
    isPwaInstalled,
    setIsPwaInstalled,
    offlineModalTab,
    setOfflineModalTab,
    loadOfflineQueueData,
    handleTriggerFullSync,
    syncQueuedOfflineSales,

    // Shift drawer
    shiftOpeningCash,
    setShiftOpeningCash,
    isShiftAuditOpen,
    setIsShiftAuditOpen,
    shiftCountedCash,
    setShiftCountedCash,
    shiftAuditResult,
    setShiftAuditResult,
    shiftCashSales,
    expectedDrawerCash,

    // Products & cart
    products,
    setProducts,
    cart,
    posSearchTerm,
    setPosSearchTerm,
    barcodeInput,
    setBarcodeInput,
    discountPercent,
    setDiscountPercent,
    selectedCategory,
    setSelectedCategory,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    cartSubtotal,
    cartTax,
    discountAmount,
    cartTotal,
    categories,
    posFilteredProducts,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    handleBarcodeSubmit,

    // Checkout & invoices
    isCheckoutOpen,
    setIsCheckoutOpen,
    paymentMethod,
    setPaymentMethod,
    tenderedAmount,
    setTenderedAmount,
    lastInvoice,
    setLastInvoice,
    handleCompleteSale,

    // Sales history
    salesList,
    salesSearchTerm,
    setSalesSearchTerm,
    salesPaymentFilter,
    setSalesPaymentFilter,
    selectedSaleDetail,
    setSelectedSaleDetail,

    // Expenses
    expenses,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    expenseSearchTerm,
    setExpenseSearchTerm,
    handleAddExpense,

    // Inventory & bulk actions
    inventorySearchTerm,
    setInventorySearchTerm,
    selectedInventoryIds,
    setSelectedInventoryIds,
    isBulkStockModalOpen,
    setIsBulkStockModalOpen,
    bulkStockMode,
    setBulkStockMode,
    bulkStockValue,
    setBulkStockValue,
    isBulkDeleteModalOpen,
    setIsBulkDeleteModalOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    handleAddProduct,
    isTransferOpen,
    setIsTransferOpen,
    transferProductId,
    setTransferProductId,
    transferTargetStore,
    setTransferTargetStore,
    transferQty,
    setTransferQty,
    handleStockTransfer,

    // Barcode labels
    isLabelModalOpen,
    setIsLabelModalOpen,
    selectedLabelProduct,
    setSelectedLabelProduct,
    labelPrintCount,
    setLabelPrintCount,

    // E-commerce bridge
    syncLogs,
    isSyncing,
    apiResponseTest,
    triggerManualSync,
    simulateExternalOrder,

    // Analytics & exports
    exportCSV,
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalExpensesAmount,
    netProfit,
    avgOrderValue,
    totalInventoryCost,
    totalInventoryRetail,
  };
}

export type PosWorkspaceController = ReturnType<typeof usePosWorkspace>;
