# Software Requirements Specification

## 1. Functional Requirements

### 1.1 Storefront Commerce (Artisans Market — `/`)
- **FR-SF-01 Catalog Sync**: The storefront shall render products from the shared WAW-POS catalog and reflect live stock availability.
- **FR-SF-02 Browsing & Filtering**: Shoppers shall filter handcrafted pieces by category, artisan workshop, and search keyword, and toggle currency display between `BDT` and `USD`.
- **FR-SF-03 Product Customization**: Shoppers shall configure optional craft finishes/variants before adding items to their shopping bag.
- **FR-SF-04 Checkout & Stock Deduction**: Submitting an order via `POST /api/v1/orders` shall validate stock, deduct inventory atomically, and return a trackable order reference.
- **FR-SF-05 Shipment Tracking**: Shoppers shall view real-time order and courier fulfillment progress from the storefront order tracker.

### 1.2 Point of Sale & Inventory Operations (WAW-POS — `/pos` & `/pos/inventory`)
- **FR-POS-01 Fast Checkout**: Cashiers shall scan barcodes/SKUs or tap product tiles, apply discounts, select a payment channel, calculate cash change, and print 80mm/58mm thermal receipts.
- **FR-POS-02 Multi-Branch Stock Control**: Managers shall view stock per branch, transfer units between branches, print Code128 labels, and run bulk stock updates or deletions.
- **FR-POS-03 Stock Audit Trail**: Every stock mutation performed in `/pos/inventory` or through storefront checkout shall append an immutable audit log record.
- **FR-POS-04 Expense & Financial Reporting**: Authorized roles shall log operational expenses, calculate real-time P&L (Revenue, COGS, Gross Margin, Net Profit), and export CSV ledgers.
- **FR-POS-05 E-Commerce & Reseller Operations**: Operators shall process online orders, trigger outbound/inbound webhook sync tests, and manage reseller channels.

### 1.3 Offline-First PWA & Synchronization
- **FR-PWA-01 Local Persistence**: The POS register shall continue accepting sales, catalog additions, and expenses when network connectivity is unavailable, persisting records to browser IndexedDB.
- **FR-PWA-02 Background Synchronization**: Upon connectivity restoration or manual trigger, queued records shall batch-sync to `POST /api/v1/sync/batch`, clear synced entries, and record an audit log.
- **FR-PWA-03 Installability**: The app shall serve a valid `manifest.json` and active Service Worker (`/sw.js`) supporting desktop and tablet installation.

### 1.4 Security, RBAC & Multi-Tenant Entitlements
- **FR-SEC-01 Role-Based Access Control**: Operations shall enforce permission boundaries across `owner`, `admin`, `manager`, and `cashier` roles (e.g., concealing wholesale cost from cashiers).
- **FR-SEC-02 Subscription Tier Gating**: Advanced modules (Barcode Printing, E-Commerce Bridge, Multi-Store Transfers, Financial P&L, Shift Auditing) shall enforce tier entitlements both in UI guards and in `src/middleware.ts`.

---

## 2. Non-Functional Requirements

- **NFR-01 Modular Architecture**: Source code shall follow a feature-sliced Next.js App Router layout (`src/features/{artisans,pos,inventory}` + `src/app/` + `src/lib/`) with no monolithic root-level component files.
- **NFR-02 Performance**: Catalog filtering, barcode lookup, and cart updates shall respond instantaneously (<100ms client interaction latency), backed by IndexedDB catalog caching when offline.
- **NFR-03 Responsiveness**: Both `/` and `/pos` shall adapt cleanly across desktop registers, POS tablets, and mobile devices.
- **NFR-04 Reliability & Graceful Fallback**: Database repositories shall seamlessly fall back to a seeded in-memory store when external Cloudflare D1 bindings are absent in local/preview runtimes.
- **NFR-05 Code Quality**: All TypeScript modules shall pass strict `next build` compilation and `npm run lint` with zero errors.
