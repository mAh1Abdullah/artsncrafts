import { NextRequest } from 'next/server';
import { UpdateBuyerProfileRequestSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { getBuyerProfile, updateBuyerProfile } from '@/lib/db/marketplace';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ok(req, getBuyerProfile(id));
}

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

    const parsed = UpdateBuyerProfileRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateBuyerProfile(id, parsed.data);
    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Buyer Profile',
      detail: (error as Error).message,
      code: 'BUYER_PROFILE_UPDATE_ERROR',
    });
  }
}
