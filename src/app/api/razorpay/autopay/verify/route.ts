import { NextRequest, NextResponse } from "next/server";
import {
  getAutopayPlanConfig,
  verifyRazorpaySubscriptionSignature,
} from "@/src/lib/razorpay-server";
import { ensureAutopayOrder } from "@/src/lib/autopay-order";
import { ensureInvoiceForAutopayPayment } from "@/src/lib/invoice-service";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";
import {
  buildRazorpayPurchaseEventId,
  getMetaRequestData,
  sendMetaPurchaseEvent,
} from "@/src/lib/meta-conversions-api";

export const runtime = "nodejs";

type VerifyAutopayRequestBody = {
  planId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  payment?: {
    paymentId?: string;
    subscriptionId?: string;
    signature?: string;
  };
};

function sanitizeText(value: string, maxLength = 120) {
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyAutopayRequestBody;
    const planId = sanitizeText(body.planId || "", 40);

    if (!getAutopayPlanConfig(planId)) {
      return NextResponse.json({ error: "Invalid autopay plan selected." }, { status: 400 });
    }

    const paymentId = sanitizeText(body.payment?.paymentId || "", 80);
    const subscriptionId = sanitizeText(body.payment?.subscriptionId || "", 80);
    const signature = sanitizeText(body.payment?.signature || "", 200);

    if (!paymentId || !subscriptionId || !signature) {
      return NextResponse.json(
        { error: "Missing Razorpay payment verification details." },
        { status: 400 }
      );
    }

    const signatureValid = verifyRazorpaySubscriptionSignature({
      paymentId,
      subscriptionId,
      signature,
    });

    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 401 });
    }

    const ensureResult = await ensureAutopayOrder({
      paymentId,
      subscriptionId,
      expectedPlanId: planId,
      customer: body.customer,
    });

    if (ensureResult.status === "payment_not_captured") {
      await trackConversionEvent({
        eventName: "autopay_payment_not_captured",
        planId,
        customerEmail: body.customer?.email,
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId: subscriptionId,
        metadata: {
          paymentStatus: ensureResult.paymentStatus,
          customerName: body.customer?.name,
          customerPhone: body.customer?.phone,
        },
      });

      return NextResponse.json(
        {
          error:
            "Payment is not captured yet. Order will be created only after successful debit.",
          paymentStatus: ensureResult.paymentStatus,
        },
        { status: 409 }
      );
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
    let invoiceError: string | undefined;

    try {
      invoice = await ensureInvoiceForAutopayPayment({
        paymentId,
        subscriptionId,
        sourceEvent: "autopay_verify",
        customer: body.customer,
        order: ensureResult.order,
      });
    } catch (error) {
      invoiceError = error instanceof Error ? error.message : "Failed to generate invoice.";
      console.error("Autopay verify invoice generation failed", error);
    }

    await trackConversionEvent({
      eventName: "autopay_payment_verified",
      planId,
      customerEmail: body.customer?.email,
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: subscriptionId,
      metadata: {
        orderStatus: ensureResult.status,
        invoiceCreated: invoice?.created ?? false,
        invoiceEmailSent: invoice?.emailSent ?? false,
        customerName: body.customer?.name,
        customerPhone: body.customer?.phone,
      },
    });

    const metaRequestData = getMetaRequestData(request);
    const shouldTrackPurchase = ensureResult.status === "created";
    const purchaseEventId = shouldTrackPurchase ? buildRazorpayPurchaseEventId(paymentId) : undefined;
    if (shouldTrackPurchase && purchaseEventId) {
      await sendMetaPurchaseEvent({
        eventId: purchaseEventId,
        eventSourceUrl: ensureResult.conversion.eventSourceUrl,
        value: ensureResult.conversion.amountInr,
        currency: ensureResult.conversion.currency,
        contentName: `${ensureResult.conversion.planId} Purchase`,
        contentIds: [ensureResult.conversion.planId],
        planId: ensureResult.conversion.planId,
        orderId: ensureResult.order.name,
        customer: {
          name: ensureResult.conversion.customer.name,
          email: ensureResult.conversion.customer.email,
          phone: ensureResult.conversion.customer.phone,
          city: ensureResult.conversion.customer.city,
          state: ensureResult.conversion.customer.state,
          pincode: ensureResult.conversion.customer.pincode,
          country: ensureResult.conversion.customer.country,
          fbp: ensureResult.conversion.fbp || metaRequestData.fbp,
          fbc: ensureResult.conversion.fbc || metaRequestData.fbc,
          clientIpAddress: metaRequestData.clientIpAddress,
          clientUserAgent: metaRequestData.clientUserAgent,
        },
      });
    }

    if (ensureResult.status === "already_exists") {
      return NextResponse.json({
        ok: true,
        meta: {
          purchaseEventId,
          shouldTrackPurchase,
        },
        alreadyExists: true,
        order: ensureResult.order,
        invoice,
        invoiceError,
      });
    }

    return NextResponse.json({
      ok: true,
      meta: {
        purchaseEventId,
        shouldTrackPurchase,
      },
      alreadyExists: ensureResult.status !== "created",
      order: {
        id: ensureResult.order.id,
        name: ensureResult.order.name,
      },
      invoice,
      invoiceError,
    });
  } catch (error) {
    console.error("Failed to verify Razorpay autopay payment", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete autopay checkout. Please try again.",
      },
      { status: 500 }
    );
  }
}
