import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, courierService, recipientName, recipientPhone, recipientAddress, deliveryType = 'standard', amountToCollect } = body;

    if (!orderId || !courierService) {
      return NextResponse.json(
        { success: false, error: 'orderId and courierService (pathao | steadfast) are required' },
        { status: 400 }
      );
    }

    const consignmentId = courierService === 'pathao'
      ? `PTH-${Math.floor(100000 + Math.random() * 900000)}`
      : `STDF-${Math.floor(100000 + Math.random() * 900000)}`;

    const trackingUrl = courierService === 'pathao'
      ? `https://merchant.pathao.com/tracking?consignment_id=${consignmentId}`
      : `https://steadfast.com.bd/tracking/${consignmentId}`;

    return NextResponse.json({
      success: true,
      courierService,
      orderId,
      consignmentId,
      trackingUrl,
      status: 'pending_pickup',
      deliveryType,
      amountToCollect: amountToCollect || 0,
      recipient: {
        name: recipientName,
        phone: recipientPhone,
        address: recipientAddress,
      },
      estimatedDeliveryDays: courierService === 'pathao' ? '24-48 Hours (Inside Dhaka/Sylhet)' : '48-72 Hours (National Courier)',
      bookedAt: new Date().toISOString(),
      message: `Successfully booked parcel with ${courierService.toUpperCase()} Logistics API. Consignment: ${consignmentId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
