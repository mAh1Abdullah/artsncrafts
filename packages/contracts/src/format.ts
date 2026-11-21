/**
 * Formatting, Currency, and Identifier Helpers shared across Astro & Next.js
 */

export const BDT_PER_USD = 120;

export function formatBDT(amountBdt: number): string {
  const rounded = Math.round(amountBdt);
  return `৳${rounded.toLocaleString('en-US')}`;
}

export function formatUSD(amountUsd: number): string {
  return `$${amountUsd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPriceFromCents(
  priceCentsBdt: number,
  currency: 'BDT' | 'USD' = 'BDT'
): string {
  const bdt = priceCentsBdt / 100;
  if (currency === 'USD') {
    return formatUSD(bdt / BDT_PER_USD);
  }
  return formatBDT(bdt);
}

export function formatPriceFromUsd(
  priceUsd: number,
  currency: 'BDT' | 'USD' = 'BDT'
): string {
  if (currency === 'USD') {
    return formatUSD(priceUsd);
  }
  return formatBDT(priceUsd * BDT_PER_USD);
}

export function createCuid(prefix: string = 'c'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}${rand}`;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\+?\d{3,5})\d{4}(\d{2,4})/, '$1****$2');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
