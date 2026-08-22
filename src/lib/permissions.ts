// ============================================================================
// WAW-POS: ROLE-BASED ACCESS CONTROL (RBAC) & SUBSCRIPTION TIER GATEWAY
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier';
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise' | 'custom';

export type FeatureModule =
  | 'core_pos'
  | 'inventory'
  | 'expenses'
  | 'barcodes'
  | 'ecommerce_bridge'
  | 'multi_store'
  | 'advanced_reports'
  | 'shift_auditing'
  | 'user_management'
  | 'api_access';

export type PermissionAction =
  // POS Terminal Actions
  | 'pos:checkout'
  | 'pos:discount:basic'      // Up to 10%
  | 'pos:discount:override'   // >10% or custom override
  | 'pos:refund'
  | 'pos:shift_audit'
  // Inventory Actions
  | 'inventory:view'
  | 'inventory:create'
  | 'inventory:edit'
  | 'inventory:delete'
  | 'inventory:edit_cost_price'
  | 'inventory:stock_transfer'
  | 'inventory:barcodes'
  // Expenses Actions
  | 'expenses:view'
  | 'expenses:create'
  | 'expenses:delete'
  // Analytics & Reports Actions
  | 'reports:basic_sales'
  | 'reports:financial_pnl'
  | 'reports:inventory_valuation'
  | 'reports:export_csv'
  // E-Commerce Bridge Actions
  | 'ecommerce:sync'
  | 'ecommerce:webhooks'
  | 'ecommerce:channel_config'
  // Administrative & Settings
  | 'settings:subscriptions'
  | 'settings:plugins'
  | 'settings:manage_users'
  | 'settings:api_keys';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  storeId?: string;
  tier: SubscriptionTier;
  enabledModules: Partial<Record<FeatureModule, boolean>>;
}

export interface TierConfig {
  name: string;
  maxStores: number;
  maxRegisters: number;
  monthlyPriceUSD: number;
  description: string;
  allowedModules: FeatureModule[];
}

// ----------------------------------------------------------------------------
// 1. SUBSCRIPTION TIER DEFINITIONS
// ----------------------------------------------------------------------------
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    name: 'Starter Plan',
    maxStores: 1,
    maxRegisters: 1,
    monthlyPriceUSD: 19,
    description: 'Ideal for single retail outlets and quick-serve counters.',
    allowedModules: ['core_pos', 'inventory', 'expenses', 'shift_auditing'],
  },
  pro: {
    name: 'Pro Plan',
    maxStores: 3,
    maxRegisters: 5,
    monthlyPriceUSD: 49,
    description: 'Designed for growing multi-branch retailers and boutique chains.',
    allowedModules: [
      'core_pos',
      'inventory',
      'expenses',
      'shift_auditing',
      'barcodes',
      'multi_store',
      'advanced_reports',
      'user_management',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    maxStores: 999,
    maxRegisters: 999,
    monthlyPriceUSD: 149,
    description: 'Full omni-channel retail ecosystem with e-commerce integration & APIs.',
    allowedModules: [
      'core_pos',
      'inventory',
      'expenses',
      'shift_auditing',
      'barcodes',
      'multi_store',
      'advanced_reports',
      'ecommerce_bridge',
      'user_management',
      'api_access',
    ],
  },
  custom: {
    name: 'Custom Tailored',
    maxStores: 999,
    maxRegisters: 999,
    monthlyPriceUSD: 299,
    description: 'Bespoke high-volume enterprise deployment with dedicated cloud bridge.',
    allowedModules: [
      'core_pos',
      'inventory',
      'expenses',
      'shift_auditing',
      'barcodes',
      'multi_store',
      'advanced_reports',
      'ecommerce_bridge',
      'user_management',
      'api_access',
    ],
  },
};

