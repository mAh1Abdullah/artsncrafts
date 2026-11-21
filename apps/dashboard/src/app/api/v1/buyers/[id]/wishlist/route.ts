import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { getBuyerProfile, toggleBuyerWishlist } from '@/lib/db/marketplace';

const ToggleWishlistSchema = z.object({
  productId: z.string().trim().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = getBuyerProfile(id);
  return ok(req, { wishlistProductIds: profile.wishlistProductIds });
}

export async function POST(
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

    const parsed = ToggleWishlistSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const result = toggleBuyerWishlist(id, parsed.data.productId);
    return ok(req, result);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Toggle Wishlist',
      detail: (error as Error).message,
      code: 'WISHLIST_UPDATE_ERROR',
    });
  }
}
