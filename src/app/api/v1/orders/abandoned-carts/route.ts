import { NextRequest, NextResponse } from 'next/server';

export interface AbandonedCartRecord {
  id: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalValue: number;
  recoveryStatus: 'pending' | 'recovered' | 'lost';
  recoveryAttempts: number;
  lastReminderSentAt?: string;
  createdAt: string;
}

const inMemoryAbandonedCarts: AbandonedCartRecord[] = [
  {
    id: 'cart-ab-001',
    customerPhone: '+880 1715-998877',
    customerName: 'Tareq Mansoor',
    customerEmail: 'tareq.sylhet@gmail.com',
    items: [
      { productId: '1', productName: 'Handcrafted Cane Basket', quantity: 3, price: 19.99 },
      { productId: '7', productName: 'Leather Keyholder & Card Case', quantity: 1, price: 15.00 },
    ],
    totalValue: 74.97,
    recoveryStatus: 'pending',
    recoveryAttempts: 1,
    lastReminderSentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'cart-ab-002',
    customerPhone: '+880 1822-334455',
    customerName: 'Samira Begum',
    items: [
      { productId: '2', productName: 'Wireless Headphones', quantity: 1, price: 99.99 },
    ],
    totalValue: 99.99,
    recoveryStatus: 'recovered',
    recoveryAttempts: 2,
    lastReminderSentAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'cart-ab-003',
    customerPhone: '+880 1911-001122',
    customerName: 'Arifuzzaman Khan',
    items: [
      { productId: '3', productName: 'Gaming Mouse RGB', quantity: 1, price: 59.99 },
      { productId: '4', productName: 'Office Chair Ergonomic', quantity: 1, price: 299.99 },
    ],
    totalValue: 359.98,
    recoveryStatus: 'pending',
    recoveryAttempts: 0,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: inMemoryAbandonedCarts.length,
    abandonedCarts: inMemoryAbandonedCarts,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerPhone, customerName, customerEmail, items = [], totalValue } = body;

    if (!customerPhone || !items.length) {
      return NextResponse.json({ success: false, error: 'Customer phone and items required' }, { status: 400 });
    }

    const calculatedTotal = totalValue || items.reduce((sum: number, it: { quantity: number; price: number }) => sum + (it.quantity * it.price), 0);

    const newCart: AbandonedCartRecord = {
      id: `cart-ab-${Date.now()}`,
      customerPhone,
      customerName,
      customerEmail,
      items,
      totalValue: Number(calculatedTotal.toFixed(2)),
      recoveryStatus: 'pending',
      recoveryAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    inMemoryAbandonedCarts.unshift(newCart);

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart logged for recovery follow-up',
      cart: newCart,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, action, recoveryStatus } = body;

    const cart = inMemoryAbandonedCarts.find((c) => c.id === cartId);
    if (!cart) {
      return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }

    if (action === 'send_reminder') {
      cart.recoveryAttempts += 1;
      cart.lastReminderSentAt = new Date().toISOString();
    }

    if (recoveryStatus) {
      cart.recoveryStatus = recoveryStatus;
    }

    return NextResponse.json({
      success: true,
      message: 'Cart updated successfully',
      cart,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
