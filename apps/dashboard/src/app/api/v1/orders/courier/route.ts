import { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, problem, validationProblem } from '@/lib/api/response';
import { bookShipmentRecord } from '@/lib/db/marketplace';

const BookCourierSchema = z.object({
  orderId: z.string().trim().min(1),
  courierService: z.enum(['pathao', 'steadfast', 'redx']),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientAddress: z.string().optional(),
  deliveryType: z.string().default('standard'),
  amountToCollect: z.coerce.number().nonnegative().default(0),
});

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

    const parsed = BookCourierSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const input = parsed.data;
    const shipment = bookShipmentRecord({
      orderId: input.orderId,
      courierCode: input.courierService,
    });

    const trackingUrl =
      input.courierService === 'pathao'
        ? `https://merchant.pathao.com/tracking?consignment_id=${shipment.trackingNumber}`
        : input.courierService === 'redx'
        ? `https://redx.com.bd/track-global-parcel/?trackingId=${shipment.trackingNumber}`
        : `https://steadfast.com.bd/tracking/${shipment.trackingNumber}`;

    return created(
      req,
      {
        shipmentId: shipment.id,
        courierService: input.courierService,
        orderId: input.orderId,
        consignmentId: shipment.trackingNumber,
        trackingUrl,
        status: 'pending_pickup',
        deliveryType: input.deliveryType,
        amountToCollect: input.amountToCollect,
        recipient: {
          name: input.recipientName,
          phone: input.recipientPhone,
          address: input.recipientAddress,
        },
        estimatedDeliveryDays:
          input.courierService === 'pathao'
            ? '24-48 Hours (Inside Dhaka/Sylhet)'
            : '48-72 Hours (National Courier)',
        bookedAt: shipment.createdAt,
        message: `Booked parcel with ${shipment.courierName}. Consignment: ${shipment.trackingNumber}`,
      },
      `/api/v1/shipments/${shipment.id}`
    );
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Courier Booking Failed',
      detail: (error as Error).message,
      code: 'COURIER_BOOK_ERROR',
    });
  }
}
