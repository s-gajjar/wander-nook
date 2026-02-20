import { NextRequest, NextResponse } from "next/server";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";

export const runtime = "nodejs";

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          eventName?: string;
          planId?: string;
          customerEmail?: string;
          razorpayPaymentId?: string;
          razorpaySubscriptionId?: string;
          metadata?: Record<string, unknown>;
        }
      | null;

    const eventName = sanitizeText(body?.eventName, 100);
    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    await trackConversionEvent({
      eventName,
      planId: sanitizeText(body?.planId, 40),
      customerEmail: sanitizeText(body?.customerEmail, 120),
      razorpayPaymentId: sanitizeText(body?.razorpayPaymentId, 80),
      razorpaySubscriptionId: sanitizeText(body?.razorpaySubscriptionId, 80),
      metadata: body?.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track conversion event", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
