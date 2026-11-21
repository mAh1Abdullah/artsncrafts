## Project Summary

WAW-POS & The Artisan's Market is a **Turborepo** monorepo uniting an **Astro v7.4** customer-facing artisan marketplace storefront (`apps/storefront`, port `4321`) with a **Next.js 16** offline-first POS, merchant operations platform, and industry-standard REST v1 API (`apps/dashboard`, port `3000`).

## Architectural Boundaries

*   **Strict Database Ownership**: All PostgreSQL / Drizzle ORM schemas (`apps/dashboard/src/lib/db/schema.ts`), migrations, and database drivers live strictly inside `apps/dashboard` (Next.js 16).
*   **Pure REST Storefront**: `apps/storefront` (Astro 7.4) has zero database dependencies and communicates exclusively with `apps/dashboard` over `/api/v1/*` using the typed REST client from `packages/contracts` (`@waw/contracts`).
*   **REST API Standards**: Every `/api/v1/*` route enforces `{ data, meta }` envelopes, paginated collections, RFC 9457 `application/problem+json` errors, Zod validation, allowlisted CORS, `X-Request-Id`, and `Idempotency-Key` on order/sync writes.

## Core Workspaces & Features

*   **Storefront (`apps/storefront` — `:4321`)**: Editorial catalog, PDP customizer & reviews, verified artisan shops, cart/checkout with coupon validation & delivery zones, Raw Materials wholesale (MOQ + online payment), artisan onboarding, buyer portal, and server-proxied AI Craft Advisor.
*   **Operations & POS (`apps/dashboard` — `:3000`)**:
    *   `/` — Operations Command Hub
    *   `/pos` — Offline-first WAW-POS register with IndexedDB queue & background sync
    *   `/pos/inventory` — Stock audit & barcode printing console
    *   `/seller` — Artisan Seller Studio with Gemini 4 Hydrogen product story generation
    *   `/admin` — Marketplace governance (vendor/product/review moderation, coupons, settlements, audit logs)
    *   `/shipping` — Bangladesh delivery zones, Pathao/Steadfast/RedX courier scoring, consignment booking & tracking

## Technology Stack

*   **Monorepo**: Turborepo (`turbo.json`, npm/bun workspaces)
*   **Storefront**: Astro v7.4 (`@astrojs/node`, `@astrojs/react`), React 19, Tailwind CSS v4 (`@tailwindcss/vite`)
*   **Backend & Operations**: Next.js 16 (App Router, Turbopack, `src/proxy.ts`), PostgreSQL (Neon Serverless), Drizzle ORM, PWA IndexedDB Sync
*   **Shared Contracts**: `@waw/contracts` (TypeScript DTOs, Zod schemas, typed REST client)
*   **AI**: `@google/genai` (`gemini-4-hydrogen`) strictly server-side in `apps/dashboard/src/app/api/v1/ai/*`

## Coding Conventions

*   Always use updated library documentation (Next.js 16 `proxy.ts` & async route params, Astro 7.4, Tailwind CSS v4, Drizzle ORM).
*   Verify changes with `npm run build` and `npm run lint` across all workspaces.
