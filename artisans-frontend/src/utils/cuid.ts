/**
 * Lightweight CUID2 implementation for offline-first & client-side model creation.
 * Produces URL-safe, lowercase, sortable, collision-resistant opaque identifiers.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function createCuid(prefix = 'c'): string {
  const timestamp = Date.now().toString(36);
  const randomChars = Array.from({ length: 12 }, () =>
    ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
  ).join('');
  const counter = Math.floor(Math.random() * 36).toString(36);
  return `${prefix}${timestamp}${counter}${randomChars}`;
}

export function formatPrice(cents: number, currency: 'BDT' | 'USD' = 'BDT'): string {
  if (currency === 'BDT') {
    // ৳ Formatting with comma thousands separation
    const amount = cents / 100;
    return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}
