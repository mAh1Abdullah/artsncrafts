import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { getBuyerProfile, updateBuyerProfile } from '@/lib/db/marketplace';

const UpdateBuyerProfileSchema = z.object({
  trustScore: z.coerce.number().min(0).max(100).optional(),
  codEligible: z.boolean().optional(),
  styleProfile: z
    .object({
      department: z.string().min(1).max(120),
      favoriteCrafts: z.array(z.string()).max(10),
      preferredColors: z.array(z.string()).max(10),
    })
    .optional(),
});

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

    const parsed = UpdateBuyerProfileSchema.safeParse(rawBody);
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
