import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/src/lib/mailer";

export const runtime = "nodejs";

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";
const UNPAID_FINANCIAL_STATUSES = new Set(["pending", "unpaid", "voided"]);
const DIRECT_WEBSITE_ORDER_SOURCES = new Set(["", "web"]);

type NoteAttribute = {
  name?: string;
  key?: string;
  value?: string;
};

type OrderLineItem = {
  title?: string;
  quantity?: number;
  variant_title?: string | null;
  sku?: string | null;
  price?: string | number | null;
};

type OrderCustomer = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type OrderWebhookPayload = {
  id?: number | string;
  name?: string;
  order_number?: number | string;
  financial_status?: string;
  total_price?: string | number | null;
  currency?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  email?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  source_name?: string | null;
  note_attributes?: NoteAttribute[];
  line_items?: OrderLineItem[];
  customer?: OrderCustomer | null;
};

type MerchantNotificationResult = {
  sent: boolean;
  skippedReason?: string;
  error?: string;
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

function sanitizeText(value: string | number | null | undefined, maxLength = 160) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
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

function isDirectWebsiteOrder(order: OrderWebhookPayload) {
  const sourceName = sanitizeText(order.source_name, 40).toLowerCase();
  return DIRECT_WEBSITE_ORDER_SOURCES.has(sourceName);
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

function formatMoney(amount: string | number | null | undefined, currency: string | null | undefined) {
  const numericAmount = Number(amount);
  const normalizedCurrency = sanitizeText(currency || "INR", 3).toUpperCase();

  if (!Number.isFinite(numericAmount)) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalizedCurrency || "INR",
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveCustomerName(order: OrderWebhookPayload) {
  const firstName = sanitizeText(order.customer?.first_name, 80);
  const lastName = sanitizeText(order.customer?.last_name, 80);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  return sanitizeText(order.contact_email || order.email || "Customer", 120);
}

function resolveMerchantRecipients() {
  const candidates = [
    process.env.ORDER_NOTIFICATION_EMAILS,
    process.env.SHOPIFY_ORDER_NOTIFICATION_EMAILS,
    process.env.SHOPIFY_ORDER_NOTIFICATION_EMAIL,
    process.env.INVOICE_COMPANY_EMAIL,
    process.env.SMTP_USER,
    process.env.MAIL_FROM,
    process.env.RESEND_FROM_EMAIL,
  ];

  return Array.from(
    new Set(
      candidates
        .flatMap((value) => String(value || "").split(/[;,]/))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function buildMerchantNotificationEmail(order: OrderWebhookPayload) {
  const orderLabel = sanitizeText(
    order.name || (order.order_number ? `#${order.order_number}` : "New order"),
    80
  );
  const customerName = resolveCustomerName(order);
  const customerEmail = sanitizeText(order.contact_email || order.email, 120) || "Not provided";
  const customerPhone = sanitizeText(order.customer?.phone || order.phone, 40) || "Not provided";
  const total = formatMoney(order.total_price, order.currency);
  const createdAt = sanitizeText(order.created_at, 40) || new Date().toISOString();
  const lineItems = (order.line_items || []).slice(0, 10).map((item) => {
    const title = sanitizeText(item.title, 120) || "Item";
    const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
    const variantTitle = sanitizeText(item.variant_title, 120);
    const linePrice = formatMoney(item.price, order.currency);
    const parts = [`${title} x ${quantity}`];

    if (variantTitle) {
      parts.push(variantTitle);
    }

    if (linePrice) {
      parts.push(linePrice);
    }

    return parts.join(" | ");
  });

  const lineItemsHtml = lineItems.length
    ? `<ul>${lineItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>No line items found in webhook payload.</p>";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New website order: ${escapeHtml(orderLabel)}</h2>
      <p style="margin:0 0 12px;">A new direct website order was created in Shopify.</p>
      <p style="margin:0 0 6px;"><strong>Total:</strong> ${escapeHtml(total || "Not available")}</p>
      <p style="margin:0 0 6px;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
      <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      <p style="margin:0 0 6px;"><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>
      <p style="margin:0 0 16px;"><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
      <h3 style="margin:0 0 8px;">Items</h3>
      ${lineItemsHtml}
    </div>
  `;

  const text = [
    `New website order: ${orderLabel}`,
    "",
    `Total: ${total || "Not available"}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Phone: ${customerPhone}`,
    `Created: ${createdAt}`,
    "",
    "Items:",
    ...(lineItems.length
      ? lineItems.map((item) => `- ${item}`)
      : ["- No line items found in webhook payload."]),
  ].join("\n");

  return {
    subject: `New website order ${orderLabel}`,
    html,
    text,
  };
}

async function sendMerchantOrderNotification(order: OrderWebhookPayload): Promise<MerchantNotificationResult> {
  const recipients = resolveMerchantRecipients();
  if (recipients.length === 0) {
    return {
      sent: false,
      skippedReason: "missing_recipient",
    };
  }

  const email = buildMerchantNotificationEmail(order);
  const result = await sendTransactionalEmail({
    to: recipients,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  return {
    sent: result.sent,
    skippedReason: result.skippedReason,
  };
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
    const autopayOrder = isAutopayOrder(order);
    let merchantNotification: MerchantNotificationResult | undefined;

    if (topic === "orders/create" && !autopayOrder && isDirectWebsiteOrder(order)) {
      try {
        merchantNotification = await sendMerchantOrderNotification(order);
      } catch (error) {
        console.error("Failed to send merchant order notification", error);
        merchantNotification = {
          sent: false,
          error: error instanceof Error ? error.message : "merchant_notification_failed",
        };
      }
    }

    if (autopayOrder && shouldCancelForUnpaidStatus(order)) {
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
        merchantNotification,
      });
    }

    return NextResponse.json({
      ok: true,
      merchantNotification,
    });
  } catch (error) {
    console.error("Failed to process Shopify order webhook", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
