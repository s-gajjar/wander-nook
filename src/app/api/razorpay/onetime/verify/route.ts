import { NextRequest, NextResponse } from "next/server";
import {
  getOnetimePlanConfig,
  verifyRazorpayPaymentSignature,
  razorpayRequest,
} from "@/src/lib/razorpay-server";
import { createOrder } from "@/src/lib/order-service";
import { ensureInvoiceForOnetimePayment } from "@/src/lib/invoice-service";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";
import {
  buildRazorpayPurchaseEventId,
  getMetaRequestData,
  sendMetaPurchaseEvent,
} from "@/src/lib/meta-conversions-api";

export const runtime = "nodejs";

type VerifyOnetimeRequestBody = {
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
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  };
  tracking?: {
    fbp?: string;
    fbc?: string;
    eventSourceUrl?: string;
  };
};

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

function sanitizeText(value: string, maxLength = 120) {
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyOnetimeRequestBody;
    const planId = sanitizeText(body.planId || "", 40);
    const plan = getOnetimePlanConfig(planId);

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    const paymentId = sanitizeText(body.payment?.razorpayPaymentId || "", 80);
    const orderId = sanitizeText(body.payment?.razorpayOrderId || "", 80);
    const signature = sanitizeText(body.payment?.razorpaySignature || "", 200);

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: "Missing payment verification details." },
        { status: 400 }
      );
    }

    // Verify signature
    const signatureValid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 401 });
    }

    // Verify payment is captured
    const payment = await razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`);

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          error: "Payment is not captured yet. Please wait a moment and try again.",
          paymentStatus: payment.status,
        },
        { status: 409 }
      );
    }

    if (payment.amount !== plan.amountPaise || payment.currency !== plan.currency) {
      return NextResponse.json(
        { error: "Payment amount or currency mismatch." },
        { status: 400 }
      );
    }

    // Validate customer details
    const customerName = sanitizeText(body.customer?.name || "", 120);
    const customerEmail = sanitizeText((body.customer?.email || "").toLowerCase(), 120);
    const customerPhone = sanitizeText(body.customer?.phone || "", 30).replace(/[^\d]/g, "");
    const addressLine1 = sanitizeText(body.customer?.addressLine1 || "", 120);
    const addressLine2 = sanitizeText(body.customer?.addressLine2 || "", 120);
    const city = sanitizeText(body.customer?.city || "", 80);
    const state = sanitizeText(body.customer?.state || "", 80);
    const pincode = sanitizeText(body.customer?.pincode || "", 20);
    const country = sanitizeText(body.customer?.country || "India", 60);

    if (!customerName || !customerEmail || !customerPhone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: "Missing customer details to create order." },
        { status: 400 }
      );
    }

    // Create order in our DB + send notification email
    const orderResult = await createOrder({
      plan,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
      },
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      paymentMethod: "razorpay-onetime",
    });

    // Create invoice + send invoice email with PDF
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
      invoice = await ensureInvoiceForOnetimePayment({
        paymentId,
        razorpayOrderId: orderId,
        sourceEvent: "onetime_verify",
        customerId: orderResult.customerId,
        planId: plan.id,
        planLabel: plan.displayName,
        amountPaise: plan.amountPaise,
        currency: plan.currency,
        durationMonths: plan.durationMonths,
      });
    } catch (error) {
      invoiceError = error instanceof Error ? error.message : "Failed to generate invoice.";
      console.error("One-time verify invoice generation failed", error);
    }

    // Track conversion
    await trackConversionEvent({
      eventName: "onetime_payment_verified",
      planId: plan.id,
      customerEmail,
      razorpayPaymentId: paymentId,
      metadata: {
        orderNumber: orderResult.orderNumber,
        orderCreated: orderResult.created,
        notificationSent: orderResult.notificationSent,
        customerName,
        customerPhone,
        customerCity: city,
      },
    });

    // Meta Purchase event
    const metaRequestData = getMetaRequestData(request);
    const purchaseEventId = orderResult.created
      ? buildRazorpayPurchaseEventId(paymentId)
      : undefined;

    if (orderResult.created && purchaseEventId) {
      const eventSourceUrl = sanitizeText(body.tracking?.eventSourceUrl || "", 300);
      const fbp = sanitizeText(body.tracking?.fbp || "", 120);
      const fbc = sanitizeText(body.tracking?.fbc || "", 240);

      await sendMetaPurchaseEvent({
        eventId: purchaseEventId,
        eventSourceUrl: eventSourceUrl || "",
        value: plan.amountInr,
        currency: plan.currency,
        contentName: `${plan.displayName} Purchase`,
        contentIds: [plan.id],
        planId: plan.id,
        orderId: orderResult.orderNumber,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          city,
          state,
          pincode,
          country,
          fbp: fbp || metaRequestData.fbp,
          fbc: fbc || metaRequestData.fbc,
          clientIpAddress: metaRequestData.clientIpAddress,
          clientUserAgent: metaRequestData.clientUserAgent,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      meta: {
        purchaseEventId,
        shouldTrackPurchase: orderResult.created,
      },
      alreadyExists: !orderResult.created,
      order: {
        id: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
      },
      invoice,
      invoiceError,
    });
  } catch (error) {
    console.error("Failed to verify Razorpay one-time payment", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete checkout. Please try again.",
      },
      { status: 500 }
    );
  }
}
