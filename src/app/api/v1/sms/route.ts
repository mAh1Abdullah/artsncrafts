import { NextRequest, NextResponse } from 'next/server';

// Mock in-memory OTP store with 5-minute expiry
const activeOTPs: Record<string, { otp: string; expiresAt: number }> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'send_otp', phone, otp, orderNumber, amount } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    if (action === 'send_otp') {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      activeOTPs[phone] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      return NextResponse.json({
        success: true,
        action: 'send_otp',
        phone,
        otpDemo: generatedOtp, // returned for demo/testing display
        message: `OTP sent successfully to ${phone} via Bangladeshi SMS Gateway (Mobireach/Greenweb). Expires in 5 minutes.`,
        sentAt: new Date().toISOString(),
      });
    }

    if (action === 'verify_otp') {
      const record = activeOTPs[phone];
      if (!record) {
        return NextResponse.json({ success: false, error: 'No active OTP found for this phone number. Please request a new OTP.' }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        delete activeOTPs[phone];
        return NextResponse.json({ success: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      if (record.otp !== String(otp).trim()) {
        return NextResponse.json({ success: false, error: 'Incorrect OTP code. Please try again.' }, { status: 400 });
      }

      delete activeOTPs[phone];
      return NextResponse.json({
        success: true,
        action: 'verify_otp',
        phone,
        verified: true,
        message: `Phone number ${phone} successfully verified.`,
      });
    }

    if (action === 'send_admin_notification') {
      return NextResponse.json({
        success: true,
        action: 'send_admin_notification',
        phone,
        message: `Admin SMS Notification dispatched: "New Order #${orderNumber || 'WAW-8891'} received! Total: $${amount || '0.00'}. Login to WAW-POS to process shipment."`,
        dispatchedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
