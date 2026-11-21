# Technology Stack

## Monorepo & Tooling

| Layer | Technology | Version / Notes |
|---|---|---|
| Monorepo Orchestrator | **Turborepo** | `^2.11` (`turbo.json` build/dev/lint/typecheck pipelines) |
| Language | **TypeScript** | `^5` (strict mode across all apps and packages) |
| Shared Contracts | **@waw/contracts** | Stateless HTTP DTOs, Zod v3 schemas, typed REST client, currency/CUID helpers |

## Public Storefront (`apps/storefront` — Port `4321`)

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Astro** | `7.4.x` (`output: 'server'` with `@astrojs/node`) |
| Interactive Islands | **React 19** (`@astrojs/react`) | Cart drawer, checkout, catalog filtering, PDP customizer, Craft Advisor, wholesale PO |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Warm artisan editorial design system (`Fraunces`, `Plus Jakarta Sans`, `JetBrains Mono`) |
| Icons | **Lucide React** | Unified vector iconography |
| Data Access | **HTTP REST Only** | Zero database/ORM packages; consumes `apps/dashboard` `/api/v1/*` exclusively |

## Operations Platform & REST API (`apps/dashboard` — Port `3000`)

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Next.js 16** | App Router, Turbopack, `src/proxy.ts` edge proxy, Route Handlers |
| Database | **PostgreSQL (Neon Serverless)** | Primary relational store (`@neondatabase/serverless`) |
| ORM | **Drizzle ORM** | `^0.44` type-safe PostgreSQL schema & migrations (lives strictly inside `apps/dashboard`) |
| Offline Storage | **IndexedDB + Service Worker** | PWA offline POS register (`src/lib/offline-db.ts`, `src/lib/background-sync.ts`) |
| Validation | **Zod** | Shared schemas from `@waw/contracts` for all API inputs |
| AI Integration | **@google/genai** | Server-side `gemini-4-hydrogen` calls via `/api/v1/ai/*` (key never exposed to browser) |
| UI & Charts | **Tailwind CSS v4**, **Radix UI**, **Recharts**, **JsBarcode** | SaaS dashboards, POS terminal, thermal receipts, barcode printing |
| Linting | **ESLint 9** | Next.js 16 native flat config (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`) |

> **Migration Note**: Legacy Cloudflare D1 (`wrangler.toml`) references and the standalone Vite `artisans-frontend/` directory have been retired in favor of PostgreSQL/Neon inside `apps/dashboard` and the Astro 7.4 storefront in `apps/storefront`.
