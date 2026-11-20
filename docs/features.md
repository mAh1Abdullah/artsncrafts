# Feature Specification

This document outlines the complete feature set across both surfaces of the **Artisans Market + WAW-POS** platform.

---

## 1. Artisans Market Customer Storefront (`/`)

- **Editorial Discovery & Hero**: Curated heritage spotlight featuring Sylhet, Dhamrai, Tangail, and Sonargaon craft guilds with studio photography.
- **Live Inventory-Synced Catalog**: Dynamically hydrated from the WAW-POS catalog (`/api/v1/products`), displaying live stock status, low-stock notices, and sold-out protection.
- **Filtering, Search & Dual Currency**: Category filter pills, real-time keyword search, workshop collections, and instant **BDT (৳) / USD ($)** currency conversion.
- **Product Customization Modal**: Interactive variant/finish selectors with dynamic price adjustments, craft provenance details, and wishlist persistence.
- **Slide-Over Shopping Bag**: Quantity adjustments, item removal, subtotal calculation, and live stock clamping.
- **Localized Bangladesh Checkout**: Supports **bKash**, **Nagad**, **AmarPay**, and **Cash on Delivery (COD)** with shipping zone calculation (Inside Dhaka / Nationwide) and atomic backend order creation (`POST /api/v1/orders`).
- **Live Order & Shipment Tracker**: Customers can inspect order status, courier milestones, and synced fulfillment updates from WAW-POS.

---

## 2. WAW-POS Operations Workspace (`/pos`)

### 2.1 POS Register Terminal
- **Barcode & SKU Quick-Scan**: Hardware/keyboard barcode scanner input (`EAN-13`, `Code128`, or SKU) for sub-second ticket building.
- **Touch-Friendly Product Grid**: Category filters, instant search, live branch stock badges, and out-of-stock prevention.
- **Active Ticket & Discounts**: Line-item quantity controls, quick percentage discounts (`0%`–`20%`), optional customer capture, and automated 5% VAT calculation.
- **Multi-Channel Tender & Cash Change**: Supports Cash Drawer (with quick denomination chips & change calculator), Debit/Card, bKash/Nagad, AmarPay/QR, UddoktaPay, and COD/Advance.
- **Printable Thermal Receipts**: Switchable **80mm Standard** and **58mm Compact** thermal invoice layouts with BIN/Mushak metadata and instant print trigger.
- **Shift Cash Drawer Auditing**: Opening cash float tracking, accumulated cash sales, variance calculation (Surplus / Shortage / Balanced), and shift reconciliation logging.

### 2.2 Catalog & Multi-Location Stock
- **Multi-Branch Inventory Tracking**: Switch across branches (`SYL-01`, `ZIN-02`, `DHK-03`) with per-store and global chain stock views.
- **Batch Operations Bar**: Multi-select checkboxes with quick `+10` / `-5` stock buttons, Bulk Stock Modifier (Set Fixed / Add / Deduct), and RBAC-gated Batch Delete.
- **Inter-Branch Stock Transfers**: Move physical inventory between outlets with available-stock validation.
- **Code128 Barcode Label Printing**: Generate and print multi-sticker sheets (`1`, `2`, `4`, or `8` stickers) per SKU.
- **Deep Link to Audit Console**: One-click access to `/pos/inventory` for server-persisted product editing and full audit history.

### 2.3 Sales Directory & Expense Logging
- **Transaction Ledger**: Searchable sales history by invoice number or customer, filterable by payment method, with full receipt reprinting.
- **Business Expense Tracker**: Categorized expense logging (Rent & Utilities, Packaging, Logistics, Staff Allowances, etc.) with KPI rollups and CSV export.

### 2.4 Executive Financial Analytics & Reporting
- **Live P&L Engine**: Real-time Gross Sales Revenue, Cost of Goods Sold (COGS), Gross Margin %, Operating Expenses, and Net Business Profit.
- **Inventory Valuation**: Compares wholesale acquisition value at cost against potential retail value alongside low-stock reorder alerts and top velocity SKUs.
- **Data Export**: One-click CSV export for Sales, Expenses, and Inventory plus browser print-ready financial summaries.

### 2.5 E-Commerce, BD Gateways & Courier Logistics
- **Unified Online Order Management**: View and fulfill storefront orders alongside external channel integrations.
- **Webhook & Cloud Sync Bridge**: Test outbound catalog sync (`/api/v1/inventory/sync`) and inbound order webhooks (`/api/v1/orders/webhook`) for Shopify, WooCommerce, and Artisans Market.
- **Courier & Payment Gateway Controls**: Integrated operational console for Bangladesh payment channels and courier dispatch workflows.

### 2.6 Resellers & Growth Hub
- **Partner & Reseller Directory**: Manage reseller tiers, wholesale margins, and promotional growth campaigns directly within the backoffice.

### 2.7 Modular SaaS Tiers & RBAC Governance
- **Role Switcher & Permission Matrix**: Enforces granular access across `owner`, `admin`, `manager`, and `cashier` roles (e.g., hiding wholesale costs from cashiers, gating bulk deletes and refunds).
- **Subscription Tier Gating**: Supports `starter`, `pro`, and `enterprise` tiers with automatic access-restricted upgrade prompts and middleware enforcement (`src/middleware.ts`).

---

## 3. Standalone Inventory & Stock Audit Console (`/pos/inventory`)

- **Server-Action Persistence**: Direct Drizzle/repository CRUD operations with automatic path revalidation across `/pos/inventory`, `/pos`, and `/`.
- **Interactive Stock Filters**: Clickable KPI summary cards (`All`, `In Stock`, `Low Stock`, `Out of Stock`) and sortable catalog tables.
- **Immutable Stock Audit Trail**: Chronological log of every manual adjustment, storefront checkout deduction, and batch update with actor metadata.
- **Barcode Lookup & Label Printer**: Instant barcode lookup dialog and printable product label generator.

---

## 4. Offline-First PWA & Background Sync Engine

- **Installable Progressive Web App**: Complete Web App Manifest (`public/manifest.json`) and Service Worker (`public/sw.js`).
- **IndexedDB Durable Storage (`waw_pos_offline_db`)**: Persists pending offline sales, inventory mutations, expenses, and a local catalog cache for instant offline lookups.
- **Automatic & Manual Sync Manager**: Reconnect listener + `waw-pos-sync` Background Sync API flushes queues to `/api/v1/sync/batch`, with a dedicated **Queue & Sync Manager** modal showing pending items, audit logs, and PWA diagnostics.
