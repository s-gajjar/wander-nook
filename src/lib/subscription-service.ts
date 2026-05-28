import { prisma } from "@/src/lib/prisma";
import { sendTransactionalEmail } from "@/src/lib/mailer";

const OWNER_EMAIL = "contact@wandernook.in";

/**
 * Ensure a subscription record exists for a given Razorpay subscription.
 * Called after successful payment processing.
 */
export async function ensureSubscription(input: {
  customerId: string;
  razorpaySubscriptionId: string;
  planId: string;
  planLabel: string;
  amountPaise: number;
  cycle: string;
}) {
  const existing = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
  });

  if (existing) {
    // Update on each successful payment
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "active",
        lastPaymentAt: new Date(),
        failedAt: null,
        failureReason: null,
        totalPaid: { increment: input.amountPaise },
        paymentCount: { increment: 1 },
      },
    });
  }

  // Calculate expiry for annual plans
  let expiresAt: Date | undefined;
  if (input.cycle === "yearly") {
    expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  return prisma.subscription.create({
    data: {
      customerId: input.customerId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      planId: input.planId,
      planLabel: input.planLabel,
      amountPaise: input.amountPaise,
      currency: "INR",
      cycle: input.cycle,
      status: "active",
      startedAt: new Date(),
      lastPaymentAt: new Date(),
      expiresAt,
      totalPaid: input.amountPaise,
      paymentCount: 1,
    },
  });
}

/**
 * Handle a failed payment — mark subscription and notify owner via email.
 */
export async function handlePaymentFailure(input: {
  razorpaySubscriptionId: string;
  razorpayPaymentId?: string;
  reason?: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
    include: { customer: true },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        failedAt: new Date(),
        failureReason: input.reason || "Payment failed",
        status: "halted",
      },
    });
  }

  const customerName = subscription?.customer.fullName || input.customerName || "Unknown";
  const customerEmail = subscription?.customer.email || input.customerEmail || "Unknown";
  const planLabel = subscription?.planLabel || "Unknown Plan";
  const amountInr = subscription ? (subscription.amountPaise / 100).toFixed(0) : "?";

  // Send alert email to owner
  await sendTransactionalEmail({
    to: OWNER_EMAIL,
    subject: `⚠️ Payment Failed — ${customerName} (${planLabel})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #DC2626; font-size: 20px; margin-bottom: 16px;">Payment Failed</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          A recurring payment has failed. The subscription is now <strong>halted</strong> until the next retry or manual resolution.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6B7280;">Customer</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td style="padding: 8px 0; color: #111827;">${customerEmail}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Plan</td><td style="padding: 8px 0; color: #111827;">${planLabel} (₹${amountInr})</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Reason</td><td style="padding: 8px 0; color: #DC2626;">${input.reason || "Payment declined"}</td></tr>
          ${input.razorpayPaymentId ? `<tr><td style="padding: 8px 0; color: #6B7280;">Payment ID</td><td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 12px;">${input.razorpayPaymentId}</td></tr>` : ""}
        </table>
        <a href="https://wandernook.in/admin/customers${subscription ? `/${subscription.customerId}` : ""}" style="display: inline-block; background: #111827; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">
          View Customer →
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
          You may want to reach out to the customer or check Razorpay dashboard for retry status.
        </p>
      </div>
    `,
    text: `Payment Failed: ${customerName} (${customerEmail}) — ${planLabel} ₹${amountInr}. Reason: ${input.reason || "Payment declined"}. Payment ID: ${input.razorpayPaymentId || "N/A"}`,
  });
}

/**
 * Handle subscription cancellation.
 */
export async function handleSubscriptionCancelled(input: {
  razorpaySubscriptionId: string;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: input.razorpaySubscriptionId },
    include: { customer: true },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    // Notify owner
    await sendTransactionalEmail({
      to: OWNER_EMAIL,
      subject: `🚨 Subscription Cancelled — ${subscription.customer.fullName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #D97706; font-size: 20px; margin-bottom: 16px;">Subscription Cancelled</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            <strong>${subscription.customer.fullName}</strong> has cancelled their <strong>${subscription.planLabel}</strong> subscription.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #6B7280;">Customer</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${subscription.customer.fullName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td style="padding: 8px 0; color: #111827;">${subscription.customer.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Plan</td><td style="padding: 8px 0; color: #111827;">${subscription.planLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Was paying</td><td style="padding: 8px 0; color: #111827;">₹${(subscription.amountPaise / 100).toFixed(0)}/${subscription.cycle === "yearly" ? "year" : "month"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7280;">Total paid</td><td style="padding: 8px 0; color: #111827;">₹${(subscription.totalPaid / 100).toFixed(0)} (${subscription.paymentCount} payments)</td></tr>
          </table>
          <a href="https://wandernook.in/admin/customers/${subscription.customerId}" style="display: inline-block; background: #111827; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">
            View Customer →
          </a>
        </div>
      `,
      text: `Subscription Cancelled: ${subscription.customer.fullName} (${subscription.customer.email}) — ${subscription.planLabel}. Total paid: ₹${(subscription.totalPaid / 100).toFixed(0)}`,
    });
  }

  return subscription;
}
