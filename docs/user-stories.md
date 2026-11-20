# User Stories

## 1. Storefront Shopper (Artisans Market — `/`)

- **US-SF-01 Curated Browsing**: As a shopper, I want to browse handcrafted goods filtered by craft category and heritage workshop, and switch between BDT and USD pricing, so I can discover authentic pieces in my preferred currency.
- **US-SF-02 Piece Customization**: As a shopper, I want to choose craft finishes, sizes, or gift wrapping inside a quick-view modal and see updated pricing and real-time stock before adding to my bag.
- **US-SF-03 Localized Checkout**: As a customer in Bangladesh, I want to pay via bKash, Nagad, AmarPay, or Cash on Delivery and immediately receive an order confirmation synced with the merchant's backend.
- **US-SF-04 Live Shipment Tracking**: As a customer, I want to track my placed order's fulfillment status directly from the storefront without contacting support.

---

## 2. Retail Cashier (WAW-POS — `/pos`)

- **US-POS-01 Barcode Checkout**: As a cashier, I want to scan product barcodes or enter SKUs so items are added instantly to the active ticket.
- **US-POS-02 Tender & Change Calculation**: As a cashier, I want quick cash denomination chips and automatic change calculation so I can complete transactions rapidly and accurately.
- **US-POS-03 Thermal Receipt Printing**: As a cashier, I want to switch between 80mm and 58mm thermal layouts and print customer copies immediately after checkout.
- **US-POS-04 Uninterrupted Offline Selling**: As a cashier during an internet outage, I want sales to save safely to IndexedDB and sync automatically to the database when connectivity returns.
- **US-POS-05 Cash Drawer Reconciliation**: As a cashier ending my shift, I want to enter my counted physical cash and verify any surplus or shortage against expected cash sales.

---

## 3. Store Manager (WAW-POS — `/pos` & `/pos/inventory`)

- **US-MGR-01 Multi-Store Transfers**: As a store manager, I want to transfer units between the Sylhet Flagship, Amberkhana Branch, and Dhaka Warehouse so stock balances stay accurate per outlet.
- **US-MGR-02 Bulk Inventory Maintenance**: As a store manager, I want to select multiple SKUs and batch-update stock levels or print Code128 shelf labels in one workflow.
- **US-MGR-03 Audit Trail Inspection**: As a store manager, I want to open `/pos/inventory` to audit every stock adjustment, storefront order deduction, and restock event with timestamps and responsible users.
- **US-MGR-04 Online Order Fulfillment**: As a store manager, I want to review incoming Artisans Market and e-commerce orders inside the E-Commerce & Logistics tab and coordinate courier dispatch.

---

## 4. Business Owner / Admin (WAW-POS — `/pos`)

- **US-OWN-01 Real-Time P&L Visibility**: As an owner, I want live Gross Revenue, COGS, Gross Margin, Expense totals, and Net Profit calculations—with CSV export—so I can monitor profitability at any time.
- **US-OWN-02 Role & Cost Protection**: As an owner, I want wholesale unit costs, financial P&L reports, and batch product deletion restricted from cashiers while allowing them full register access.
- **US-OWN-03 Modular Subscription Controls**: As an owner, I want to enable or upgrade modules (Barcode Printing, E-Commerce Bridge, Multi-Branch Network, Shift Auditing) as my retail network scales.
- **US-OWN-04 Reseller Growth Management**: As an owner, I want a dedicated Resellers & Growth hub to onboard retail partners and monitor distribution channels.
