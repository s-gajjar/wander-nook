import {
  getAutopayPlanConfig,
  getAutopayPlanConfigByRazorpayPlanId,
  parseShopifyVariantId,
  razorpayRequest,
  type RazorpayAutopayPlanConfig,
} from "@/src/lib/razorpay-server";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
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

type ShopifyOrderResponse = {
  id: number;
  name: string;
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

export type EnsureAutopayOrderResult =
  | { status: "payment_not_captured"; paymentStatus: string }
  | { status: "already_exists"; order: ExistingOrderNode }
  | { status: "created"; order: ShopifyOrderResponse };

type EnsureAutopayOrderOptions = {
  paymentId: string;
  subscriptionId: string;
  expectedPlanId?: string;
  customer?: AutopayCustomerDetails;
  orderNote?: string;
};

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function normalizePhone(value: string | null | undefined) {
  return sanitizeText(value, 30).replace(/[^\d]/g, "");
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Customer", lastName: "Autopay" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Autopay" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ").slice(0, 60),
  };
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

function assertShopifyConfig() {
  if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error("Shopify admin configuration is missing.");
  }
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

async function findExistingOrderByTag(orderTag: string) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-07/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `#graphql
        query ExistingOrder($query: String!) {
          orders(first: 1, query: $query) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `,
      variables: {
        query: `tag:"${orderTag}"`,
      },
    }),
  });

  const json = (await response.json().catch(() => null)) as
    | {
        data?: {
          orders?: {
            edges?: Array<{ node: ExistingOrderNode }>;
          };
        };
      }
    | null;

  if (!response.ok || !json) {
    return null;
  }

  return json.data?.orders?.edges?.[0]?.node ?? null;
}

async function createShopifyOrder(payload: Record<string, unknown>) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-07/orders.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as
    | { order?: ShopifyOrderResponse }
    | { errors?: unknown }
    | null;

  if (!response.ok || !json || !("order" in json) || !json.order) {
    throw new Error(
      `Failed to create Shopify order: ${
        json && "errors" in json ? JSON.stringify(json.errors) : `HTTP ${response.status}`
      }`
    );
  }

  return json.order;
}

export async function ensureAutopayOrder({
  paymentId,
  subscriptionId,
  expectedPlanId,
  customer,
  orderNote,
}: EnsureAutopayOrderOptions): Promise<EnsureAutopayOrderResult> {
  assertShopifyConfig();

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

  const variantId = parseShopifyVariantId(plan.shopifyVariantId);
  if (!variantId) {
    throw new Error("Invalid Shopify variant mapping for selected plan.");
  }

  const resolvedCustomer = resolveCustomerDetails(customer, subscription, payment);
  if (
    !resolvedCustomer.name ||
    !resolvedCustomer.email ||
    !resolvedCustomer.phone ||
    !resolvedCustomer.addressLine1 ||
    !resolvedCustomer.city ||
    !resolvedCustomer.state ||
    !resolvedCustomer.pincode
  ) {
    throw new Error("Missing customer details to create Shopify order.");
  }

  const paymentTag = `rzp-pay-${normalizedPaymentId}`;
  const existingOrder = await findExistingOrderByTag(paymentTag);
  if (existingOrder) {
    return {
      status: "already_exists",
      order: existingOrder,
    };
  }

  const subscriptionTag = `rzp-sub-${normalizedSubscriptionId}`;
  const amount = (plan.amountPaise / 100).toFixed(2);
  const { firstName, lastName } = splitName(resolvedCustomer.name);
  const order = await createShopifyOrder({
    order: {
      email: resolvedCustomer.email,
      phone: resolvedCustomer.phone,
      line_items: [
        {
          variant_id: variantId,
          quantity: 1,
          price: amount,
        },
      ],
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        phone: resolvedCustomer.phone,
        address1: resolvedCustomer.addressLine1,
        ...(resolvedCustomer.addressLine2 ? { address2: resolvedCustomer.addressLine2 } : {}),
        city: resolvedCustomer.city,
        province: resolvedCustomer.state,
        country: resolvedCustomer.country,
        zip: resolvedCustomer.pincode,
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        phone: resolvedCustomer.phone,
        address1: resolvedCustomer.addressLine1,
        ...(resolvedCustomer.addressLine2 ? { address2: resolvedCustomer.addressLine2 } : {}),
        city: resolvedCustomer.city,
        province: resolvedCustomer.state,
        country: resolvedCustomer.country,
        zip: resolvedCustomer.pincode,
      },
      financial_status: "paid",
      send_receipt: true,
      send_fulfillment_receipt: false,
      tags: [
        "wanderstamps-autopay",
        "razorpay-autopay",
        subscriptionTag,
        paymentTag,
        plan.id,
      ].join(", "),
      note: orderNote || "Order created after verified Razorpay autopay payment.",
      note_attributes: [
        { name: "checkout_source", value: "wanderstamps-autopay" },
        { name: "razorpay_subscription_id", value: normalizedSubscriptionId },
        { name: "razorpay_payment_id", value: normalizedPaymentId },
        { name: "razorpay_subscription_status", value: subscription.status },
        { name: "recurring_plan", value: plan.id },
        { name: "recurring_amount_inr", value: String(plan.amountInr) },
        { name: "recurring_total_count", value: String(plan.totalCount) },
      ],
      transactions: [
        {
          kind: "sale",
          status: "success",
          amount,
          gateway: "Razorpay",
          authorization: normalizedPaymentId,
        },
      ],
    },
  });

  return {
    status: "created",
    order: {
      id: order.id,
      name: order.name,
    },
  };
}
