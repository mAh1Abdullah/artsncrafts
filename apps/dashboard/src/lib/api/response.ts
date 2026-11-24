import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type {
  ApiList,
  ApiSuccess,
  PaginationMeta,
  ProblemDetails,
  ValidationFieldError,
} from '@waw/contracts';

const PROBLEM_BASE_URI = 'https://api.waw-platform.local/errors';

export function getRequestId(req: NextRequest): string {
  return (
    req.headers.get('x-request-id') ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  );
}

export function buildCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  const configured = (process.env.STOREFRONT_URL || process.env.STOREFRONT_ORIGIN || 'http://localhost:4321').replace(/\/+$/, '');
  const apiBound = (process.env.API_URL || process.env.DASHBOARD_URL || '').replace(/\/+$/, '');
  const allowedOrigins = new Set([
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    configured,
    ...(apiBound ? [apiBound] : []),
  ]);

  const headers: Record<string, string> = {
    Vary: 'Origin',
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] =
      'Content-Type, Authorization, Idempotency-Key, X-Request-Id, X-Tenant-Id, X-Store-Id, X-User-Role, X-Subscription-Tier';
  }
  return headers;
}

export function ok<T>(
  req: NextRequest,
  data: T,
  options?: { status?: number; cacheControl?: string; extraHeaders?: Record<string, string> }
): NextResponse<ApiSuccess<T>> {
  const requestId = getRequestId(req);
  const body: ApiSuccess<T> = {
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    ...buildCorsHeaders(req),
    ...(options?.extraHeaders ?? {}),
  };

  if (options?.cacheControl) {
    headers['Cache-Control'] = options.cacheControl;
  }

  return NextResponse.json(body, {
    status: options?.status ?? 200,
    headers,
  });
}

export function created<T>(
  req: NextRequest,
  data: T,
  location?: string
): NextResponse<ApiSuccess<T>> {
  const extraHeaders: Record<string, string> = {};
  if (location) {
    extraHeaders['Location'] = location;
  }
  return ok(req, data, { status: 201, extraHeaders });
}

export function noContent(req: NextRequest): NextResponse {
  const requestId = getRequestId(req);
  return new NextResponse(null, {
    status: 204,
    headers: {
      'X-Request-Id': requestId,
      ...buildCorsHeaders(req),
    },
  });
}

export interface ParsedPagination {
  page: number;
  limit: number;
  sort: string;
}

export function parsePagination(
  req: NextRequest,
  defaults: { limit?: number; maxLimit?: number; sort?: string } = {}
): ParsedPagination {
  const { searchParams } = new URL(req.url);
  const rawPage = Number(searchParams.get('page') ?? '1');
  const rawLimit = Number(searchParams.get('limit') ?? String(defaults.limit ?? 20));
  const maxLimit = defaults.maxLimit ?? 100;

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : defaults.limit ?? 20;
  const sort = searchParams.get('sort') || defaults.sort || '-createdAt';

  return { page, limit, sort };
}

export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number
): { slice: T[]; pagination: PaginationMeta } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const slice = items.slice(start, start + limit);

  return {
    slice,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

export function list<T>(
  req: NextRequest,
  items: T[],
  pagination: PaginationMeta,
  options?: { cacheControl?: string }
): NextResponse<ApiList<T>> {
  const requestId = getRequestId(req);
  const body: ApiList<T> = {
    data: items,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: 'v1',
      pagination,
    },
  };

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    ...buildCorsHeaders(req),
  };

  if (options?.cacheControl) {
    headers['Cache-Control'] = options.cacheControl;
  }

  return NextResponse.json(body, { status: 200, headers });
}

export function problem(
  req: NextRequest,
  params: {
    status: number;
    title: string;
    detail: string;
    code: string;
    errors?: ValidationFieldError[];
  }
): NextResponse<ProblemDetails> {
  const requestId = getRequestId(req);
  const instance = new URL(req.url).pathname;

  const body: ProblemDetails = {
    type: `${PROBLEM_BASE_URI}/${params.code.toLowerCase().replace(/_/g, '-')}`,
    title: params.title,
    status: params.status,
    detail: params.detail,
    instance,
    code: params.code,
    requestId,
    ...(params.errors && params.errors.length > 0 ? { errors: params.errors } : {}),
  };

  return NextResponse.json(body, {
    status: params.status,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Request-Id': requestId,
      ...buildCorsHeaders(req),
    },
  });
}

export function validationProblem(
  req: NextRequest,
  zodError: ZodError
): NextResponse<ProblemDetails> {
  const errors: ValidationFieldError[] = zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));

  return problem(req, {
    status: 422,
    title: 'Validation Failed',
    detail: 'One or more request parameters failed schema validation.',
    code: 'VALIDATION_ERROR',
    errors,
  });
}

// ============================================================================
// IDEMPOTENCY-KEY IN-MEMORY CACHE FOR SAFE RETRIES ON POST MUTATIONS
// ============================================================================
interface StoredIdempotentResponse {
  status: number;
  body: unknown;
  location?: string;
  storedAt: number;
}

const idempotencyStore = new Map<string, StoredIdempotentResponse>();
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 30; // 30 minutes

export function checkIdempotency(
  req: NextRequest,
  scope: string
): NextResponse | null {
  const key = req.headers.get('idempotency-key')?.trim();
  if (!key) return null;

  const fullKey = `${scope}:${key}`;
  const cached = idempotencyStore.get(fullKey);
  if (!cached) return null;

  if (Date.now() - cached.storedAt > IDEMPOTENCY_TTL_MS) {
    idempotencyStore.delete(fullKey);
    return null;
  }

  const requestId = getRequestId(req);
  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    'Idempotency-Replayed': 'true',
    ...buildCorsHeaders(req),
  };
  if (cached.location) {
    headers['Location'] = cached.location;
  }

  return NextResponse.json(cached.body, {
    status: cached.status,
    headers,
  });
}

export function saveIdempotency(
  req: NextRequest,
  scope: string,
  status: number,
  body: unknown,
  location?: string
): void {
  const key = req.headers.get('idempotency-key')?.trim();
  if (!key) return;
  idempotencyStore.set(`${scope}:${key}`, {
    status,
    body,
    location,
    storedAt: Date.now(),
  });
}
