/**
 * Shopify → Local Order Migration Script
 *
 * Fetches all orders from Shopify Admin REST API and inserts them
 * into the local Order model (PostgreSQL via Prisma).
 *
 * Prerequisites:
 *   - DATABASE_URL env var set
 *   - NEXT_PUBLIC_SHOPIFY_DOMAIN env var (e.g. "mystore.myshopify.com")
 *   - SHOPIFY_ADMIN_ACCESS_TOKEN env var
 *
 * Usage:
 *   npx tsx scripts/migrate-shopify-orders.ts
 *   npx tsx scripts/migrate-shopify-orders.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN?.trim() ?? "";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ?? "";
const API_VERSION = "2025-07";
const DRY_RUN = process.argv.includes("--dry-run");

interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

interface ShopifyCustomer {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ShopifyLineItem {
  title?: string;
  quantity?: number;
  price?: string;
  sku?: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  order_number: number;
  email?: string;
  phone?: string;
  financial_status: string;
  total_price: string;
  currency: string;
  created_at: string;
  cancelled_at?: string | null;
  customer?: ShopifyCustomer;
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  line_items?: ShopifyLineItem[];
  note_attributes?: Array<{ name?: string; key?: string; value?: string }>;
  gateway?: string;
  payment_gateway_names?: string[];
  source_name?: string;
}

async function fetchShopifyOrders(): Promise<ShopifyOrder[]> {
  const allOrders: ShopifyOrder[] = [];
  let pageUrl: string | null =
    `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/orders.json?limit=250&status=any`;

  while (pageUrl) {
    console.log(`  Fetching: ${pageUrl.substring(0, 100)}...`);
    const response: Response = await fetch(pageUrl, {
      headers: {
        "X-Shopify-Access-Token": ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    const orders = data.orders ?? [];
    allOrders.push(...orders);
    console.log(`  Fetched ${orders.length} orders (total: ${allOrders.length})`);

    // Pagination via Link header
    const linkHeader: string = response.headers.get("link") || "";
    const nextMatch: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    pageUrl = nextMatch ? nextMatch[1] : null;
  }

  return allOrders;
}

function getNoteAttr(order: ShopifyOrder, keys: string[]): string {
  const normalizedKeys = new Set(keys.map((k) => k.toLowerCase()));
  for (const attr of order.note_attributes ?? []) {
    const key = (attr.name ?? attr.key ?? "").trim().toLowerCase();
    if (normalizedKeys.has(key)) {
      return (attr.value ?? "").trim();
    }
  }
  return "";
}

function resolveCustomerName(order: ShopifyOrder): string {
  const firstName = order.customer?.first_name?.trim() ?? "";
  const lastName = order.customer?.last_name?.trim() ?? "";
  const full = [firstName, lastName].filter(Boolean).join(" ");
  return full || order.email || "Unknown";
}

function resolveEmail(order: ShopifyOrder): string {
  return (order.customer?.email || order.email || "").trim().toLowerCase();
}

function resolvePhone(order: ShopifyOrder): string {
  return (order.customer?.phone || order.phone || "").trim().replace(/\s+/g, "");
}

function derivePaymentMethod(order: ShopifyOrder): string {
  const noteSource = getNoteAttr(order, ["checkout_source"]);
  if (noteSource === "wanderstamps-autopay") return "razorpay-autopay";

  const gateways = order.payment_gateway_names ?? [];
  if (gateways.some((g) => g.toLowerCase().includes("razorpay"))) return "razorpay-onetime";

  return "shopify-checkout";
}

function derivePlanId(order: ShopifyOrder): string {
  const planId = getNoteAttr(order, ["plan_id", "recurring_plan"]);
  if (planId) return planId;

  // Infer from line items
  const items = order.line_items ?? [];
  for (const item of items) {
    const title = (item.title ?? "").toLowerCase();
    if (title.includes("annual")) return "annual-onetime";
    if (title.includes("monthly")) return "monthly-autopay";
    if (title.includes("print")) return "print-plan";
    if (title.includes("digital")) return "digital-plan";
  }

  return "unknown";
}

function derivePlanLabel(planId: string, order: ShopifyOrder): string {
  const labels: Record<string, string> = {
    "annual-onetime": "Annual Plan (One-time)",
    "monthly-autopay": "Monthly Plan (Autopay)",
    "print-plan": "Print Plan",
    "digital-plan": "Digital Plan",
  };
  if (labels[planId]) return labels[planId];

  const firstItem = (order.line_items ?? [])[0];
  return firstItem?.title || "Shopify Order";
}

function buildOrderNumber(order: ShopifyOrder): string {
  // Use Shopify's order name if it looks clean, otherwise generate
  const name = order.name ?? "";
  if (name.startsWith("#")) {
    return `WN-SHOPIFY-${name.replace("#", "")}`;
  }
  return `WN-SHOPIFY-${order.order_number}`;
}

async function migrateOrders() {
  console.log("🔄 Shopify → Local Order Migration");
  console.log(`   Domain: ${SHOPIFY_DOMAIN}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log("");

  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    console.error("❌ Missing NEXT_PUBLIC_SHOPIFY_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN");
    process.exit(1);
  }

  // Fetch all Shopify orders
  console.log("📥 Fetching orders from Shopify...");
  const shopifyOrders = await fetchShopifyOrders();
  console.log(`   Found ${shopifyOrders.length} total orders\n`);

  // Filter to only paid, non-cancelled orders
  const validOrders = shopifyOrders.filter((order) => {
    if (order.cancelled_at) return false;
    const status = (order.financial_status ?? "").toLowerCase();
    return status === "paid" || status === "partially_paid";
  });
  console.log(`   ${validOrders.length} paid, non-cancelled orders to migrate\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const order of validOrders) {
    const orderNumber = buildOrderNumber(order);
    const email = resolveEmail(order);

    if (!email) {
      console.log(`   ⚠️  Skipping ${order.name} — no email`);
      skipped++;
      continue;
    }

    // Check if already migrated
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (existing) {
      console.log(`   ⏭️  ${orderNumber} already exists, skipping`);
      skipped++;
      continue;
    }

    const customerName = resolveCustomerName(order);
    const phone = resolvePhone(order);
    const address = order.shipping_address || order.billing_address;
    const planId = derivePlanId(order);
    const planLabel = derivePlanLabel(planId, order);
    const paymentMethod = derivePaymentMethod(order);
    const amountPaise = Math.round(parseFloat(order.total_price) * 100);

    if (DRY_RUN) {
      console.log(`   🧪 [DRY] Would create: ${orderNumber} | ${customerName} | ${planLabel} | ₹${order.total_price}`);
      created++;
      continue;
    }

    try {
      // Upsert customer
      const customer = await prisma.customer.upsert({
        where: { email },
        update: {
          fullName: customerName,
          phone: phone || "0000000000",
          updatedAt: new Date(),
        },
        create: {
          fullName: customerName,
          email,
          phone: phone || "0000000000",
          addressLine1: address?.address1 || "N/A",
          addressLine2: address?.address2 || "",
          city: address?.city || "N/A",
          state: address?.province || "N/A",
          pincode: address?.zip || "000000",
          country: address?.country || "India",
        },
      });

      // Create order
      await prisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          planId,
          planLabel,
          amountPaise,
          currency: order.currency || "INR",
          status: "paid",
          paymentMethod,
          razorpayPaymentId: `shopify_${order.id}`, // Placeholder since original Razorpay ID not available
          razorpayOrderId: null,
          razorpaySubscriptionId: null,
          shippingAddress: address
            ? {
                line1: address.address1 || "",
                line2: address.address2 || "",
                city: address.city || "",
                state: address.province || "",
                pincode: address.zip || "",
                country: address.country || "India",
              }
            : undefined,
          notes: `Migrated from Shopify order ${order.name} (ID: ${order.id})`,
          createdAt: new Date(order.created_at),
        },
      });

      console.log(`   ✅ ${orderNumber} | ${customerName} | ${planLabel} | ₹${order.total_price}`);
      created++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Skip duplicate key errors gracefully
      if (message.includes("Unique constraint")) {
        console.log(`   ⏭️  ${orderNumber} — duplicate, skipping`);
        skipped++;
      } else {
        console.error(`   ❌ ${orderNumber} — ${message}`);
        errors++;
      }
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   Total processed: ${validOrders.length}`);

  if (DRY_RUN) {
    console.log("\n   ℹ️  This was a dry run. No data was written.");
  }
}

migrateOrders()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
