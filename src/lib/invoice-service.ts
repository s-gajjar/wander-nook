import { prisma } from "@/src/lib/prisma";
import { sendTransactionalEmail } from "@/src/lib/mailer";
import {
  getAutopayPlanConfigByRazorpayPlanId,
  razorpayRequest,
  type RazorpayAutopayPlanConfig,
} from "@/src/lib/razorpay-server";
import {
  renderInvoiceEmailHtml,
  renderInvoiceHtml,
  formatCurrency,
  type InvoiceTemplateInput,
} from "@/src/lib/invoice-template";
import { getSiteUrl } from "@/src/lib/site-url";
import type { AutopayCustomerDetails } from "@/src/lib/autopay-order";
import { Prisma } from "@prisma/client";
import { generateInvoicePdfBuffer } from "@/src/lib/invoice-pdf";

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  email?: string | null;
  contact?: string | null;
  created_at?: number;
  invoice_id?: string | null;
};

type RazorpaySubscription = {
  id: string;
  status: string;
  plan_id: string;
  customer_email?: string | null;
  customer_contact?: string | null;
  notes?: Record<string, string>;
  current_start?: number;
  current_end?: number;
};

export type EnsureInvoiceForAutopayPaymentOptions = {
  paymentId: string;
  subscriptionId: string;
  sourceEvent: string;
  customer?: AutopayCustomerDetails;
  order?: {
    id?: string | number;
    name?: string;
  };
  razorpayInvoiceId?: string;
};

export type EnsureInvoiceForAutopayPaymentResult = {
  invoiceId: string;
  invoiceNumber: string;
  publicToken: string;
  created: boolean;
  emailSent: boolean;
  emailSkippedReason?: string;
};

type InvoiceWithCustomer = Awaited<ReturnType<typeof getInvoiceByPaymentId>>;

function normalizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizePhone(value: string | null | undefined) {
  return normalizeText(value, 30).replace(/[^\d]/g, "");
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = (value || "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeCustomer(
  input: AutopayCustomerDetails | undefined,
  subscription: RazorpaySubscription,
  payment: RazorpayPayment
) {
  const notes = subscription.notes ?? {};

  return {
    fullName: normalizeText(firstNonEmpty(input?.name, notes.customer_name, "Customer"), 120),
    email: normalizeText(
      firstNonEmpty(input?.email, notes.customer_email, subscription.customer_email, payment.email)
        .toLowerCase(),
      120
    ),
    phone: normalizePhone(
      firstNonEmpty(input?.phone, notes.customer_phone, subscription.customer_contact, payment.contact)
    ),
    addressLine1: normalizeText(firstNonEmpty(input?.addressLine1, notes.customer_address_1), 120),
    addressLine2: normalizeText(firstNonEmpty(input?.addressLine2, notes.customer_address_2), 120),
    city: normalizeText(firstNonEmpty(input?.city, notes.customer_city), 80),
    state: normalizeText(firstNonEmpty(input?.state, notes.customer_state), 80),
    pincode: normalizeText(firstNonEmpty(input?.pincode, notes.customer_pincode), 20),
    country: normalizeText(firstNonEmpty(input?.country, notes.customer_country, "India"), 60),
  };
}

function deriveBillingWindow(
  plan: RazorpayAutopayPlanConfig,
  payment: RazorpayPayment,
  subscription: RazorpaySubscription
) {
  const fromSubscriptionStart = subscription.current_start
    ? new Date(subscription.current_start * 1000)
    : null;
  const fromSubscriptionEnd = subscription.current_end
    ? new Date(subscription.current_end * 1000)
    : null;

  if (fromSubscriptionStart && fromSubscriptionEnd) {
    return {
      periodStart: fromSubscriptionStart,
      periodEnd: fromSubscriptionEnd,
      issuedAt: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
    };
  }

  const issuedAt = payment.created_at ? new Date(payment.created_at * 1000) : new Date();
  const periodStart = new Date(issuedAt);
  const periodEnd = new Date(issuedAt);

  if (plan.cycle === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  return {
    periodStart,
    periodEnd,
    issuedAt,
  };
}

function buildInvoiceNumber(paymentId: string, issuedAt: Date) {
  const year = issuedAt.getFullYear();
  const month = String(issuedAt.getMonth() + 1).padStart(2, "0");
  const suffix = paymentId.replace(/^pay_/i, "").toUpperCase();
  return `WN-${year}${month}-${suffix}`;
}

async function getInvoiceByPaymentId(paymentId: string) {
  return prisma.invoice.findUnique({
    where: {
      razorpayPaymentId: paymentId,
    },
    include: {
      customer: true,
    },
  });
}

function invoicePublicUrl(publicToken: string) {
  return `${getSiteUrl()}/invoice/${publicToken}`;
}

function toTemplateInput(invoice: NonNullable<InvoiceWithCustomer>): InvoiceTemplateInput {
  return {
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    paymentCapturedAt: invoice.paymentCapturedAt,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    amountPaise: invoice.amountPaise,
    currency: invoice.currency,
    billingCycle: invoice.billingCycle,
    planLabel: invoice.planLabel,
    razorpayPaymentId: invoice.razorpayPaymentId,
    razorpaySubscriptionId: invoice.razorpaySubscriptionId,
    razorpayInvoiceId: invoice.razorpayInvoiceId,
    shopifyOrderName: invoice.shopifyOrderName,
    customer: {
      fullName: invoice.customer.fullName,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      addressLine1: invoice.customer.addressLine1,
      addressLine2: invoice.customer.addressLine2,
      city: invoice.customer.city,
      state: invoice.customer.state,
      pincode: invoice.customer.pincode,
      country: invoice.customer.country,
    },
  };
}

function emailTextBody(input: {
  customerName: string;
  invoiceNumber: string;
  invoiceUrl: string;
  planLabel: string;
  billingCycle: string;
  amount: string;
}) {
  return [
    `Hi ${input.customerName},`,
    "",
    "Thanks for your payment. Your Wander Nook invoice is ready.",
    `Invoice: ${input.invoiceNumber}`,
    `Plan: ${input.planLabel} (${input.billingCycle})`,
    `Amount: ${input.amount}`,
    `View invoice: ${input.invoiceUrl}`,
    "",
    "Regards,",
    "Wander Nook",
  ].join("\n");
}

async function deliverInvoiceEmail(invoice: NonNullable<InvoiceWithCustomer>) {
  const invoiceUrl = invoicePublicUrl(invoice.publicToken);
  const templateInput = toTemplateInput(invoice);
  const pdfBuffer = await generateInvoicePdfBuffer(templateInput);
  const emailHtml = renderInvoiceEmailHtml({
    customerName: invoice.customer.fullName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl,
    amountPaise: invoice.amountPaise,
    currency: invoice.currency,
    planLabel: invoice.planLabel,
    billingCycle: invoice.billingCycle,
    issuedAt: invoice.issuedAt,
  });

  const emailText = emailTextBody({
    customerName: invoice.customer.fullName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl,
    planLabel: invoice.planLabel,
    billingCycle: invoice.billingCycle,
    amount: formatCurrency(invoice.amountPaise, invoice.currency),
  });

  const sendResult = await sendTransactionalEmail({
    to: invoice.customer.email,
    subject: `Invoice ${invoice.invoiceNumber} - Wander Nook`,
    html: emailHtml,
    text: emailText,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (!sendResult.sent) {
    return {
      emailSent: false,
      emailSkippedReason: sendResult.skippedReason,
    };
  }

  await prisma.invoice.update({
    where: {
      id: invoice.id,
    },
    data: {
      emailSentAt: new Date(),
      emailProviderId: sendResult.providerId,
    },
  });

  return {
    emailSent: true,
  };
}

async function resolveAutopayContext(paymentId: string, subscriptionId: string) {
  const [payment, subscription] = await Promise.all([
    razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`),
    razorpayRequest<RazorpaySubscription>(`/subscriptions/${subscriptionId}`),
  ]);

  if (payment.status !== "captured") {
    throw new Error(`Invoice can only be created for captured payments. Got: ${payment.status}`);
  }

  const plan = getAutopayPlanConfigByRazorpayPlanId(subscription.plan_id);
  if (!plan) {
    throw new Error("Unable to map subscription plan for invoice creation.");
  }

  return {
    payment,
    subscription,
    plan,
  };
}

export async function ensureInvoiceForAutopayPayment(
  options: EnsureInvoiceForAutopayPaymentOptions
): Promise<EnsureInvoiceForAutopayPaymentResult> {
  const paymentId = normalizeText(options.paymentId, 80);
  const subscriptionId = normalizeText(options.subscriptionId, 80);

  if (!paymentId || !subscriptionId) {
    throw new Error("Missing payment/subscription details for invoice creation.");
  }

  const existing = await getInvoiceByPaymentId(paymentId);
  if (existing) {
    const needsEmail = !existing.emailSentAt;
    if (!needsEmail) {
      return {
        invoiceId: existing.id,
        invoiceNumber: existing.invoiceNumber,
        publicToken: existing.publicToken,
        created: false,
        emailSent: true,
      };
    }

    const emailResult = await deliverInvoiceEmail(existing);
    return {
      invoiceId: existing.id,
      invoiceNumber: existing.invoiceNumber,
      publicToken: existing.publicToken,
      created: false,
      emailSent: emailResult.emailSent,
      emailSkippedReason: emailResult.emailSkippedReason,
    };
  }

  const { payment, subscription, plan } = await resolveAutopayContext(paymentId, subscriptionId);
  const customerData = normalizeCustomer(options.customer, subscription, payment);

  if (
    !customerData.fullName ||
    !customerData.email ||
    !customerData.phone ||
    !customerData.addressLine1 ||
    !customerData.city ||
    !customerData.state ||
    !customerData.pincode
  ) {
    throw new Error("Cannot generate invoice without complete customer billing details.");
  }

  const customer = await prisma.customer.upsert({
    where: {
      email: customerData.email,
    },
    update: {
      fullName: customerData.fullName,
      phone: customerData.phone,
      addressLine1: customerData.addressLine1,
      addressLine2: customerData.addressLine2 || null,
      city: customerData.city,
      state: customerData.state,
      pincode: customerData.pincode,
      country: customerData.country || "India",
    },
    create: {
      fullName: customerData.fullName,
      email: customerData.email,
      phone: customerData.phone,
      addressLine1: customerData.addressLine1,
      addressLine2: customerData.addressLine2 || null,
      city: customerData.city,
      state: customerData.state,
      pincode: customerData.pincode,
      country: customerData.country || "India",
    },
  });

  const billingWindow = deriveBillingWindow(plan, payment, subscription);

  let invoice: NonNullable<InvoiceWithCustomer>;

  try {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: buildInvoiceNumber(payment.id, billingWindow.issuedAt),
        customerId: customer.id,
        planId: plan.id,
        planLabel: plan.displayName,
        billingCycle: plan.cycle,
        amountPaise: payment.amount,
        currency: payment.currency,
        periodStart: billingWindow.periodStart,
        periodEnd: billingWindow.periodEnd,
        issuedAt: billingWindow.issuedAt,
        paymentCapturedAt: billingWindow.issuedAt,
        razorpayPaymentId: payment.id,
        razorpaySubscriptionId: subscription.id,
        razorpayInvoiceId:
          normalizeText(options.razorpayInvoiceId || payment.invoice_id || null, 80) || null,
        sourceEvent: normalizeText(options.sourceEvent, 120) || "unknown_event",
        shopifyOrderId: options.order?.id ? String(options.order.id) : null,
        shopifyOrderName: normalizeText(options.order?.name, 40) || null,
      },
      include: {
        customer: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingInvoice = await getInvoiceByPaymentId(payment.id);
      if (existingInvoice) {
        if (existingInvoice.emailSentAt) {
          return {
            invoiceId: existingInvoice.id,
            invoiceNumber: existingInvoice.invoiceNumber,
            publicToken: existingInvoice.publicToken,
            created: false,
            emailSent: true,
          };
        }

        const emailResult = await deliverInvoiceEmail(existingInvoice);
        return {
          invoiceId: existingInvoice.id,
          invoiceNumber: existingInvoice.invoiceNumber,
          publicToken: existingInvoice.publicToken,
          created: false,
          emailSent: emailResult.emailSent,
          emailSkippedReason: emailResult.emailSkippedReason,
        };
      }
    }

    throw error;
  }

  const emailResult = await deliverInvoiceEmail(invoice);

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    publicToken: invoice.publicToken,
    created: true,
    emailSent: emailResult.emailSent,
    emailSkippedReason: emailResult.emailSkippedReason,
  };
}

export async function resendInvoiceEmail(invoiceId: string) {
  const normalized = normalizeText(invoiceId, 80);
  if (!normalized) {
    throw new Error("Invoice id is required.");
  }

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: normalized,
    },
    include: {
      customer: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  return deliverInvoiceEmail(invoice);
}

export async function getInvoiceByPublicToken(publicToken: string) {
  const normalized = normalizeText(publicToken, 80);
  if (!normalized) {
    return null;
  }

  return prisma.invoice.findUnique({
    where: {
      publicToken: normalized,
    },
    include: {
      customer: true,
    },
  });
}

export async function renderInvoiceDocument(publicToken: string) {
  const invoice = await getInvoiceByPublicToken(publicToken);
  if (!invoice) {
    return null;
  }

  return renderInvoiceHtml(toTemplateInput(invoice));
}

export async function renderInvoicePdf(publicToken: string) {
  const invoice = await getInvoiceByPublicToken(publicToken);
  if (!invoice) {
    return null;
  }

  return generateInvoicePdfBuffer(toTemplateInput(invoice));
}
