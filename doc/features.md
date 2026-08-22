# WAW POS - Feature Roadmap

## Core Features: Core POS & Register (Starter Tier)
- Product catalog management (CRUD operations via Drizzle/SQLite).
- Fast checkout register interface with cart calculation and subtotal/tax/discount handling.
- Basic cash payment processing and receipt formatting.
- **Product Management:** Add, edit, delete products with details like name, description, price, SKU, unit cost, current stock, and reorder level.
- **Stock Management:** Track current stock levels, set reorder levels, and receive automated low stock alerts.
- **Sales Transaction:** Record sales, including multiple items, quantities, and prices. Support for different payment methods (cash, card, UPI).
- **Expense Logging:** Categorize and record all business expenses with date, amount, and description.
- **Comprehensive Reporting:** Generate detailed sales, expense, and inventory reports with various metrics and breakdowns.
- **Data Export:** Export all reports in both CSV and formatted PDF formats.

## Inventory & Barcode Integration (Pro Tier)
* Barcode scanner integration (supporting Code128 and EAN formats).
* Real-time stock updates and low-stock indicators.
* Product categorization and search filtering.

## PWA & Offline Capabilities:
- **Offline-first Support:** The application will be designed to function offline, allowing users to continue recording sales and expenses without an active internet connection.
- **Background Sync:** Data recorded offline will automatically synchronize with the Cloudflare D1 database once an internet connection is re-established.
- **Conflict Resolution:** A strategy for handling data conflicts during synchronization will be considered (e.g., last-write wins, user prompt).
  
## User Interface (UI) Flow Considerations:
- **Intuitive Navigation:** Clear and consistent navigation across all sections (Inventory, Sales, Expenses, Reports).
- **Streamlined Sales Process:** A quick and efficient interface for recording sales, minimizing clicks and data entry.
- **Data Entry Forms:** User-friendly forms with clear labels, input validation, and helpful hints.
- **Report Visualization:** Clear and readable presentation of reports, potentially with simple charts for trends.
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
