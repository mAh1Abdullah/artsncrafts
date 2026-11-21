import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  list,
  ok,
  paginateArray,
  parsePagination,
  problem,
  validationProblem,
} from '@/lib/api/response';
import {
  listCourierProviders,
  listDeliveryZones,
  suggestCourierForLocation,
  updateDeliveryZoneTariff,
} from '@/lib/db/marketplace';

const UpdateTariffSchema = z.object({
  idOrCode: z.string().min(1),
  basePriceBdt: z.coerce.number().nonnegative(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('suggest') === 'true') {
    const district = searchParams.get('district') || 'Dhaka';
    const upazila = searchParams.get('upazila') || '';
    const suggestion = suggestCourierForLocation(district, upazila);
    return ok(req, suggestion);
  }

  if (searchParams.get('includeCouriers') === 'true') {
    return ok(req, {
      zones: listDeliveryZones(),
      couriers: listCourierProviders(),
    });
  }

  const { page, limit } = parsePagination(req, { limit: 20, maxLimit: 50 });
  const zones = listDeliveryZones();
  const { slice, pagination } = paginateArray(zones, page, limit);
  return list(req, slice, pagination);
}

export async function PATCH(req: NextRequest) {
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

    const parsed = UpdateTariffSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const updated = updateDeliveryZoneTariff(parsed.data.idOrCode, parsed.data.basePriceBdt);
    if (!updated) {
      return problem(req, {
        status: 404,
        title: 'Delivery Zone Not Found',
        detail: `No delivery zone matching "${parsed.data.idOrCode}".`,
        code: 'ZONE_NOT_FOUND',
      });
    }

    return ok(req, updated);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Update Delivery Zone',
      detail: (error as Error).message,
      code: 'ZONE_UPDATE_ERROR',
    });
  }
}
