import { storageService } from './storage';
import { Coupon, CouponRedemption, CartItem } from '../types';
import { createCuid } from '../utils/cuid';

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
  discountAmountCents: number;
}

export class CouponService {
  public static getCoupons(): Coupon[] {
    return storageService.getCoupons();
  }

  public static getCouponByCode(code: string): Coupon | undefined {
    const cleanCode = code.trim().toUpperCase();
    return this.getCoupons().find(c => c.code.toUpperCase() === cleanCode);
  }

  public static getCouponRedemptions(couponId?: string, userId?: string): CouponRedemption[] {
    return storageService.getCouponRedemptions(couponId, userId);
  }

  /**
   * JSONB Rules Engine Evaluator
   * Evaluates eligibility and calculates exact discountAmountCents.
   */
  public static validate(
    code: string,
    userId: string,
    cartItems: CartItem[],
    subtotalCents: number
  ): CouponValidationResult {
    if (!code || !code.trim()) {
      return { valid: false, reason: 'Please enter a coupon promo code.', discountAmountCents: 0 };
    }

    const coupon = this.getCouponByCode(code);
    if (!coupon) {
      return { valid: false, reason: `Promo code '${code.trim().toUpperCase()}' is invalid.`, discountAmountCents: 0 };
    }

    if (coupon.status !== 'active') {
      return { valid: false, reason: `Coupon '${coupon.code}' is currently ${coupon.status}.`, discountAmountCents: 0 };
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return { valid: false, reason: `Coupon '${coupon.code}' is not yet active.`, discountAmountCents: 0 };
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return { valid: false, reason: `Coupon '${coupon.code}' has expired.`, discountAmountCents: 0 };
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, reason: `Coupon '${coupon.code}' usage limit has been reached.`, discountAmountCents: 0 };
    }

    const rules = coupon.rules;
    const cond = rules.conditions || {};

    // 1. Specific Vendor Condition
    if (cond.specific_vendor_id) {
      const vendorItems = cartItems.filter(item => item.vendorId === cond.specific_vendor_id);
      if (vendorItems.length === 0) {
        const vendor = storageService.getVendors().find(v => v.id === cond.specific_vendor_id);
        const name = vendor ? vendor.displayName : 'the designated workshop';
        return { 
          valid: false, 
          reason: `Coupon '${coupon.code}' is only valid for handcrafted items from ${name}.`, 
          discountAmountCents: 0 
        };
      }
    }

    // 2. Applicable Categories Condition
    if (cond.applicable_categories && cond.applicable_categories.length > 0) {
      const products = storageService.getProducts();
      const matchingItems = cartItems.filter(item => {
        if (item.itemType === 'product' && item.productId) {
          const prod = products.find(p => p.id === item.productId);
          return prod && cond.applicable_categories!.includes(prod.category);
        }
        return false;
      });

      if (matchingItems.length === 0) {
        return { 
          valid: false, 
          reason: `Coupon '${coupon.code}' is only valid for products in categories: ${cond.applicable_categories.join(', ')}.`, 
          discountAmountCents: 0 
        };
      }
    }

    // 3. First Order Only Condition
    if (cond.first_order_only) {
      const userOrders = storageService.getOrders().filter(o => o.buyerUserId === userId && o.status !== 'cancelled');
      if (userOrders.length > 0) {
        return { valid: false, reason: `Coupon '${coupon.code}' is reserved for first-time orders only.`, discountAmountCents: 0 };
      }
    }

    // 4. Max Uses Per User Condition
    if (cond.max_uses_per_user && cond.max_uses_per_user > 0) {
      const redemptions = storageService.getCouponRedemptions(coupon.id, userId);
      if (redemptions.length >= cond.max_uses_per_user) {
        return { 
          valid: false, 
          reason: `You have reached the limit of ${cond.max_uses_per_user} redemption(s) for coupon '${coupon.code}'.`, 
          discountAmountCents: 0 
        };
      }
    }

