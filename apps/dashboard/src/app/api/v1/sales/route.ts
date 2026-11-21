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
import {
  DEFAULT_STORE,
  DEFAULT_TENANT,
  getSales,
  recordSale,
} from '@/lib/db/products';

const CreateSaleSchema = z.object({
  invoiceNumber: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        sku: z.string(),
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().nonnegative().default(0),
        unitPrice: z.coerce.number().nonnegative(),
        totalPrice: z.coerce.number().nonnegative(),
      })
    )
    .min(1),
  subtotal: z.coerce.number().nonnegative().default(0),
  discountAmount: z.coerce.number().nonnegative().default(0),
  taxAmount: z.coerce.number().nonnegative().default(0),
  totalAmount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.string().default('cash'),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  storeId: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;
    const { page, limit } = parsePagination(req, { limit: 50, maxLimit: 200 });
    const sales = await getSales(storeId);
    const { slice, pagination } = paginateArray(sales, page, limit);
    return list(req, slice, pagination);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Sales',
      detail: (error as Error).message,
      code: 'SALES_FETCH_ERROR',
    });
  }
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

    const parsed = CreateSaleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const input = parsed.data;
    const sale = await recordSale({
      tenantId: input.tenantId || DEFAULT_TENANT.id,
      storeId: input.storeId || DEFAULT_STORE.id,
      invoiceNumber: input.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      subtotal: input.subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      totalAmount: input.totalAmount,
      paymentMethod: input.paymentMethod,
      customerName: input.customerName,
      notes: input.notes,
      items: input.items,
    });

    return created(req, sale, `/api/v1/sales/${sale.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Record Sale',
      detail: (error as Error).message,
      code: 'SALE_CREATE_ERROR',
    });
  }
}
