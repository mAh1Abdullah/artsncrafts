# System Architecture — WAW-POS & The Artisan's Market Monorepo

## 1. Monorepo Topology (Turborepo)

The platform is organized as a **Turborepo** workspace separating the public customer storefront from the backend REST API, PostgreSQL database owner, and operational consoles:

```text
/
├── turbo.json                  # Task graph (build, dev, lint, typecheck)
├── package.json                # Root workspaces: ["apps/*", "packages/*"]
├── apps/
│   ├── storefront/             # @waw/storefront — Astro 7.4 + React 19 Islands (Port 4321)
│   └── dashboard/              # @waw/dashboard  — Next.js 16 + Drizzle/PostgreSQL + REST API (Port 3000)
├── packages/
│   └── contracts/              # @waw/contracts  — Stateless HTTP DTOs, Zod schemas, REST client
└── docs/                       # Platform architecture, data models, features, roadmap
```

### Strict Ownership Boundaries

1. **Database Ownership (`apps/dashboard` only)**:
   - All PostgreSQL tables (`src/lib/db/schema.ts`), Drizzle configuration (`drizzle.config.ts`), migrations (`drizzle/`), and database drivers (`@neondatabase/serverless`, `drizzle-orm`) live strictly inside `apps/dashboard`.
   - `apps/storefront` and `packages/contracts` contain **zero** database or ORM dependencies.

2. **Public Storefront (`apps/storefront`, Port `4321`)**:
   - Built with **Astro v7.4** (`output: 'server'` via `@astrojs/node`), Tailwind CSS v4 (`@tailwindcss/vite`), and targeted **React 19 Islands** (`@astrojs/react`).
   - Communicates exclusively with `apps/dashboard` over HTTP via the typed REST client exported from `@waw/contracts`.

3. **Operations Platform & REST API (`apps/dashboard`, Port `3000`)**:
   - Built with **Next.js 16** (App Router, Turbopack, `src/proxy.ts` edge proxy).
   - Serves the versioned REST API under `/api/v1/*` and hosts all operational consoles:
     - `/` — Operations Command Hub
     - `/pos` — WAW-POS Offline-First Register (PWA + IndexedDB + Background Sync)
     - `/pos/inventory` — Stock Audit & Barcode Console
     - `/seller` — Artisan Seller Studio (with Gemini 4 Hydrogen AI story assist)
     - `/admin` — Marketplace Governance & Admin Console
     - `/shipping` — Bangladesh Delivery Zones, Couriers & Tracking Console

---

## 2. Industry-Standard REST API Architecture (`/api/v1/*`)

Every endpoint under `apps/dashboard/src/app/api/v1/` enforces consistent HTTP semantics:

- **Uniform Success Envelopes**:
  - Single resource: `{ data: T, meta: { requestId, timestamp, version: "v1" } }`
  - Collection: `{ data: T[], meta: { requestId, timestamp, version: "v1", pagination: { page, limit, total, totalPages, hasNext, hasPrev } } }`
- **RFC 9457 Problem Details (`application/problem+json`)**:
  - All `4xx`/`5xx` errors return `{ type, title, status, detail, instance, code, requestId, errors? }`.
- **HTTP Status Semantics**:
  - `200 OK`, `201 Created` (with `Location` header), `204 No Content` (`DELETE`), `400 Bad Request`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (duplicate SKU/coupon, insufficient stock), `422 Unprocessable Entity` (Zod schema or MOQ failures), `500`/`502`/`503`.
- **Idempotency**:
  - `POST /api/v1/orders`, `POST /api/v1/wholesale-orders`, and `POST /api/v1/sync` honor the `Idempotency-Key` header to prevent duplicate charges or double stock deductions on retries.
- **CORS & Request Tracing (`src/proxy.ts`)**:
  - Allowlists the Astro storefront origin (`STOREFRONT_ORIGIN`, default `http://localhost:4321`) with `Vary: Origin`, handles `OPTIONS` preflight, and attaches `X-Request-Id` to every response.

---

## 3. Data & Sync Flows

### Storefront Checkout → POS Stock Deduction
1. Customer submits checkout in Astro (`:4321`) with a unique `Idempotency-Key`.
2. Next.js (`:3000`) validates the payload via `@waw/contracts` Zod schemas and checks live stock.
3. Stock is atomically deducted in the shared catalog, an immutable stock audit entry is recorded, a companion consignment shipment is booked (Pathao / Steadfast / RedX), and the sale is mirrored into the WAW-POS ledger.

### Offline-First POS Register Sync
1. Cashiers record sales, stock counts, and expenses in IndexedDB while offline.
2. On reconnect or manual trigger, `background-sync.ts` flushes pending batches to `POST /api/v1/sync` with an `Idempotency-Key`.
3. Server reconciles mutations into PostgreSQL and returns a refreshed catalog snapshot for local cache hydration.

### Server-Side AI Proxy (Gemini 4 Hydrogen)
- `POST /api/v1/ai/craft-advisor` (called by Astro storefront modal) and `POST /api/v1/ai/product-story` (called by Seller Studio) invoke `@google/genai` strictly on the Next.js server using `process.env.GEMINI_API_KEY` and model `gemini-4-hydrogen`.
