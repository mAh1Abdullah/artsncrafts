import { NextRequest } from 'next/server';
import { ValidateCouponSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { validateCouponCode } from '@/lib/db/marketplace';

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

    const parsed = ValidateCouponSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const result = validateCouponCode(parsed.data.code, parsed.data.subtotalBdt);
    return ok(req, result);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Validate Coupon',
      detail: (error as Error).message,
      code: 'COUPON_VALIDATE_ERROR',
    });
  }
}
