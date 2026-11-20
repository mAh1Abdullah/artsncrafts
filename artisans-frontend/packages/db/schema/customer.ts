/**
 * Phase 10 — Database Schema: Customer Engagement, Reviews, Wishlist, Notifications & Style Profiles
 */

import { pgTable, text, integer, timestamp, boolean, jsonb, unique } from 'drizzle-orm/pg-core';

// 1. Wishlist Items
export const wishlistItems = pgTable('wishlist_items', {
  id: text('id').primaryKey(), // cuid2
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userProductUnique: unique('wishlist_user_product_unique').on(t.userId, t.productId),
}));

// 2. Product Reviews (Verified Purchase Required)
export const productReviews = pgTable('product_reviews', {
  id: text('id').primaryKey(), // cuid2
  userId: text('user_id').notNull(),
  productId: text('product_id').notNull(),
  productVariantId: text('product_variant_id'),
  orderItemId: text('order_item_id').notNull(), // enforces verified purchase
  vendorProfileId: text('vendor_profile_id').notNull(),
  rating: integer('rating').notNull(), // 1 - 5
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('submitted'), // 'submitted' | 'approved' | 'rejected' | 'hidden'
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),
}, (t) => ({
  userOrderItemUnique: unique('review_user_order_item_unique').on(t.userId, t.orderItemId),
}));

// 3. Review Status Events (Append-Only Moderation Audit Log)
export const reviewStatusEvents = pgTable('review_status_events', {
  id: text('id').primaryKey(), // cuid2
  reviewId: text('review_id').notNull(),
  actionByUserId: text('action_by_user_id').notNull(),
  previousStatus: text('previous_status').notNull(),
  newStatus: text('new_status').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 4. Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(), // cuid2
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'order_placed' | 'order_shipped' | 'order_delivered' | 'review_request' | 'wishlist_restock' | 'vendor_approved' | 'vendor_rejected' | 'product_approved' | 'product_rejected' | 'seller_new_order' | 'payout_sent'
  title: text('title').notNull(),
  body: text('body').notNull(),
  entityType: text('entity_type'), // 'order' | 'product' | 'review' | 'payout'
  entityId: text('entity_id'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 5. Notification Deliveries
export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey(),
  notificationId: text('notification_id').notNull(),
  channel: text('channel').notNull(), // 'in_app' | 'email' | 'sms'
  status: text('status').notNull().default('sent'), // 'pending' | 'sent' | 'failed'
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});

// 6. User Style Profiles (Optional Personalization Engine)
export const userStyleProfiles = pgTable('user_style_profiles', {
  id: text('id').primaryKey(), // cuid2
  userId: text('user_id').notNull().unique(),
  department: text('department'), // e.g. 'Women', 'Men', 'Home & Decor'
  sizeTops: text('size_tops'),
  sizeBottoms: text('size_bottoms'),
  sizeShoes: text('size_shoes'),
  preferences: jsonb('preferences'), // e.g. { favoriteCrafts: ['Jamdani', 'Pottery'], preferredColors: ['Earth Tone'] }
  consentVersion: text('consent_version').notNull().default('v1.0'),
  consentedAt: timestamp('consented_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
