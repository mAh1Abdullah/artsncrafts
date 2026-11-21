import { createWawApiClient } from '@waw/contracts';

const DEFAULT_API_BASE = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.PUBLIC_API_BASE_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE;
}

export function getDashboardUrl(): string {
  const fromEnv = import.meta.env.PUBLIC_DASHBOARD_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE;
}

export const wawApi = createWawApiClient({
  baseUrl: getApiBaseUrl(),
});

export function createServerApiClient() {
  // Server-side Astro SSR fetches from the Next.js 16 REST API over HTTP
  const base =
    (typeof process !== 'undefined' && process.env.INTERNAL_API_BASE_URL) ||
    getApiBaseUrl();
  return createWawApiClient({ baseUrl: base });
}
