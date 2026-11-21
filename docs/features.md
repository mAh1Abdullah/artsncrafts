# Platform Features

## 1. Customer Storefront (`apps/storefront` — Astro 7.4 · Port `4321`)

- **Editorial Artisan Storefront (`/`)**: Warm craft-focused showcase with live category filters, instant search, price/rating sorting, and currency toggle (`৳ BDT` / `$ USD`).
- **Product Detail & Bespoke Customizer (`/products/[id]`)**: Live workshop stock levels, artisan personalization options (engraving, kiln finish, loom hem), craft lead times, and verified collector reviews with live submission.
- **Verified Artisan Studios (`/shops/[slug]`)**: Dedicated studio profile pages displaying workshop location, craft specialty, COD policy, and studio-specific catalog.
- **Express Cart & Checkout Drawer**: Real-time coupon validation (`POST /api/v1/coupons/validate`), Bangladesh delivery zone tariff selection, bKash/Nagad/SSLCommerz/COD checkout, and `Idempotency-Key` protected order submission (`POST /api/v1/orders`).
- **Bespoke Craft Advisor (AI)**: Server-proxied Gemini 4 Hydrogen consultation modal matching buyer gift ideas to authentic Bangladeshi craft clusters and materials.
- **Raw Materials Wholesale (`/raw-materials`)**: B2B craft material sourcing with MOQ enforcement and online-only wholesale PO checkout (`POST /api/v1/wholesale-orders`).
- **Artisan Onboarding (`/sell`)**: Public workshop application portal writing directly to the Marketplace Admin approval queue (`POST /api/v1/vendors`).
- **Collector Account (`/account`)**: Live order history with courier tracking codes, saved wishlist, store wallet credit, buyer trust/COD standing, and saved addresses.

---

## 2. Operations & Merchant Platform (`apps/dashboard` — Next.js 16 · Port `3000`)

- **Operations Command Hub (`/`)**: Executive overview of GMV, unified catalog SKUs, low-stock alerts, moderation queue depth, pending payouts, and workspace launchers.
- **WAW-POS Offline-First Register (`/pos`)**: Touch-friendly retail checkout, barcode scanner lookup, thermal receipt generation, split/multi-method tender, expenses, P&L financial analytics, reseller hub, and IndexedDB offline queue with background sync (`POST /api/v1/sync`).
- **Stock Audit Console (`/pos/inventory`)**: Bulk stock resets/adjustments, reorder level management, barcode label printing, and full stock movement audit logs.
- **Artisan Seller Studio (`/seller`)**: Publish new listings directly into the unified PostgreSQL/POS catalog, draft editorial copy via Gemini 4 Hydrogen (`POST /api/v1/ai/product-story`), advance order fulfillment statuses, inspect payout ledgers, and configure shop settings.
- **Marketplace Governance & Admin (`/admin`)**: Approve/suspend artisan studios, moderate product listings and collector reviews, create platform promo coupons, approve/mark paid vendor settlements, and audit every governance action.
- **Shipping & Logistics Console (`/shipping`)**: Edit Bangladesh delivery zone tariffs, run the Pathao/Steadfast/RedX courier scoring simulator, book consignments manually, and append live tracking scan events.
