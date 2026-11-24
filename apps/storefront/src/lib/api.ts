import { createWawApiClient } from '@waw/contracts';

const SERVER_API_BASE = 'http://127.0.0.1:3000';
export const STOREFRONT_BASE = '/storefront';

export function storefrontPath(path = '/'): string {
  if (!path || path === '/') return STOREFRONT_BASE;
  if (path.startsWith('#')) return `${STOREFRONT_BASE}${path}`;
  return `${STOREFRONT_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);
}

function normalizeOrigin(url: unknown): string {
  if (!url || typeof url !== 'string') return '';
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '');
}

export function getApiBaseUrl(): string {
  const cleanedEnv = normalizeOrigin(import.meta.env.PUBLIC_API_BASE_URL);

  if (typeof window !== 'undefined') {
    if (window.location.port === '4321') {
      return cleanedEnv || 'http://localhost:3000';
    }
    if (cleanedEnv && !isLocalhostUrl(cleanedEnv)) {
      return cleanedEnv;
    }
    return '';
  }
  return SERVER_API_BASE;
}

export function getDashboardUrl(): string {
  const cleanedEnv = normalizeOrigin(import.meta.env.PUBLIC_DASHBOARD_URL);

  if (typeof window !== 'undefined' && window.location.port === '4321') {
    return cleanedEnv || 'http://localhost:3000';
  }
  if (cleanedEnv && !isLocalhostUrl(cleanedEnv)) {
    return cleanedEnv;
  }
  return '';
}

export const wawApi = createWawApiClient({
  baseUrl: getApiBaseUrl(),
});

export function createServerApiClient() {
  // Server-side Astro SSR fetches from the Next.js 16 REST API over HTTP
  const base =
    (typeof process !== 'undefined' && process.env.INTERNAL_API_BASE_URL) ||
    SERVER_API_BASE;
  return createWawApiClient({ baseUrl: base });
}
