# Data Models & PostgreSQL Schema Ownership

All relational database schemas live exclusively in **`apps/dashboard/src/lib/db/schema.ts`** using Drizzle ORM (`drizzle-orm/pg-core`) targeting PostgreSQL (Neon Serverless). The Astro storefront (`apps/storefront`) never accesses the database directly; it exchanges JSON DTOs defined in `@waw/contracts` over REST.

---

## 1. Core POS & Multi-Tenant Retail Tables

- **`tenants`**: Multi-tenant workspace metadata (`id`, `name`, `slug`, `currency`, `timezone`).
- **`stores`**: Physical branch locations (`id`, `tenant_id`, `name`, `code`, `is_main_branch`).
- **`tenant_subscriptions`**: SaaS tier (`starter` / `pro` / `enterprise`), branch limits, and enabled modules JSON.
- **`categories`**: Product category taxonomy per tenant.
- **`products`**: Unified SKU catalog shared across WAW-POS and The Artisan's Market (`id`, `tenant_id`, `store_id`, `vendor_id`, `sku`, `barcode`, `unit_cost`, `selling_price`, `current_stock`, `reorder_level`, `is_synced_to_ecommerce`).
- **`store_inventory`**: Per-branch stock quantities.
- **`sales` & `sale_items`**: Completed POS and mirrored storefront transactions with itemized COGS and payment method.
- **`expenses`**: Store operating expenses categorized by type and recorder.
- **`stock_audit_logs`**: Immutable ledger of every stock delta (`restock`, `damage_waste`, `physical_count`, `return_restock`, `theft_loss`, `correction`).
- **`api_keys` & `sync_events`**: External channel integration credentials and sync history.

---

## 2. Marketplace, Vendor & Governance Tables (Consolidated into `apps/dashboard`)

- **`vendor_profiles`**: Artisan studios (`public_slug`, `display_name`, `status` workflow: `draft → submitted → under_review → approved | rejected | suspended`, `craft_specialty`, `workshop_location`, `allow_cod`).
- **`coupons`**: Platform and vendor promo codes (`code`, `discount_type`, `discount_value`, `min_order_bdt`, `max_discount_cap_bdt`, `usage_limit`, `usage_count`).
- **`user_trust_profiles`**: Buyer trust score (`0–100`), risk level (`low | medium | high`), and COD eligibility flags.
- **`admin_audit_logs`**: Immutable governance trail capturing every admin decision (`actor`, `action`, `entity_type`, `entity_id`, `reason`).

---

## 3. Payments, Wallets & Vendor Settlements

- **`payment_attempts` & `payments`**: Gateway initiation (`bkash`, `nagad`, `uddoktapay`, `amarpay`, `sslcommerz`, `cod`) and verified capture states.
- **`payment_provider_events`**: Idempotent webhook audit records keyed by `(provider, provider_event_id)`.
- **`refunds`**: Full or partial refund requests linked to payment records.
- **`wallet_accounts` & `wallet_transactions`**: Buyer store-credit wallets with append-only credit/debit ledger entries.
- **`vendor_settlements` & `vendor_payout_accounts`**: Periodic artisan payout cycles (`gross_amount_bdt`, `commission_bdt`, `net_amount_bdt`, `status`, masked bKash/bank payout destinations).

---

## 4. Wholesale Raw Materials (B2B Craft Supply)

- **`raw_materials`**: Bulk craft supply listings (`category`, `price_bdt`, `unit`, `moq`, `stock_quantity`, `status`).
- **`wholesale_orders`**: B2B artisan purchase orders enforcing MOQ validation and online-only prepayment.

---

## 5. Shipping, Bangladesh Zones & Customer Engagement

- **`user_addresses`**: Saved collector shipping addresses across Bangladeshi divisions/districts.
- **`delivery_zones`**: Regional delivery tariffs (`dhaka_metro`, `outside_dhaka`, `remote_area`) with min/max ETA days.
- **`courier_providers`**: Integrated Bangladesh logistics carriers (`pathao`, `steadfast`, `redx`).
- **`shipments` & `shipment_events`**: Consignment bookings with append-only tracking event timelines.
- **`wishlist_items`**, **`product_reviews`**, **`notifications`**, and **`user_style_profiles`**: Collector engagement and personalization models.
