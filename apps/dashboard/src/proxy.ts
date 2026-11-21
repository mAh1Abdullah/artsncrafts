import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateAccess,
  PermissionAction,
  SubscriptionTier,
  UserRole,
  UserSession,
  DEFAULT_USERS,
  SUBSCRIPTION_TIERS,
} from '@/lib/permissions';

const DEFAULT_TENANT_ID = 'tenant-waw-sylhet-001';
const DEFAULT_STORE_ID = 'store-sylhet-flagship-01';

const ROUTE_PERMISSION_MAP: Array<{
  pattern: RegExp;
  method?: string;
  action: PermissionAction;
  description: string;
}> = [
  {
    pattern: /^\/api\/v1\/reports/,
    action: 'reports:financial_pnl',
    description: 'Financial Reports & Executive P&L',
  },
  {
    pattern: /^\/api\/v1\/inventory\/sync/,
    action: 'ecommerce:sync',
    description: 'E-Commerce Catalog & Stock Sync',
  },
  {
    pattern: /^\/api\/v1\/orders\/webhook/,
    action: 'ecommerce:webhooks',
    description: 'External E-Commerce Webhook Receiver',
  },
  {
    pattern: /^\/api\/v1\/expenses/,
    method: 'POST',
    action: 'expenses:create',
    description: 'Log Business Expense',
  },
  {
    pattern: /^\/api\/v1\/expenses/,
    method: 'DELETE',
    action: 'expenses:delete',
    description: 'Delete Business Expense',
  },
  {
    pattern: /^\/api\/v1\/expenses/,
    method: 'GET',
    action: 'expenses:view',
    description: 'Query Operating Expenses',
  },
  {
    pattern: /^\/api\/v1\/products/,
    method: 'DELETE',
    action: 'inventory:delete',
    description: 'Delete Catalog Product',
  },
  {
    pattern: /^\/api\/v1\/sales/,
    method: 'POST',
    action: 'pos:checkout',
    description: 'Record Sales Transaction & POS Checkout',
  },
];

function getAllowedCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  const configuredOrigin = process.env.STOREFRONT_ORIGIN || 'http://localhost:4321';
  const allowlist = new Set([
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    configuredOrigin,
  ]);

  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowlist.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] =
      'Content-Type, Authorization, Idempotency-Key, X-Request-Id, X-Tenant-Id, X-Store-Id, X-User-Role, X-Subscription-Tier';
  }
  return headers;
}

/**
 * Next.js 16 Network Boundary (`proxy.ts`)
 * - Handles explicit CORS allowlist for the Astro 7.4 storefront (:4321)
 * - Injects X-Request-Id correlation headers
 * - Enforces tenant, role, and subscription tier entitlements returning RFC 9457 Problem Details
 */
export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const requestId =
    req.headers.get('x-request-id') ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req_${Date.now()}`);
  const corsHeaders = getAllowedCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'X-Request-Id': requestId,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const extractedStoreId =
    req.headers.get('x-store-id') ||
    searchParams.get('storeId') ||
    req.cookies.get('waw_store_id')?.value ||
    DEFAULT_STORE_ID;

  const extractedTenantId =
    req.headers.get('x-tenant-id') ||
    searchParams.get('tenantId') ||
    req.cookies.get('waw_tenant_id')?.value ||
    DEFAULT_TENANT_ID;

  const validRoles: UserRole[] = ['owner', 'admin', 'manager', 'cashier'];
  const rawRole = (
    req.headers.get('x-user-role') ||
    req.cookies.get('waw_role')?.value ||
    'admin'
  ).toLowerCase() as UserRole;
  const userRole: UserRole = validRoles.includes(rawRole) ? rawRole : 'admin';

  const validTiers: SubscriptionTier[] = ['starter', 'pro', 'enterprise', 'custom'];
  const rawTier = (
    req.headers.get('x-subscription-tier') ||
    req.cookies.get('waw_tier')?.value ||
    'enterprise'
  ).toLowerCase() as SubscriptionTier;
  const subscriptionTier: SubscriptionTier = validTiers.includes(rawTier)
    ? rawTier
    : 'enterprise';

  const baseUser = DEFAULT_USERS[userRole] || DEFAULT_USERS.admin;
  const tierConfig = SUBSCRIPTION_TIERS[subscriptionTier] || SUBSCRIPTION_TIERS.enterprise;
  const enabledModules: Partial<Record<string, boolean>> = { ...baseUser.enabledModules };
  tierConfig.allowedModules.forEach((mod) => {
    enabledModules[mod] = true;
  });

  const userSession: UserSession = {
    ...baseUser,
    id: baseUser.id || `usr-${userRole}`,
    role: userRole,
    tenantId: extractedTenantId,
    storeId: extractedStoreId,
    tier: subscriptionTier,
    enabledModules: enabledModules as UserSession['enabledModules'],
  };

  const matchedPolicy = ROUTE_PERMISSION_MAP.find((rule) => {
    if (!rule.pattern.test(pathname)) return false;
    if (rule.method && rule.method !== req.method) return false;
    return true;
  });

  if (matchedPolicy) {
    const evaluation = evaluateAccess(userSession, matchedPolicy.action);
    if (!evaluation.allowed) {
      return NextResponse.json(
        {
          type: 'https://api.waw-platform.local/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: evaluation.reason || `Access denied for ${matchedPolicy.description}.`,
          instance: pathname,
          code: 'FORBIDDEN',
          requestId,
        },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/problem+json',
            'X-Request-Id': requestId,
            'X-Permission-Status': 'Denied',
            ...corsHeaders,
          },
        }
      );
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-tenant-id', extractedTenantId);
  requestHeaders.set('x-store-id', extractedStoreId);
  requestHeaders.set('x-user-id', userSession.id);
  requestHeaders.set('x-user-name', userSession.name);
  requestHeaders.set('x-user-role', userSession.role);
  requestHeaders.set('x-subscription-tier', userSession.tier);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Tenant-Id', extractedTenantId);
  response.headers.set('X-Store-Id', extractedStoreId);
  response.headers.set('X-User-Role', userSession.role);
  response.headers.set('X-Subscription-Tier', userSession.tier);

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
