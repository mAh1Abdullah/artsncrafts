import { NextRequest } from 'next/server';
import {
  created,
  list,
  ok,
  paginateArray,
  parsePagination,
  problem,
} from '@/lib/api/response';

export interface AbandonedCartRecord {
  id: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalValue: number;
  recoveryStatus: 'pending' | 'recovered' | 'lost';
  recoveryAttempts: number;
  lastReminderSentAt?: string;
  createdAt: string;
}

const inMemoryAbandonedCarts: AbandonedCartRecord[] = [
  {
    id: 'cart-ab-001',
    customerPhone: '+880 1715-998877',
    customerName: 'Tareq Mansoor',
    customerEmail: 'tareq.sylhet@gmail.com',
    items: [
      { productId: '5', productName: 'Sylhet Cane Basket, Shital Pati Mat & Khadi Tunic Set', quantity: 2, price: 39.99 },
      { productId: 'art-1', productName: 'Hand-Carved Earthen Water Pitcher & Tumbler Set', quantity: 1, price: 24.5 },
    ],
    totalValue: 104.48,
    recoveryStatus: 'pending',
    recoveryAttempts: 1,
    lastReminderSentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'cart-ab-002',
    customerPhone: '+880 1822-334455',
    customerName: 'Samira Begum',
    items: [
      { productId: 'art-4', productName: 'Tarkashi Heritage Silver Filigree Pendant & Earrings', quantity: 1, price: 88.0 },
    ],
    totalValue: 88.0,
    recoveryStatus: 'recovered',
    recoveryAttempts: 2,
    lastReminderSentAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'cart-ab-003',
    customerPhone: '+880 1911-001122',
    customerName: 'Arifuzzaman Khan',
    items: [
      { productId: 'art-2', productName: 'Heritage 80-Count Royal Handloom Jamdani Saree', quantity: 1, price: 185.0 },
    ],
    totalValue: 185.0,
    recoveryStatus: 'pending',
    recoveryAttempts: 0,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });
  const { slice, pagination } = paginateArray(inMemoryAbandonedCarts, page, limit);
  return list(req, slice, pagination);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const { customerPhone, customerName, customerEmail, items = [], totalValue } = body;
    if (!customerPhone || !Array.isArray(items) || items.length === 0) {
      return problem(req, {
        status: 422,
        title: 'Missing Required Fields',
        detail: 'Customer phone and at least one cart item are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const calculatedTotal =
      totalValue ||
      items.reduce(
        (sum: number, it: { quantity: number; price: number }) => sum + it.quantity * it.price,
        0
      );

    const newCart: AbandonedCartRecord = {
      id: `cart-ab-${Date.now()}`,
      customerPhone,
      customerName,
      customerEmail,
      items,
      totalValue: Number(calculatedTotal.toFixed(2)),
      recoveryStatus: 'pending',
      recoveryAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    inMemoryAbandonedCarts.unshift(newCart);
    return created(req, newCart, `/api/v1/orders/abandoned-carts/${newCart.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Log Abandoned Cart',
      detail: (error as Error).message,
      code: 'ABANDONED_CART_ERROR',
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const { cartId, action, recoveryStatus } = body;
    const cart = inMemoryAbandonedCarts.find((c) => c.id === cartId);
    if (!cart) {
      return problem(req, {
        status: 404,
        title: 'Abandoned Cart Not Found',
        detail: `No abandoned cart found matching "${cartId}".`,
        code: 'CART_NOT_FOUND',
      });
    }

    if (action === 'send_reminder') {
      cart.recoveryAttempts += 1;
      cart.lastReminderSentAt = new Date().toISOString();
    }
    if (recoveryStatus) {
      cart.recoveryStatus = recoveryStatus;
    }

    return ok(req, cart);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Abandoned Cart',
      detail: (error as Error).message,
      code: 'ABANDONED_CART_UPDATE_ERROR',
    });
  }
}
