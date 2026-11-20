# System Architecture & Directory Guide

## 1. Platform Overview

This repository hosts a unified dual-surface retail & craft commerce platform:

- **Artisans Market (`/`)** — Customer-facing handcrafted goods storefront inspired by Bangladeshi heritage guilds (Sylhet, Dhamrai, Tangail, Sonargaon), featuring curated collections, dynamic product customization, BDT/USD currency toggling, localized Bangladesh payment flows (bKash, Nagad, AmarPay, COD), and live shipment tracking.
- **WAW-POS (`/pos` & `/pos/inventory`)** — Offline-first Point of Sale (POS), multi-branch inventory management, barcode scanning & label printing, expense tracking, financial P&L analytics, e-commerce logistics bridge, reseller growth hub, and RBAC/SaaS tier governance.

Both surfaces share a single product catalog, stock ledger, and REST/Server Action backend so online storefront orders atomically deduct stock and record sales directly into the POS ledger.

---

## 2. High-Level System Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 15 APP ROUTER ENTRY                          │
│                                                                              │
│   ┌───────────────────────────┐        ┌─────────────────────────────────┐   │
│   │  Storefront Route (/)     │        │  Backoffice Routes (/pos,       │   │
│   │  Artisans Market UI       │◄──────►│  /pos/inventory) + Redirects    │   │
│   └─────────────┬─────────────┘        └────────────────┬────────────────┘   │
└─────────────────┼───────────────────────────────────────┼────────────────────┘
                  │                                       │
                  ▼                                       ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────────┐
│   src/features/artisans/        │      │  src/features/pos/ & inventory/     │
│  • Editorial Hero & Catalog     │      │  • usePosWorkspace State Hook       │
│  • Product Customizer & Bag     │      │  • 8 Focused Tab Views              │
│  • Workshop Drawers & Tracker   │      │  • 10 Extracted Action/Audit Modals │
│  • Localized BD Checkout        │      │  • Standalone Audit Console Table   │
└─────────────────┬───────────────┘      └────────────────┬────────────────────┘
                  │                                       │
                  └───────────────────┬───────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 SHARED API GATEWAY, RBAC & PERSISTENCE CORE                  │
