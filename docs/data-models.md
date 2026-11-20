# Data Models & Persistence Schema

The platform spans three coordinated data layers:
1. **Relational Database Schema** (`src/lib/db/schema.ts`, Drizzle ORM / SQLite-compatible Cloudflare D1, with an in-memory repository fallback in `src/lib/db/products.ts`).
2. **Client Offline Storage** (`src/lib/offline-db.ts`, IndexedDB database `waw_pos_offline_db`).
3. **Domain View Models** (`src/features/artisans/types.ts` and `src/features/pos/types.ts`).

---

## 1. Core Relational Entities (`src/lib/db/schema.ts`)

### `tenants` & `stores`
Supports multi-tenant SaaS isolation and multi-branch operations (`SYL-01`, `ZIN-02`, `DHK-03`).
- `id` (`text`, PK)
- `name` (`text`)
- `subscriptionTier` (`"starter" | "pro" | "enterprise"`)
- `enabledModules` (`json` / feature flags)
- `createdAt`, `updatedAt`

### `categories`
- `id` (`text`, PK — e.g. `cat-handicrafts`, `cat-apparel`, `cat-home-living`)
- `tenantId` (`text`, FK -> `tenants.id`)
- `name` (`text`)
- `description` (`text`, nullable)

### `products`
Shared single source of truth powering **Artisans Market (`/`)**, **WAW-POS (`/pos`)**, and **Stock Audit Console (`/pos/inventory`)**.
- `id` (`text`, PK)
- `tenantId` (`text`, FK)
- `categoryId` (`text`, FK -> `categories.id`)
- `name` (`text`)
- `description` (`text`, nullable)
- `sku` (`text`, unique per tenant)
- `barcode` (`text`, nullable — EAN-13 / Code128)
- `brand` (`text`, nullable — maps to artisan guild/workshop)
- `imageUrl` (`text`, nullable — `/images/artisans/*.jpg`)
- `unitPrice` / `unitCost` (`text` / decimal string — wholesale cost)
- `sellingPrice` (`text` / decimal string — retail price)
- `taxRatePercentage` (`text` — default `0` or `5`)
- `currentStock` (`integer`)
- `reorderLevel` (`integer`)
- `isSyncedToEcommerce` (`boolean`)
- `externalEcommerceId` (`text`, nullable)
- `createdAt`, `updatedAt`

### `stock_audit_logs`
Immutable ledger of every stock movement across storefront orders, POS checkout, and manual adjustments.
- `id` (`text`, PK)
- `tenantId` (`text`)
- `productId` (`text`, FK -> `products.id`)
- `previousStock` (`integer`)
- `changeAmount` (`integer`, signed delta)
- `newStock` (`integer`)
- `adjustmentType` (`"restock" | "sale" | "damage" | "return" | "correction" | "bulk_set" | "create_product"`)
- `reason` (`text`)
- `userId`, `userName`, `userRole` (`text`)
- `createdAt` (`timestamp`)

### `sales` & `sale_items` / `online_orders`
Captures both physical POS register invoices and Artisans Market storefront orders.
- `id` (`text`, PK)
- `invoiceNo` / `orderNumber` (`text`, unique)
- `tenantId`, `storeId` (`text`)
- `customerName`, `customerPhone`, `shippingAddress` (`text`, nullable)
- `subtotal`, `discountAmount`, `taxAmount`, `totalAmount` (`numeric`)
- `paymentMethod` (`"cash" | "card" | "mobile_banking" | "upi" | "bkash" | "nagad" | "amarpay" | "cod"`)
- `status` (`"pending" | "confirmed" | "packed" | "shipped" | "delivered" | "completed" | "refunded"`)
- `source` (`"pos_terminal" | "artisans_storefront" | "ecommerce_sync"`)
- `createdAt`

### `expenses`
- `id` (`text`, PK)
- `tenantId`, `storeId` (`text`)
- `category` (`text` — Rent & Utilities, Packaging, Logistics, etc.)
- `amount` (`numeric`)
- `description` (`text`)
- `paymentMethod` (`text`)
- `recordedBy` (`text`)
- `expenseDate` (`text`, ISO date)

---

## 2. Offline IndexedDB Schema (`waw_pos_offline_db`)

Managed in `src/lib/offline-db.ts` for resilient offline-first POS operation:

| Object Store | Key Path | Purpose |
| --- | --- | --- |
| `pending_sales` | `id` | Queued offline POS sales awaiting batch push to `/api/v1/sync/batch`. |
| `pending_inventory` | `id` | Queued offline stock adjustments and newly created SKUs. |
| `pending_expenses` | `id` | Queued offline operational expenses. |
| `catalog_cache` | `id` | Snapshot of `POSProduct[]` enabling instant offline barcode & search lookup. |
| `sync_history_logs` | `id` | Timestamped audit trail of automatic, background, and manual sync runs. |

---

## 3. Storefront Domain Extensions (`src/features/artisans/types.ts`)

`mapBackendProductToArtisan()` (`src/features/artisans/data/artisans-catalog.ts`) enriches raw WAW-POS `products` rows with editorial metadata for `/`:
- `ArtisanProduct`: maps `sellingPrice` to dual-currency (`priceUsd`, `priceBdt`), attaches heritage story, workshop guild (`ArtisanWorkshop`), craft dimensions, lead time, and selectable `CustomizationOption[]`.
- `StorefrontCartItem`: binds `ArtisanProduct`, selected customizations, computed unit price, and quantity.
- `StorefrontOrderRecord`: tracks placed storefront order ID, payment method, delivery estimate, and live status synced from `/api/v1/orders`.
