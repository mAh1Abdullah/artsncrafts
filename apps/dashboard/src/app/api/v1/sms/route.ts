import { NextRequest } from 'next/server';
import { ok, problem } from '@/lib/api/response';

const activeOTPs: Record<string, { otp: string; expiresAt: number }> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return problem(req, {
        status: 400,
        title: 'Invalid JSON Payload',
        detail: 'Request body must be a valid JSON object.',
        code: 'INVALID_JSON',
      });
    }

    const { action = 'send_otp', phone, otp, orderNumber, amount } = body;
    if (!phone) {
      return problem(req, {
        status: 422,
        title: 'Phone Required',
        detail: 'A valid recipient phone number is required.',
        code: 'PHONE_REQUIRED',
      });
    }

    if (action === 'send_otp') {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      activeOTPs[phone] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      return ok(req, {
        action: 'send_otp',
        phone,
        otpDemo: generatedOtp,
        message: `OTP dispatched to ${phone}. Expires in 5 minutes.`,
        sentAt: new Date().toISOString(),
      });
    }

    if (action === 'verify_otp') {
      const record = activeOTPs[phone];
      if (!record) {
        return problem(req, {
          status: 400,
          title: 'OTP Not Found',
          detail: 'No active OTP found for this phone number. Request a new code.',
          code: 'OTP_NOT_FOUND',
        });
      }

      if (Date.now() > record.expiresAt) {
        delete activeOTPs[phone];
        return problem(req, {
          status: 400,
          title: 'OTP Expired',
          detail: 'OTP has expired. Request a new code.',
          code: 'OTP_EXPIRED',
        });
      }

      if (record.otp !== String(otp).trim()) {
        return problem(req, {
          status: 400,
          title: 'Invalid OTP',
          detail: 'Incorrect OTP code. Please try again.',
          code: 'OTP_MISMATCH',
        });
      }

      delete activeOTPs[phone];
      return ok(req, {
        action: 'verify_otp',
        phone,
        verified: true,
        message: `Phone number ${phone} successfully verified.`,
      });
    }

    if (action === 'send_admin_notification') {
      return ok(req, {
        action: 'send_admin_notification',
        phone,
        message: `Admin SMS dispatched for Order #${orderNumber || 'WAW-8891'} ($${amount || '0.00'}).`,
        dispatchedAt: new Date().toISOString(),
      });
    }

    return problem(req, {
      status: 400,
      title: 'Invalid SMS Action',
      detail: `Unsupported action "${action}".`,
      code: 'INVALID_SMS_ACTION',
    });
  } catch (error) {
    return problem(req, {
      status: 500,
      title: 'SMS Gateway Error',
      detail: (error as Error).message,
      code: 'SMS_ERROR',
    });
  }
}
