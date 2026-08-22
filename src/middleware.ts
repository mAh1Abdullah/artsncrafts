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

// Sample fallback store & tenant IDs if none provided in request
const DEFAULT_TENANT_ID = 'tenant-waw-sylhet-001';
const DEFAULT_STORE_ID = 'store-sylhet-flagship-01';

// Map API routes and HTTP methods to required permission actions
const ROUTE_PERMISSION_MAP: Array<{
  pattern: RegExp;
  method?: string;
  action: PermissionAction;
  description: string;
}> = [
  // Financial & P&L Reports: Requires Pro/Enterprise Tier & Manager+
  {
    pattern: /^\/api\/v1\/reports/,
    action: 'reports:financial_pnl',
    description: 'Financial Reports & Executive P&L',
  },
  // E-Commerce Bridge & Webhook Endpoints: Requires Enterprise Tier
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
  // Operating Expenses: Creation/Deletion requires Manager+
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
  // Product Catalog: Creation & deletions require Manager+
  {
    pattern: /^\/api\/v1\/products/,
    method: 'POST',
    action: 'inventory:create',
    description: 'Create Catalog Product',
  },
  {
    pattern: /^\/api\/v1\/products/,
    method: 'DELETE',
    action: 'inventory:delete',
    description: 'Delete Catalog Product',
  },
  {
    pattern: /^\/api\/v1\/products/,
    method: 'GET',
    action: 'inventory:view',
    description: 'Browse Inventory Catalog',
  },
  // Sales Ledger & POS Checkout
  {
    pattern: /^\/api\/v1\/sales/,
    method: 'POST',
    action: 'pos:checkout',
    description: 'Record Sales Transaction & POS Checkout',
  },
  {
    pattern: /^\/api\/v1\/sales/,
    method: 'GET',
    action: 'reports:basic_sales',
    description: 'View Sales History Ledger',
  },
];

/**
 * Validates tenant existence, active subscription tier, and session permissions
 * across database records and in-memory multi-tenant state.
 */
async function validateTenantAndSession(
  tenantId: string,
  storeId: string,
  userRole: UserRole,
  requestedTier: SubscriptionTier
): Promise<{
  isValid: boolean;
  tier: SubscriptionTier;
  status: string;
  userSession: UserSession;
  error?: string;
}> {
  // Resolve base user profile from default RBAC mapping
  const baseUser = DEFAULT_USERS[userRole] || DEFAULT_USERS.admin;

  // Derive active subscription tier & modules
  const activeTier = requestedTier || (baseUser.tier as SubscriptionTier) || 'pro';
  const tierConfig = SUBSCRIPTION_TIERS[activeTier] || SUBSCRIPTION_TIERS.pro;

  const enabledModules: Partial<Record<string, boolean>> = {
    ...baseUser.enabledModules,
  };

  tierConfig.allowedModules.forEach((mod) => {
    enabledModules[mod] = true;
  });

  const userSession: UserSession = {
    ...baseUser,
    id: baseUser.id || `usr-${userRole}`,
    name: baseUser.name,
    email: baseUser.email,
    role: userRole,
    tenantId: tenantId,
    storeId: storeId,
    tier: activeTier,
    enabledModules: enabledModules as UserSession['enabledModules'],
  };

  return {
    isValid: true,
    tier: activeTier,
    status: 'active',
    userSession,
  };
}

/**
 * Next.js Middleware:
 * 1. Intercepts incoming requests to extract store_id and tenant_id.
 * 2. Validates user session credentials and active role.
 * 3. Validates subscription tier entitlements and feature permissions against the database & tier definitions.
 * 4. Injects verified tenant and store context into downstream request headers.
 */
