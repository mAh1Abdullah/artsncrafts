# WAW POS - Project Requirements

## Core Objective
To build a high-performance, lightweight, and versatile Point of Sale (POS) system designed for retail environments, offering modular features and seamless integration capabilities for third-party e-commerce platforms.

## Key Functional Requirements
1. **Multi-Tenancy & Store Isolation:** Support multiple independent stores/subscribers within a single deployment, ensuring data isolation via strict `store_id` scoping.
2. **Modular Architecture:** Enable or disable features (Inventory, Barcodes, Multi-Store, E-Commerce Sync) dynamically based on active subscription tiers.
3. **Third-Party E-Commerce Integration:** Provide secure REST/GraphQL API endpoints and webhook triggers to sync physical POS sales with external platforms (Shopify, WooCommerce, custom sites).
4. **Fast-Paced Checkout Register:** Provide an optimized, keyboard- and barcode-friendly checkout interface with quick cash/card tender options and receipt generation.
5. **Inventory & Stock Tracking:** Real-time stock decrementing, low-stock alerts, and multi-location inventory support.

### Inventory Management:
- The system shall allow adding new inventory items with details such as name, description, SKU, unit price, selling price, and initial stock quantity.
- The system shall allow updating existing inventory item details.
- The system shall allow tracking stock levels for each item.
- The system shall alert the user when stock for an item falls below a predefined reorder level.
- The system shall support searching and filtering inventory items.

### Expense Tracking:
- The system shall allow recording various business expenses with details such as date, category, amount, and description.
- The system shall allow categorizing expenses (e.g., rent, utilities, supplies).
- The system shall provide a summary of expenses over a selected period.

### Sales Directory:
- The system shall allow recording sales transactions, including items sold, quantity, price, and total amount.
- The system shall automatically update inventory levels after a sale.
- The system shall allow searching and viewing past sales transactions.
- The system shall support different payment methods (e.g., cash, card, UPI).

### Reporting:
- The system shall generate daily, weekly, and monthly sales reports, including:
    - Total sales amount
    - Sales by product (quantity and revenue)
    - Top-selling products
    - Average transaction value
- The system shall generate daily, weekly, and monthly expense reports, including:
    - Total expenses by category
    - Breakdown of expenses over time
- The system shall generate inventory reports, including:
    - Low stock items
    - Current stock value
    - Stock movement (in/out)
- All reports shall be exportable in CSV and PDF formats, with clear formatting and summaries.

### E-Commerce & Multi-Vendor Management:
- The system shall support single and multi-vendor website architectures for independent local merchants under a unified ecosystem.
- The system shall support promotional landing pages and marketing campaign systems with conversion tracking.
- The system shall include a reseller program module to track affiliate and partner sales commissions.
- The system shall support SEO-friendly blog and brand management modules.

### Localized Bangladeshi Checkout Intelligence & Payments:
- The system shall integrate local mobile financial services and payment aggregators: **bKash**, **Nagad**, **UddoktaPay**, and **AmarPay**, alongside a manual payment gateway fallback (e.g., Cash on Delivery or bank transfer).
- The system shall support customer advance partial payments and track due balances natively.
- The system shall log abandoned carts and incomplete checkouts for automated recovery follow-ups.
- The system shall feature an automated fraud-checking risk evaluation system to flag suspicious orders.

### Logistics, SMS, & Live Tracking Automation:
- The system shall integrate directly with **Pathao** and **Stedfast Courier** APIs for one-click parcel booking and status synchronization.
- The system shall provide real-time order and courier shipment tracking.
- The system shall integrate with local bulk SMS API gateways to facilitate customer **OTP order verification** during checkout and automated **Admin Order SMS Notifications**.

### Error Handling and Validation:
- The system shall validate all user inputs to prevent incorrect data entry (e.g., non-numeric values for price/quantity, negative stock).
- The system shall provide clear and user-friendly error messages for invalid inputs or failed operations.
- The system shall handle database errors gracefully and inform the user appropriately.
- The system shall prevent actions that would lead to inconsistent data (e.g., selling more items than available in stock).

## Non-Functional Requirements:
- **Usability:** The application shall have an intuitive and user-friendly interface.
- **Performance:** The application shall be responsive and handle typical daily operations efficiently.
- **Reliability:** The application shall be stable and minimize data loss, featuring PWA offline-first capabilities and background sync.
- **Security:** Sensitive data (e.g., sales records, tenant credentials) shall be protected via secure token-based authentication and API gateways.
- **Maintainability:** The codebase shall be well-structured and easy to maintain.
- **Scalability:** The application should be able to handle a growing number of inventory items, transactions, and multi-tenant stores.
