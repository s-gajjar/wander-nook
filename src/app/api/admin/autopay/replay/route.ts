import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { ensureAutopayOrder } from "@/src/lib/autopay-order";
import { ensureInvoiceForAutopayPayment } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

type ReplayEntry = {
  paymentId?: string;
  subscriptionId?: string;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
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
      .filter((entry) => entry.paymentId && entry.subscriptionId);

    if (normalizedEntries.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one valid paymentId and subscriptionId pair." },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      normalizedEntries.map(async ({ paymentId, subscriptionId }) => {
        try {
          const order = await ensureAutopayOrder({
            paymentId,
            subscriptionId,
            orderNote: "Shopify order replayed manually from admin.",
          });

          if (order.status === "payment_not_captured") {
            return {
              paymentId,
              subscriptionId,
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
              subscriptionId,
              sourceEvent: "admin_autopay_replay",
              order: order.order,
            });
          } catch (error) {
            return {
              paymentId,
              subscriptionId,
              ok: false,
              orderStatus: order.status,
              orderName: order.order.name,
              error:
                error instanceof Error ? error.message : "Invoice/customer replay failed after order replay.",
            };
          }

          return {
            paymentId,
            subscriptionId,
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
            subscriptionId,
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
