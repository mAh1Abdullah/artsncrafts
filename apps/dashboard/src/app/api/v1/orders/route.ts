import { NextRequest } from 'next/server';
import { CreateOrderRequestSchema, UpdateOrderRequestSchema } from '@waw/contracts';
import {
  checkIdempotency,
  created,
  list,
  ok,
  paginateArray,
  parsePagination,
  problem,
  saveIdempotency,
  validationProblem,
} from '@/lib/api/response';
import {
  createOrderWithPosSync,
  listOrders,
  updateOrderRecord,
} from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const courier = searchParams.get('courier') || undefined;
    const buyerUserId = searchParams.get('buyerUserId') || undefined;
    const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

    const orders = listOrders({ status, paymentMethod, courier, buyerUserId });
    const { slice, pagination } = paginateArray(orders, page, limit);
    return list(req, slice, pagination);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Orders',
      detail: (error as Error).message,
      code: 'ORDERS_FETCH_ERROR',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const replayed = checkIdempotency(req, 'POST:/api/v1/orders');
    if (replayed) return replayed;

    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = CreateOrderRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const result = await createOrderWithPosSync(parsed.data);
    if (result.conflict || !result.order) {
      return problem(req, {
        status: 409,
        title: 'Insufficient Stock',
        detail: result.conflict || 'One or more requested items are out of stock.',
        code: 'INSUFFICIENT_STOCK',
      });
    }

    const location = `/api/v1/orders/${result.order.id}`;
    const response = created(req, result.order, location);
    const clonedBody = await response.clone().json();
    saveIdempotency(req, 'POST:/api/v1/orders', 201, clonedBody, location);
    return response;
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Create Order',
      detail: (error as Error).message,
      code: 'ORDER_CREATE_ERROR',
    });
  }
}

// Legacy PATCH compatibility on collection when orderId is provided in body
export async function PATCH(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object' || !rawBody.orderId) {
      return problem(req, {
        status: 400,
        title: 'Missing Order Identifier',
        detail: 'Use PATCH /api/v1/orders/{id} or include orderId in the request body.',
        code: 'MISSING_ORDER_ID',
      });
    }

    const parsed = UpdateOrderRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateOrderRecord(String(rawBody.orderId), parsed.data);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Order Not Found',
        detail: `No order found matching "${rawBody.orderId}".`,
        code: 'ORDER_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Order',
      detail: (error as Error).message,
      code: 'ORDER_UPDATE_ERROR',
    });
  }
}
