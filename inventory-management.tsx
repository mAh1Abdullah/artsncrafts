"use client";

import { useState, useEffect, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowRightLeft,
  Barcode,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Package,
  Percent,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wifi,
  WifiOff,
  Zap,
  ChevronDown,
  Sliders,
  Minus,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventorySalesSummary } from "@/components/dashboard/inventory-sales-summary";
import {
  UserRole,
  SubscriptionTier,
  PermissionAction,
  evaluateAccess,
  SUBSCRIPTION_TIERS,
  DEFAULT_USERS,
  ROLE_PERMISSIONS,
  ACTION_MODULE_MAP,
  MODULE_MINIMUM_TIER,
} from "@/lib/permissions";

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  stock: number;
  minStock: number;
  unitCost: number;
  price: number;
  taxRate: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  syncedToEcommerce: boolean;
  externalId?: string;
  storeStocks: { [storeId: string]: number };
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  storeId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "mobile_banking" | "upi";
  status: "completed" | "refunded";
  source: "pos_terminal" | "ecommerce_sync";
}

export interface BusinessExpense {
  id: string;
  storeId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  recordedBy: string;
  paymentMethod: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  platform: "Shopify" | "WooCommerce" | "Custom Webhook";
  eventType: "order.created" | "inventory.synced" | "product.pushed";
  details: string;
  status: "success" | "pending" | "failed";
}

const INITIAL_PRODUCTS: POSProduct[] = [
  {
    id: "1",
    name: "Handcrafted Cane Basket",
    sku: "HC-005",
    barcode: "8901234567894",
    category: "Handicrafts",
    stock: 120,
    minStock: 25,
    unitCost: 9.5,
    price: 19.99,
    taxRate: 0,
    status: "In Stock",
    syncedToEcommerce: true,
    externalId: "shopify_prod_99184",
    storeStocks: { "SYL-01": 80, "ZIN-02": 40, "DHK-03": 0 },
  },
  {
    id: "2",
    name: "Wireless Headphones",
    sku: "WH-001",
    barcode: "8901234567890",
    category: "Electronics",
    stock: 45,
    minStock: 10,
    unitCost: 65.0,
    price: 99.99,
    taxRate: 5,
    status: "In Stock",
    syncedToEcommerce: true,
    externalId: "shopify_prod_99182",
    storeStocks: { "SYL-01": 30, "ZIN-02": 15, "DHK-03": 0 },
  },
  {
    id: "3",
    name: "Gaming Mouse RGB",
    sku: "GM-002",
    barcode: "8901234567891",
    category: "Electronics",
    stock: 5,
    minStock: 15,
    unitCost: 35.0,
    price: 59.99,
    taxRate: 5,
    status: "Low Stock",
    syncedToEcommerce: true,
    externalId: "woo_prod_4412",
    storeStocks: { "SYL-01": 3, "ZIN-02": 2, "DHK-03": 0 },
  },
  {
    id: "4",
    name: "Office Chair Ergonomic",
    sku: "OC-003",
    barcode: "8901234567892",
    category: "Furniture",
    stock: 0,
    minStock: 5,
    unitCost: 180.0,
    price: 299.99,
    taxRate: 5,
    status: "Out of Stock",
    syncedToEcommerce: false,
    storeStocks: { "SYL-01": 0, "ZIN-02": 0, "DHK-03": 0 },
  },
  {
    id: "5",
    name: "Adjustable LED Desk Lamp",
    sku: "DL-004",
    barcode: "8901234567893",
    category: "Lighting",
    stock: 23,
    minStock: 8,
    unitCost: 45.0,
    price: 79.99,
    taxRate: 5,
    status: "In Stock",
    syncedToEcommerce: true,
    externalId: "shopify_prod_99183",
    storeStocks: { "SYL-01": 15, "ZIN-02": 8, "DHK-03": 0 },
  },
  {
    id: "6",
    name: "Traditional Shital Pati Mat",
    sku: "SP-006",
    barcode: "8901234567895",
    category: "Handicrafts",
    stock: 35,
    minStock: 10,
    unitCost: 14.0,
    price: 34.99,
    taxRate: 0,
    status: "In Stock",
    syncedToEcommerce: true,
    storeStocks: { "SYL-01": 25, "ZIN-02": 10, "DHK-03": 0 },
  },
];

const INITIAL_SALES: SaleTransaction[] = [
  {
    id: "sale-101",
    invoiceNo: "INV-889101",
    date: "Today, 11:30 AM",
    storeId: "SYL-01",
    cashierName: "Tanvir Hasan",
    customerName: "Rahim Ahmed",
    customerPhone: "+880 1711-223344",
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1 },
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
    ],
    subtotal: 119.98,
    discountAmount: 10.0,
    discountPercent: 8,
    taxAmount: 5.5,
    totalAmount: 115.48,
    paymentMethod: "cash",
    status: "completed",
    source: "pos_terminal",
  },
  {
    id: "sale-102",
    invoiceNo: "INV-889102",
    date: "Today, 01:15 PM",
    storeId: "SYL-01",
    cashierName: "Tanvir Hasan",
    customerName: "Tasnim Begum",
    customerPhone: "+880 1822-445566",
    items: [{ product: INITIAL_PRODUCTS[2], quantity: 1 }],
    subtotal: 59.99,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 3.0,
    totalAmount: 62.99,
    paymentMethod: "card",
    status: "completed",
    source: "pos_terminal",
  },
  {
    id: "sale-103",
    invoiceNo: "INV-889103",
    date: "Yesterday, 04:45 PM",
    storeId: "SYL-01",
    cashierName: "Tanvir Hasan",
    customerName: "Shopify Customer #4812",
    items: [{ product: INITIAL_PRODUCTS[0], quantity: 2 }],
    subtotal: 39.98,
    discountAmount: 0,
    discountPercent: 0,
    taxAmount: 0,
    totalAmount: 39.98,
    paymentMethod: "mobile_banking",
    status: "completed",
    source: "ecommerce_sync",
  },
];

const INITIAL_EXPENSES: BusinessExpense[] = [
  {
    id: "exp-001",
    storeId: "SYL-01",
    category: "Rent & Utilities",
    amount: 150.0,
    date: "2026-08-20",
    description: "Outlet Electricity & Utility Bill (Zindabazar)",
    recordedBy: "Tanvir Hasan",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "exp-002",
    storeId: "SYL-01",
    category: "Packaging & Supplies",
    amount: 35.0,
    date: "2026-08-21",
    description: "Eco-friendly jute branded retail bags (100 pcs)",
    recordedBy: "Tanvir Hasan",
    paymentMethod: "Cash",
  },
  {
    id: "exp-003",
    storeId: "SYL-01",
    category: "Store Refreshments",
    amount: 12.5,
    date: "2026-08-22",
    description: "Staff morning tea and bakery snacks",
    recordedBy: "Tanvir Hasan",
    paymentMethod: "Cash",
  },
];

const INITIAL_SYNC_LOGS: SyncLog[] = [
  {
    id: "log-1",
    timestamp: "Just now",
    platform: "Shopify",
    eventType: "inventory.synced",
    details: "Pushed stock delta for SKU: HC-005 to Shopify Store",
    status: "success",
  },
  {
    id: "log-2",
    timestamp: "12 mins ago",
    platform: "WooCommerce",
    eventType: "order.created",
    details: "Inbound webhook: Order #WC-8921 processed, stock reserved",
    status: "success",
  },
  {
    id: "log-3",
    timestamp: "1 hour ago",
    platform: "Custom Webhook",
    eventType: "product.pushed",
    details: "Webhook trigger dispatched for synced catalog items",
    status: "success",
  },
];

