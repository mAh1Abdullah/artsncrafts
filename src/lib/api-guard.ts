import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateAccess,
  PermissionAction,
  SubscriptionTier,
  UserRole,
  UserSession,
  DEFAULT_USERS,
  SUBSCRIPTION_TIERS,
} from './permissions';

export function getSessionFromRequest(req: NextRequest): UserSession {
  const headerRole = (req.headers.get('x-user-role') as UserRole) || null;
  const headerTier = (req.headers.get('x-subscription-tier') as SubscriptionTier) || null;
  const cookieRole = (req.cookies.get('waw_role')?.value as UserRole) || null;
  const cookieTier = (req.cookies.get('waw_tier')?.value as SubscriptionTier) || null;

  const role: UserRole = headerRole || cookieRole || 'admin';
  const tier: SubscriptionTier = headerTier || cookieTier || 'pro';

  const defaultUser = DEFAULT_USERS[role] || DEFAULT_USERS.admin;

  return {
    ...defaultUser,
    role,
    tier,
    enabledModules: {
      ...defaultUser.enabledModules,
      ...SUBSCRIPTION_TIERS[tier]?.allowedModules.reduce((acc, mod) => {
        acc[mod] = true;
        return acc;
      }, {} as Record<string, boolean>),
    },
  };
}

export function enforcePermission(req: NextRequest, action: PermissionAction): NextResponse | null {
  const session = getSessionFromRequest(req);
  const evaluation = evaluateAccess(session, action);

  if (!evaluation.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: evaluation.reason,
        requiredRole: evaluation.requiredRole,
        requiredTier: evaluation.requiredTier,
        requiredModule: evaluation.requiredModule,
        currentRole: session.role,
        currentTier: session.tier,
      },
      {
        status: 403,
      }
    );
  }

  return null;
}
