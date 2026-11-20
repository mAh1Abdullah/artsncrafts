/**
 * Phase 7 — Database Schema: Payments Domain
 * Drizzle ORM definitions for Payments, Payment Attempts, Provider Webhook Events,
 * Refunds, Wallets, Vendor Settlements & Payout Accounts.
 */

import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export type PaymentAttemptProvider = 'cod' | 'bkash' | 'sslcommerz';
export type PaymentAttemptStatus = 'created' | 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | 'cancelled';
export type RefundStatus = 'requested' | 'approved' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
export type RefundMethod = 'original_payment_source' | 'manual_bank_transfer' | 'mobile_wallet' | 'wallet_credit' | 'gift_credit';
export type SettlementStatus = 'draft' | 'pending_review' | 'approved' | 'paid' | 'cancelled';
export type SettlementLineType = 'sale' | 'commission' | 'refund_deduction' | 'adjustment' | 'shipping_fee';
export type PayoutMethod = 'bkash' | 'bank_transfer';

// 1. Payment Attempts (provider neutral)
export const paymentAttempts = pgTable('payment_attempts', {
  id: text('id').primaryKey(), // cuid2
  orderId: text('order_id').notNull(),
  provider: text('provider').$type<PaymentAttemptProvider>().notNull(),
  status: text('status').$type<PaymentAttemptStatus>().notNull().default('created'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('BDT'),
  gatewayReference: text('gateway_reference'),
  metadata: jsonb('metadata'), // e.g. bkash mobile number, SSLCommerz session key
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Authoritative Payments
export const payments = pgTable('payments', {
  id: text('id').primaryKey(), // cuid2
  paymentAttemptId: text('payment_attempt_id').notNull(),
  orderId: text('order_id').notNull(),
  provider: text('provider').$type<PaymentAttemptProvider>().notNull(),
  status: text('status').$type<PaymentStatus>().notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('BDT'),
  transactionId: text('transaction_id').notNull(), // e.g. TRX_BKASH_992104
  providerSignatureHash: text('provider_signature_hash'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 3. Payment Provider Webhook/Callback Event Ledger (Idempotent)
export const paymentProviderEvents = pgTable('payment_provider_events', {
  id: text('id').primaryKey(), // cuid2
  provider: text('provider').$type<PaymentAttemptProvider>().notNull(),
  eventType: text('event_type').notNull(), // e.g. 'bkash.payment.success', 'sslcommerz.ipn'
  eventId: text('event_id').notNull(), // Unique webhook ID from gateway
  rawPayload: jsonb('raw_payload').notNull(),
  signatureValid: boolean('signature_valid').notNull().default(false),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  uniqueProviderEvent: uniqueIndex('idx_provider_event_id').on(t.provider, t.eventId)
}));

// 4. Refunds (Requests and Execution)
export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(), // cuid2
  orderId: text('order_id').notNull(),
  paymentId: text('payment_id'),
  refundMethod: text('refund_method').$type<RefundMethod>().notNull().default('original_payment_source'),
  status: text('status').$type<RefundStatus>().notNull().default('requested'),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  approvedByUserId: text('approved_by_user_id'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 5. Item-Level Refund Details
export const refundItems = pgTable('refund_items', {
  id: text('id').primaryKey(), // cuid2
  refundId: text('refund_id').notNull(),
  orderItemId: text('order_item_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  amountCents: integer('amount_cents').notNull(),
});

// 6. Customer Wallet Accounts
export const walletAccounts = pgTable('wallet_accounts', {
  id: text('id').primaryKey(), // cuid2
  userId: text('user_id').notNull().unique(),
  balanceCents: integer('balance_cents').notNull().default(0),
  currency: text('currency').notNull().default('BDT'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 7. Wallet Transaction Ledger
export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(), // cuid2
  walletAccountId: text('wallet_account_id').notNull(),
  type: text('type').$type<'credit' | 'debit'>().notNull(),
  amountCents: integer('amount_cents').notNull(),
  balanceAfterCents: integer('balance_after_cents').notNull(),
  referenceType: text('reference_type').notNull(), // 'refund' | 'order_payment' | 'admin_adjustment'
  referenceId: text('reference_id').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 8. Vendor Settlements
export const vendorSettlements = pgTable('vendor_settlements', {
  id: text('id').primaryKey(), // cuid2
  vendorProfileId: text('vendor_profile_id').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  grossAmountCents: integer('gross_amount_cents').notNull(),
  commissionCents: integer('commission_cents').notNull(), // 10% platform commission
  netAmountCents: integer('net_amount_cents').notNull(),
  status: text('status').$type<SettlementStatus>().notNull().default('draft'),
  approvedByUserId: text('approved_by_user_id'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 9. Vendor Settlement Line Items
export const vendorSettlementItems = pgTable('vendor_settlement_items', {
  id: text('id').primaryKey(), // cuid2
  vendorSettlementId: text('vendor_settlement_id').notNull(),
  vendorOrderId: text('vendor_order_id').notNull(),
  lineType: text('line_type').$type<SettlementLineType>().notNull(),
  amountCents: integer('amount_cents').notNull(),
  note: text('note'),
});

// 10. Vendor Payout Accounts (Encrypted Details)
export const vendorPayoutAccounts = pgTable('vendor_payout_accounts', {
  id: text('id').primaryKey(), // cuid2
  vendorProfileId: text('vendor_profile_id').notNull(),
  payoutMethod: text('payout_method').$type<PayoutMethod>().notNull(),
  detailsEncrypted: text('details_encrypted').notNull(), // AES-256 encrypted payload
  maskedIdentifier: text('masked_identifier').notNull(), // e.g., "bKash *******5678" or "City Bank ****4321"
  isDefault: boolean('is_default').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
