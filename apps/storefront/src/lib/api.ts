import {
  createBoundStorefrontClient,
  normalizeServiceOrigin,
  resolveBoundApiBaseUrl,
  type StorefrontServiceContext,
} from '@waw/contracts';

export const STOREFRONT_BASE = '/';

export function storefrontPath(path = '/'): string {
  if (!path || path === '/') return '/';
  if (path.startsWith('#')) return `/${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);
}

export function getApiBaseUrl(): string {
  return resolveBoundApiBaseUrl({
    publicApiBaseUrl: import.meta.env.PUBLIC_API_BASE_URL,
  });
}

export function getDashboardUrl(): string {
  const cleanedEnv = normalizeServiceOrigin(import.meta.env.PUBLIC_DASHBOARD_URL);

  if (typeof window !== 'undefined' && window.location.port === '4321') {
    return cleanedEnv || 'http://localhost:3000';
  }
  if (cleanedEnv && !isLocalhostUrl(cleanedEnv)) {
    return cleanedEnv;
  }
  return '';
}

export const wawApi = createBoundStorefrontClient({
  publicApiBaseUrl: import.meta.env.PUBLIC_API_BASE_URL,
});

export function createServerApiClient(context?: StorefrontServiceContext) {
  // Server-side Astro SSR fetches from the Next.js 16 REST API over HTTP
  // using the shared @waw/contracts Vercel service binding utility (process.env.API_URL).
  return createBoundStorefrontClient({
    publicApiBaseUrl: import.meta.env.PUBLIC_API_BASE_URL,
    ...context,
  });
}