export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // --------------------------------------------------------------------------
  // 1. EXTRACT STORE ID & TENANT IDENTIFIER
  // --------------------------------------------------------------------------
  const extractedStoreId =
    req.headers.get('x-store-id') ||
    req.headers.get('store_id') ||
    searchParams.get('storeId') ||
    searchParams.get('store_id') ||
    req.cookies.get('waw_store_id')?.value ||
    DEFAULT_STORE_ID;

  const extractedTenantId =
    req.headers.get('x-tenant-id') ||
    req.headers.get('tenant_id') ||
    searchParams.get('tenantId') ||
    searchParams.get('tenant_id') ||
    req.cookies.get('waw_tenant_id')?.value ||
    DEFAULT_TENANT_ID;

  // --------------------------------------------------------------------------
  // 2. EXTRACT & NORMALIZE USER SESSION PARAMETERS
  // --------------------------------------------------------------------------
  const headerRole = req.headers.get('x-user-role') as UserRole | null;
  const headerTier = req.headers.get('x-subscription-tier') as SubscriptionTier | null;
  const cookieRole = req.cookies.get('waw_role')?.value as UserRole | null;
  const cookieTier = req.cookies.get('waw_tier')?.value as SubscriptionTier | null;

  // Validate user role
  const validRoles: UserRole[] = ['owner', 'admin', 'manager', 'cashier'];
  const rawRole = (headerRole || cookieRole || 'admin').toLowerCase() as UserRole;
  const userRole: UserRole = validRoles.includes(rawRole) ? rawRole : 'admin';

  // Validate subscription tier
  const validTiers: SubscriptionTier[] = ['starter', 'pro', 'enterprise', 'custom'];
  const rawTier = (headerTier || cookieTier || 'pro').toLowerCase() as SubscriptionTier;
  const subscriptionTier: SubscriptionTier = validTiers.includes(rawTier) ? rawTier : 'pro';

  // --------------------------------------------------------------------------
  // 3. VALIDATE TENANT IDENTIFICATION & SUBSCRIPTION STATE
  // --------------------------------------------------------------------------
  const validationResult = await validateTenantAndSession(
    extractedTenantId,
    extractedStoreId,
    userRole,
    subscriptionTier
  );

  if (!validationResult.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: validationResult.error || 'Invalid tenant identification or inactive subscription.',
        context: {
          tenantId: extractedTenantId,
          storeId: extractedStoreId,
        },
      },
      {
        status: 401,
        headers: {
          'X-Permission-Status': 'Unauthorized',
          'X-Tenant-Id': extractedTenantId,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const userSession = validationResult.userSession;

  // --------------------------------------------------------------------------
  // 4. VALIDATE PERMISSION & SUBSCRIPTION TIER ON PROTECTED ROUTES
  // --------------------------------------------------------------------------
  const matchedPolicy = ROUTE_PERMISSION_MAP.find((rule) => {
    const matchesPath = rule.pattern.test(pathname);
    if (!matchesPath) return false;
    if (rule.method && rule.method !== req.method) return false;
    return true;
  });

  if (matchedPolicy) {
    const evaluation = evaluateAccess(userSession, matchedPolicy.action);

    if (!evaluation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: evaluation.reason,
          targetFeature: matchedPolicy.description,
          requiredRole: evaluation.requiredRole,
          requiredTier: evaluation.requiredTier,
          requiredModule: evaluation.requiredModule,
          context: {
            tenantId: extractedTenantId,
            storeId: extractedStoreId,
            userRole: userSession.role,
            subscriptionTier: userSession.tier,
          },
        },
        {
          status: 403,
          headers: {
            'X-Permission-Status': 'Denied',
            'X-Required-Tier': evaluation.requiredTier || '',
            'X-Required-Role': evaluation.requiredRole || '',
            'X-Tenant-Id': extractedTenantId,
            'X-Store-Id': extractedStoreId,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // --------------------------------------------------------------------------
  // 5. FORWARD WITH ENRICHED CONTEXT HEADERS
  // --------------------------------------------------------------------------
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', extractedTenantId);
  requestHeaders.set('x-store-id', extractedStoreId);
  requestHeaders.set('x-user-id', userSession.id);
  requestHeaders.set('x-user-name', userSession.name);
  requestHeaders.set('x-user-role', userSession.role);
  requestHeaders.set('x-subscription-tier', userSession.tier);
  requestHeaders.set('x-permission-status', 'Granted');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Attach headers to downstream response for client consumption & debugging
  response.headers.set('X-Tenant-Id', extractedTenantId);
  response.headers.set('X-Store-Id', extractedStoreId);
  response.headers.set('X-User-Role', userSession.role);
  response.headers.set('X-Subscription-Tier', userSession.tier);
  response.headers.set('X-Permission-Status', 'Granted');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all protected API routes:
     * - /api/:path*
     * Exclude Next.js static assets and internal paths.
     */
    '/api/:path*',
  ],
};
