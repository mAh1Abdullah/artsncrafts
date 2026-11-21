import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  created,
  list,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import { bookShipmentRecord, listShipments } from '@/lib/db/marketplace';

const BookShipmentSchema = z.object({
  orderId: z.string().trim().min(1),
  courierCode: z.enum(['pathao', 'steadfast', 'redx']),
  trackingNumber: z.string().trim().max(80).optional(),
  overrideReason: z.string().trim().max(300).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId')?.trim();
  const { page, limit } = parsePagination(req, { limit: 25, maxLimit: 100 });

  let shipments = listShipments();
  if (orderId) {
    shipments = shipments.filter((s) => s.orderId === orderId || s.orderNumber === orderId);
  }

  const { slice, pagination } = paginateArray(shipments, page, limit);
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

    const parsed = BookShipmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const shipment = bookShipmentRecord(parsed.data);
    return created(req, shipment, `/api/v1/shipments/${shipment.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Book Shipment',
      detail: (error as Error).message,
      code: 'SHIPMENT_BOOK_ERROR',
    });
  }
}
