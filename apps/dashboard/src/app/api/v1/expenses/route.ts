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
  getExpenses,
  recordExpense,
} from '@/lib/db/products';

const CreateExpenseSchema = z.object({
  category: z.string().trim().min(1).max(100),
  amount: z.coerce.number().positive(),
  description: z.string().trim().max(500).default(''),
  recordedBy: z.string().trim().default('Cashier'),
  expenseDate: z.string().optional(),
  storeId: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;
    const { page, limit } = parsePagination(req, { limit: 50, maxLimit: 200 });
    const expenses = await getExpenses(storeId);
    const { slice, pagination } = paginateArray(expenses, page, limit);
    return list(req, slice, pagination);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Load Expenses',
      detail: (error as Error).message,
      code: 'EXPENSES_FETCH_ERROR',
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

    const parsed = CreateExpenseSchema.safeParse(rawBody);
    if (!parsed.success) {
      return validationProblem(req, parsed.error);
    }

    const input = parsed.data;
    const expense = await recordExpense({
      tenantId: input.tenantId || DEFAULT_TENANT.id,
      storeId: input.storeId || DEFAULT_STORE.id,
      category: input.category,
      amount: input.amount,
      description: input.description,
      recordedBy: input.recordedBy,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
    });

    return created(req, expense, `/api/v1/expenses/${expense.id}`);
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'Failed to Record Expense',
      detail: (error as Error).message,
      code: 'EXPENSE_CREATE_ERROR',
    });
  }
}
