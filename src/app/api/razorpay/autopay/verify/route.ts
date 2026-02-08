import { NextRequest, NextResponse } from "next/server";
import {
  getAutopayPlanConfig,
  parseShopifyVariantId,
  razorpayRequest,
  verifyRazorpaySubscriptionSignature,
} from "@/src/lib/razorpay-server";

export const runtime = "nodejs";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";

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

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
};

type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
};

type ExistingOrderNode = {
  id: string;
  name: string;
};

function sanitizeText(value: string, maxLength = 120) {
  return value.trim().slice(0, maxLength);
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

async function findExistingOrderByTag(subscriptionTag: string) {
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
        query: `tag:"${subscriptionTag}"`,
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
    | { order?: { id: number; name: string } }
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

export async function POST(request: NextRequest) {
  try {
    if (!SHOPIFY_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: "Shopify admin configuration is missing." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as VerifyAutopayRequestBody;
    const planId = sanitizeText(body.planId || "", 40);
    const plan = getAutopayPlanConfig(planId);

    if (!plan) {
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

    const [subscription, payment] = await Promise.all([
      razorpayRequest<RazorpaySubscription>(`/subscriptions/${subscriptionId}`),
      razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`),
    ]);

    if (subscription.plan_id !== plan.razorpayPlanId) {
      return NextResponse.json(
        { error: "Subscription plan mismatch. Please retry checkout." },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          error:
            "Payment is not captured yet. Order will be created only after successful debit.",
          paymentStatus: payment.status,
        },
        { status: 409 }
      );
    }

    if (payment.amount !== plan.amountPaise || payment.currency !== "INR") {
      return NextResponse.json(
        { error: "Payment amount or currency mismatch." },
        { status: 400 }
      );
    }

    const variantId = parseShopifyVariantId(plan.shopifyVariantId);
    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid Shopify variant mapping for selected plan." },
        { status: 500 }
      );
    }

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
        { error: "Missing customer details to create Shopify order." },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitName(customerName);
    const subscriptionTag = `rzp-sub-${subscriptionId}`;

    const existingOrder = await findExistingOrderByTag(subscriptionTag);
    if (existingOrder) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        order: existingOrder,
      });
    }

    const amount = (plan.amountPaise / 100).toFixed(2);
    const order = await createShopifyOrder({
      order: {
        email: customerEmail,
        phone: customerPhone,
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
          phone: customerPhone,
          address1: addressLine1,
          ...(addressLine2 ? { address2: addressLine2 } : {}),
          city,
          province: state,
          country,
          zip: pincode,
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          phone: customerPhone,
          address1: addressLine1,
          ...(addressLine2 ? { address2: addressLine2 } : {}),
          city,
          province: state,
          country,
          zip: pincode,
        },
        financial_status: "paid",
        send_receipt: true,
        send_fulfillment_receipt: false,
        tags: [
          "wanderstamps-autopay",
          "razorpay-autopay",
          subscriptionTag,
          `rzp-pay-${paymentId}`,
          plan.id,
        ].join(", "),
        note: "Order created after verified Razorpay autopay payment.",
        note_attributes: [
          { name: "checkout_source", value: "wanderstamps-autopay" },
          { name: "razorpay_subscription_id", value: subscriptionId },
          { name: "razorpay_payment_id", value: paymentId },
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
            authorization: paymentId,
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        name: order.name,
      },
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
