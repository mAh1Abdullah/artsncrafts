import { NextRequest } from 'next/server';
import { UpdateOrderRequestSchema } from '@waw/contracts';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { findOrderById, updateOrderRecord } from '@/lib/db/marketplace';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = findOrderById(id);
  if (!order) {
    return problem(req, {
      status: 404,
      title: 'Order Not Found',
      detail: `No order found with identifier "${id}".`,
      code: 'ORDER_NOT_FOUND',
    });
  }
  return ok(req, order);
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

    const parsed = UpdateOrderRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateOrderRecord(id, parsed.data);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Order Not Found',
        detail: `No order found with identifier "${id}".`,
        code: 'ORDER_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Order',
      detail: (error as Error).message,
      code: 'ORDER_UPDATE_ERROR',
    });
  }
}
