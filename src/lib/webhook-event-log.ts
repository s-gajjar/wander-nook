import { prisma } from "@/src/lib/prisma";

export type WebhookEventInput = {
  provider: "razorpay";
  eventType: string;
  eventId?: string;
  paymentId?: string;
  subscriptionId?: string;
  payload?: unknown;
};

export type WebhookEventRecord = {
  id: string;
  isDuplicate: boolean;
};

/**
 * Records a webhook event and checks for duplicates.
 * Returns { id, isDuplicate } — if isDuplicate is true, skip processing.
 */
export async function recordWebhookEvent(
  input: WebhookEventInput
): Promise<WebhookEventRecord> {
  // If we have an eventId, check for deduplication
  if (input.eventId) {
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: input.provider,
          eventId: input.eventId,
        },
      },
    });

    if (existing) {
      // Increment attempts counter
      await prisma.webhookEvent.update({
        where: { id: existing.id },
        data: { attempts: { increment: 1 } },
      });
      return { id: existing.id, isDuplicate: true };
    }
  }

  const record = await prisma.webhookEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      eventId: input.eventId ?? null,
      paymentId: input.paymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      status: "received",
      payload: input.payload as object ?? null,
    },
  });

  return { id: record.id, isDuplicate: false };
}

/**
 * Marks a webhook event as processed.
 */
export async function markWebhookProcessed(id: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id },
    data: { status: "processed", processedAt: new Date() },
  });
}

/**
 * Marks a webhook event as failed.
 */
export async function markWebhookFailed(id: string, error: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id },
    data: { status: "failed", error: error.slice(0, 1000) },
  });
}

/**
 * Marks a webhook event as skipped.
 */
export async function markWebhookSkipped(id: string, reason: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { id },
    data: { status: "skipped", error: reason.slice(0, 500) },
  });
}
