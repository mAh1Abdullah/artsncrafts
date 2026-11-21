import { NextRequest } from 'next/server';
import { CreateCouponSchema } from '@waw/contracts';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import { createCouponRecord, listCoupons } from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { page, limit } = parsePagination(req, { limit: 50, maxLimit: 100 });
  const coupons = listCoupons();
  const { slice, pagination } = paginateArray(coupons, page, limit);
  return list(req, slice, pagination);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = CreateCouponSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const result = createCouponRecord(parsed.data);
    if ('conflict' in result) {
      return problem(req, {
        status: 409,
        title: 'Duplicate Coupon Code',
        detail: result.conflict,
        code: 'DUPLICATE_COUPON',
      });
    }

    return created(req, result, `/api/v1/coupons/${result.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Create Coupon',
      detail: (error as Error).message,
      code: 'COUPON_CREATE_ERROR',
    });
  }
}