// ----------------------------------------------------------------------------
// 2. FEATURE MODULE REQUIREMENT FOR ACTIONS
// ----------------------------------------------------------------------------
export const ACTION_MODULE_MAP: Record<PermissionAction, FeatureModule> = {
  'pos:checkout': 'core_pos',
  'pos:discount:basic': 'core_pos',
  'pos:discount:override': 'core_pos',
  'pos:refund': 'core_pos',
  'pos:shift_audit': 'shift_auditing',

  'inventory:view': 'inventory',
  'inventory:create': 'inventory',
  'inventory:edit': 'inventory',
  'inventory:delete': 'inventory',
  'inventory:edit_cost_price': 'inventory',
  'inventory:stock_transfer': 'multi_store',
  'inventory:barcodes': 'barcodes',

  'expenses:view': 'expenses',
  'expenses:create': 'expenses',
  'expenses:delete': 'expenses',

  'reports:basic_sales': 'core_pos',
  'reports:financial_pnl': 'advanced_reports',
  'reports:inventory_valuation': 'advanced_reports',
  'reports:export_csv': 'advanced_reports',

  'ecommerce:sync': 'ecommerce_bridge',
  'ecommerce:webhooks': 'ecommerce_bridge',
  'ecommerce:channel_config': 'ecommerce_bridge',

  'settings:subscriptions': 'user_management',
  'settings:plugins': 'user_management',
  'settings:manage_users': 'user_management',
  'settings:api_keys': 'api_access',
};

// Minimum Subscription Tier required for each Feature Module
export const MODULE_MINIMUM_TIER: Record<FeatureModule, SubscriptionTier> = {
  core_pos: 'starter',
  inventory: 'starter',
  expenses: 'starter',
  shift_auditing: 'starter',
  barcodes: 'pro',
  multi_store: 'pro',
  advanced_reports: 'pro',
  user_management: 'pro',
  ecommerce_bridge: 'enterprise',
  api_access: 'enterprise',
};

// ----------------------------------------------------------------------------
// 3. ROLE-BASED ACCESS PERMISSION MATRIX
// ----------------------------------------------------------------------------
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  cashier: [
    'pos:checkout',
    'pos:discount:basic',
    'pos:shift_audit',
    'inventory:view',
    'reports:basic_sales',
  ],
  manager: [
    'pos:checkout',
    'pos:discount:basic',
    'pos:discount:override',
    'pos:refund',
    'pos:shift_audit',
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:stock_transfer',
    'inventory:barcodes',
    'expenses:view',
    'expenses:create',
    'reports:basic_sales',
    'reports:financial_pnl',
    'reports:inventory_valuation',
    'reports:export_csv',
    'ecommerce:sync',
  ],
  admin: [
    'pos:checkout',
    'pos:discount:basic',
    'pos:discount:override',
    'pos:refund',
    'pos:shift_audit',
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:delete',
    'inventory:edit_cost_price',
    'inventory:stock_transfer',
    'inventory:barcodes',
    'expenses:view',
    'expenses:create',
    'expenses:delete',
    'reports:basic_sales',
    'reports:financial_pnl',
    'reports:inventory_valuation',
    'reports:export_csv',
    'ecommerce:sync',
    'ecommerce:webhooks',
    'ecommerce:channel_config',
    'settings:plugins',
    'settings:manage_users',
    'settings:api_keys',
  ],
  owner: [
    // Owner inherits all permissions
    'pos:checkout',
    'pos:discount:basic',
    'pos:discount:override',
    'pos:refund',
    'pos:shift_audit',
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:delete',
    'inventory:edit_cost_price',
    'inventory:stock_transfer',
    'inventory:barcodes',
    'expenses:view',
    'expenses:create',
    'expenses:delete',
    'reports:basic_sales',
    'reports:financial_pnl',
    'reports:inventory_valuation',
    'reports:export_csv',
    'ecommerce:sync',
    'ecommerce:webhooks',
    'ecommerce:channel_config',
    'settings:subscriptions',
    'settings:plugins',
    'settings:manage_users',
    'settings:api_keys',
  ],
};

// ----------------------------------------------------------------------------
// 4. ACCESS EVALUATOR (COMBINING ROLE + SUBSCRIPTION TIER + MODULE FLAGS)
// ----------------------------------------------------------------------------
export interface AccessEvaluation {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredTier?: SubscriptionTier;
  requiredModule?: FeatureModule;
}

