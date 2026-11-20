/**
 * Phase 9 — Database Schema: Shipping, Delivery Zones & Courier Integration Domain
 */

import { pgTable, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. User Saved Addresses
export const userAddresses = pgTable('user_addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  label: text('label').notNull().default('Home'), // 'Home' | 'Work' | 'Workshop'
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  addressLine: text('address_line').notNull(),
  upazilaThana: text('upazila_thana').notNull(),
  district: text('district').notNull(),
  division: text('division').notNull(),
  postalCode: text('postal_code').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 2. Vendor Pickup Addresses
export const vendorPickupAddresses = pgTable('vendor_pickup_addresses', {
  id: text('id').primaryKey(),
  vendorProfileId: text('vendor_profile_id').notNull(),
  pickupPointName: text('pickup_point_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  contactPhone: text('contact_phone').notNull(),
  addressLine: text('address_line').notNull(),
  upazilaThana: text('upazila_thana').notNull(),
  district: text('district').notNull(),
  division: text('division').notNull(),
  postalCode: text('postal_code').notNull(),
  isPrimary: boolean('is_primary').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 3. Delivery Locations (Platform-Normalized)
export const deliveryLocations = pgTable('delivery_locations', {
  id: text('id').primaryKey(),
  division: text('division').notNull(),
  district: text('district').notNull(),
  upazilaThana: text('upazila_thana').notNull(),
  postalCode: text('postal_code'),
  isRemote: boolean('is_remote').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 4. Delivery Zones
export const deliveryZones = pgTable('delivery_zones', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // 'dhaka_metro' | 'outside_dhaka' | 'remote_area'
  name: text('name').notNull(), // 'Dhaka Metro' | 'Outside Dhaka' | 'Remote Area'
  basePriceCents: integer('base_price_cents').notNull(),
  estimatedDeliveryDaysMin: integer('estimated_delivery_days_min').notNull(),
  estimatedDeliveryDaysMax: integer('estimated_delivery_days_max').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 5. Delivery Zone Locations (Many Locations -> One Zone)
export const deliveryZoneLocations = pgTable('delivery_zone_locations', {
  id: text('id').primaryKey(),
  zoneId: text('zone_id').notNull(),
  deliveryLocationId: text('delivery_location_id').notNull(),
});

// 6. Courier Providers Directory
export const courierProviders = pgTable('courier_providers', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // 'pathao' | 'redx' | 'steadfast'
  name: text('name').notNull(), // 'Pathao Logistics' | 'RedX Delivery' | 'Steadfast Courier'
  supportsCod: boolean('supports_cod').notNull().default(true),
  avgDeliveryHours: integer('avg_delivery_hours').notNull(),
  apiEndpoint: text('api_endpoint').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 7. Courier Service Areas
export const courierServiceAreas = pgTable('courier_service_areas', {
  id: text('id').primaryKey(),
  courierProviderId: text('courier_provider_id').notNull(),
  deliveryLocationId: text('delivery_location_id').notNull(),
  isPickupAvailable: boolean('is_pickup_available').notNull().default(true),
  isDeliveryAvailable: boolean('is_delivery_available').notNull().default(true),
  isCodAvailable: boolean('is_cod_available').notNull().default(true),
  surchargeCents: integer('surcharge_cents').notNull().default(0),
});

// 8. Shipments
export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(), // cuid2
  vendorOrderId: text('vendor_order_id').notNull(),
  courierProviderId: text('courier_provider_id').notNull(),
  courierName: text('courier_name').notNull(),
  trackingNumber: text('tracking_number').notNull(),
  shippingFeeCents: integer('shipping_fee_cents').notNull(),
  codAmountCents: integer('cod_amount_cents').notNull().default(0),
  status: text('status').notNull().default('booked'), // 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'returned'
  courierOverriddenByUserId: text('courier_overridden_by_user_id'),
  courierOverrideReason: text('courier_override_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 9. Shipment Items
export const shipmentItems = pgTable('shipment_items', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id').notNull(),
  orderItemId: text('order_item_id').notNull(),
  quantity: integer('quantity').notNull(),
});

// 10. Shipment Events (Append-Only Courier Tracking History)
export const shipmentEvents = pgTable('shipment_events', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id').notNull(),
  status: text('status').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  eventTimestamp: timestamp('event_timestamp').notNull().defaultNow(),
});

// 11. Delivery Suggestions (Audit & Recommendation Engine History)
export const deliverySuggestions = pgTable('delivery_suggestions', {
  id: text('id').primaryKey(),
  buyerAddressId: text('buyer_address_id'),
  deliveryLocationId: text('delivery_location_id').notNull(),
  recommendedCourierId: text('recommended_courier_id').notNull(),
  confidenceScore: integer('confidence_score').notNull(), // 0 to 100
  scoringBreakdown: jsonb('scoring_breakdown').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
