import { storageService } from './storage';
import { UserTrustProfile, UserTrustEvent } from '../types';
import { createCuid } from '../utils/cuid';

export const DEFAULT_TRUST_SCORE = 50;
export const COD_ELIGIBILITY_THRESHOLD = 65;

export const STANDARD_TRUST_DELTAS: Record<string, { delta: number; label: string }> = {
  phone_verified: { delta: 10, label: 'Phone Number Verified' },
  first_purchase: { delta: 5, label: 'First Purchase Completed' },
  order_delivered: { delta: 3, label: 'Order Delivered Successfully' },
  cod_delivered: { delta: 5, label: 'COD Order Delivered & Paid' },
  cod_refused: { delta: -15, label: 'COD Order Refused / Uncollected' },
  refund_requested_legitimate: { delta: 0, label: 'Legitimate Refund Request' },
  refund_repeated: { delta: -5, label: 'Repeated Refund Requests' },
  admin_flagged: { delta: -20, label: 'Account Flagged by Moderation' },
  manual_adjustment: { delta: 0, label: 'Manual Admin Adjustment' }
};

export class TrustService {
  /**
   * Recalculates user trust score from the append-only log of user_trust_events.
   */
  public static evaluate(userId: string): UserTrustProfile {
    const events = storageService.getTrustEvents(userId);
    
    // Starting score is 50 / 100 (neutral) on account creation
    let score = DEFAULT_TRUST_SCORE;
    
    events.forEach(evt => {
      score += evt.scoreDelta;
    });

    // Clamp score strictly between 0 and 100
    score = Math.max(0, Math.min(100, score));

    const codEligible = score >= COD_ELIGIBILITY_THRESHOLD;
    const riskLevel: 'low' | 'medium' | 'high' = 
      score >= 75 ? 'low' : score >= 40 ? 'medium' : 'high';

    const profiles = storageService.getTrustProfiles();
    let profile = profiles.find(p => p.userId === userId);

    if (!profile) {
      profile = {
        id: createCuid('tp_'),
        userId,
        score,
        codEligible,
        riskLevel,
        manualReviewRequired: riskLevel === 'high',
        lastEvaluatedAt: new Date().toISOString()
      };
      profiles.push(profile);
    } else {
      profile.score = score;
      profile.codEligible = codEligible;
      profile.riskLevel = riskLevel;
      profile.manualReviewRequired = riskLevel === 'high';
      profile.lastEvaluatedAt = new Date().toISOString();
    }

    localStorage.setItem('artisan_market_trust_profiles', JSON.stringify(profiles));
    return profile;
  }

  /**
   * Appends a new trust event and immediately triggers evaluation.
   */
  public static addEvent(
    userId: string, 
    eventType: keyof typeof STANDARD_TRUST_DELTAS | string, 
    delta?: number, 
    reason?: string, 
    createdByUserId?: string
  ): { event: UserTrustEvent; profile: UserTrustProfile } {
    const standard = STANDARD_TRUST_DELTAS[eventType];
    const scoreDelta = delta !== undefined ? delta : (standard ? standard.delta : 0);
    const eventReason = reason || (standard ? standard.label : eventType);

    const events = storageService.getTrustEvents();
    const newEvent: UserTrustEvent = {
      id: createCuid('te_'),
      userId,
      eventType,
      scoreDelta,
      reason: createdByUserId ? `${eventReason} (By Admin ${createdByUserId})` : eventReason,
      createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    localStorage.setItem('artisan_market_trust_events', JSON.stringify(events));

    // Re-evaluate trust profile
    const updatedProfile = this.evaluate(userId);

    // Record audit log
    storageService.addAuditLog(
      'trust_event_added', 
      `Trust Event '${eventType}' (${scoreDelta > 0 ? '+' : ''}${scoreDelta}) recorded for user.`, 
      'trust', 
      userId,
      {
        publicMessage: `Trust score adjusted by ${scoreDelta > 0 ? '+' : ''}${scoreDelta}`,
        privateNote: eventReason
      }
    );

    return { event: newEvent, profile: updatedProfile };
  }

  /**
   * Evaluates Cash on Delivery eligibility considering user bans, admin overrides, trust scores, and vendor settings.
   */
  public static isCODEligible(userId: string, vendorAllowCod: boolean = true): { eligible: boolean; reason: string; score: number } {
    const users = storageService.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return { eligible: false, reason: 'User not found', score: 0 };
    }

    if (user.isBanned) {
      return { eligible: false, reason: 'Account restricted due to policy violations.', score: 0 };
    }

    if (user.codEligibilityOverride !== undefined && user.codEligibilityOverride !== null) {
      const profile = this.evaluate(userId);
      return {
        eligible: user.codEligibilityOverride,
        reason: user.codEligibilityOverride ? 'Administrative override granted COD access.' : 'Administrative override restricted COD access.',
        score: profile.score
      };
    }

    if (!vendorAllowCod) {
      const profile = this.evaluate(userId);
      return { eligible: false, reason: 'Selected vendor does not support Cash on Delivery.', score: profile.score };
    }

    const profile = this.evaluate(userId);
    if (profile.score >= COD_ELIGIBILITY_THRESHOLD) {
      return {
        eligible: true,
        reason: `Trust score (${profile.score}/100) meets Cash on Delivery threshold (≥${COD_ELIGIBILITY_THRESHOLD}).`,
        score: profile.score
      };
    } else {
      return {
        eligible: false,
        reason: `Trust score (${profile.score}/100) is below Cash on Delivery threshold (${COD_ELIGIBILITY_THRESHOLD}). Complete pre-paid orders or verify phone to increase score.`,
        score: profile.score
      };
    }
  }

  /**
   * Returns visual tier information for trust score badges and visualization bars.
   */
  public static getTrustTier(score: number) {
    if (score >= 85) {
      return {
        label: 'Platinum Trusted Buyer',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        barColor: 'bg-emerald-600',
        description: 'Elite platform standing with instant COD eligibility and priority dispute handling.'
      };
    } else if (score >= 65) {
      return {
        label: 'Gold Verified Buyer',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        barColor: 'bg-blue-600',
        description: 'Verified active buyer eligible for Cash on Delivery across all partner workshops.'
      };
    } else if (score >= 45) {
      return {
        label: 'Silver Building Trust',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        barColor: 'bg-amber-500',
        description: 'Developing order history. Complete 1-2 pre-paid purchases or verify phone to unlock COD.'
      };
    } else {
      return {
        label: 'Restricted Standby',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        barColor: 'bg-rose-500',
        description: 'High risk or unverified account. Requires digital pre-payment (bKash / Card).'
      };
    }
  }
}
