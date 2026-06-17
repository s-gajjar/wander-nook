import {
  getAutopayPlanConfig,
  getAutopayPlanConfigByRazorpayPlanId,
  razorpayRequest,
  type RazorpayAutopayPlanConfig,
} from "@/src/lib/razorpay-server";
import { prisma } from "@/src/lib/prisma";
import { sendOrderNotificationEmail } from "@/src/lib/order-service";

const SUPPORTED_CURRENCY = "INR";

type ExistingOrderNode = {
  id: string;
  name: string;
};

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  email?: string | null;
  contact?: string | null;
};

type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  customer_email?: string | null;
  customer_contact?: string | null;
  notes?: Record<string, string>;
};

export type AutopayCustomerDetails = {
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

type AutopayOrderConversionMeta = {
  planId: string;
  amountInr: number;
  currency: string;
  customer: ReturnType<typeof resolveCustomerDetails>;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

export type EnsureAutopayOrderResult =
  | { status: "payment_not_captured"; paymentStatus: string }
  | { status: "already_exists"; order: ExistingOrderNode; conversion: AutopayOrderConversionMeta }
  | { status: "subscription_order_exists"; order: ExistingOrderNode; conversion: AutopayOrderConversionMeta }
  | { status: "created"; order: ExistingOrderNode; conversion: AutopayOrderConversionMeta };

type EnsureAutopayOrderOptions = {
  paymentId: string;
  subscriptionId: string;
  expectedPlanId?: string;
  customer?: AutopayCustomerDetails;
  orderNote?: string;
};

type StoredCustomerFallback = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizePhone(value: string | null | undefined) {
  return sanitizeText(value, 30).replace(/[^\d]/g, "");
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

function resolvePlan(
  subscriptionPlanId: string,
  expectedPlanId?: string
): RazorpayAutopayPlanConfig {
  if (expectedPlanId) {
    const expectedPlan = getAutopayPlanConfig(expectedPlanId);
    if (!expectedPlan) {
      throw new Error("Invalid autopay plan selected.");
    }

    if (expectedPlan.razorpayPlanId !== subscriptionPlanId) {
      throw new Error("Subscription plan mismatch. Please retry checkout.");
    }

    return expectedPlan;
  }

  const inferredPlan = getAutopayPlanConfigByRazorpayPlanId(subscriptionPlanId);
  if (!inferredPlan) {
    throw new Error("Unable to map Razorpay subscription to configured autopay plan.");
  }
  return inferredPlan;
}

function resolveCustomerDetails(
  input: AutopayCustomerDetails | undefined,
  subscription: RazorpaySubscription,
  payment: RazorpayPayment
) {
  const notes = subscription.notes ?? {};

  return {
    name: sanitizeText(firstNonEmpty(input?.name, notes.customer_name), 120),
    email: sanitizeText(
      firstNonEmpty(input?.email, notes.customer_email, subscription.customer_email, payment.email)
        .toLowerCase(),
      120
    ),
    phone: normalizePhone(
      firstNonEmpty(input?.phone, notes.customer_phone, subscription.customer_contact, payment.contact)
    ),
    addressLine1: sanitizeText(firstNonEmpty(input?.addressLine1, notes.customer_address_1), 120),
    addressLine2: sanitizeText(firstNonEmpty(input?.addressLine2, notes.customer_address_2), 120),
    city: sanitizeText(firstNonEmpty(input?.city, notes.customer_city), 80),
    state: sanitizeText(firstNonEmpty(input?.state, notes.customer_state), 80),
    pincode: sanitizeText(firstNonEmpty(input?.pincode, notes.customer_pincode), 20),
    country: sanitizeText(firstNonEmpty(input?.country, notes.customer_country, "India"), 60),
  };
}

function mergeCustomerDetails(
  customer: ReturnType<typeof resolveCustomerDetails>,
  fallback: StoredCustomerFallback | null
) {
  if (!fallback) {
    return customer;
  }

  return {
    name: sanitizeText(firstNonEmpty(customer.name, fallback.fullName), 120),
    email: sanitizeText(firstNonEmpty(customer.email, fallback.email).toLowerCase(), 120),
    phone: normalizePhone(firstNonEmpty(customer.phone, fallback.phone)),
    addressLine1: sanitizeText(firstNonEmpty(customer.addressLine1, fallback.addressLine1), 120),
    addressLine2: sanitizeText(firstNonEmpty(customer.addressLine2, fallback.addressLine2), 120),
    city: sanitizeText(firstNonEmpty(customer.city, fallback.city), 80),
    state: sanitizeText(firstNonEmpty(customer.state, fallback.state), 80),
    pincode: sanitizeText(firstNonEmpty(customer.pincode, fallback.pincode), 20),
    country: sanitizeText(firstNonEmpty(customer.country, fallback.country, "India"), 60),
  };
}

async function findStoredCustomerFallback(subscriptionId: string, email: string) {
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      razorpaySubscriptionId: subscriptionId,
    },
    orderBy: {
      issuedAt: "desc",
    },
    include: {
      customer: true,
    },
  });

  if (latestInvoice?.customer) {
    return {
      fullName: latestInvoice.customer.fullName,
      email: latestInvoice.customer.email,
      phone: latestInvoice.customer.phone,
      addressLine1: latestInvoice.customer.addressLine1,
      addressLine2: latestInvoice.customer.addressLine2,
      city: latestInvoice.customer.city,
      state: latestInvoice.customer.state,
      pincode: latestInvoice.customer.pincode,
      country: latestInvoice.customer.country,
    };
  }

  if (!email) {
    return null;
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: {
      email,
    },
  });

  if (!existingCustomer) {
    return null;
  }

  return {
    fullName: existingCustomer.fullName,
    email: existingCustomer.email,
    phone: existingCustomer.phone,
    addressLine1: existingCustomer.addressLine1,
    addressLine2: existingCustomer.addressLine2,
    city: existingCustomer.city,
    state: existingCustomer.state,
    pincode: existingCustomer.pincode,
    country: existingCustomer.country,
  };
}

