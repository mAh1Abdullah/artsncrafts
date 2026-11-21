import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { updateSettlementStatus } from '@/lib/db/marketplace';

const UpdateSettlementSchema = z.object({
  status: z.enum(['draft', 'pending_review', 'approved', 'paid', 'cancelled']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const parsed = UpdateSettlementSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateSettlementStatus(id, parsed.data.status);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Settlement Not Found',
        detail: `No settlement record found matching "${id}".`,
        code: 'SETTLEMENT_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Settlement',
      detail: (error as Error).message,
      code: 'SETTLEMENT_UPDATE_ERROR',
    });
  }
}
