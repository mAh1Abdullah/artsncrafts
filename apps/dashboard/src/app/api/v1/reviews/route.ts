import { NextRequest } from 'next/server';
import { CreateReviewSchema } from '@waw/contracts';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import { createReviewRecord, listReviews } from '@/lib/db/marketplace';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId') || undefined;
  const status = searchParams.get('status') || undefined;
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

  const reviews = listReviews({ productId, status });
  const { slice, pagination } = paginateArray(reviews, page, limit);
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

    const parsed = CreateReviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const review = createReviewRecord(parsed.data);
    return created(req, review, `/api/v1/reviews/${review.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Submit Review',
      detail: (error as Error).message,
      code: 'REVIEW_CREATE_ERROR',
    });
  }
}
