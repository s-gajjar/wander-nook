import { NextRequest, NextResponse } from "next/server";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";

export const runtime = "nodejs";

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function readMetadataText(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
  maxLength = 120
) {
  if (!metadata) {
    return "";
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number") {
      const normalized = sanitizeText(String(value), maxLength);
      if (normalized) {
        return normalized;
      }
    }
  }

  return "";
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

    const metadata =
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : undefined;

    await trackConversionEvent({
      eventName,
      planId: sanitizeText(body?.planId, 40) || readMetadataText(metadata, ["plan_id"], 40),
      customerEmail:
        sanitizeText(body?.customerEmail, 120) ||
        readMetadataText(metadata, ["customer_email"], 120),
      razorpayPaymentId:
        sanitizeText(body?.razorpayPaymentId, 80) ||
        readMetadataText(metadata, ["payment_id"], 80),
      razorpaySubscriptionId:
        sanitizeText(body?.razorpaySubscriptionId, 80) ||
        readMetadataText(metadata, ["subscription_id"], 80),
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track conversion event", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
