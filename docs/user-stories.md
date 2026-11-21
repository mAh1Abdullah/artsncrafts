# User Stories

## Collectors & Shoppers (Astro 7.4 Storefront — `:4321`)
- As a collector, I can browse Bangladeshi heritage crafts by category, search by technique or workshop, switch between BDT and USD, and inspect real-time workshop stock.
- As a gift buyer, I can customize eligible pieces (base engraving, kiln finish, loom hem) and consult the AI Craft Advisor for tailored recommendations.
- As a shopper, I can apply verified promo coupons, choose a Bangladesh delivery zone, pay via bKash/Nagad/Card/COD, and track my consignment from `/account`.

## Artisan Workshops & Sellers (`apps/storefront/sell` + `apps/dashboard/seller`)
- As a craft workshop, I can apply to join the marketplace via `/sell` and source bulk clay, yarn, timber, silver wire, and eco-packaging with MOQ pricing on `/raw-materials`.
- As an approved artisan, I can open `/seller` in Next.js 16 to publish listings synced to WAW-POS, generate editorial product stories with Gemini 4 Hydrogen, advance order fulfillment, and review bi-weekly payout settlements.

## Retail Cashiers & Store Managers (`apps/dashboard/pos` & `/pos/inventory`)
- As a cashier, I can ring up in-store sales even when internet connectivity drops, printing thermal receipts and letting IndexedDB background sync push transactions to PostgreSQL automatically upon reconnect.
- As a store manager, I can audit every stock change, print SKU barcode labels, track store expenses, and review live P&L reports.

## Marketplace Admins & Logistics Operators (`apps/dashboard/admin` & `/shipping`)
- As an admin, I can approve or suspend artisan studio applications, moderate product listings and collector reviews, issue platform coupons, release vendor settlements, and inspect immutable audit logs.
- As a logistics operator, I can adjust Bangladesh delivery zone tariffs, evaluate optimal Pathao/Steadfast/RedX routing, book consignments, and append tracking scan events.
