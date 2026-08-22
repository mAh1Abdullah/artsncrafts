# WAW POS - Feature Roadmap

## Phase 1: Core POS & Register (Starter Tier)
* Product catalog management (CRUD operations via Drizzle/SQLite).
* Fast checkout register interface with cart calculation and subtotal/tax/discount handling.
* Basic cash payment processing and receipt formatting.

## Phase 2: Inventory & Barcode Integration (Pro Tier)
* Barcode scanner integration (supporting Code128 and EAN formats).
* Real-time stock updates and low-stock indicators.
* Product categorization and search filtering.

## Phase 3: Subscription Management & Access Control (SaaS Core)
* Tenant onboarding and subscription status verification.
* Feature-flag middleware to lock/unlock modules based on active subscription.
* Multi-user role permissions (Cashier vs. Store Manager).

## Phase 4: Headless Integration & Webhooks (Enterprise Tier)
* Public API gateway protected by secure token authentication.
* Outbound webhooks (`order.completed`, `inventory.adjusted`) for external e-commerce platforms.
* Multi-location inventory routing.