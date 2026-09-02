# WAW POS - Data Models & Schema Design

This document outlines the expanded data models for the POS application, which will be implemented using Cloudflare D1 and Drizzle ORM to support multi-tenancy, inventory tracking, expenses, multi-vendor architecture, local Bangladeshi payment gateways, and logistics.

## Stores / Tenants
* `id` (UUID / Primary Key)
* `name` (String)
* `subscription_tier` (Enum: `starter`, `pro`, `enterprise`)
* `subscription_status` (Enum: `active`, `suspended`, `trial`)
* `active_modules` (JSON / Text, tracks enabled feature flags)
* `created_at` (Timestamp)

## Users / Staff
* `id`: TEXT (Primary Key, UUID)
* `store_id` (Foreign Key to Stores)
* `name`: TEXT (User's full name)
* `email`: TEXT (Unique identifier / login)
* `role`: TEXT (Enum: `admin`, `store_manager`, `cashier`, `vendor`)
* `created_at`: INTEGER (Unix timestamp)

## Product
Represents an inventory item.
- `id`: TEXT (Primary Key, UUID)
- `store_id` (Foreign Key to Stores)
- `vendor_id`: TEXT (Foreign Key to Users / Vendors, Nullable for multi-vendor support)
- `name`: TEXT (Product name, e.g., "Milk")
- `description`: TEXT (Optional, e.g., "Full cream milk")
- `sku`: TEXT (Stock Keeping Unit, unique identifier)
- `barcode`: TEXT (String, Nullable)
- `category_id`: TEXT (Foreign Key, Optional)
- `brand`: TEXT (String, Optional for brand/SEO module)
- `unit_price`: REAL (Cost price of the item)
- `selling_price`: REAL (Selling price of the item)
- `current_stock`: INTEGER (Current quantity in stock)
- `reorder_level`: INTEGER (Threshold for low stock alert)
- `created_at`: INTEGER (Unix timestamp)
- `updated_at`: INTEGER (Unix timestamp)

## Sale
Represents an offline or POS sales transaction.
- `id`: TEXT (Primary Key, UUID)
- `store_id` (Foreign Key to Stores)
- `cashier_id`: TEXT (Foreign Key to Users)
- `transaction_date`: INTEGER (Unix timestamp of the sale)
- `total_amount`: REAL (Total amount of the sale)
- `payment_method`: TEXT (e.g., "Cash", "Card", "UPI", "bKash")
- `status`: TEXT (e.g., "completed", "refunded", "pending")
- `created_at`: INTEGER (Unix timestamp)
- `updated_at`: INTEGER (Unix timestamp)

## SaleItem
Represents an item within a sales transaction (junction table for Sale and Product).
- `id`: TEXT (Primary Key, UUID)
- `sale_id`: TEXT (Foreign Key to Sale)
- `product_id`: TEXT (Foreign Key to Product)
- `quantity`: INTEGER (Quantity of the product sold in this transaction)
- `price_at_sale`: REAL (Selling price of the product at the time of sale)

## Expense
Represents a business expense.
- `id`: TEXT (Primary Key, UUID)
- `store_id` (Foreign Key to Stores)
- `expense_date`: INTEGER (Unix timestamp of the expense)
- `category`: TEXT (e.g., "Rent", "Utilities", "Supplies", "Salaries")
- `amount`: REAL (Amount of the expense)
- `description`: TEXT (Optional, details about the expense)
- `created_at`: INTEGER (Unix timestamp)
- `updated_at`: INTEGER (Unix timestamp)

## E-Commerce Orders & Transactions (Online/Integrated)
* `id`: TEXT (Primary Key, UUID)
* `store_id` (Foreign Key to Stores)
* `customer_id`: TEXT (Foreign Key to Customers, Nullable)
* `total_amount`: REAL (Decimal / Integer)
* `advance_amount`: REAL (Customer advance partial payment tracking)
* `due_balance`: REAL (Remaining unpaid balance for partial payments)
* `payment_method`: TEXT (String: `cash`, `card`, `bkash`, `nagad`, `uddoktapay`, `amarpay`, `cod`)
* `payment_status`: TEXT (String: `paid`, `partial`, `unpaid`)
* `status` (String: `completed`, `refunded`, `pending`, `incomplete`, `cancelled`)
* `courier_service`: TEXT (String: `pathao`, `steadfast`, Nullable)
* `tracking_code`: TEXT (Courier tracking reference, Nullable)
* `fraud_risk_score`: REAL (Automated risk evaluation score, Nullable)
* `created_at`: INTEGER (Timestamp)

## Order Items
* `id`: TEXT (Primary Key, UUID)
* `order_id`: TEXT (Foreign Key to Orders)
* `product_id`: TEXT (Foreign Key to Products)
* `quantity`: INTEGER
* `unit_price`: REAL

## Abandoned Carts / Incomplete Orders
* `id`: TEXT (Primary Key, UUID)
* `store_id` (Foreign Key to Stores)
* `customer_phone`: TEXT (String)
* `cart_data`: TEXT (JSON string of items left in cart)
* `recovery_status`: TEXT (Enum: `pending`, `recovered`, `lost`)
* `created_at`: INTEGER (Timestamp)
