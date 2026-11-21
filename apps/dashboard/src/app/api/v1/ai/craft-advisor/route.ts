import { NextRequest } from 'next/server';
import { CraftAdvisorRequestSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { generateCraftAdvice } from '@/lib/api/gemini';

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

    const parsed = CraftAdvisorRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const advice = await generateCraftAdvice(parsed.data.prompt);
    return ok(req, advice);
  } catch (error) {
    const err = error as Error & { statusCode?: number; code?: string };
    return problem(req, {
      status: err.statusCode ?? 502,
      title: 'Craft Advisor Unavailable',
      detail: err.message || 'Unable to generate craft consultation.',
      code: err.code ?? 'AI_CRAFT_ADVISOR_ERROR',
    });
  }
}
