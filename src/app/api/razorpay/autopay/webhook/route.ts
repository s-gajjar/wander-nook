import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureAutopayOrder, type AutopayCustomerDetails } from "@/src/lib/autopay-order";
import { razorpayRequest } from "@/src/lib/razorpay-server";

export const runtime = "nodejs";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

type RazorpayInvoiceCustomerAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  country?: string | null;
};

type RazorpayInvoiceCustomerDetails = {
  name?: string | null;
  email?: string | null;
  contact?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_contact?: string | null;
  billing_address?: RazorpayInvoiceCustomerAddress | null;
  shipping_address?: RazorpayInvoiceCustomerAddress | null;
};

type RazorpayInvoiceEntity = {
  id?: string;
  status?: string;
  payment_id?: string;
  subscription_id?: string;
  customer_details?: RazorpayInvoiceCustomerDetails | null;
};

type RazorpayPaymentEntity = {
  id?: string;
  status?: string;
  invoice_id?: string | null;
};

type RazorpaySubscriptionEntity = {
  id?: string;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    invoice?: {
      entity?: RazorpayInvoiceEntity;
    };
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
  };
};

type RazorpayInvoiceResponse = {
  id: string;
  payment_id?: string | null;
  subscription_id?: string | null;
  customer_details?: RazorpayInvoiceCustomerDetails | null;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizePhone(value: string | null | undefined) {
  return sanitizeText(value, 30).replace(/[^\d]/g, "");
}

function timingSafeEqualUtf8(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyWebhookSignature(rawBody: string, signature: string) {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  return timingSafeEqualUtf8(expectedSignature, signature);
}

function toCustomerDetails(
  details: RazorpayInvoiceCustomerDetails | null | undefined
): AutopayCustomerDetails | undefined {
  if (!details) {
    return undefined;
  }

  const billing = details.billing_address ?? details.shipping_address ?? undefined;
  const name = sanitizeText(details.name || details.customer_name, 120);
  const email = sanitizeText(
    (details.email || details.customer_email || "").toLowerCase(),
    120
  );
  const phone = normalizePhone(details.contact || details.customer_contact);
  const addressLine1 = sanitizeText(billing?.line1, 120);
  const addressLine2 = sanitizeText(billing?.line2, 120);
  const city = sanitizeText(billing?.city, 80);
  const state = sanitizeText(billing?.state, 80);
  const pincode = sanitizeText(billing?.zipcode, 20);
  const country = sanitizeText(billing?.country || "India", 60);

  return {
    name,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    country,
  };
}

async function extractPaymentAndSubscriptionDetails(body: RazorpayWebhookPayload) {
  const invoiceEntity = body.payload?.invoice?.entity;
  const paymentEntity = body.payload?.payment?.entity;
  const subscriptionEntity = body.payload?.subscription?.entity;

  let paymentId = sanitizeText(invoiceEntity?.payment_id || paymentEntity?.id, 80);
  let subscriptionId = sanitizeText(
    invoiceEntity?.subscription_id || subscriptionEntity?.id,
    80
  );
  let customer = toCustomerDetails(invoiceEntity?.customer_details);

  if ((!paymentId || !subscriptionId) && paymentEntity?.invoice_id) {
    const invoiceId = sanitizeText(paymentEntity.invoice_id, 80);
    if (invoiceId) {
      const invoice = await razorpayRequest<RazorpayInvoiceResponse>(`/invoices/${invoiceId}`);
      paymentId = paymentId || sanitizeText(invoice.payment_id || paymentEntity?.id, 80);
      subscriptionId = subscriptionId || sanitizeText(invoice.subscription_id, 80);
      customer = customer || toCustomerDetails(invoice.customer_details);
    }
  }

  if (!paymentId || !subscriptionId) {
    return null;
  }

  return {
    paymentId,
    subscriptionId,
    customer,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Razorpay webhook secret configuration is missing." },
        { status: 500 }
      );
    }

    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature." }, { status: 401 });
    }

    const rawBody = await request.text();
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const event = sanitizeText(body.event, 80);
    const handledEvents = new Set(["invoice.paid", "subscription.charged", "payment.captured"]);
    if (!handledEvents.has(event)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        event,
      });
    }

    const paymentDetails = await extractPaymentAndSubscriptionDetails(body);
    if (!paymentDetails) {
      return NextResponse.json({
        ok: true,
        event,
        skipped: "missing_payment_or_subscription_reference",
      });
    }

    const ensureResult = await ensureAutopayOrder({
      paymentId: paymentDetails.paymentId,
      subscriptionId: paymentDetails.subscriptionId,
      customer: paymentDetails.customer,
      orderNote: "Order created from Razorpay webhook fallback after payment capture.",
    });

    if (ensureResult.status === "payment_not_captured") {
      return NextResponse.json({
        ok: true,
        event,
        skipped: "payment_not_captured",
        paymentStatus: ensureResult.paymentStatus,
      });
    }

    return NextResponse.json({
      ok: true,
      event,
      alreadyExists: ensureResult.status === "already_exists",
      order: ensureResult.order,
    });
  } catch (error) {
    console.error("Failed to process Razorpay autopay webhook", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Razorpay webhook event.",
      },
      { status: 500 }
    );
  }
}
