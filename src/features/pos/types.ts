export type PosTabId =
  | "pos"
  | "inventory"
  | "sales"
  | "expenses"
  | "reports"
  | "ecommerce"
  | "reseller"
  | "subscriptions";

export interface StoreLocation {
  id: string;
  name: string;
  isMain: boolean;
}

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

export interface AccessDeniedModalState {
  isOpen: boolean;
  title: string;
  reason: string;
  requiredRole?: string;
  requiredTier?: string;
  requiredModule?: string;
  targetAction?: string;
}

export interface ShiftAuditResult {
  expected: number;
  counted: number;
  difference: number;
}

export interface OfflineQueueCounts {
  salesCount: number;
  inventoryCount: number;
  expensesCount: number;
  totalCount: number;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PosNotification {
  id: number;
  tone: "info" | "success" | "warning" | "error";
  message: string;
}
