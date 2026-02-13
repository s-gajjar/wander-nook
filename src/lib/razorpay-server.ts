import crypto from "crypto";

export type AutopayPlanId = "monthly-autopay" | "annual-autopay";

export type RazorpayAutopayPlanConfig = {
  id: AutopayPlanId;
  displayName: string;
  amountInr: number;
  amountPaise: number;
  totalCount: number;
  cycle: "monthly" | "yearly";
  razorpayPlanId: string;
  shopifyVariantId: string;
};

const PLAN_DEFINITIONS: Record<
  AutopayPlanId,
  Omit<RazorpayAutopayPlanConfig, "razorpayPlanId" | "shopifyVariantId">
> = {
  "monthly-autopay": {
    id: "monthly-autopay",
    displayName: "Monthly Autopay",
    amountInr: 200,
    amountPaise: 20000,
    totalCount: 36,
    cycle: "monthly",
  },
  "annual-autopay": {
    id: "annual-autopay",
    displayName: "Annual Autopay",
    amountInr: 2300,
    amountPaise: 230000,
    totalCount: 5,
    cycle: "yearly",
  },
};

function envValue(name: string) {
  const value = process.env[name];
  if (!value) return "";
  return value.trim();
}

function requiredEnv(name: string) {
  const value = envValue(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getRazorpaySecret() {
  return requiredEnv("RAZORPAY_KEY_SECRET");
}

export function getRazorpayKeyId() {
  return requiredEnv("RAZORPAY_KEY_ID");
}

function getRazorpayAuthHeader() {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpaySecret();
  const token = Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function getVariantByPlan(planId: AutopayPlanId) {
  if (planId === "monthly-autopay") {
    return (
      envValue("SHOPIFY_MONTHLY_VARIANT_ID") ||
      envValue("NEXT_PUBLIC_MONTHLY_VARIANT_ID") ||
      envValue("NEXT_PUBLIC_SHOPIFY_VARIANT_ID2")
    );
  }
  return (
    envValue("SHOPIFY_ANNUAL_VARIANT_ID") ||
    envValue("NEXT_PUBLIC_ANNUAL_VARIANT_ID") ||
    envValue("NEXT_PUBLIC_SHOPIFY_VARIANT_ID2")
  );
}

function getRazorpayPlanId(planId: AutopayPlanId) {
  if (planId === "monthly-autopay") {
    return (
      envValue("RAZORPAY_MONTHLY_PLAN_ID") ||
      envValue("RAZORPAY_PLAN_ID_MONTHLY")
    );
  }
  return (
    envValue("RAZORPAY_ANNUAL_PLAN_ID") ||
    envValue("RAZORPAY_PLAN_ID_ANNUAL")
  );
}

export function getAutopayPlanConfig(planId: string): RazorpayAutopayPlanConfig | null {
  if (planId !== "monthly-autopay" && planId !== "annual-autopay") {
    return null;
  }

  const basePlan = PLAN_DEFINITIONS[planId];
  const razorpayPlanId = getRazorpayPlanId(planId);
  const shopifyVariantId = getVariantByPlan(planId);

  if (!razorpayPlanId) {
    throw new Error(
      `Missing Razorpay plan mapping for ${planId}. Set RAZORPAY_${
        planId === "monthly-autopay" ? "MONTHLY" : "ANNUAL"
      }_PLAN_ID in env.`
    );
  }

  if (!shopifyVariantId) {
    throw new Error(
      `Missing Shopify variant mapping for ${planId}. Set SHOPIFY_${
        planId === "monthly-autopay" ? "MONTHLY" : "ANNUAL"
      }_VARIANT_ID in env.`
    );
  }

  return {
    ...basePlan,
    razorpayPlanId,
    shopifyVariantId,
  };
}

export function getAutopayPlanConfigByRazorpayPlanId(
  razorpayPlanId: string
): RazorpayAutopayPlanConfig | null {
  const normalizedPlanId = razorpayPlanId.trim();
  if (!normalizedPlanId) {
    return null;
  }

  const planIds: AutopayPlanId[] = ["monthly-autopay", "annual-autopay"];
  for (const planId of planIds) {
    try {
      const plan = getAutopayPlanConfig(planId);
      if (plan && plan.razorpayPlanId === normalizedPlanId) {
        return plan;
      }
    } catch {
      // Skip unconfigured plans while checking configured mappings.
    }
  }

  return null;
}

export function parseShopifyVariantId(variant: string) {
  const trimmed = variant.trim();
  const gidMatch = trimmed.match(/^gid:\/\/shopify\/ProductVariant\/(\d+)$/);
  if (gidMatch) {
    return Number(gidMatch[1]);
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return null;
}

export async function razorpayRequest<TResponse>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  }
) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as
    | (TResponse & { error?: { code?: string; description?: string } })
    | null;

  if (!response.ok || !json) {
    const errorMessage =
      json?.error?.description ||
      json?.error?.code ||
      `Razorpay request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return json;
}

export function verifyRazorpaySubscriptionSignature({
  paymentId,
  subscriptionId,
  signature,
}: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", getRazorpaySecret())
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
