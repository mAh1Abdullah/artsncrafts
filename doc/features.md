# WAW POS - Feature Roadmap

## Core Features: Core POS & Register (Starter Tier)
- **Product Catalog Management:** Comprehensive CRUD operations for products (name, description, price, SKU, unit cost, current stock, reorder levels, and categories) via Drizzle/SQLite.
- **Fast Checkout Register Interface:** High-speed terminal with real-time cart calculation, subtotaling, tax management, and discount handling.
- **Flexible Payment Processing:** Support for basic cash processing, card, UPI, and manual payment options.
- **Expense & Purchase Logging:** Track and categorize all business expenditures and stock purchase intakes with dates, amounts, and descriptions.
- **Reporting & Data Export:** Generate detailed financial, sales, and inventory metrics with instant export capabilities in both CSV and formatted PDF formats.

## Inventory & Barcode Integration (Pro Tier)
- **Barcode Operations:** Full hardware barcode scanner integration supporting Code128 and EAN formats, paired with built-in barcode lookup and label printing tools.
- **Real-Time Stock Intelligence:** Live stock level updates, automated low-stock warnings, and historical audit logs.
- **Advanced Search & Filtering:** Quick product categorization, filtering, and lookup optimizations.

## PWA & Offline Capabilities
- **Offline-First Support:** Fully functional offline mode enabling uninterrupted sales and expense recording without an active internet connection.
- **Background Sync:** Automatic data synchronization with the Cloudflare D1 database once internet connectivity is restored.
- **Conflict Management:** Built-in strategies for data reconciliation during multi-device synchronization.

## Subscription Management & Access Control (SaaS Core)
- **Tenant Onboarding & Verification:** Automated store registration and subscription lifecycle checks (`Starter`, `Pro`, `Enterprise`).
- **Dynamic Feature-Flag Middleware:** Restrict or grant access to specific modules and UI elements based on the tenant's active subscription tier.
- **Role-Based Access Control (RBAC):** Granular permissions for distinct user roles (e.g., Administrator, Store Manager, Cashier).

## Headless Integration & Webhooks (Enterprise Tier)
- **Secure Public API Gateway:** Protected API endpoints utilizing token-based authentication for external platforms.
- **Outbound & Inbound Webhooks:** Real-time event hooks (`order.completed`, `inventory.adjusted`) to sync physical POS data with external e-commerce systems (Shopify, WooCommerce, custom apps).
- **Multi-Location Routing:** Manage inventory pools and routing across multiple physical business outlets.

## Localized Bangladesh E-Commerce & Logistics Add-ons
- **Single & Multi-Vendor Framework:** Architecture to support independent local merchant storefronts under a shared ecosystem.
- **Marketing & SEO Suite:** Built-in campaign landing page builders, reseller program commission tracking, and SEO-friendly blog/brand engines.
- **Local Payment Gateways:** Native support for popular Bangladeshi mobile financial services and payment aggregators: **bKash**, **Nagad**, **UddoktaPay**, and **AmarPay**, alongside a **Manual Payment Gateway** fallback (e.g., direct bank transfer or Cash on Delivery).
- **Checkout Intelligence:** Advanced tools including customer advance partial payments, abandoned cart logging, and automated fraud-risk checking.
- **Courier & Logistics Automation:** Direct integration with **Pathao** and **Stedfast Courier** APIs for one-click parcel booking and live shipment tracking.
- **Communication Suite:** Automated **Admin Order SMS Notifications** and customer **OTP Verification** via local bulk SMS API gateways.
- **Responsive Design:** The UI should adapt well to different screen sizes (desktop, tablet).

## \Subscription Management & Access Control (SaaS Core)
* Tenant onboarding and subscription status verification.
* Feature-flag middleware to lock/unlock modules based on active subscription.
* Multi-user role permissions (Cashier vs. Store Manager).
  
## Headless Integration & Webhooks (Enterprise Tier)
* Public API gateway protected by secure token authentication.
* Outbound webhooks (`order.completed`, `inventory.adjusted`) for external e-commerce platforms.
* Multi-location inventory routing.

## Future Enhancements (Potential):
- **User Management:** Multiple user accounts with different roles (e.g., admin, cashier).
- **Customer Management:** Track customer information and purchase history.
- **Supplier Management:** Manage supplier details and purchase orders.
- **Barcode Scanning:** Integrate with barcode scanners for faster product lookup.
- **Multi-store Support:** Manage inventory and sales across multiple business locations.
- **Cloud Sync:** Synchronize data across devices or to a cloud backup.
