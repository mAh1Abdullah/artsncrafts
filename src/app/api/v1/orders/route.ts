import { NextRequest, NextResponse } from 'next/server';

export interface EcommerceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  advanceAmount: number;
  dueBalance: number;
  paymentMethod: 'bkash' | 'nagad' | 'uddoktapay' | 'amarpay' | 'cod' | 'card' | 'cash';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'pending' | 'completed' | 'voided' | 'incomplete' | 'cancelled';
  courierService: 'pathao' | 'steadfast' | null;
  trackingCode: string | null;
  courierStatus?: 'pending_pickup' | 'in_transit' | 'delivered' | 'returned';
  fraudRiskScore: number; // 0.00 to 1.00
  fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudSignals?: string[];
  notes?: string;
  createdAt: string;
}

// In-memory store for demo orders initialized with realistic Bangladeshi e-commerce orders
const inMemoryOrders: EcommerceOrder[] = [
  {
    id: 'ord-bd-1001',
    orderNumber: 'WAW-BD-8901',
    customerName: 'Kazi Mahbubur Rahman',
    customerPhone: '+880 1712-345678',
    shippingAddress: 'House 42, Road 11, Block D, Banani, Dhaka 1213',
    items: [
      {
        productId: '1',
        productName: 'Handcrafted Cane Basket',
        sku: 'HC-005',
        quantity: 2,
        unitPrice: 19.99,
      },
      {
        productId: '6',
        productName: 'Traditional Shital Pati Mat',
        sku: 'SP-006',
        quantity: 1,
        unitPrice: 34.99,
      },
    ],
    totalAmount: 74.97,
    advanceAmount: 20.00,
    dueBalance: 54.97,
    paymentMethod: 'bkash',
    paymentStatus: 'partial',
    status: 'pending',
    courierService: 'pathao',
    trackingCode: 'PTH-8890214-BD',
    courierStatus: 'in_transit',
    fraudRiskScore: 0.12,
    fraudRiskLevel: 'LOW',
    fraudSignals: ['Verified mobile operator', 'Customer OTP confirmed'],
    notes: 'Please deliver after 3 PM',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ord-bd-1002',
    orderNumber: 'WAW-BD-8902',
    customerName: 'Nusrat Jahan Chowdhury',
    customerPhone: '+880 1819-987654',
    shippingAddress: 'Amberkhana Point, Sylhet Sadar, Sylhet 3100',
    items: [
      {
        productId: '2',
        productName: 'Wireless Headphones',
        sku: 'WH-001',
        quantity: 1,
        unitPrice: 99.99,
      },
    ],
    totalAmount: 99.99,
    advanceAmount: 99.99,
    dueBalance: 0.00,
    paymentMethod: 'nagad',
    paymentStatus: 'paid',
    status: 'completed',
    courierService: 'steadfast',
    trackingCode: 'STDF-667120-SYL',
    courierStatus: 'delivered',
    fraudRiskScore: 0.05,
    fraudRiskLevel: 'LOW',
    fraudSignals: ['Instant full payment via Nagad', 'Matching shipping address'],
    notes: 'Gift packaging requested',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'ord-bd-1003',
    orderNumber: 'WAW-BD-8903',
    customerName: 'Shakil Anwar',
    customerPhone: '+880 1923-456789',
    shippingAddress: 'Zindabazar Plaza, Level 3, Sylhet',
    items: [
      {
        productId: '3',
        productName: 'Gaming Mouse RGB',
        sku: 'GM-002',
        quantity: 2,
        unitPrice: 59.99,
      },
      {
        productId: '5',
        productName: 'Adjustable LED Desk Lamp',
        sku: 'DL-004',
        quantity: 1,
        unitPrice: 79.99,
      },
    ],
    totalAmount: 199.97,
    advanceAmount: 0.00,
    dueBalance: 199.97,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    status: 'pending',
    courierService: null,
    trackingCode: null,
    fraudRiskScore: 0.78,
    fraudRiskLevel: 'HIGH',
    fraudSignals: ['High value COD order without advance payment', 'Multiple uncollected deliveries recorded in past 30 days'],
    notes: 'COD Verification required before dispatch',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'ord-bd-1004',
    orderNumber: 'WAW-BD-8904',
    customerName: 'Farzana Akter Rima',
    customerPhone: '+880 1630-112233',
    shippingAddress: 'Agrabad Commercial Area, Chittagong 4100',
    items: [
      {
        productId: '8',
        productName: 'Artisan Khadi Cotton Shirt',
        sku: 'AK-008',
        quantity: 3,
        unitPrice: 28.00,
      },
    ],
    totalAmount: 84.00,
    advanceAmount: 84.00,
    dueBalance: 0.00,
    paymentMethod: 'amarpay',
    paymentStatus: 'paid',
    status: 'pending',
    courierService: 'pathao',
    trackingCode: 'PTH-991204-CTG',
    courierStatus: 'pending_pickup',
    fraudRiskScore: 0.15,
    fraudRiskLevel: 'LOW',
    fraudSignals: ['Full payment via AmarPay Aggregator'],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const courier = searchParams.get('courier');

    let result = [...inMemoryOrders];

    if (status) {
      result = result.filter((o) => o.status === status);
    }
    if (paymentMethod) {
      result = result.filter((o) => o.paymentMethod === paymentMethod);
    }
    if (courier) {
      result = result.filter((o) => o.courierService === courier);
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      orders: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      shippingAddress,
      items = [],
      totalAmount,
      advanceAmount = 0,
      paymentMethod = 'cod',
      courierService = null,
      notes = '',
    } = body;

    if (!customerPhone || !items.length) {
      return NextResponse.json(
        { success: false, error: 'Customer phone and items are required' },
        { status: 400 }
      );
    }

    const calculatedTotal = Number(totalAmount) || items.reduce((sum: number, it: { quantity: number; unitPrice: number }) => sum + (it.quantity * it.unitPrice), 0);
    const advance = Number(advanceAmount) || 0;
    const due = Math.max(0, calculatedTotal - advance);

    // Fraud Evaluation Heuristic
    let fraudScore = 0.1;
    const fraudSignals: string[] = [];

    if (paymentMethod === 'cod' && calculatedTotal > 150) {
      fraudScore += 0.45;
      fraudSignals.push('Large COD transaction without full advance');
    }
    if (advance > 0) {
      fraudScore = Math.max(0.05, fraudScore - 0.2);
      fraudSignals.push('Advance payment verified');
    }
    if (customerPhone.startsWith('+88017') || customerPhone.startsWith('+88018') || customerPhone.startsWith('+88019') || customerPhone.startsWith('+88016') || customerPhone.startsWith('+88013') || customerPhone.startsWith('+88015')) {
      fraudSignals.push('Valid Bangladeshi MNO prefix');
    } else {
      fraudScore += 0.3;
      fraudSignals.push('Unrecognized mobile country code/prefix');
    }

    const fraudLevel: 'LOW' | 'MEDIUM' | 'HIGH' = fraudScore > 0.65 ? 'HIGH' : fraudScore > 0.35 ? 'MEDIUM' : 'LOW';

    const newOrder: EcommerceOrder = {
      id: `ord-bd-${Date.now()}`,
      orderNumber: `WAW-BD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName || 'Valued Online Customer',
      customerPhone,
      shippingAddress: shippingAddress || 'Store Pickup / Standard Address',
      items,
      totalAmount: Number(calculatedTotal.toFixed(2)),
      advanceAmount: Number(advance.toFixed(2)),
      dueBalance: Number(due.toFixed(2)),
      paymentMethod,
      paymentStatus: due === 0 ? 'paid' : advance > 0 ? 'partial' : 'unpaid',
      status: 'pending',
      courierService: courierService || null,
      trackingCode: courierService === 'pathao' ? `PTH-${Math.floor(100000 + Math.random() * 900000)}-BD` : courierService === 'steadfast' ? `STDF-${Math.floor(100000 + Math.random() * 900000)}-BD` : null,
      courierStatus: courierService ? 'pending_pickup' : undefined,
      fraudRiskScore: Number(fraudScore.toFixed(2)),
      fraudRiskLevel: fraudLevel,
      fraudSignals,
      notes,
      createdAt: new Date().toISOString(),
    };

    inMemoryOrders.unshift(newOrder);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully with localized BD gateway & fraud evaluation',
      order: newOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, courierService, trackingCode, advanceAmount, courierStatus } = body;

    const idx = inMemoryOrders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = inMemoryOrders[idx];

    if (status) order.status = status;
    if (courierService !== undefined) order.courierService = courierService;
    if (trackingCode !== undefined) order.trackingCode = trackingCode;
    if (courierStatus !== undefined) order.courierStatus = courierStatus;

    if (advanceAmount !== undefined) {
      const newAdvance = Number(advanceAmount);
      order.advanceAmount = newAdvance;
      order.dueBalance = Math.max(0, order.totalAmount - newAdvance);
      order.paymentStatus = order.dueBalance === 0 ? 'paid' : order.advanceAmount > 0 ? 'partial' : 'unpaid';
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
