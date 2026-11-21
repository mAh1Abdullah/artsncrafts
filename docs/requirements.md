# System Requirements

## Functional Requirements

1. **Decoupled Storefront & Backend**:
   - The public storefront (`apps/storefront`) must run on Astro 7.4 (port `4321`) and rely exclusively on the Next.js 16 REST API (port `3000`) with zero direct database connections.
   - All operational consoles (WAW-POS, Stock Audit, Seller Studio, Marketplace Admin, Shipping Logistics) must live inside `apps/dashboard`.
2. **Unified Real-Time Inventory**:
   - Every product created in Seller Studio or WAW-POS is immediately available to the storefront catalog.
   - Storefront orders must validate stock availability (returning `409 Conflict` when insufficient), atomically deduct stock, create a stock audit entry, and mirror the transaction into the POS sales ledger.
3. **Offline-First Retail Continuity**:
   - The WAW-POS register must remain operable without network connectivity via Service Worker caching and IndexedDB queues, synchronizing reliably via idempotent `POST /api/v1/sync` once connectivity resumes.
4. **Industry-Standard REST API Contracts**:
   - All `/api/v1/*` endpoints must enforce plural resource paths, standard HTTP status codes, uniform `{ data, meta }` / `{ data, meta: { pagination } }` envelopes, RFC 9457 `application/problem+json` error payloads, Zod input validation, and `Idempotency-Key` protection on order and sync writes.

## Non-Functional Requirements

- **Security**:
  - `GEMINI_API_KEY` and `DATABASE_URL` remain strictly server-side inside `apps/dashboard`.
  - CORS allowlists only configured storefront origins (`STOREFRONT_ORIGIN`, default `http://localhost:4321`) with `Vary: Origin`.
  - Parameterized Drizzle ORM queries and strict Zod schema validation protect all write endpoints.
- **Performance**:
  - Astro ships minimal client JavaScript via targeted React 19 islands while Next.js 16 uses Turbopack and Server Components for fast dashboard rendering.
- **Observability**:
  - Every API response includes `X-Request-Id` and structured error codes for end-to-end traceability.
