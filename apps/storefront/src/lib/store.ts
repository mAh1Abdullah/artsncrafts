import {
  BDT_PER_USD,
  formatBDT,
  formatUSD,
  type ProductDTO,
} from '@waw/contracts';

export type CurrencyCode = 'BDT' | 'USD';

export interface CartSelection {
  optionLabel: string;
  value: string;
  priceModifierBdt: number;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  sku: string;
  vendorId: string;
  vendorName: string;
  imageUrl: string;
  unitPriceBdt: number;
  unitPriceUsd: number;
  quantity: number;
  maxStock: number;
  customSelections?: CartSelection[];
  customNote?: string;
}

export interface ToastItem {
  id: string;
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface StoreState {
  cart: CartItem[];
  currency: CurrencyCode;
  wishlistIds: string[];
  cartOpen: boolean;
  advisorOpen: boolean;
  toasts: ToastItem[];
}

const STORAGE_CART_KEY = 'waw_storefront_cart_v1';
const STORAGE_CURRENCY_KEY = 'waw_storefront_currency_v1';
const STORAGE_WISHLIST_KEY = 'waw_storefront_wishlist_v1';

const state: StoreState = {
  cart: [],
  currency: 'BDT',
  wishlistIds: ['art-2', 'art-4'],
  cartOpen: false,
  advisorOpen: false,
  toasts: [],
};

let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(state.cart));
    window.localStorage.setItem(STORAGE_CURRENCY_KEY, state.currency);
    window.localStorage.setItem(
      STORAGE_WISHLIST_KEY,
      JSON.stringify(state.wishlistIds)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function hydrateStoreOnce() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const rawCart = window.localStorage.getItem(STORAGE_CART_KEY);
    if (rawCart) {
      const parsed = JSON.parse(rawCart);
      if (Array.isArray(parsed)) state.cart = parsed;
    }
    const rawCurrency = window.localStorage.getItem(STORAGE_CURRENCY_KEY);
    if (rawCurrency === 'USD' || rawCurrency === 'BDT') {
      state.currency = rawCurrency;
    }
    const rawWishlist = window.localStorage.getItem(STORAGE_WISHLIST_KEY);
    if (rawWishlist) {
      const parsed = JSON.parse(rawWishlist);
      if (Array.isArray(parsed)) state.wishlistIds = parsed;
    }
  } catch {
    // Ignore malformed local storage
  }
  emit();
}

export function subscribeStore(listener: () => void): () => void {
  hydrateStoreOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoreSnapshot(): StoreState {
  hydrateStoreOnce();
  return {
    cart: [...state.cart],
    currency: state.currency,
    wishlistIds: [...state.wishlistIds],
    cartOpen: state.cartOpen,
    advisorOpen: state.advisorOpen,
    toasts: [...state.toasts],
  };
}

export function formatMoney(amountBdt: number, currency: CurrencyCode): string {
  if (currency === 'USD') {
    return formatUSD(amountBdt / BDT_PER_USD);
  }
  return formatBDT(amountBdt);
}

export function pushToast(
  message: string,
  tone: 'success' | 'error' | 'info' = 'info'
) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  state.toasts = [...state.toasts, { id, tone, message }];
  emit();
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      dismissToast(id);
    }, 4200);
  }
}

export function dismissToast(id: string) {
  state.toasts = state.toasts.filter((t) => t.id !== id);
  emit();
}

export function setCurrency(currency: CurrencyCode) {
  state.currency = currency;
  persist();
  emit();
}

export function setCartOpen(open: boolean) {
  state.cartOpen = open;
  emit();
}

export function setAdvisorOpen(open: boolean) {
  state.advisorOpen = open;
  emit();
}

export function addToCart(
  product: ProductDTO,
  quantity: number = 1,
  customSelections?: CartSelection[],
  customNote?: string
) {
  const extraBdt = (customSelections ?? []).reduce(
    (sum, s) => sum + (s.priceModifierBdt || 0),
    0
  );
  const unitPriceBdt = product.priceBdt + extraBdt;
  const unitPriceUsd = Number((unitPriceBdt / BDT_PER_USD).toFixed(2));
  const selSig = JSON.stringify(customSelections ?? []) + (customNote ?? '');
  const key = `${product.id}::${selSig}`;

  const idx = state.cart.findIndex((item) => item.key === key);
  if (idx !== -1) {
    const nextQty = Math.min(
      Math.max(1, product.currentStock || 10),
      state.cart[idx].quantity + quantity
    );
    state.cart[idx] = { ...state.cart[idx], quantity: nextQty };
  } else {
    state.cart = [
      ...state.cart,
      {
        key,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        vendorId: product.vendorId || 'v-dhamrai-clay',
        vendorName: product.vendorName,
        imageUrl:
          product.imageUrl ||
          '/images/artisans/artisans_hero_workshop_1795181990328.jpg',
        unitPriceBdt,
        unitPriceUsd,
        quantity: Math.max(1, quantity),
        maxStock: Math.max(1, product.currentStock || 10),
        customSelections,
        customNote,
      },
    ];
  }

  persist();
  emit();
  pushToast(`Added "${product.name}" to your bag.`, 'success');
}

export function updateCartQuantity(key: string, quantity: number) {
  if (quantity <= 0) {
    removeCartItem(key);
    return;
  }
  state.cart = state.cart.map((item) =>
    item.key === key
      ? { ...item, quantity: Math.min(item.maxStock, quantity) }
      : item
  );
  persist();
  emit();
}

export function removeCartItem(key: string) {
  state.cart = state.cart.filter((item) => item.key !== key);
  persist();
  emit();
}

export function clearCart() {
  state.cart = [];
  persist();
  emit();
}

export function setWishlistIds(ids: string[]) {
  state.wishlistIds = [...ids];
  persist();
  emit();
}

export function toggleLocalWishlist(productId: string): boolean {
  const exists = state.wishlistIds.includes(productId);
  if (exists) {
    state.wishlistIds = state.wishlistIds.filter((id) => id !== productId);
  } else {
    state.wishlistIds = [productId, ...state.wishlistIds];
  }
  persist();
  emit();
  return !exists;
}
