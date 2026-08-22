# WAW POS - Data Models & Schema Design

## Stores / Tenants
* `id` (UUID / Primary Key)
* `name` (String)
* `subscription_tier` (Enum: `starter`, `pro`, `enterprise`)
* `subscription_status` (Enum: `active`, `suspended`, `trial`)
* `created_at` (Timestamp)

## Products
* `id` (Primary Key)
* `store_id` (Foreign Key to Stores)
* `name` (String)
* `sku` (String, Unique per store)
* `barcode` (String, Nullable)
* `price` (Decimal / Integer)
* `stock_quantity` (Integer)
* `category_id` (Foreign Key, Optional)

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