# WAW-POS & The Artisan's Market Monorepo

A **Turborepo** monorepo uniting **The Artisan's Market** customer storefront (**Astro v7.4**) with **WAW-POS**, **Seller Studio**, **Marketplace Admin**, **Shipping Logistics**, and an industry-standard **REST v1 API** (**Next.js 16** + **PostgreSQL/Drizzle ORM**).

## Workspace Structure

| Workspace | Package | Framework | Port | Responsibility |
|---|---|---|---|---|
| `apps/storefront` | `@waw/storefront` | **Astro 7.4** + React 19 Islands + Tailwind v4 | `4321` | Public storefront, PDP customizer, cart/checkout, raw materials wholesale, seller onboarding, buyer portal (100% REST API driven, zero DB deps) |
| `apps/dashboard` | `@waw/dashboard` | **Next.js 16** + Drizzle ORM + PostgreSQL | `3000` | Sole PostgreSQL schema owner, REST API (`/api/v1/*`), WAW-POS offline-first register (`/pos`), Stock Audit (`/pos/inventory`), Seller Studio (`/seller`), Admin (`/admin`), Shipping (`/shipping`) |
| `packages/contracts` | `@waw/contracts` | TypeScript + Zod | — | Shared HTTP DTOs, Zod validators, RFC 9457 error types, typed REST client, currency & CUID utilities |

## Getting Started

1. Copy `.env.example` to `.env` and configure `DATABASE_URL` (optional; falls back cleanly in preview) and `GEMINI_API_KEY` (for server-side Craft Advisor & Product Story AI routes).
2. Install workspace dependencies:
   ```bash
   npm install
   ```
3. Run both apps concurrently via Turborepo:
   ```bash
   npm run dev
   ```
   - Next.js 16 Operations Hub, POS & REST API: `http://localhost:3000`
   - Astro 7.4 Customer Storefront: `http://localhost:4321`
4. Build and lint all workspaces:
   ```bash
   npm run build
   npm run lint
   ```

## REST API Standards (`/api/v1/*`)

- Uniform response envelopes: `{ data, meta }` and `{ data, meta: { pagination } }`
- Standardized **RFC 9457** `application/problem+json` error responses
- `X-Request-Id` tracing header and allowlisted CORS (`STOREFRONT_ORIGIN`)
- `Idempotency-Key` support on `POST /api/v1/orders`, `POST /api/v1/wholesale-orders`, and `POST /api/v1/sync`

## Documentation

See `/docs/` for detailed documentation:
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/tech-stack.md`](docs/tech-stack.md)
- [`docs/data-models.md`](docs/data-models.md)
- [`docs/features.md`](docs/features.md)
- [`docs/requirements.md`](docs/requirements.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/user-stories.md`](docs/user-stories.md)