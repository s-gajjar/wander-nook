import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";
const UNPAID_FINANCIAL_STATUSES = new Set(["pending", "unpaid", "voided"]);

type NoteAttribute = {
  name?: string;
  key?: string;
  value?: string;
};

type OrderWebhookPayload = {
  id?: number | string;
  order_number?: number | string;
  financial_status?: string;
  cancelled_at?: string | null;
  note_attributes?: NoteAttribute[];
};

function timingSafeBase64Compare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyWebhookSignature(rawBody: string, signatureHeader: string) {
  const digest = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  return timingSafeBase64Compare(digest, signatureHeader);
}

function isAutopayOrder(order: OrderWebhookPayload) {
  const noteAttributes = order.note_attributes ?? [];

  return noteAttributes.some((attribute) => {
    const key = (attribute.name ?? attribute.key ?? "").trim().toLowerCase();
    const value = (attribute.value ?? "").trim().toLowerCase();
    return key === "checkout_source" && value === "wanderstamps-autopay";
  });
}

function shouldCancelForUnpaidStatus(order: OrderWebhookPayload) {
  if (order.cancelled_at) {
    return false;
  }

  const status = (order.financial_status ?? "").toLowerCase();
  return UNPAID_FINANCIAL_STATUSES.has(status);
}

function parseOrderId(orderId: number | string | undefined) {
  if (typeof orderId === "number") {
    return orderId;
  }

  if (typeof orderId === "string") {
    const parsed = Number(orderId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

async function cancelOrder(orderId: number) {
  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2025-07/orders/${orderId}/cancel.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: "other",
        email: false,
        restock: false,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Order cancel failed (${response.status}): ${body}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN || !WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing Shopify webhook configuration" },
        { status: 500 }
      );
    }

    const signatureHeader = request.headers.get("x-shopify-hmac-sha256");
    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (!verifyWebhookSignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const topic = request.headers.get("x-shopify-topic") ?? "";
    if (topic !== "orders/create" && topic !== "orders/updated") {
      return NextResponse.json({ ok: true });
    }

    const order = JSON.parse(rawBody) as OrderWebhookPayload;

    if (!isAutopayOrder(order)) {
      return NextResponse.json({ ok: true });
    }

    if (!shouldCancelForUnpaidStatus(order)) {
      return NextResponse.json({ ok: true });
    }

    const orderId = parseOrderId(order.id);
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order id in webhook payload" }, { status: 400 });
    }

    await cancelOrder(orderId);

    return NextResponse.json({
      ok: true,
      action: "cancelled_unpaid_autopay_order",
      orderId,
      orderNumber: order.order_number ?? null,
    });
  } catch (error) {
    console.error("Failed to process Shopify order webhook", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
