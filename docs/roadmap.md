# Platform Roadmap

## Completed Milestones

- **Phase 1 — WAW-POS Core & Offline-First Engine**: Retail POS terminal, IndexedDB queue, background sync, barcode label printing, expenses, and financial P&L analytics.
- **Phase 2 — Turborepo Monorepo Migration**: Split repository into `apps/storefront` (`@waw/storefront`), `apps/dashboard` (`@waw/dashboard`), and `packages/contracts` (`@waw/contracts`).
- **Phase 3 — Next.js 16 & PostgreSQL Consolidation**: Upgraded backend to Next.js 16 (`proxy.ts`, flat ESLint 9, Turbopack) and consolidated all POS + Marketplace Drizzle PostgreSQL schemas strictly inside `apps/dashboard`.
- **Phase 4 — Industry-Standard REST v1 API**: Standardized all `/api/v1/*` routes with `{ data, meta }` envelopes, pagination, RFC 9457 `application/problem+json` errors, Zod validation, allowlisted CORS, and `Idempotency-Key` support.
- **Phase 5 — Astro 7.4 Storefront & Merchant Consoles**: Rewrote the customer marketplace in Astro 7.4 with React 19 islands, moved Seller Studio, Marketplace Admin, and Shipping Logistics into `apps/dashboard`, and integrated server-side Gemini 4 Hydrogen AI services.

## Upcoming Milestones

- **Phase 6 — Live Payment Gateway Webhooks**: Connect production bKash Tokenized Checkout, Nagad Merchant API, and SSLCommerz IPN verification backed by `payment_provider_events`.
- **Phase 7 — Production Auth & Session Federation**: Integrate multi-role authentication (Owner, Admin, Manager, Cashier, Artisan, Buyer) with HTTP-only session cookies across `:3000` and `:4321`.
- **Phase 8 — Live Courier API Dispatch**: Wire live Pathao Merchant API and Steadfast Consignment webhooks into `/api/v1/shipments`.
- **Phase 9 — Multi-Currency International Shipping**: Expand checkout with DHL/FedEx international rate tables for overseas Bangladeshi craft collectors.
