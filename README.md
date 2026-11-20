# Artisans Market & WAW-POS

A unified, offline-first **handcrafted e-commerce storefront** (**Artisans Market**) and **retail Point of Sale & Inventory backoffice** (**WAW-POS**), built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4**, **Drizzle ORM**, and **IndexedDB + Service Worker Background Sync**.

---

## Application Surfaces & Routes

| Route | Surface | Purpose |
| --- | --- | --- |
| `/` | **Artisans Market Storefront** | Customer-facing handcrafted goods catalog with live WAW-POS stock sync, workshop stories, customization modal, BDT/USD switching, bKash/Nagad/AmarPay/COD checkout, and shipment tracker. |
| `/pos` | **WAW-POS Operations Dashboard** | Unified backoffice housing POS Register, Multi-Branch Catalog & Stock, Sales Ledger, Expenses, P&L Analytics, E-Commerce & Logistics, Reseller Growth Hub, and RBAC/SaaS Plugins. |
| `/pos/inventory` | **Inventory & Stock Audit Console** | Dedicated server-action console for catalog CRUD, barcode lookup, label printing, bulk stock updates, and immutable stock audit logs. |
| `/dashboard` | Legacy Redirect | Redirects cleanly to `/pos`. |
| `/inventory` | Legacy Redirect | Redirects cleanly to `/pos/inventory`. |

---

## Project Structure (Feature-Sliced)

```text
├── docs/                           # Standardized architecture, schema & product specs
├── drizzle/                        # Drizzle ORM SQL migrations
├── public/                         # PWA manifest, Service Worker (/sw.js) & storefront media
└── src/
    ├── middleware.ts               # API Gateway RBAC & subscription tier enforcement
    ├── app/                        # Next.js 15 App Router entry points & /api/v1/* routes
    ├── components/ui/              # Shared Radix / Tailwind UI primitives
    ├── features/
    │   ├── artisans/               # Storefront components, types & heritage catalog mapper
    │   ├── pos/                    # Modular POS workspace (hooks, 8 views, 10 dialogs, shared)
    │   └── inventory/              # Standalone Inventory & Stock Audit Console components
    └── lib/                        # Drizzle DB, Server Actions, RBAC, IndexedDB & Background Sync
```

---

## Documentation

Full technical and product documentation lives in `docs/`:

- [System Architecture & Directory Guide](docs/architecture.md)
- [Feature Specification](docs/features.md)
- [Software Requirements](docs/requirements.md)
- [Data Models & Persistence Schema](docs/data-models.md)
- [Technology Stack](docs/tech-stack.md)
- [User Stories](docs/user-stories.md)
- [Development Roadmap](docs/roadmap.md)

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server on port 3000
npm run dev

# 3. Run linter & production build check
npm run lint
npm run build
```

Open `http://localhost:3000` for **Artisans Market** or `http://localhost:3000/pos` for the **WAW-POS** backoffice dashboard.