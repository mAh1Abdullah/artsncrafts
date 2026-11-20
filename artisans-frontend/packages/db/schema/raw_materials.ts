/**
 * Phase 8 — Database Schema: Raw Materials Domain
 * Drizzle ORM definitions for Raw Materials Wholesale Catalogue and Supplier Orders.
 */

import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export type RawMaterialCategory = 'Beads' | 'Yarn' | 'Clay' | 'Wood' | 'Leather' | 'Metals' | 'Packaging';
export type RawMaterialStatus = 'active' | 'inactive' | 'out_of_stock';
export type WholesaleOrderStatus = 'pending' | 'accepted' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// 1. Raw Materials Catalogue
export const rawMaterials = pgTable('raw_materials', {
  id: text('id').primaryKey(), // cuid2
  wholesalerVendorProfileId: text('wholesaler_vendor_profile_id').notNull(),
  name: text('name').notNull(),
  category: text('category').$type<RawMaterialCategory>().notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  unit: text('unit').notNull(), // 'pack' | 'spool' | 'bag' | 'set' | 'kg'
  moq: integer('moq').notNull().default(10), // minimum order quantity
  stockQuantity: integer('stock_quantity').notNull().default(0),
  status: text('status').$type<RawMaterialStatus>().notNull().default('active'),
  images: jsonb('images').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Wholesale Orders
export const wholesaleOrders = pgTable('wholesale_orders', {
  id: text('id').primaryKey(), // cuid2
  buyerVendorProfileId: text('buyer_vendor_profile_id').notNull(),
  supplierVendorProfileId: text('supplier_vendor_profile_id').notNull(),
  rawMaterialId: text('raw_material_id').notNull(),
  materialName: text('material_name').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  status: text('status').$type<WholesaleOrderStatus>().notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('bkash'), // Online payment only (no COD)
  shippingAddressSnapshot: jsonb('shipping_address_snapshot').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
