import { createWawApiClient, type WawApiClient, type WawApiClientOptions } from './client.js';

export const DEFAULT_LOCAL_API_URL = 'http://127.0.0.1:3000';
export const DEFAULT_TENANT_ID = 'tenant-waw-sylhet-001';
export const DEFAULT_STORE_ID = 'store-sylhet-flagship-01';

export interface StorefrontServiceContext {
  /**
   * Optional explicit API base URL override.
   * When omitted on the server, resolves from Vercel service binding `process.env.API_URL`
   * (or `DASHBOARD_URL` / `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL`), falling back to local port 3000.
   */
  baseUrl?: string;
  /**
   * Optional public API base URL injected via Astro `import.meta.env.PUBLIC_API_BASE_URL`.
   */
  publicApiBaseUrl?: string;
  /**
   * Optional correlation request ID forwarded from incoming SSR request headers.
   */
  requestId?: string;
  /**
   * Optional multi-tenant & store headers for WAW-POS & Artisan's Market isolation.
   */
  tenantId?: string;
  storeId?: string;
  userRole?: string;
  /**
   * Additional headers to include on every service-to-service request.
   */
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

function isLocalhostOrigin(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);
}

export function normalizeServiceOrigin(url: unknown): string {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');
  if (
    cleaned &&
    !cleaned.startsWith('http://') &&
    !cleaned.startsWith('https://') &&
    !cleaned.startsWith('/')
  ) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

/**
 * Resolves the environment-injected URL for `storefront` -> `dashboard` REST v1 calls.
 * - Server-side (Astro SSR / Vercel Functions): reads `process.env.API_URL` injected by
 *   the Vercel service binding (`{ type: "service", service: "dashboard", format: "url", env: "API_URL" }`).
 * - Client-side (Browser): uses relative paths (`""`) when served from the same domain/proxy,
 *   or `http://localhost:3000` when browsing standalone Astro dev on port `4321`.
 */
export function resolveBoundApiBaseUrl(context?: StorefrontServiceContext): string {
  if (context?.baseUrl) {
    return normalizeServiceOrigin(context.baseUrl);
  }

  const publicCleaned = normalizeServiceOrigin(context?.publicApiBaseUrl);

  if (typeof window !== 'undefined') {
    if (window.location.port === '4321') {
      return publicCleaned || 'http://localhost:3000';
    }
    if (publicCleaned && !isLocalhostOrigin(publicCleaned)) {
      return publicCleaned;
    }
    return '';
  }

  const runtimeEnv = (
    globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;

  if (runtimeEnv) {
    const bound =
      runtimeEnv.API_URL ||
      runtimeEnv.DASHBOARD_URL ||
      runtimeEnv.INTERNAL_API_BASE_URL ||
      runtimeEnv.PUBLIC_API_BASE_URL ||
      publicCleaned;
    const normalized = normalizeServiceOrigin(bound);
    if (normalized) {
      return normalized;
    }
  }

  return publicCleaned || DEFAULT_LOCAL_API_URL;
}

/**
 * Builds standard WAW-POS & Artisan's Market headers for cross-service REST v1 requests,
 * including correlation IDs (`X-Request-Id`), tenant/store context, and service identification.
 */
export function buildServiceHeaders(context?: StorefrontServiceContext): Record<string, string> {
  const requestId =
    context?.requestId ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Request-Id': requestId,
    'X-Tenant-Id': context?.tenantId || DEFAULT_TENANT_ID,
    'X-Store-Id': context?.storeId || DEFAULT_STORE_ID,
    'X-Calling-Service': 'storefront',
    ...(context?.userRole ? { 'X-User-Role': context.userRole } : {}),
    ...(context?.headers ?? {}),
  };

  return headers;
}

/**
 * Creates a typed `@waw/contracts` REST v1 client configured with Vercel service binding URLs
 * (`process.env.API_URL`) and standard correlation/tenant headers.
 */
export function createBoundStorefrontClient(context?: StorefrontServiceContext): WawApiClient {
  const options: WawApiClientOptions = {
    baseUrl: resolveBoundApiBaseUrl(context),
    defaultHeaders: buildServiceHeaders(context),
    fetchImpl: context?.fetchImpl,
  };
  return createWawApiClient(options);
}