    // Calculate Eligible Subtotal
    let eligibleSubtotalCents = subtotalCents;
    if (cond.specific_vendor_id) {
      eligibleSubtotalCents = cartItems
        .filter(i => i.vendorId === cond.specific_vendor_id)
        .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
    } else if (cond.applicable_categories && cond.applicable_categories.length > 0) {
      const products = storageService.getProducts();
      eligibleSubtotalCents = cartItems
        .filter(item => {
          if (item.itemType === 'product' && item.productId) {
            const prod = products.find(p => p.id === item.productId);
            return prod && cond.applicable_categories!.includes(prod.category);
          }
          return false;
        })
        .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
    }

    // 5. Min Order Amount Condition
    if (cond.min_order_amount && eligibleSubtotalCents < cond.min_order_amount) {
      const minBdt = Math.round(cond.min_order_amount / 100);
      return { 
        valid: false, 
        reason: `Coupon '${coupon.code}' requires a minimum eligible subtotal of ৳${minBdt.toLocaleString()}.`, 
        discountAmountCents: 0 
      };
    }

    // Calculate Discount Amount
    let discountAmountCents = 0;
    if (rules.discount.type === 'percentage') {
      const percentage = rules.discount.value;
      const rawDiscount = Math.round((eligibleSubtotalCents * percentage) / 100);
      discountAmountCents = rawDiscount;

      if (cond.max_discount_cap && cond.max_discount_cap > 0) {
        discountAmountCents = Math.min(discountAmountCents, cond.max_discount_cap);
      }
    } else if (rules.discount.type === 'fixed') {
      discountAmountCents = rules.discount.value;
    }

    // Ensure discount does not exceed eligible subtotal
    discountAmountCents = Math.min(eligibleSubtotalCents, discountAmountCents);

    if (discountAmountCents <= 0) {
      return { valid: false, reason: 'Coupon does not yield any discount on your current cart items.', discountAmountCents: 0 };
    }

    return {
      valid: true,
      coupon,
      discountAmountCents
    };
  }

  /**
   * Applies validated coupon on order creation and records coupon_redemption.
   */
  public static apply(
    code: string,
    userId: string,
    orderId: string,
    discountAmountCents: number
  ): CouponRedemption {
    const coupon = this.getCouponByCode(code);
    if (!coupon) {
      throw new Error(`Coupon with code '${code}' not found.`);
    }

    const redemption: CouponRedemption = {
      id: createCuid('cpr_'),
      couponId: coupon.id,
      userId,
      orderId,
      discountAmountCents,
      createdAt: new Date().toISOString()
    };

    storageService.addCouponRedemption(redemption);

    storageService.addAuditLog(
      'coupon_redeemed',
      `Coupon '${coupon.code}' redeemed on order #${orderId} for ৳${Math.round(discountAmountCents / 100)} discount.`,
      'coupon',
      coupon.id,
      {
        metadata: {
          orderId,
          userId,
          discountAmountCents
        }
      }
    );

    return redemption;
  }

  /**
   * Creates a new coupon (Platform or Vendor).
   */
  public static createCoupon(
    couponData: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>,
    createdByUserId: string
  ): Coupon {
    const code = couponData.code.trim().toUpperCase();
    const existing = this.getCouponByCode(code);
    if (existing) {
      throw new Error(`A coupon with code '${code}' already exists.`);
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: createCuid('cpn_'),
      code,
      usageCount: 0,
      createdByUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.saveCoupon(newCoupon);

    storageService.addAuditLog(
      'coupon_created',
      `Created ${newCoupon.type} coupon '${newCoupon.code}' (${newCoupon.rules.discount.type === 'percentage' ? `${newCoupon.rules.discount.value}%` : `৳${Math.round(newCoupon.rules.discount.value / 100)}`})`,
      'coupon',
      newCoupon.id
    );

    return newCoupon;
  }

  /**
   * Updates an existing coupon.
   */
  public static updateCoupon(id: string, updates: Partial<Coupon>): Coupon {
    const coupons = this.getCoupons();
    const existing = coupons.find(c => c.id === id);
    if (!existing) {
      throw new Error(`Coupon not found.`);
    }

    const updated: Coupon = {
      ...existing,
      ...updates,
      code: updates.code ? updates.code.trim().toUpperCase() : existing.code,
      updatedAt: new Date().toISOString()
    };

    storageService.saveCoupon(updated);

    storageService.addAuditLog(
      'coupon_updated',
      `Updated coupon '${updated.code}' status to ${updated.status}`,
      'coupon',
      updated.id
    );

    return updated;
  }
}
