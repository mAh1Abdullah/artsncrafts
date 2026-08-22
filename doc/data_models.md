# WAW POS - Data Models & Schema Design

This document outlines the initial data models for the POS application, which will be implemented using Cloudflare D1 and Drizzle ORM.
## Stores / Tenants
* `id` (UUID / Primary Key)
* `name` (String)
* `subscription_tier` (Enum: `starter`, `pro`, `enterprise`)
* `subscription_status` (Enum: `active`, `suspended`, `trial`)
* `created_at` (Timestamp)

## Product
Represents an inventory item.
- `id`: TEXT (Primary Key, UUID)
- `store_id` (Foreign Key to Stores)
- `name`: TEXT (Product name, e.g., "Milk")
- `description`: TEXT (Optional, e.g., "Full cream milk")
- `sku`: TEXT (Stock Keeping Unit, unique identifier)
- `barcode`: (String, Nullable)
- `category_id`: (Foreign Key, Optional)
- `unit_price`: REAL (Cost price of the item)
- `selling_price`: REAL (Selling price of the item)
- `current_stock`: INTEGER (Current quantity in stock)
- `reorder_level`: INTEGER (Threshold for low stock alert)
- `created_at`: INTEGER (Unix timestamp)
- `updated_at`: INTEGER (Unix timestamp)


## Sale
Represents a sales transaction.
- `id`: TEXT (Primary Key, UUID)
- `transaction_date`: INTEGER (Unix timestamp of the sale)
- `total_amount`: REAL (Total amount of the sale)
- `payment_method`: TEXT (e.g., "Cash", "Card", "UPI")
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
- `expense_date`: INTEGER (Unix timestamp of the expense)
- `category`: TEXT (e.g., "Rent", "Utilities", "Supplies", "Salaries")
- `amount`: REAL (Amount of the expense)
- `description`: TEXT (Optional, details about the expense)
- `created_at`: INTEGER (Unix timestamp)
- `updated_at`: INTEGER (Unix timestamp)

## Orders / Transactions
* `id` (Primary Key)
* `store_id` (Foreign Key to Stores)
* `cashier_id` (Foreign Key to Users)
* `total_amount` (Decimal / Integer)
* `payment_method` (String: `cash`, `card`, `external`)
* `status` (String: `completed`, `refunded`, `pending`)
* `created_at` (Timestamp)

## Order Items
* `id` (Primary Key)
* `order_id` (Foreign Key to Orders)
* `product_id` (Foreign Key to Products)
* `quantity` (Integer)
* `unit_price` (Decimal / Integer)
