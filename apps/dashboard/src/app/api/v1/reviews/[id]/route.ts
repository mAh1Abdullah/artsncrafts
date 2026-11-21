import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { moderateReviewRecord } from '@/lib/db/marketplace';

const ModerateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'hidden']),
  reason: z.string().max(400).optional(),
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

    const parsed = ModerateReviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = moderateReviewRecord(id, parsed.data.status, parsed.data.reason);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Review Not Found',
        detail: `No review found with identifier "${id}".`,
        code: 'REVIEW_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Moderate Review',
      detail: (error as Error).message,
      code: 'REVIEW_MODERATE_ERROR',
    });
  }
}