async function withSubscriptionOrderLock<T>(
  subscriptionId: string,
  operation: () => Promise<T>
) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${subscriptionId}))`;
      return operation();
    },
    {
      maxWait: 5000,
      timeout: 20000,
    }
  );
}

function toOrderNode(order: { id: string; orderNumber: string }): ExistingOrderNode {
  return {
    id: order.id,
    name: order.orderNumber,
  };
}

function buildAutopayOrderNumber(paymentId: string) {
  const normalized = paymentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `WN-AUTO-${normalized || Date.now()}`;
}

function buildShippingAddress(customer: ReturnType<typeof resolveCustomerDetails>) {
  return {
    name: customer.name,
    line1: customer.addressLine1,
    line2: customer.addressLine2 || null,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2 || null,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    country: customer.country,
    phone: customer.phone,
  };
}

export async function ensureAutopayOrder({
  paymentId,
  subscriptionId,
  expectedPlanId,
  customer,
  orderNote,
}: EnsureAutopayOrderOptions): Promise<EnsureAutopayOrderResult> {
  const normalizedPaymentId = sanitizeText(paymentId, 80);
  const normalizedSubscriptionId = sanitizeText(subscriptionId, 80);

  if (!normalizedPaymentId || !normalizedSubscriptionId) {
    throw new Error("Missing Razorpay payment verification details.");
  }

  const [subscription, payment] = await Promise.all([
    razorpayRequest<RazorpaySubscription>(`/subscriptions/${normalizedSubscriptionId}`),
    razorpayRequest<RazorpayPayment>(`/payments/${normalizedPaymentId}`),
  ]);

  const plan = resolvePlan(subscription.plan_id, expectedPlanId);

  if (payment.status !== "captured") {
    return {
      status: "payment_not_captured",
      paymentStatus: payment.status,
    };
  }

  if (payment.amount !== plan.amountPaise || payment.currency !== SUPPORTED_CURRENCY) {
    throw new Error("Payment amount or currency mismatch.");
  }

  const baseCustomer = resolveCustomerDetails(customer, subscription, payment);
  const resolvedCustomer = mergeCustomerDetails(
    baseCustomer,
    await findStoredCustomerFallback(normalizedSubscriptionId, baseCustomer.email)
  );
  const conversion: AutopayOrderConversionMeta = {
    planId: plan.id,
    amountInr: plan.amountInr,
    currency: SUPPORTED_CURRENCY,
    customer: resolvedCustomer,
    fbp: sanitizeText(subscription.notes?.meta_fbp, 120),
    fbc: sanitizeText(subscription.notes?.meta_fbc, 240),
    eventSourceUrl: sanitizeText(subscription.notes?.event_source_url, 300),
  };
  if (
    !resolvedCustomer.name ||
    !resolvedCustomer.email ||
    !resolvedCustomer.phone ||
    !resolvedCustomer.addressLine1 ||
    !resolvedCustomer.city ||
    !resolvedCustomer.state ||
    !resolvedCustomer.pincode
  ) {
    throw new Error("Missing customer details to create local autopay order.");
  }

  return withSubscriptionOrderLock(normalizedSubscriptionId, async () => {
    const existingOrder = await prisma.order.findUnique({
      where: {
        razorpayPaymentId: normalizedPaymentId,
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (existingOrder) {
      return {
        status: "already_exists" as const,
        order: toOrderNode(existingOrder),
        conversion,
      };
    }

    const existingSubscriptionOrder = await prisma.order.findFirst({
      where: {
        razorpaySubscriptionId: normalizedSubscriptionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (existingSubscriptionOrder) {
      return {
        status: "subscription_order_exists" as const,
        order: toOrderNode(existingSubscriptionOrder),
        conversion,
      };
    }

    const storedCustomer = await prisma.customer.upsert({
      where: {
        email: resolvedCustomer.email,
      },
      update: {
        fullName: resolvedCustomer.name,
        phone: resolvedCustomer.phone,
        addressLine1: resolvedCustomer.addressLine1,
        addressLine2: resolvedCustomer.addressLine2 || null,
        city: resolvedCustomer.city,
        state: resolvedCustomer.state,
        pincode: resolvedCustomer.pincode,
        country: resolvedCustomer.country || "India",
      },
      create: {
        fullName: resolvedCustomer.name,
        email: resolvedCustomer.email,
        phone: resolvedCustomer.phone,
        addressLine1: resolvedCustomer.addressLine1,
        addressLine2: resolvedCustomer.addressLine2 || null,
        city: resolvedCustomer.city,
        state: resolvedCustomer.state,
        pincode: resolvedCustomer.pincode,
        country: resolvedCustomer.country || "India",
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: buildAutopayOrderNumber(normalizedPaymentId),
        customerId: storedCustomer.id,
        planId: plan.id,
        planLabel: plan.displayName,
        amountPaise: plan.amountPaise,
        currency: SUPPORTED_CURRENCY,
        status: "paid",
        fulfillmentStatus: "unfulfilled",
        paymentMethod: "razorpay-autopay",
        razorpayPaymentId: normalizedPaymentId,
        razorpaySubscriptionId: normalizedSubscriptionId,
        shippingAddress: buildShippingAddress(resolvedCustomer),
        notes:
          orderNote ||
          `Local autopay order created after verified Razorpay payment ${normalizedPaymentId}. Subscription: ${normalizedSubscriptionId}.`,
      },
    });

    try {
      await sendOrderNotificationEmail({
        orderNumber: order.orderNumber,
        customer: {
          name: resolvedCustomer.name,
          email: resolvedCustomer.email,
          phone: resolvedCustomer.phone,
          addressLine1: resolvedCustomer.addressLine1,
          addressLine2: resolvedCustomer.addressLine2,
          city: resolvedCustomer.city,
          state: resolvedCustomer.state,
          pincode: resolvedCustomer.pincode,
          country: resolvedCustomer.country,
        },
        plan,
        payment: {
          razorpayPaymentId: normalizedPaymentId,
          referenceLabel: "Razorpay Subscription ID",
          referenceValue: normalizedSubscriptionId,
        },
        createdAt: order.createdAt,
      });
    } catch (error) {
      console.error("Failed to send autopay order notification email", error);
    }

    return {
      status: "created" as const,
      order: toOrderNode(order),
      conversion,
    };
  });
}