export function evaluateAccess(
  user: UserSession,
  action: PermissionAction
): AccessEvaluation {
  // Step 1: Check User Role Permissions
  const allowedActionsForRole = ROLE_PERMISSIONS[user.role] || [];
  if (!allowedActionsForRole.includes(action)) {
    // Find minimum role that has this permission
    const roles: UserRole[] = ['cashier', 'manager', 'admin', 'owner'];
    const minRole = roles.find((r) => ROLE_PERMISSIONS[r].includes(action)) || 'admin';
    return {
      allowed: false,
      reason: `Access Denied: Your current role '${user.role}' lacks permission for '${action}'. Minimum required role: '${minRole}'.`,
      requiredRole: minRole,
    };
  }

  // Step 2: Check Subscription Tier Entitlement
  const requiredModule = ACTION_MODULE_MAP[action];
  const tierConfig = SUBSCRIPTION_TIERS[user.tier];

  if (!tierConfig) {
    return {
      allowed: false,
      reason: `Invalid subscription tier: '${user.tier}'.`,
    };
  }

  if (!tierConfig.allowedModules.includes(requiredModule)) {
    const minTier = MODULE_MINIMUM_TIER[requiredModule];
    return {
      allowed: false,
      reason: `Tier Limitation: The '${requiredModule}' feature is not included in the ${tierConfig.name}. Please upgrade to the ${SUBSCRIPTION_TIERS[minTier].name} to unlock this feature.`,
      requiredTier: minTier,
      requiredModule,
    };
  }

  // Step 3: Check Tenant Enabled Modules Configuration (Feature Flags)
  if (user.enabledModules && user.enabledModules[requiredModule] === false) {
    return {
      allowed: false,
      reason: `Module Disabled: The '${requiredModule}' plugin is currently turned off in your tenant settings.`,
      requiredModule,
    };
  }

  return { allowed: true };
}

// ----------------------------------------------------------------------------
// 5. HELPER PRE-DEFINED TEST PROFILES
// ----------------------------------------------------------------------------
export const DEFAULT_USERS: Record<UserRole, UserSession> = {
  owner: {
    id: 'user-owner-01',
    name: 'Nafis Chowdhury (Owner)',
    email: 'nafis@sylhetcrafts.com',
    role: 'owner',
    tenantId: 'tenant-waw-sylhet-001',
    tier: 'enterprise',
    enabledModules: {
      core_pos: true,
      inventory: true,
      expenses: true,
      shift_auditing: true,
      barcodes: true,
      multi_store: true,
      advanced_reports: true,
      ecommerce_bridge: true,
      user_management: true,
      api_access: true,
    },
  },
  admin: {
    id: 'user-admin-01',
    name: 'Sultana Razia (Store Administrator)',
    email: 'sultana@sylhetcrafts.com',
    role: 'admin',
    tenantId: 'tenant-waw-sylhet-001',
    tier: 'pro',
    enabledModules: {
      core_pos: true,
      inventory: true,
      expenses: true,
      shift_auditing: true,
      barcodes: true,
      multi_store: true,
      advanced_reports: true,
      ecommerce_bridge: false,
      user_management: true,
      api_access: false,
    },
  },
  manager: {
    id: 'user-mgr-01',
    name: 'Farhan Karim (Branch Manager)',
    email: 'farhan@sylhetcrafts.com',
    role: 'manager',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    tier: 'pro',
    enabledModules: {
      core_pos: true,
      inventory: true,
      expenses: true,
      shift_auditing: true,
      barcodes: true,
      multi_store: true,
      advanced_reports: true,
      ecommerce_bridge: false,
      user_management: false,
      api_access: false,
    },
  },
  cashier: {
    id: 'user-cashier-01',
    name: 'Tanvir Hasan (Register Cashier)',
    email: 'tanvir@sylhetcrafts.com',
    role: 'cashier',
    tenantId: 'tenant-waw-sylhet-001',
    storeId: 'store-sylhet-flagship-01',
    tier: 'starter',
    enabledModules: {
      core_pos: true,
      inventory: true,
      expenses: true,
      shift_auditing: true,
      barcodes: false,
      multi_store: false,
      advanced_reports: false,
      ecommerce_bridge: false,
      user_management: false,
      api_access: false,
    },
  },
};
