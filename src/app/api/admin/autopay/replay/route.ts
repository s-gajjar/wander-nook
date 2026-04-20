import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { ensureAutopayOrder } from "@/src/lib/autopay-order";
import { ensureInvoiceForAutopayPayment } from "@/src/lib/invoice-service";
import { razorpayRequest } from "@/src/lib/razorpay-server";

export const runtime = "nodejs";

type ReplayEntry = {
  paymentId?: string;
  subscriptionId?: string;
};

type RazorpayReplayPayment = {
  id: string;
  invoice_id?: string | null;
};

type RazorpayReplayInvoice = {
  id: string;
  subscription_id?: string | null;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

async function resolveSubscriptionId(
  paymentId: string,
  subscriptionId: string
): Promise<string> {
  const normalizedSubscriptionId = sanitizeText(subscriptionId, 80);
  if (normalizedSubscriptionId) {
    return normalizedSubscriptionId;
  }

  const payment = await razorpayRequest<RazorpayReplayPayment>(`/payments/${paymentId}`);
  const invoiceId = sanitizeText(payment.invoice_id, 80);
  if (!invoiceId) {
    throw new Error("Could not infer subscription id from payment. Paste the sub_... id too.");
  }

  const invoice = await razorpayRequest<RazorpayReplayInvoice>(`/invoices/${invoiceId}`);
  const inferredSubscriptionId = sanitizeText(invoice.subscription_id, 80);
  if (!inferredSubscriptionId) {
    throw new Error("Razorpay invoice does not contain a subscription id for this payment.");
  }

  return inferredSubscriptionId;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          paymentId?: string;
          subscriptionId?: string;
          entries?: ReplayEntry[];
        }
      | null;

    const entries = Array.isArray(body?.entries)
      ? body.entries
      : [{ paymentId: body?.paymentId, subscriptionId: body?.subscriptionId }];

    const normalizedEntries = entries
      .map((entry) => ({
        paymentId: sanitizeText(entry.paymentId, 80),
        subscriptionId: sanitizeText(entry.subscriptionId, 80),
      }))
      .filter((entry) => entry.paymentId);

    if (normalizedEntries.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid pay_... id. sub_... is optional." },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      normalizedEntries.map(async ({ paymentId, subscriptionId }) => {
        try {
          const resolvedSubscriptionId = await resolveSubscriptionId(paymentId, subscriptionId);
          const order = await ensureAutopayOrder({
            paymentId,
            subscriptionId: resolvedSubscriptionId,
            orderNote: "Shopify order replayed manually from admin.",
          });

          if (order.status === "payment_not_captured") {
            return {
              paymentId,
              subscriptionId: resolvedSubscriptionId,
              ok: true,
              orderStatus: order.status,
              paymentStatus: order.paymentStatus,
            };
          }

          let invoice:
            | {
                invoiceId: string;
                invoiceNumber: string;
                publicToken: string;
                created: boolean;
                emailSent: boolean;
                emailSkippedReason?: string;
              }
            | undefined;

          try {
            invoice = await ensureInvoiceForAutopayPayment({
              paymentId,
              subscriptionId: resolvedSubscriptionId,
              sourceEvent: "admin_autopay_replay",
              order: order.order,
            });
          } catch (error) {
            return {
              paymentId,
              subscriptionId: resolvedSubscriptionId,
              ok: false,
              orderStatus: order.status,
              orderName: order.order.name,
              error:
                error instanceof Error ? error.message : "Invoice/customer replay failed after order replay.",
            };
          }

          return {
            paymentId,
            subscriptionId: resolvedSubscriptionId,
            ok: true,
            orderStatus: order.status,
            orderName: order.order.name,
            invoiceNumber: invoice.invoiceNumber,
            invoiceCreated: invoice.created,
            invoiceEmailSent: invoice.emailSent,
            invoiceEmailSkippedReason: invoice.emailSkippedReason,
          };
        } catch (error) {
          return {
            paymentId,
            subscriptionId: sanitizeText(subscriptionId, 80),
            ok: false,
            error: error instanceof Error ? error.message : "Replay failed.",
          };
        }
      })
    );

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (error) {
    console.error("Failed to replay autopay payments from admin", error);
    return NextResponse.json({ error: "Failed to replay autopay payments." }, { status: 500 });
  }
}
