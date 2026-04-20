import { ensureAutopayOrder, type AutopayCustomerDetails } from "@/src/lib/autopay-order";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";
import { ensureInvoiceForAutopayPayment } from "@/src/lib/invoice-service";
import { prisma } from "@/src/lib/prisma";
import { razorpayRequest } from "@/src/lib/razorpay-server";

type RazorpayPaymentListItem = {
  id: string;
  status?: string | null;
  currency?: string | null;
  invoice_id?: string | null;
  created_at?: number | null;
};

type RazorpayPaymentCollection = {
  items?: RazorpayPaymentListItem[];
};

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

type RazorpayInvoiceResponse = {
  id: string;
  payment_id?: string | null;
  subscription_id?: string | null;
  customer_details?: RazorpayInvoiceCustomerDetails | null;
};

type ReconcileRecentAutopayPaymentsOptions = {
  trigger: string;
  maxAgeHours?: number;
  maxPayments?: number;
  minIntervalMinutes?: number;
};

type ReconcileRecentAutopayPaymentsResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  scanned: number;
  processed: number;
  createdOrders: number;
  createdInvoices: number;
  errors: Array<{
    paymentId: string;
    message: string;
  }>;
};

const RECONCILE_EVENT_NAME = "autopay_reconcile_run";

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizePhone(value: string | null | undefined) {
  return sanitizeText(value, 30).replace(/[^\d]/g, "");
}

function toCustomerDetails(
  details: RazorpayInvoiceCustomerDetails | null | undefined
): AutopayCustomerDetails | undefined {
  if (!details) {
    return undefined;
  }

  const billing = details.billing_address ?? details.shipping_address ?? undefined;

  return {
    name: sanitizeText(details.name || details.customer_name, 120),
    email: sanitizeText((details.email || details.customer_email || "").toLowerCase(), 120),
    phone: normalizePhone(details.contact || details.customer_contact),
    addressLine1: sanitizeText(billing?.line1, 120),
    addressLine2: sanitizeText(billing?.line2, 120),
    city: sanitizeText(billing?.city, 80),
    state: sanitizeText(billing?.state, 80),
    pincode: sanitizeText(billing?.zipcode, 20),
    country: sanitizeText(billing?.country || "India", 60),
  };
}

async function shouldRunReconcile(minIntervalMinutes: number) {
  const lastRun = await prisma.conversionEvent.findFirst({
    where: {
      eventName: RECONCILE_EVENT_NAME,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!lastRun) {
    return true;
  }

  return Date.now() - lastRun.createdAt.getTime() >= minIntervalMinutes * 60 * 1000;
}

export async function reconcileRecentAutopayPayments({
  trigger,
  maxAgeHours = 48,
  maxPayments = 25,
  minIntervalMinutes = 5,
}: ReconcileRecentAutopayPaymentsOptions): Promise<ReconcileRecentAutopayPaymentsResult> {
  if (!(await shouldRunReconcile(minIntervalMinutes))) {
    return {
      ok: true,
      skipped: true,
      reason: "recent_run_exists",
      scanned: 0,
      processed: 0,
      createdOrders: 0,
      createdInvoices: 0,
      errors: [],
    };
  }

  const to = Math.floor(Date.now() / 1000);
  const from = to - maxAgeHours * 60 * 60;
  const payments = await razorpayRequest<RazorpayPaymentCollection>(
    `/payments?from=${from}&to=${to}&count=${Math.max(1, Math.min(maxPayments, 100))}&skip=0`
  );

  const candidates = (payments.items || [])
    .filter((payment) => payment.status === "captured" && sanitizeText(payment.invoice_id, 80))
    .sort((a, b) => (a.created_at || 0) - (b.created_at || 0));

  let processed = 0;
  let createdOrders = 0;
  let createdInvoices = 0;
  const errors: ReconcileRecentAutopayPaymentsResult["errors"] = [];

  for (const payment of candidates) {
    const paymentId = sanitizeText(payment.id, 80);
    const invoiceId = sanitizeText(payment.invoice_id, 80);

    if (!paymentId || !invoiceId) {
      continue;
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        razorpayPaymentId: paymentId,
      },
      select: {
        id: true,
        shopifyOrderId: true,
        shopifyOrderName: true,
      },
    });

    if (existingInvoice?.shopifyOrderId || existingInvoice?.shopifyOrderName) {
      continue;
    }

    try {
      const invoice = await razorpayRequest<RazorpayInvoiceResponse>(`/invoices/${invoiceId}`);
      const subscriptionId = sanitizeText(invoice.subscription_id, 80);
      if (!subscriptionId) {
        continue;
      }

      const customer = toCustomerDetails(invoice.customer_details);
      const order = await ensureAutopayOrder({
        paymentId,
        subscriptionId,
        customer,
        orderNote: "Shopify order created from Razorpay reconciliation fallback.",
      });

      processed += 1;
      if (order.status === "created") {
        createdOrders += 1;
      }

      if (order.status !== "payment_not_captured") {
        if (existingInvoice && !existingInvoice.shopifyOrderId && !existingInvoice.shopifyOrderName) {
          await prisma.invoice.update({
            where: {
              id: existingInvoice.id,
            },
            data: {
              shopifyOrderId: String(order.order.id),
              shopifyOrderName: order.order.name,
            },
          });
          continue;
        }

        const ensuredInvoice = await ensureInvoiceForAutopayPayment({
          paymentId,
          subscriptionId,
          sourceEvent: `autopay_reconcile:${trigger}`,
          customer,
          order: order.order,
          razorpayInvoiceId: invoice.id,
        });

        if (ensuredInvoice.created) {
          createdInvoices += 1;
        }
      }
    } catch (error) {
      errors.push({
        paymentId,
        message: error instanceof Error ? error.message : "Autopay reconciliation failed.",
      });
    }
  }

  await trackConversionEvent({
    eventName: RECONCILE_EVENT_NAME,
    metadata: {
      trigger,
      scanned: candidates.length,
      processed,
      createdOrders,
      createdInvoices,
      errors: errors.slice(0, 10),
    },
  });

  return {
    ok: true,
    skipped: false,
    scanned: candidates.length,
    processed,
    createdOrders,
    createdInvoices,
    errors,
  };
}
