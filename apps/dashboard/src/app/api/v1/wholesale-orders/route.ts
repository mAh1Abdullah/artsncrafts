import { NextRequest } from 'next/server';
import { CreateWholesaleOrderSchema } from '@waw/contracts';
import {
  checkIdempotency,
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  saveIdempotency,
  validationProblem,
} from '@/lib/api/response';
import {
  createWholesaleOrderRecord,
  listWholesaleOrders,
} from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });
  const orders = listWholesaleOrders();
  const { slice, pagination } = paginateArray(orders, page, limit);
  return list(req, slice, pagination);
}

export async function POST(req: NextRequest) {
  try {
    const replayed = checkIdempotency(req, 'POST:/api/v1/wholesale-orders');
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

    const parsed = CreateWholesaleOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const result = createWholesaleOrderRecord(parsed.data);
    if (result.error || !result.order) {
      return problem(req, {
        status: result.error?.status ?? 422,
        title: 'Wholesale Order Rejected',
        detail: result.error?.detail ?? 'Unable to fulfill wholesale order.',
        code: result.error?.code ?? 'WHOLESALE_ORDER_ERROR',
      });
    }

    const location = `/api/v1/wholesale-orders/${result.order.id}`;
    const response = created(req, result.order, location);
    const clonedBody = await response.clone().json();
    saveIdempotency(req, 'POST:/api/v1/wholesale-orders', 201, clonedBody, location);
    return response;
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Create Wholesale Order',
      detail: (error as Error).message,
      code: 'WHOLESALE_ORDER_CREATE_ERROR',
    });
  }
}
