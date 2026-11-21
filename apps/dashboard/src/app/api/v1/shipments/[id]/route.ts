import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, problem, validationProblem } from '@/lib/api/response';
import { appendShipmentEventRecord, listShipments } from '@/lib/db/marketplace';

const AppendShipmentEventSchema = z.object({
  status: z.enum(['booked', 'picked_up', 'in_transit', 'delivered', 'returned']),
  location: z.string().trim().min(2).max(160),
  description: z.string().trim().min(3).max(400),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shipment = listShipments().find(
    (s) => s.id === id || s.trackingNumber === id || s.orderId === id || s.orderNumber === id
  );
  if (!shipment) {
    return problem(req, {
      status: 404,
      title: 'Shipment Not Found',
      detail: `No shipment found matching "${id}".`,
      code: 'SHIPMENT_NOT_FOUND',
    });
  }
  return ok(req, shipment);
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

    const parsed = AppendShipmentEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = appendShipmentEventRecord(id, parsed.data);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Shipment Not Found',
        detail: `No shipment found matching "${id}".`,
        code: 'SHIPMENT_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Shipment',
      detail: (error as Error).message,
      code: 'SHIPMENT_UPDATE_ERROR',
    });
  }
}