export default function Component() {
  const [activeTab, setActiveTab] = useState<
    "pos" | "inventory" | "sales" | "expenses" | "reports" | "ecommerce" | "subscriptions"
  >("pos");

  const [tenantName] = useState("Sylhet Artisans & Retail Network");
  const [selectedStore, setSelectedStore] = useState("SYL-01");
  const storesList = [
    { id: "SYL-01", name: "Sylhet Flagship Outlet (Zindabazar)", isMain: true },
    { id: "ZIN-02", name: "Amberkhana Branch Outlet", isMain: false },
    { id: "DHK-03", name: "Dhaka Central Warehouse", isMain: false },
  ];

  const [activeCashier, setActiveCashier] = useState("Tanvir Hasan (Lead Cashier)");
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);

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

  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    title: string;
    reason: string;
    requiredRole?: string;
    requiredTier?: string;
    requiredModule?: string;
    targetAction?: string;
  }>({
    isOpen: false,
    title: "Access Restricted",
    reason: "",
  });

  // Sync role and tier into cookies for backend middleware & API routes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = `waw_role=${userRole}; path=/; max-age=86400`;
      document.cookie = `waw_tier=${subscriptionTier}; path=/; max-age=86400`;
    }
  }, [userRole, subscriptionTier]);

  // Synchronize active cashier name when user role changes
  useEffect(() => {
    const user = DEFAULT_USERS[userRole];
    if (user) {
      setActiveCashier(`${user.name} (${user.role.toUpperCase()})`);
    }
  }, [userRole]);

  // Helper to evaluate access for an action given current role and tier
  const canPerform = (action: PermissionAction): boolean => {
    const session = {
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
    const evalResult = evaluateAccess(session, action);
    return evalResult.allowed;
  };

  // Helper to trigger action or display modal with explanation
  const checkAction = (action: PermissionAction, onAllowed: () => void) => {
    const session = {
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
    const evalResult = evaluateAccess(session, action);
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
  };

  // Shift Drawer State
  const [shiftOpeningCash, setShiftOpeningCash] = useState<number>(100.0);
  const [isShiftAuditOpen, setIsShiftAuditOpen] = useState(false);
  const [shiftCountedCash, setShiftCountedCash] = useState<string>("");
  const [shiftAuditResult, setShiftAuditResult] = useState<{
    expected: number;
    counted: number;
    difference: number;
  } | null>(null);

  // Products and Cart State
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

  // Cart operations
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
      alert(`No product found for barcode/SKU: ${barcodeInput}`);
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    // Deduct stock for the active store
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
          status: (newTotalStock === 0 ? "Out of Stock" : newTotalStock <= p.minStock ? "Low Stock" : "In Stock") as
            | "In Stock"
            | "Low Stock"
            | "Out of Stock",
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

    if (isOffline) {
      setOfflineQueue((prev) => prev + 1);
    } else if (enabledModules.ecommerce_bridge) {
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

    setIsCheckoutOpen(false);
    clearCart();
  };

  const handleStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || transferTargetStore === selectedStore || transferQty <= 0) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === transferProductId) {
          const fromStock = p.storeStocks[selectedStore] ?? 0;
          const toStock = p.storeStocks[transferTargetStore] ?? 0;
          if (fromStock < transferQty) {
            alert("Cannot transfer more stock than available in source store.");
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

    setIsTransferOpen(false);
    alert(`Successfully transferred ${transferQty} units to ${transferTargetStore}`);
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

    setProducts([newProd, ...products]);
    setIsAddProductOpen(false);
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
    setIsAddExpenseOpen(false);
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
          items: products.filter((p) => p.syncedToEcommerce).map((p) => ({
            sku: p.sku,
            barcode: p.barcode,
            newStock: p.stock,
            externalId: p.externalId,
          })),
        }),
      });
      const data = await res.json();
      setApiResponseTest(JSON.stringify(data, null, 2));
      const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: "Just now",
        platform: "Shopify",
        eventType: "inventory.synced",
        details: `Successfully synced ${data.syncedCount || products.length} catalog items with Shopify API`,
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
    let fileName = `waw-pos-${type}-${Date.now()}.csv`;

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>
              <strong>OFFLINE MODE ACTIVE:</strong> All register transactions are securely queued in local storage.
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-amber-800 text-white">{offlineQueue} offline actions pending sync</Badge>
            <button
              onClick={() => {
                setIsOffline(false);
                setOfflineQueue(0);
                alert("Online connection restored! Synchronized queued sales with Cloud database.");
              }}
              className="underline hover:text-amber-100 text-xs"
            >
              Simulate Online Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main App Bar */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 text-white font-bold text-lg shadow-xs">
              W
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold leading-tight tracking-tight">WAW-POS</h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold ${
                    subscriptionTier === "enterprise"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : subscriptionTier === "pro"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {subscriptionTier} TIER
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{tenantName}</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              id="nav-pos"
              onClick={() => setActiveTab("pos")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "pos"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>POS Register</span>
            </button>
            <button
              id="nav-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "inventory"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Catalog & Stock</span>
            </button>
            <button
              id="nav-sales"
              onClick={() => setActiveTab("sales")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "sales"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Sales History</span>
            </button>
            <button
              id="nav-expenses"
              onClick={() => {
                if (!canPerform("expenses:view")) {
                  checkAction("expenses:view", () => setActiveTab("expenses"));
                } else {
                  setActiveTab("expenses");
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "expenses"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Expenses</span>
              {!canPerform("expenses:view") && (
                <Lock className="h-3 w-3 text-amber-500 ml-0.5" />
              )}
            </button>
            <button
              id="nav-reports"
              onClick={() => {
                if (!canPerform("reports:basic_sales")) {
                  checkAction("reports:basic_sales", () => setActiveTab("reports"));
                } else {
                  setActiveTab("reports");
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "reports"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics & Reports</span>
              {!canPerform("reports:financial_pnl") && (
                <Lock className="h-3 w-3 text-amber-500 ml-0.5" />
              )}
            </button>
            <button
              id="nav-ecommerce"
              onClick={() => {
                if (!canPerform("ecommerce:sync")) {
                  checkAction("ecommerce:sync", () => setActiveTab("ecommerce"));
                } else {
                  setActiveTab("ecommerce");
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "ecommerce"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>E-Commerce Bridge</span>
              {!canPerform("ecommerce:sync") && (
                <Lock className="h-3 w-3 text-amber-500 ml-0.5" />
              )}
            </button>
            <button
              id="nav-subscriptions"
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "subscriptions"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>RBAC & Plugins</span>
            </button>
          </nav>

          {/* User Role & Quick Context Switchers */}
          <div className="flex items-center space-x-2">
            {/* User Role Switcher */}
            <div className="flex items-center space-x-1 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-slate-400 text-[11px] font-mono">Role:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent font-semibold text-xs text-slate-900 focus:outline-none cursor-pointer capitalize"
              >
                <option value="owner">Owner (Nafis)</option>
                <option value="admin">Admin (Sultana)</option>
                <option value="manager">Manager (Farhan)</option>
                <option value="cashier">Cashier (Tanvir)</option>
              </select>
            </div>

            {/* Store Outlet Selector */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Store className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-transparent font-medium text-xs focus:outline-none cursor-pointer"
              >
                {storesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsOffline(!isOffline)}
              title="Toggle Offline Simulation"
              className={`p-1.5 rounded-lg border text-xs flex items-center ${
                isOffline ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t bg-slate-50 gap-2">
          {[
            { id: "pos", label: "POS Register", icon: ShoppingCart },
            { id: "inventory", label: "Catalog & Stock", icon: Package },
            { id: "sales", label: "Sales History", icon: Receipt },
            { id: "expenses", label: "Expenses", icon: TrendingDown },
            { id: "reports", label: "Reports", icon: BarChart3 },
            { id: "ecommerce", label: "E-Commerce Bridge", icon: Globe },
            { id: "subscriptions", label: "Plugins", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* TAB 1: POS REGISTER TERMINAL & DASHBOARD HOME */}
        {/* ========================================================================= */}
        {activeTab === "pos" && (
          <div className="space-y-4">
            {/* Dashboard Summary Card: Current Inventory Count & Recent Sales Trends */}
            <InventorySalesSummary
              products={products}
              salesList={salesList}
              selectedStore={selectedStore}
              storesList={storesList}
              onNavigateToInventory={() => setActiveTab("inventory")}
              onNavigateToSales={() => setActiveTab("sales")}
            />

            {/* Shift Bar */}
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">{activeCashier}</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Shift Float: ${shiftOpeningCash.toFixed(2)}</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Cash Drawer Est: ${expectedDrawerCash.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShiftAuditOpen(true)}
                  className="h-7 text-xs border-slate-200 hover:bg-slate-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  Cash Drawer Audit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Product Selection Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="barcode-scanner-input"
                        placeholder="Scan barcode or enter SKU and press Enter..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="pl-9 bg-slate-50 text-sm font-mono"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="px-4 text-xs font-semibold">
                      <Zap className="h-4 w-4 mr-1.5 text-amber-500" />
                      Scan
                    </Button>
                  </form>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Quick search products..."
                        value={posSearchTerm}
                        onChange={(e) => setPosSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-xs bg-slate-50"
                      />
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 max-w-[280px]">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap capitalize transition-colors ${
                            selectedCategory === cat
                              ? "bg-slate-900 text-white font-medium"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {posFilteredProducts.map((product) => {
                    const currentStoreStock = product.storeStocks[selectedStore] ?? product.stock;
                    const isOutOfStock = currentStoreStock <= 0;
                    return (
                      <button
                        key={product.id}
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-150 relative flex flex-col justify-between h-32 ${
                          isOutOfStock
                            ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                            : "bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs active:scale-[0.98]"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-700"
                                  : currentStoreStock <= product.minStock
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {currentStoreStock} in stock
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mt-1">
                            {product.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <span className="text-[11px] text-slate-500">{product.category}</span>
                          <span className="text-sm font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POS Cart Column */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-4 w-4 text-slate-700" />
                    <h3 className="font-semibold text-slate-900 text-sm">Active Order</h3>
                    <Badge variant="secondary" className="text-xs">
                      {cart.reduce((s, i) => s + i.quantity, 0)} items
                    </Badge>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Optional Customer info */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <Input
                    placeholder="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-7 text-xs bg-white"
                  />
                  <Input
                    placeholder="Customer Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-7 text-xs bg-white"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                      <ShoppingCart className="h-12 w-12 stroke-1 mb-2 text-slate-300" />
                      <p className="text-sm font-medium">Register Cart Empty</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Scan barcode or click catalog items to build ticket
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex-1 pr-3">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="text-[11px] text-slate-500 font-mono">
                            ${item.product.price.toFixed(2)} × {item.quantity} = $
                            {(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="h-6 w-6 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="h-6 w-6 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono font-medium">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Discount</span>
                      <div className="flex items-center space-x-1">
                        {[0, 5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setDiscountPercent(pct)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              discountPercent === pct
                                ? "bg-slate-900 text-white"
                                : "bg-white border text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount ({discountPercent}%)</span>
                        <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Est. Tax (5%)</span>
                      <span className="font-mono font-medium">${cartTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="font-mono">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    id="btn-checkout"
                    disabled={cart.length === 0}
                    onClick={() => {
                      setTenderedAmount(cartTotal.toFixed(2));
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Tender & Checkout (${cartTotal.toFixed(2)})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CATALOG & MULTI-LOCATION STOCK */}
        {/* ========================================================================= */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Product Catalog & Multi-Store Stock</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage product attributes, barcodes, retail margins, and multi-location inventory.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV("inventory")}
                  className="h-9 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    checkAction("inventory:stock_transfer", () => setIsTransferOpen(true));
                  }}
                  className={`h-9 text-xs flex items-center ${
                    !canPerform("inventory:stock_transfer") ? "opacity-75" : ""
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                  Transfer Stock
                  {!canPerform("inventory:stock_transfer") && (
                    <Lock className="h-3 w-3 text-amber-500 ml-1" />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    checkAction("inventory:create", () => setIsAddProductOpen(true));
                  }}
                  className={`h-9 text-xs bg-slate-900 text-white flex items-center ${
                    !canPerform("inventory:create") ? "opacity-80" : ""
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Product
                  {!canPerform("inventory:create") && (
                    <Lock className="h-3 w-3 text-amber-400 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Inventory Summary Metric Cards */}
            {(() => {
              let tabTotalStockUnits = 0;
              let tabTotalCostValue = 0;
              let tabTotalRetailValue = 0;
              let tabLowStockCount = 0;
              let tabOutOfStockCount = 0;

              products.forEach((prod) => {
                const branchStock = prod.storeStocks[selectedStore] ?? prod.stock;
                tabTotalStockUnits += branchStock;
                tabTotalCostValue += branchStock * prod.unitCost;
                tabTotalRetailValue += branchStock * prod.price;

                if (branchStock <= 0) {
                  tabOutOfStockCount += 1;
                } else if (branchStock <= prod.minStock) {
                  tabLowStockCount += 1;
                }
              });

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Card 1: Total Items */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Items
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {tabTotalStockUnits.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">units</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Across <strong className="text-slate-700 font-semibold">{products.length}</strong> unique SKUs
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Card 2: Low Stock Alerts */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Low Stock Alerts
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span
                          className={`text-2xl font-bold font-mono ${
                            tabLowStockCount + tabOutOfStockCount > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {tabLowStockCount + tabOutOfStockCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">items</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="text-amber-700 font-medium">{tabLowStockCount} low stock</span>
                        {" · "}
                        <span className="text-rose-600 font-medium">{tabOutOfStockCount} out of stock</span>
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-xl border ${
                        tabLowStockCount + tabOutOfStockCount > 0
                          ? "bg-amber-50 border-amber-200 text-amber-600"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}
                    >
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Card 3: Total Inventory Value */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Inventory Value
                      </p>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        {userRole === "cashier" ? (
                          <span className="text-2xl font-bold font-mono text-slate-400">••••••</span>
                        ) : (
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            ${tabTotalCostValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">at cost</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Retail Value:{" "}
                        <strong className="text-slate-800 font-semibold font-mono">
                          ${tabTotalRetailValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Active Bulk Action Bar for Inventory Table */}
            {selectedInventoryIds.size > 0 && (
              <div className="bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-700/80 font-mono text-xs font-bold text-indigo-100">
                    {selectedInventoryIds.size}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {selectedInventoryIds.size} {selectedInventoryIds.size === 1 ? "item" : "items"} selected
                    </span>
                    <span className="text-xs text-indigo-200 ml-2 hidden sm:inline">
                      for batch inventory operations
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quick Preset Buttons */}
                  <div className="hidden lg:flex items-center gap-1 bg-indigo-950/60 p-1 rounded-lg border border-indigo-700/50">
                    <button
                      onClick={() => {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (selectedInventoryIds.has(p.id)) {
                              const curr = p.storeStocks[selectedStore] ?? p.stock;
                              const updatedBranchStock = curr + 10;
                              const updatedGlobalStock = p.stock + 10;
                              return {
                                ...p,
                                stock: updatedGlobalStock,
                                storeStocks: { ...p.storeStocks, [selectedStore]: updatedBranchStock },
                                status: updatedGlobalStock <= 0 ? "Out of Stock" : updatedGlobalStock <= p.minStock ? "Low Stock" : "In Stock",
                              };
                            }
                            return p;
                          })
                        );
                      }}
                      className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                      title="Add 10 units to current store stock"
                    >
                      +10 Stock
                    </button>
                    <button
                      onClick={() => {
                        setProducts((prev) =>
                          prev.map((p) => {
                            if (selectedInventoryIds.has(p.id)) {
                              const curr = p.storeStocks[selectedStore] ?? p.stock;
                              const updatedBranchStock = Math.max(0, curr - 5);
                              const updatedGlobalStock = Math.max(0, p.stock - 5);
                              return {
                                ...p,
                                stock: updatedGlobalStock,
                                storeStocks: { ...p.storeStocks, [selectedStore]: updatedBranchStock },
                                status: updatedGlobalStock <= 0 ? "Out of Stock" : updatedGlobalStock <= p.minStock ? "Low Stock" : "In Stock",
                              };
                            }
                            return p;
                          })
                        );
                      }}
                      className="px-2 py-1 text-xs font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 rounded transition-colors"
                      title="Deduct 5 units from current store stock"
                    >
                      -5 Stock
                    </button>
                  </div>

                  {/* Bulk Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-indigo-950 hover:bg-indigo-50 font-semibold h-8 text-xs gap-1.5 shadow-xs"
                      >
                        <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                        Bulk Actions
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5">
                      <DropdownMenuLabel className="text-xs text-slate-500 font-medium">
                        Apply to {selectedInventoryIds.size} Selected Items
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          setBulkStockMode("set");
                          setBulkStockValue(50);
                          setIsBulkStockModalOpen(true);
                        }}
                        className="text-xs cursor-pointer py-2"
                      >
                        <Package className="h-4 w-4 mr-2 text-indigo-600" />
                        Set Fixed Stock Level...
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setBulkStockMode("add");
                          setBulkStockValue(10);
                          setIsBulkStockModalOpen(true);
                        }}
                        className="text-xs cursor-pointer py-2"
                      >
                        <Plus className="h-4 w-4 mr-2 text-emerald-600" />
                        Add Stock (+X Units)...
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setBulkStockMode("subtract");
                          setBulkStockValue(5);
                          setIsBulkStockModalOpen(true);
                        }}
                        className="text-xs cursor-pointer py-2"
                      >
                        <Minus className="h-4 w-4 mr-2 text-amber-600" />
                        Deduct Stock (-X Units)...
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          checkAction("inventory:delete", () => {
                            setIsBulkDeleteModalOpen(true);
                          });
                        }}
                        className="text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer py-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-rose-600" />
                        Delete Selected Items...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Direct Batch Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      checkAction("inventory:delete", () => {
                        setIsBulkDeleteModalOpen(true);
                      });
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-medium h-8 text-xs gap-1.5 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span> ({selectedInventoryIds.size})
                  </Button>

                  {/* Clear Selection */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInventoryIds(new Set())}
                    className="text-indigo-200 hover:text-white hover:bg-indigo-800 h-8 text-xs px-2.5"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search SKU, product name, barcode..."
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs bg-white"
                />
              </div>
              <div className="text-xs text-slate-500">
                Viewing stock for: <strong>{storesList.find((s) => s.id === selectedStore)?.name}</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    {/* Header Checkbox */}
                    <TableHead className="w-12 px-3 py-3">
                      <div className="flex items-center justify-center">
                        {(() => {
                          const visibleProds = products.filter(
                            (p) =>
                              p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                              p.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                              p.barcode.includes(inventorySearchTerm)
                          );
                          const allSelected = visibleProds.length > 0 && visibleProds.every((p) => selectedInventoryIds.has(p.id));
                          const someSelected = visibleProds.some((p) => selectedInventoryIds.has(p.id)) && !allSelected;
                          return (
                            <Checkbox
                              checked={allSelected ? true : someSelected ? "indeterminate" : false}
                              onCheckedChange={() => {
                                if (allSelected) {
                                  const newSet = new Set(selectedInventoryIds);
                                  visibleProds.forEach((p) => newSet.delete(p.id));
                                  setSelectedInventoryIds(newSet);
                                } else {
                                  const newSet = new Set(selectedInventoryIds);
                                  visibleProds.forEach((p) => newSet.add(p.id));
                                  setSelectedInventoryIds(newSet);
                                }
                              }}
                              aria-label="Select all products"
                            />
                          );
                        })()}
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">SKU & Barcode</TableHead>
                    <TableHead className="text-xs font-semibold">Product Name</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Cost</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Selling Price</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Current Store Stock</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Global Chain Stock</TableHead>
                    <TableHead className="text-xs font-semibold text-center">E-Commerce Sync</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                        p.barcode.includes(inventorySearchTerm)
                    )
                    .map((prod) => {
                      const branchStock = prod.storeStocks[selectedStore] ?? prod.stock;
                      const isSelected = selectedInventoryIds.has(prod.id);
                      return (
                        <TableRow
                          key={prod.id}
                          className={isSelected ? "bg-indigo-50/70 hover:bg-indigo-50/90" : "hover:bg-slate-50/70"}
                        >
                          {/* Row Checkbox */}
                          <TableCell className="w-12 px-3 py-3">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  const newSet = new Set(selectedInventoryIds);
                                  if (newSet.has(prod.id)) {
                                    newSet.delete(prod.id);
                                  } else {
                                    newSet.add(prod.id);
                                  }
                                  setSelectedInventoryIds(newSet);
                                }}
                                aria-label={`Select ${prod.name}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs font-semibold text-slate-800">{prod.sku}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center">
                              <Barcode className="h-3 w-3 mr-1 inline" />
                              {prod.barcode}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs text-slate-900">{prod.name}</div>
                            {prod.externalId && (
                              <div className="text-[10px] text-indigo-600 font-mono">
                                Bridge: {prod.externalId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{prod.category}</TableCell>
                          <TableCell className="text-xs text-right font-mono text-slate-500">
                            {userRole === "cashier" ? (
                              <span className="text-slate-400 flex items-center justify-end" title="Wholesale cost hidden from Cashier role">
                                <Lock className="h-3 w-3 mr-1 text-slate-300" />
                                ••••
                              </span>
                            ) : (
                              `$${prod.unitCost.toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-semibold text-slate-900">
                            ${prod.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-center font-bold">
                            {branchStock} units
                          </TableCell>
                          <TableCell className="text-xs text-center text-slate-500">
                            {prod.stock} units
                          </TableCell>
                          <TableCell className="text-center">
                            {prod.syncedToEcommerce ? (
                              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                <Globe className="h-3 w-3 mr-1" />
                                Synced
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Local Only
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                branchStock === 0
                                  ? "bg-red-100 text-red-800"
                                  : branchStock <= prod.minStock
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {branchStock === 0 ? "Out of Stock" : branchStock <= prod.minStock ? "Low Stock" : "In Stock"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                checkAction("inventory:barcodes", () => {
                                  setSelectedLabelProduct(prod);
                                  setIsLabelModalOpen(true);
                                });
                              }}
                              className="h-7 text-[11px] text-slate-600 hover:text-slate-900"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              Label
                              {!canPerform("inventory:barcodes") && (
                                <Lock className="h-2.5 w-2.5 text-amber-500 ml-0.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SALES HISTORY & RECEIPTS */}
        {/* ========================================================================= */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Sales Directory & Transaction Ledger</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review historical POS sales, reprint receipts, and inspect transactions across stores.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV("sales")}
                  className="h-9 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search invoice number, customer..."
                  value={salesSearchTerm}
                  onChange={(e) => setSalesSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs bg-white"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Payment Filter:</span>
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value)}
                  className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">bKash / Mobile</option>
                  <option value="upi">UPI / QR</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Invoice No</TableHead>
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold">Store Outlet</TableHead>
                    <TableHead className="text-xs font-semibold">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Items Sold</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Source</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesList
                    .filter((s) => {
                      const matchSearch =
                        s.invoiceNo.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
                        (s.customerName && s.customerName.toLowerCase().includes(salesSearchTerm.toLowerCase()));
                      const matchMethod = salesPaymentFilter === "all" || s.paymentMethod === salesPaymentFilter;
                      return matchSearch && matchMethod;
                    })
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {sale.invoiceNo}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{sale.date}</TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">{sale.storeId}</TableCell>
                        <TableCell className="text-xs text-slate-800">
                          {sale.customerName || <span className="text-slate-400 italic">Walk-in Customer</span>}
                        </TableCell>
                        <TableCell className="text-xs text-center font-medium">
                          {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-bold text-slate-900">
                          ${sale.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {sale.paymentMethod.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {sale.source === "ecommerce_sync" ? (
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                              E-Commerce
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              POS
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            View Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: EXPENSE TRACKING */}
        {/* ========================================================================= */}
        {activeTab === "expenses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Business Expense Logging</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record operational costs, rent, packaging, logistics, and store overheads.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV("expenses")}
                  className="h-9 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export CSV
                </Button>
                <Button onClick={() => setIsAddExpenseOpen(true)} className="h-9 text-xs bg-slate-900 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Record Expense
                </Button>
              </div>
            </div>

            {/* Expense KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500">Total Recorded Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    ${totalExpensesAmount.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Across all logged operational categories</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500">Rent & Utilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    $
                    {expenses
                      .filter((e) => e.category.includes("Rent") || e.category.includes("Utilities"))
                      .reduce((s, e) => s + e.amount, 0)
                      .toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Store lease, electricity, water bills</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500">Packaging & Daily Supplies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    $
                    {expenses
                      .filter((e) => !e.category.includes("Rent") && !e.category.includes("Utilities"))
                      .reduce((s, e) => s + e.amount, 0)
                      .toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Bags, stationary, snacks, minor maintenance</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Expense Category</TableHead>
                    <TableHead className="text-xs font-semibold">Description / Payee</TableHead>
                    <TableHead className="text-xs font-semibold">Store Outlet</TableHead>
                    <TableHead className="text-xs font-semibold">Recorded By</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-xs text-slate-600 font-mono">{exp.date}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        <Badge variant="outline" className="text-[10px] bg-slate-50">
                          {exp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{exp.description}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{exp.storeId}</TableCell>
                      <TableCell className="text-xs text-slate-600">{exp.recordedBy}</TableCell>
                      <TableCell className="text-xs text-right font-mono font-bold text-slate-900">
                        ${exp.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-center text-slate-600">{exp.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ANALYTICS & COMPREHENSIVE REPORTS */}
        {/* ========================================================================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Executive Business Analytics & Financial Reports</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time profit & loss calculations, inventory valuation, and sales velocity metrics.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-9 text-xs bg-white"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print Report
                </Button>
                <Button
                  size="sm"
                  onClick={() => exportCSV("sales")}
                  className="h-9 text-xs bg-slate-900 text-white"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export Financial Ledger
                </Button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-slate-500">Gross Sales Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-slate-900">${totalRevenue.toFixed(2)}</div>
                  <div className="text-[11px] text-emerald-600 flex items-center mt-1">
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    {salesList.length} transactions completed
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-slate-500">Cost of Goods Sold (COGS)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-slate-700">${totalCOGS.toFixed(2)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Wholesale product acquisition cost</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-slate-500">Gross Margin Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-indigo-600">${grossProfit.toFixed(2)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% Gross Margin
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-slate-500">Net Business Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    ${netProfit.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">After deducting ${totalExpensesAmount.toFixed(2)} expenses</p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Valuation & Top Sellers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Total Inventory Valuation</h3>
                  <Badge variant="outline" className="text-xs">
                    {products.length} catalog items
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <span className="text-slate-500">Total Stock Value (at Cost)</span>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      ${totalInventoryCost.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <span className="text-slate-500">Total Potential Retail Value</span>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                      ${totalInventoryRetail.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs space-y-2">
                  <h4 className="font-semibold text-slate-800">Low Stock Reorder Alerts:</h4>
                  {products
                    .filter((p) => p.stock <= p.minStock)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-900"
                      >
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">{p.name}</span>
                          <span className="font-mono text-xs text-amber-700">({p.sku})</span>
                        </div>
                        <span className="font-bold text-xs">
                          {p.stock} left (Min: {p.minStock})
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Top Velocity Products</h3>
                  <span className="text-xs text-slate-400 font-medium">Ranked by units sold</span>
                </div>
                <div className="space-y-3">
                  {products.slice(0, 4).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <span className="flex h-6 w-6 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.category} • ${p.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-slate-900">${(p.price * 5).toFixed(2)}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">5 units sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: E-COMMERCE & WEBHOOK BRIDGE */}
        {/* ========================================================================= */}
        {activeTab === "ecommerce" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Universal E-Commerce & Webhook Bridge</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bi-directional inventory sync with Shopify, WooCommerce, and Custom Store Webhooks.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={simulateExternalOrder}
                  disabled={isSyncing}
                  variant="outline"
                  className="h-9 text-xs bg-white"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                  Simulate Inbound Order
                </Button>
                <Button
                  onClick={triggerManualSync}
                  disabled={isSyncing}
                  className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Outbound Catalog
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-indigo-100 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Shopify Store</CardTitle>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <CardDescription className="text-xs">
                    Connected: sylhet-crafts.myshopify.com
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Active Sync:</span>
                    <span className="font-semibold text-emerald-600">Bi-directional Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhook Endpoint:</span>
                    <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                      /api/v1/orders/webhook
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">WooCommerce Store</CardTitle>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <CardDescription className="text-xs">Connected: store.sylhetartisans.com</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Active Sync:</span>
                    <span className="font-semibold text-emerald-600">Inventory Deltas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Bridge:</span>
                    <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">
                      /api/v1/inventory/sync
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">WAW Marketplace API</CardTitle>
                    <span className="flex h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <CardDescription className="text-xs">National Artisan Network (Sylhet Pilot)</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Access Tier:</span>
                    <span className="font-semibold text-slate-700">Ready to Connect</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Type:</span>
                    <span className="font-mono text-[10px]">Bearer API Key</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {apiResponseTest && (
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-1">
                <div className="text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                  <span>API Debug Output Console</span>
                  <button
                    onClick={() => setApiResponseTest(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <pre className="overflow-x-auto pt-2">{apiResponseTest}</pre>
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent Sync Events & Webhook Logs</CardTitle>
                <CardDescription className="text-xs">
                  Event stream of POS sales and external e-commerce inventory sync triggers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{log.details}</p>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span className="font-mono font-medium text-indigo-600">{log.platform}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">{log.eventType}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: MODULAR PLUGINS & SAAS SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Modular Subscriptions & Plugin Architecture</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic module loading inspired by modular enterprise POS systems. Features are gatekept based on subscriber tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => {
                  setSubscriptionTier("starter");
                  setEnabledModules({
                    core_pos: true,
                    inventory: true,
                    barcodes: false,
                    ecommerce_bridge: false,
                    multi_store: false,
                    advanced_reports: false,
                    shift_auditing: false,
                  });
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  subscriptionTier === "starter"
                    ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">Starter Plan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Single-register physical shop</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">Free</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Core POS Register & Receipts
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Basic Inventory CRUD
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Expense Logging
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5 mr-2" /> Barcode Scanning & Label Printing
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5 mr-2" /> E-Commerce Sync Bridge
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5 mr-2" /> Multi-Branch Network
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setSubscriptionTier("pro");
                  setEnabledModules({
                    core_pos: true,
                    inventory: true,
                    barcodes: true,
                    ecommerce_bridge: true,
                    multi_store: false,
                    advanced_reports: true,
                    shift_auditing: true,
                  });
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  subscriptionTier === "pro"
                    ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900">Pro Retailer</h3>
                      <Badge className="bg-indigo-600 text-white text-[10px]">Active Plan</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Physical Store + Online Sync</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">$29/mo</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Core POS & Expense Tracking
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Barcode Scanner & Label Gen
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Shopify & WooCommerce Bridge
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Advanced Profit & Loss Reports
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Lock className="h-3.5 w-3.5 mr-2" /> Multi-Branch Network
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setSubscriptionTier("enterprise");
                  setEnabledModules({
                    core_pos: true,
                    inventory: true,
                    barcodes: true,
                    ecommerce_bridge: true,
                    multi_store: true,
                    advanced_reports: true,
                    shift_auditing: true,
                  });
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  subscriptionTier === "enterprise"
                    ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">Enterprise</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Multi-Location Retail Chain</p>
                  </div>
                  <span className="text-lg font-bold text-slate-900">$89/mo</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> All Pro Features Included
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Unlimited Store Branches
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Inter-Branch Stock Transfers
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Cashier Drawer Shift Audits
                  </div>
                  <div className="flex items-center text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Custom Webhook API Endpoints
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Role & Subscription Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center">
                    <KeyRound className="h-4 w-4 text-indigo-600 mr-2" />
                    Role-Based Access Control (RBAC) & Tier Entitlement Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live authorization matrix evaluated by WAW-POS Gateway Middleware (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono">src/middleware.ts</code>).
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 font-medium">Viewing as:</span>
                  <Badge variant="outline" className="capitalize font-semibold text-slate-900">
                    {userRole} ({subscriptionTier} tier)
                  </Badge>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Action / Permission</TableHead>
                    <TableHead className="text-xs font-semibold">Module Area</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Min Subscription</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Cashier</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Manager</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Admin</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Owner</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Current Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { action: "pos:checkout", label: "Process Sales & Receipts", module: "core_pos", minTier: "starter" },
                    { action: "pos:discount:override", label: "Special Discount Overrides (>10%)", module: "core_pos", minTier: "starter" },
                    { action: "pos:refund", label: "Issue Refunds & Void Invoices", module: "core_pos", minTier: "starter" },
                    { action: "inventory:create", label: "Create / Edit Catalog Items", module: "inventory", minTier: "starter" },
                    { action: "inventory:stock_transfer", label: "Inter-Branch Stock Transfers", module: "multi_store", minTier: "pro" },
                    { action: "inventory:barcodes", label: "Barcode Scanning & Label Printing", module: "barcodes", minTier: "pro" },
                    { action: "expenses:create", label: "Record Business Expenses", module: "core_pos", minTier: "starter" },
                    { action: "reports:financial_pnl", label: "P&L, Margins & Valuation Reports", module: "advanced_reports", minTier: "pro" },
                    { action: "ecommerce:sync", label: "E-Commerce Bridge & Webhooks", module: "ecommerce_bridge", minTier: "pro" },
                    { action: "pos:shift_audit", label: "Register Drawer Cashier Auditing", module: "shift_auditing", minTier: "enterprise" },
                  ].map((row) => {
                    const isAllowedForCurrent = canPerform(row.action as PermissionAction);
                    const cashierAllowed = ROLE_PERMISSIONS.cashier.includes(row.action as PermissionAction);
                    const managerAllowed = ROLE_PERMISSIONS.manager.includes(row.action as PermissionAction);
                    const adminAllowed = ROLE_PERMISSIONS.admin.includes(row.action as PermissionAction);
                    const ownerAllowed = ROLE_PERMISSIONS.owner.includes(row.action as PermissionAction);

                    return (
                      <TableRow key={row.action} className="text-xs">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{row.label}</div>
                          <code className="text-[10px] text-slate-400 font-mono">{row.action}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {row.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize font-medium ${
                              row.minTier === "enterprise"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : row.minTier === "pro"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {row.minTier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {cashierAllowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {managerAllowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {adminAllowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {ownerAllowed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isAllowedForCurrent ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100 font-medium">
                              Granted (200)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-medium">
                              Restricted (403)
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CHECKOUT & TENDER */}
      {/* ========================================================================= */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Complete Sale & Tender</DialogTitle>
            <DialogDescription className="text-xs">
              Select customer payment method and confirm tender balance.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border text-center space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Total Due</span>
              <div className="text-3xl font-bold font-mono text-slate-900">${cartTotal.toFixed(2)}</div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === "cash"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Cash Tender</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === "card"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Debit / Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mobile_banking")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === "mobile_banking"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>bKash / Nagad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === "upi"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Barcode className="h-4 w-4" />
                  <span>UPI / QR Scan</span>
                </button>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-1.5">
                <Label htmlFor="tendered" className="text-xs font-semibold">
                  Cash Received ($)
                </Label>
                <Input
                  id="tendered"
                  type="number"
                  step="0.01"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="font-mono text-sm"
                />
                {Number(tenderedAmount) >= cartTotal && (
                  <div className="text-xs text-emerald-600 font-semibold pt-1 flex justify-between">
                    <span>Change Due to Customer:</span>
                    <span className="font-mono font-bold">${(Number(tenderedAmount) - cartTotal).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleCompleteSale} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Complete Sale & Issue Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE THERMAL RECEIPT (NEW OR HISTORICAL) */}
      {/* ========================================================================= */}
      {(lastInvoice || selectedSaleDetail) && (
        <Dialog
          open={Boolean(lastInvoice || selectedSaleDetail)}
          onOpenChange={() => {
            setLastInvoice(null);
            setSelectedSaleDetail(null);
          }}
        >
          <DialogContent className="sm:max-w-[380px] font-mono text-xs">
            {(() => {
              const invoice = lastInvoice || selectedSaleDetail!;
              return (
                <div>
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-sm font-bold tracking-tight">SALES RECEIPT</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500">{tenantName}</DialogDescription>
                  </DialogHeader>

                  <div className="border-y border-dashed border-slate-300 py-3 my-2 space-y-2">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Invoice: {invoice.invoiceNo}</span>
                      <span>{invoice.date}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Store: {invoice.storeId}</span>
                      <span className="capitalize">Method: {invoice.paymentMethod}</span>
                    </div>
                    {invoice.customerName && (
                      <div className="text-[11px] text-slate-600">
                        Customer: {invoice.customerName} {invoice.customerPhone && `(${invoice.customerPhone})`}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      {invoice.items.map((item) => (
                        <div key={item.product.id} className="flex justify-between">
                          <span className="truncate pr-2">
                            {item.product.name} × {item.quantity}
                          </span>
                          <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${invoice.subtotal.toFixed(2)}</span>
                      </div>
                      {invoice.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount:</span>
                          <span>-${invoice.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${invoice.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-300">
                        <span>TOTAL PAID:</span>
                        <span>${invoice.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-between items-center sm:justify-between pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setLastInvoice(null);
                        setSelectedSaleDetail(null);
                      }}
                      className="text-xs"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        window.print();
                      }}
                      className="text-xs bg-slate-900 text-white"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      Print Thermal Receipt
                    </Button>
                  </DialogFooter>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD PRODUCT */}
      {/* ========================================================================= */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl">
          <form onSubmit={handleAddProduct}>
            <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-100">
              <DialogHeader className="gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                      Add New Product
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Register a new item with pricing, SKU barcode, and inventory threshold limits.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-name" className="text-xs font-semibold text-slate-700">
                    Product Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="modal-prod-name"
                    name="name"
                    required
                    placeholder="e.g. Handcrafted Shital Pati Mat"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-cat" className="text-xs font-semibold text-slate-700">
                    Category
                  </Label>
                  <select
                    id="modal-prod-cat"
                    name="category"
                    defaultValue="Handicrafts"
                    className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs text-slate-800"
                  >
                    <option value="Handicrafts">Handicrafts</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Home & Living">Home & Living</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-sku" className="text-xs font-semibold text-slate-700">
                    SKU Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="modal-prod-sku"
                    name="sku"
                    required
                    placeholder="e.g. SPM-001"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-barcode" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Barcode className="h-3.5 w-3.5 text-slate-400" />
                    Barcode (EAN-13 / Code128)
                  </Label>
                  <Input
                    id="modal-prod-barcode"
                    name="barcode"
                    placeholder="e.g. 8901234567895"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Pricing & Valuation
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="modal-prod-cost" className="text-xs text-slate-600 font-medium">
                      Unit Cost ($)
                    </Label>
                    <Input
                      id="modal-prod-cost"
                      name="unitCost"
                      type="number"
                      step="0.01"
                      defaultValue="10.00"
                      className="h-9 text-xs font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="modal-prod-price" className="text-xs text-slate-600 font-medium">
                      Selling Price ($) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="modal-prod-price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue="24.99"
                      required
                      className="h-9 text-xs font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-stock" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Initial Stock ({storesList.find((s) => s.id === selectedStore)?.name?.split(" ")[0] || selectedStore})
                  </Label>
                  <Input
                    id="modal-prod-stock"
                    name="stock"
                    type="number"
                    defaultValue="20"
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-prod-min" className="text-xs font-semibold text-slate-700">
                    Reorder Alert Threshold
                  </Label>
                  <Input
                    id="modal-prod-min"
                    name="minStock"
                    type="number"
                    defaultValue="5"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="syncedToEcommerce"
                  name="syncedToEcommerce"
                  defaultChecked
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="syncedToEcommerce" className="text-xs font-medium cursor-pointer text-slate-700">
                  Sync automatically to connected E-Commerce stores (Shopify / WooCommerce)
                </Label>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddProductOpen(false)}
                className="h-9 text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4"
              >
                <Plus className="h-4 w-4" />
                <span>Save to Inventory</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD EXPENSE */}
      {/* ========================================================================= */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleAddExpense}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Record Business Expense</DialogTitle>
              <DialogDescription className="text-xs">
                Log operational expenses, rent, packaging, logistics, or staff costs.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div>
                <Label htmlFor="exp-category" className="text-xs font-medium">
                  Category *
                </Label>
                <select
                  id="exp-category"
                  name="category"
                  required
                  className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Packaging & Supplies">Packaging & Supplies</option>
                  <option value="Logistics & Delivery">Logistics & Delivery</option>
                  <option value="Store Refreshments">Store Refreshments</option>
                  <option value="Maintenance & Cleaning">Maintenance & Cleaning</option>
                  <option value="Marketing & Print">Marketing & Print</option>
                  <option value="Staff Daily Allowance">Staff Daily Allowance</option>
                </select>
              </div>

              <div>
                <Label htmlFor="exp-amount" className="text-xs font-medium">
                  Amount ($) *
                </Label>
                <Input id="exp-amount" name="amount" type="number" step="0.01" required placeholder="0.00" className="mt-1 font-mono" />
              </div>

              <div>
                <Label htmlFor="exp-desc" className="text-xs font-medium">
                  Description / Payee Note *
                </Label>
                <Input id="exp-desc" name="description" required placeholder="e.g. Monthly electricity bill" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="exp-pay" className="text-xs font-medium">
                  Payment Method
                </Label>
                <select
                  id="exp-pay"
                  name="paymentMethod"
                  className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
                >
                  <option value="Cash Drawer">Cash Drawer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="bKash / Mobile Wallet">bKash / Mobile Wallet</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-slate-900 text-white">
                Record Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: INTER-BRANCH STOCK TRANSFER */}
      {/* ========================================================================= */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleStockTransfer}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Inter-Branch Stock Transfer</DialogTitle>
              <DialogDescription className="text-xs">
                Move physical stock between store locations and update branch balances.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div>
                <Label className="text-xs font-medium">Source Outlet (Current)</Label>
                <div className="p-2 bg-slate-100 rounded-md text-xs font-medium text-slate-800 mt-1">
                  {storesList.find((s) => s.id === selectedStore)?.name} ({selectedStore})
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Target Outlet *</Label>
                <select
                  value={transferTargetStore}
                  onChange={(e) => setTransferTargetStore(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
                >
                  {storesList
                    .filter((s) => s.id !== selectedStore)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium">Select Product *</Label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  required
                  className="w-full mt-1 border border-slate-200 rounded-md p-2 bg-white text-xs"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Avail in {selectedStore}: {p.storeStocks[selectedStore] ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium">Transfer Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="text-xs bg-slate-900 text-white">
                Dispatch Stock Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: BARCODE LABEL GENERATOR */}
      {/* ========================================================================= */}
      {selectedLabelProduct && (
        <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Print Barcode Labels</DialogTitle>
              <DialogDescription className="text-xs">
                Generate printable Code128 shelf and item stickers for physical labeling.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <Label>Number of Stickers:</Label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 4, 8].map((count) => (
                    <button
                      key={count}
                      onClick={() => setLabelPrintCount(count)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        labelPrintCount === count ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Label Previews */}
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-lg border">
                {Array.from({ length: labelPrintCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-300 rounded shadow-2xs text-center space-y-1 font-mono"
                  >
                    <div className="text-[9px] font-sans font-bold text-slate-800 truncate">
                      {selectedLabelProduct.name}
                    </div>
                    <div className="flex justify-center py-1">
                      {/* Code128 Visual Bars */}
                      <div className="flex items-end space-x-[2px] h-9">
                        {[2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                          <div
                            key={i}
                            className={`bg-slate-900 h-full ${
                              w === 1 ? "w-[1px]" : w === 2 ? "w-[2px]" : w === 3 ? "w-[3px]" : "w-[4px]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600 font-bold">{selectedLabelProduct.barcode}</div>
                    <div className="text-xs font-bold text-slate-900">${selectedLabelProduct.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsLabelModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={() => window.print()} className="text-xs bg-slate-900 text-white">
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print Sticker Sheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: REGISTER SHIFT AUDIT / CASH DRAWER RECONCILIATION */}
      {/* ========================================================================= */}
      <Dialog open={isShiftAuditOpen} onOpenChange={setIsShiftAuditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Register Shift Cash Audit</DialogTitle>
            <DialogDescription className="text-xs">
              Reconcile physical cash drawer with expected POS shift ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Opening Cash Float:</span>
                <span className="font-mono font-medium">${shiftOpeningCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Cash Sales Accumulated:</span>
                <span className="font-mono font-medium text-emerald-600">+${shiftCashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Expected Drawer Total:</span>
                <span className="font-mono text-sm">${expectedDrawerCash.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="counted-cash" className="text-xs font-semibold">
                Actual Physical Cash Counted ($) *
              </Label>
              <Input
                id="counted-cash"
                type="number"
                step="0.01"
                placeholder="Count all physical bills and coins..."
                value={shiftCountedCash}
                onChange={(e) => setShiftCountedCash(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {shiftCountedCash && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-semibold flex justify-between ${
                  Number(shiftCountedCash) - expectedDrawerCash === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : Number(shiftCountedCash) - expectedDrawerCash > 0
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <span>Drawer Variance:</span>
                <span className="font-mono">
                  {Number(shiftCountedCash) - expectedDrawerCash >= 0 ? "+" : ""}
                  {(Number(shiftCountedCash) - expectedDrawerCash).toFixed(2)} (
                  {Number(shiftCountedCash) - expectedDrawerCash === 0
                    ? "Balanced Perfectly"
                    : Number(shiftCountedCash) - expectedDrawerCash > 0
                    ? "Surplus"
                    : "Shortage"}
                  )
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsShiftAuditOpen(false)} className="text-xs">
              Close
            </Button>
            <Button
              onClick={() => {
                if (!shiftCountedCash) return;
                alert(
                  `Shift Audit Logged successfully!\nExpected: $${expectedDrawerCash.toFixed(
                    2
                  )}\nCounted: $${Number(shiftCountedCash).toFixed(2)}\nDifference: $${(
                    Number(shiftCountedCash) - expectedDrawerCash
                  ).toFixed(2)}`
                );
                setIsShiftAuditOpen(false);
              }}
              className="text-xs bg-slate-900 text-white"
            >
              Confirm Shift Audit & Close Drawer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: ACCESS RESTRICTED / SUBSCRIPTION TIER UPGRADE MODAL */}
      {/* ========================================================================= */}
      <Dialog
        open={accessDeniedModal.isOpen}
        onOpenChange={(open) =>
          setAccessDeniedModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-amber-600 mb-1">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-slate-900">
                {accessDeniedModal.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              {accessDeniedModal.reason}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Active User Role:</span>
                <Badge variant="outline" className="capitalize font-semibold">
                  {userRole}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Subscription Tier:</span>
                <Badge variant="outline" className="capitalize font-semibold">
                  {subscriptionTier} Plan
                </Badge>
              </div>
              {accessDeniedModal.requiredTier && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-indigo-700 font-semibold">
                  <span>Required Tier:</span>
                  <span className="capitalize">{accessDeniedModal.requiredTier} Plan or higher</span>
                </div>
              )}
              {accessDeniedModal.requiredRole && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-indigo-700 font-semibold">
                  <span>Required Role:</span>
                  <span className="capitalize">{accessDeniedModal.requiredRole} or higher</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="text-xs"
            >
              Dismiss
            </Button>

            {accessDeniedModal.requiredTier ? (
              <Button
                size="sm"
                onClick={() => {
                  setSubscriptionTier(
                    accessDeniedModal.requiredTier as SubscriptionTier
                  );
                  setEnabledModules((prev) => ({
                    ...prev,
                    [accessDeniedModal.requiredModule || "advanced_reports"]: true,
                    barcodes: true,
                    ecommerce_bridge: true,
                    multi_store: true,
                  }));
                  setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Upgrade to {accessDeniedModal.requiredTier?.toUpperCase()} Tier
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setUserRole((accessDeniedModal.requiredRole as UserRole) || "admin");
                  setAccessDeniedModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Switch to {accessDeniedModal.requiredRole?.toUpperCase() || "ADMIN"} Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: BULK STOCK LEVEL MODIFIER */}
      {/* ========================================================================= */}
      <Dialog open={isBulkStockModalOpen} onOpenChange={setIsBulkStockModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Stock ({selectedInventoryIds.size} Items)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Batch modify stock levels for {storesList.find((s) => s.id === selectedStore)?.name}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Operation Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBulkStockMode("set")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "set"
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Set Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStockMode("add")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "add"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStockMode("subtract")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    bulkStockMode === "subtract"
                      ? "bg-amber-50 border-amber-400 text-amber-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {bulkStockMode === "set"
                  ? "New Stock Value (Units)"
                  : bulkStockMode === "add"
                  ? "Units to Add"
                  : "Units to Deduct"}
              </Label>
              <Input
                type="number"
                min="0"
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(Number(e.target.value) || 0)}
                className="font-mono text-sm h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkStockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setProducts((prev) =>
                  prev.map((p) => {
                    if (selectedInventoryIds.has(p.id)) {
                      const currentBranch = p.storeStocks[selectedStore] ?? p.stock;
                      let newBranchStock = currentBranch;
                      let newGlobalStock = p.stock;

                      if (bulkStockMode === "set") {
                        const delta = bulkStockValue - currentBranch;
                        newBranchStock = bulkStockValue;
                        newGlobalStock = Math.max(0, p.stock + delta);
                      } else if (bulkStockMode === "add") {
                        newBranchStock = currentBranch + bulkStockValue;
                        newGlobalStock = p.stock + bulkStockValue;
                      } else {
                        newBranchStock = Math.max(0, currentBranch - bulkStockValue);
                        newGlobalStock = Math.max(0, p.stock - bulkStockValue);
                      }

                      return {
                        ...p,
                        stock: newGlobalStock,
                        storeStocks: {
                          ...p.storeStocks,
                          [selectedStore]: newBranchStock,
                        },
                        status:
                          newGlobalStock <= 0
                            ? "Out of Stock"
                            : newGlobalStock <= p.minStock
                            ? "Low Stock"
                            : "In Stock",
                      };
                    }
                    return p;
                  })
                );
                setIsBulkStockModalOpen(false);
                setSelectedInventoryIds(new Set());
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Apply to {selectedInventoryIds.size} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: BULK DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Delete {selectedInventoryIds.size} Products?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete these products from catalog?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
              {Array.from(selectedInventoryIds).map((id) => {
                const prod = products.find((p) => p.id === id);
                if (!prod) return null;
                return (
                  <div key={id} className="text-xs flex items-center justify-between px-2 py-1 bg-white rounded border border-slate-100">
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">{prod.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{prod.sku}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setProducts((prev) => prev.filter((p) => !selectedInventoryIds.has(p.id)));
                setIsBulkDeleteModalOpen(false);
                setSelectedInventoryIds(new Set());
              }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Confirm Batch Delete ({selectedInventoryIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
