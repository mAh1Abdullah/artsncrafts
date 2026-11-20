# Technology Stack

## 1. Core Framework & Language

- **Next.js 15 (App Router)**: Hybrid Server & Client Component architecture powering `/` (Artisans Market), `/pos` (WAW-POS), `/pos/inventory` (Stock Audit Console), Server Actions, API Route Handlers (`/api/v1/*`), and Edge-compatible Middleware (`src/middleware.ts`).
- **React 19**: Concurrent rendering, transitions, and modular hook-driven feature state (`usePosWorkspace`).
- **TypeScript 5**: Strict end-to-end typing across Drizzle schemas, API contracts, RBAC permissions, IndexedDB queues, and UI components.

---

## 2. Styling, Typography & Motion

- **Tailwind CSS v4 (`@tailwindcss/postcss`)**: Utility-first styling with CSS variable design tokens in `src/app/globals.css`.
- **Radix UI Primitives (`src/components/ui/`)**: Accessible headless dialogs, dropdown menus, checkboxes, selects, tabs, and tables.
- **Motion (`motion/react`)**: Smooth storefront drawer, product modal, and entrance transitions.
- **Lucide React (`lucide-react`)**: Consistent vector iconography across both storefront and backoffice surfaces.
- **Recharts (`recharts`)**: Responsive sales trend and inventory analytics charts inside WAW-POS.
- **Google Fonts (`next/font/google`)**:
  - Storefront (`/`): `Fraunces` (editorial display serif), `Plus Jakarta Sans` (UI copy), `JetBrains Mono` (tabular pricing & order codes).
  - Backoffice (`/pos`): `Geist` and `Geist Mono` (high-density tabular POS numerals).

---

## 3. Data Persistence & Offline-First PWA

- **Drizzle ORM + Drizzle Kit**: Type-safe relational schema (`src/lib/db/schema.ts`) and SQL migrations (`drizzle/`) targeting **Cloudflare D1** (SQLite-compatible serverless SQL), paired with an in-memory seeded repository fallback (`src/lib/db/products.ts`) for zero-config local/preview execution.
- **IndexedDB (`src/lib/offline-db.ts`)**: Durable client-side storage (`waw_pos_offline_db`) for offline sales, inventory mutations, expenses, catalog caching, and sync logs.
- **Service Worker & Background Sync (`public/sw.js` + `src/lib/background-sync.ts`)**: Stale-while-revalidate asset caching, offline network interception, and automatic `waw-pos-sync` queue flushing upon reconnect.
- **Web App Manifest (`public/manifest.json`)**: Enables standalone PWA installation on tablets and desktop POS stations.

---

## 4. Security & Access Governance

- **RBAC & Tier Engine (`src/lib/permissions.ts`)**: Declarative permission matrix mapping `owner`, `admin`, `manager`, and `cashier` roles plus `starter`, `pro`, and `enterprise` subscription entitlements.
- **API Gateway Middleware (`src/middleware.ts` & `src/lib/api-guard.ts`)**: Evaluates role and tier headers/cookies on protected `/api/v1/*` routes before executing mutations.
