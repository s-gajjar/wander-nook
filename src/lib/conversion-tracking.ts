import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";

type TrackConversionEventInput = {
  eventName: string;
  planId?: string;
  customerEmail?: string;
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
  metadata?: Record<string, unknown>;
};

function normalizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

export async function trackConversionEvent(input: TrackConversionEventInput) {
  const eventName = normalizeText(input.eventName, 100);
  if (!eventName) {
    return;
  }

  const metadata = input.metadata
    ? (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue)
    : undefined;

  try {
    await prisma.conversionEvent.create({
      data: {
        eventName,
        planId: normalizeText(input.planId, 40) || null,
        customerEmail: normalizeText((input.customerEmail || "").toLowerCase(), 120) || null,
        razorpayPaymentId: normalizeText(input.razorpayPaymentId, 80) || null,
        razorpaySubscriptionId: normalizeText(input.razorpaySubscriptionId, 80) || null,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to track conversion event", error);
  }
}
