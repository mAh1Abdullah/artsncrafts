import { NextRequest } from 'next/server';
import { ProductStoryRequestSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { generateArtisanProductStory } from '@/lib/api/gemini';

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

    const parsed = ProductStoryRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const story = await generateArtisanProductStory(parsed.data);
    return ok(req, story);
  } catch (error) {
    const err = error as Error & { statusCode?: number; code?: string };
    return problem(req, {
      status: err.statusCode ?? 502,
      title: 'Product Story Generator Unavailable',
      detail: err.message || 'Unable to generate artisan product story.',
      code: err.code ?? 'AI_PRODUCT_STORY_ERROR',
    });
  }
}