│                                                                              │
│  • src/middleware.ts & src/lib/permissions.ts (RBAC + SaaS Tier Guard)       │
│  • src/app/api/v1/* (Products, Orders, Webhooks, Inventory Sync, Batch Sync) │
│  • src/lib/db/* & drizzle/ (Drizzle ORM + Cloudflare D1 / Memory Fallback)   │
│  • src/lib/offline-db.ts + public/sw.js (IndexedDB + Background Sync PWA)    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature-Sliced Directory Plan

The codebase enforces a clean **Feature-Sliced Architecture** inside `src/`:

```text
├── docs/                                # Standardized engineering & product documentation
│   ├── architecture.md                  # System design, directory rules & data flows (this file)
│   ├── data-models.md                   # Relational D1 schema, API payloads & IndexedDB stores
│   ├── features.md                      # Storefront + WAW-POS feature catalog
│   ├── requirements.md                  # Functional & non-functional system requirements
│   ├── roadmap.md                       # Completed phases & future delivery milestones
│   ├── tech-stack.md                    # Runtime, UI, database & PWA technology stack
│   └── user-stories.md                  # Shopper, cashier, manager & owner user stories
│
├── drizzle/                             # SQL database migrations (Drizzle Kit)
├── public/
│   ├── images/artisans/                 # Single source of truth for storefront imagery
│   ├── icons/                           # PWA app icons
│   ├── manifest.json                    # Web App Manifest
│   └── sw.js                            # Service Worker (caching + Background Sync API)
│
└── src/
    ├── middleware.ts                    # Tenant, role & subscription tier enforcement for /api/*
    ├── app/                             # Thin Next.js 15 App Router entry points
    │   ├── layout.tsx                   # Root HTML shell, fonts & PWA metadata
    │   ├── globals.css                  # Tailwind CSS v4 tokens & theme styles
    │   ├── page.tsx                     # `/` — Artisans Market Storefront (SSR hydrated)
    │   ├── pos/
    │   │   ├── page.tsx                 # `/pos` — Unified WAW-POS Operations Workspace
    │   │   └── inventory/
    │   │       └── page.tsx             # `/pos/inventory` — Standalone Stock Audit Console
    │   ├── dashboard/page.tsx           # Legacy redirect -> `/pos`
    │   ├── inventory/page.tsx           # Legacy redirect -> `/pos/inventory`
    │   └── api/
    │       ├── health/route.ts          # Liveness probe
    │       ├── orders/route.ts          # Order listing helper
    │       └── v1/
    │           ├── products/route.ts    # Shared catalog CRUD API
    │           ├── orders/route.ts      # Storefront checkout & POS order ledger API
    │           ├── orders/webhook/      # External Shopify/WooCommerce order webhook
    │           ├── inventory/sync/      # Outbound e-commerce inventory sync bridge
    │           └── sync/batch/          # Offline PWA batch synchronization endpoint
    │
    ├── components/
    │   └── ui/                          # Reusable headless/Radix UI primitives (Button, Dialog, Table...)
    │
    ├── features/                        # Domain-owned feature slices
    │   ├── artisans/                    # Storefront commerce slice
    │   │   ├── types.ts                 # Storefront product, cart, order & workshop types
    │   │   ├── data/artisans-catalog.ts # Heritage catalog mapper, workshops & currency utils
    │   │   └── components/              # ArtisansStorefront, Header, CartDrawer, CheckoutModal,
    │   │                                # ProductDetailModal, WorkshopDrawer, OrderTrackerModal
    │   │
    │   ├── pos/                         # Unified WAW-POS backoffice slice
    │   │   ├── types.ts                 # POSProduct, CartItem, SaleTransaction, SyncLog...
    │   │   ├── data/initial-data.ts     # Store outlets & offline seed datasets
    │   │   ├── hooks/usePosWorkspace.ts # Consolidated POS state, RBAC, cart & offline sync hook
    │   │   └── components/
    │   │       ├── PosWorkspace.tsx     # Top-level POS workspace orchestrator
    │   │       ├── PosHeader.tsx        # App bar, tab nav, offline banner, role/store switchers
    │   │       ├── shared/              # InventorySalesSummary, EcommerceOrdersLogistics, ResellerHub
    │   │       ├── views/               # 8 modular tab views (Register, Catalog, Sales, Expenses,
    │   │       │                        # Reports, Ecommerce, Reseller, Subscriptions)
    │   │       └── dialogs/             # 10 focused dialogs (Checkout, Receipt, AddProduct,
    │   │                                # AddExpense, StockTransfer, Labels, ShiftAudit,
    │   │                                # AccessRestricted, BulkInventory, OfflineSyncModal)
    │   │
    │   └── inventory/                   # Standalone Inventory & Stock Audit slice (`/pos/inventory`)
    │       └── components/              # InventoryClient, ProductTable, ProductForm, SummaryCards,
    │                                    # AddProductDialog, BarcodeLookup, LabelPrinter, AuditLogTable
    │
    └── lib/                             # Cross-cutting infrastructure & domain services
        ├── actions/products.ts          # Next.js Server Actions for inventory mutations
        ├── db/                          # Drizzle schema (`schema.ts`) & repository (`products.ts`)
        ├── api-guard.ts                 # Request authorization helper
        ├── background-sync.ts           # Automatic reconnect & manual batch sync engine
        ├── offline-db.ts                # Client IndexedDB wrapper for offline queues & catalog cache
        ├── permissions.ts               # Role-based permissions & subscription tier definitions
        └── utils.ts                     # Shared className & formatting helpers
```

---

## 4. Routing & Boundary Conventions

| Route | Responsibility | Notes |
| --- | --- | --- |
| `/` | **Artisans Market Storefront** | Server-renders initial catalog from `getProducts()` and hydrates live stock from `/api/v1/products`. |
| `/pos` | **WAW-POS Unified Backoffice** | Houses all 8 operational modules (Register, Catalog, Sales, Expenses, Reports, E-Commerce, Resellers, RBAC). |
| `/pos/inventory` | **Inventory & Stock Audit Console** | Deep-link server-action console for barcode lookup, thumbnail editing, bulk stock mutations, and immutable audit logs. |
| `/dashboard` | Legacy Redirect | Server-redirects permanently/cleanly to `/pos`. |
| `/inventory` | Legacy Redirect | Server-redirects cleanly to `/pos/inventory`. |
| `/api/v1/*` | REST API Gateway | Protected by `src/middleware.ts` RBAC and tier checks. |

### Architectural Guardrails
1. **No Root-Level UI Code**: All application logic and components live strictly inside `src/`.
2. **Feature Isolation**: Feature slices (`src/features/<domain>`) own their domain components, hooks, types, and seed helpers. Shared design primitives stay in `src/components/ui/`, and cross-feature infrastructure stays in `src/lib/`.
3. **Thin App Router Files**: Route files under `src/app/` only handle data loading, redirects, metadata, and composing feature entry components.
4. **Single Media Source**: Static storefront imagery resides exclusively under `public/images/artisans/`.

---

## 5. Key Data Flows

### 5.1 Storefront Checkout ↔ WAW-POS Live Stock Sync
1. Shopper selects items and customizations on `/` (`ArtisansStorefront`) and completes checkout in `CheckoutModal`.
2. Client submits `POST /api/v1/orders` with customer details, payment channel (bKash, Nagad, AmarPay, COD), and line items.
3. Server validates stock, atomically decrements product inventory in `src/lib/db/products.ts`, appends a stock audit log entry, and records the online order.
4. Both `/` and `/pos` reflect updated inventory counts immediately on next hydration or refresh, and `/pos` surfaces the order inside the **E-Commerce & Logistics** tab.

### 5.2 Offline-First POS & Background Synchronization
1. On load, `usePosWorkspace` caches the active product catalog into IndexedDB (`waw_pos_offline_db`) via `cacheProductCatalog()`.
2. When offline (real network drop or simulated offline toggle), POS sales, stock additions, and expense entries write immediately to durable IndexedDB queues (`pending_sales`, `pending_inventory`, `pending_expenses`).
3. When connectivity returns—or when the user triggers **Sync to Database Now** in `OfflineSyncModal`—`performFullSync()` (`src/lib/background-sync.ts`) dispatches queued records to `POST /api/v1/sync/batch`, clears confirmed entries, and appends an entry to `sync_history_logs`.
4. `public/sw.js` caches static assets and listens for the `waw-pos-sync` Background Sync tag to coordinate background flushes.
