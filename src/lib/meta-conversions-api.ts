import crypto from "crypto";
import { getSiteUrl } from "@/src/lib/site-url";
import { META_PIXEL_ID } from "@/src/lib/meta-pixel";

type MetaMaybeString = string | number | null | undefined;

type MetaCustomerData = {
  name?: MetaMaybeString;
  email?: MetaMaybeString;
  phone?: MetaMaybeString;
  city?: MetaMaybeString;
  state?: MetaMaybeString;
  pincode?: MetaMaybeString;
  country?: MetaMaybeString;
  fbp?: MetaMaybeString;
  fbc?: MetaMaybeString;
  clientIpAddress?: MetaMaybeString;
  clientUserAgent?: MetaMaybeString;
};

type SendMetaPurchaseEventInput = {
  eventId: string;
  eventSourceUrl?: MetaMaybeString;
  value: number;
  currency?: MetaMaybeString;
  contentName?: MetaMaybeString;
  contentCategory?: MetaMaybeString;
  contentIds?: Array<string | number>;
  planId?: MetaMaybeString;
  orderId?: MetaMaybeString;
  customer?: MetaCustomerData;
};

type RequestLike = {
  headers: Headers;
  cookies?: {
    get: (name: string) => { value?: string } | undefined;
  };
};

const DEFAULT_META_GRAPH_API_VERSION = "v21.0";

function envValue(name: string) {
  return (process.env[name] || "").trim();
}

function getMetaAccessToken() {
  return (
    envValue("META_CAPI_ACCESS_TOKEN") ||
    envValue("META_CONVERSIONS_API_ACCESS_TOKEN") ||
    envValue("FACEBOOK_CONVERSIONS_API_ACCESS_TOKEN")
  );
}

function getMetaGraphApiVersion() {
  const version = envValue("META_GRAPH_API_VERSION");
  if (!version) {
    return DEFAULT_META_GRAPH_API_VERSION;
  }
  return version.startsWith("v") ? version : `v${version}`;
}

function normalizeText(value: MetaMaybeString, maxLength = 240) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function hashForMeta(value: MetaMaybeString) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function hashPhoneForMeta(value: MetaMaybeString) {
  const normalized = normalizeText(value).replace(/[^\d]/g, "");
  return hashForMeta(normalized);
}

function normalizeCountry(value: MetaMaybeString) {
  const country = normalizeText(value, 60).toLowerCase();
  if (!country) {
    return "";
  }
  if (country === "india") {
    return "in";
  }
  return country.length === 2 ? country : country;
}

function splitName(value: MetaMaybeString) {
  const parts = normalizeText(value, 120).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function compactObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    })
  );
}

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "";
  }
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "";
}

export function getMetaRequestData(request: RequestLike) {
  return {
    fbp: request.cookies?.get("_fbp")?.value || "",
    fbc: request.cookies?.get("_fbc")?.value || "",
    clientIpAddress: getClientIp(request.headers),
    clientUserAgent: request.headers.get("user-agent") || "",
  };
}

export function buildRazorpayPurchaseEventId(paymentId: string) {
  return `purchase:razorpay:${normalizeText(paymentId, 80)}`;
}

export function buildShopifyPurchaseEventId(orderId: string | number) {
  return `purchase:shopify:${normalizeText(orderId, 80)}`;
}

function buildUserData(customer: MetaCustomerData | undefined) {
  const { firstName, lastName } = splitName(customer?.name);
  return compactObject({
    em: hashForMeta(customer?.email),
    ph: hashPhoneForMeta(customer?.phone),
    fn: hashForMeta(firstName),
    ln: hashForMeta(lastName),
    ct: hashForMeta(customer?.city),
    st: hashForMeta(customer?.state),
    zp: hashForMeta(customer?.pincode),
    country: hashForMeta(normalizeCountry(customer?.country)),
    fbp: normalizeText(customer?.fbp, 120),
    fbc: normalizeText(customer?.fbc, 240),
    client_ip_address: normalizeText(customer?.clientIpAddress, 80),
    client_user_agent: normalizeText(customer?.clientUserAgent, 500),
  });
}

export async function sendMetaPurchaseEvent(input: SendMetaPurchaseEventInput) {
  const pixelId = META_PIXEL_ID.trim();
  const accessToken = getMetaAccessToken();

  if (!pixelId || !accessToken) {
    return { sent: false, skippedReason: "missing_meta_capi_config" };
  }

  const userData = buildUserData(input.customer);
  const payload = compactObject({
    data: [
      compactObject({
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: normalizeText(input.eventId, 160),
        action_source: "website",
        event_source_url: normalizeText(input.eventSourceUrl) || getSiteUrl(),
        user_data: userData,
        custom_data: compactObject({
          currency: normalizeText(input.currency || "INR", 3).toUpperCase(),
          value: input.value,
          content_name: normalizeText(input.contentName),
          content_category: normalizeText(input.contentCategory || "Subscription"),
          content_type: "product",
          content_ids: input.contentIds?.map(String) || (input.planId ? [String(input.planId)] : []),
          num_items: 1,
          order_id: normalizeText(input.orderId, 120),
        }),
      }),
    ],
    test_event_code: envValue("META_CAPI_TEST_EVENT_CODE") || undefined,
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/${getMetaGraphApiVersion()}/${encodeURIComponent(
        pixelId
      )}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const body = (await response.json().catch(() => null)) as
      | { events_received?: number; error?: { message?: string; code?: number } }
      | null;

    if (!response.ok || body?.error) {
      console.error("Meta CAPI Purchase event failed", body?.error || response.status);
      return {
        sent: false,
        error: body?.error?.message || `Meta CAPI request failed with status ${response.status}`,
      };
    }

    return { sent: true, eventsReceived: body?.events_received ?? 0 };
  } catch (error) {
    console.error("Meta CAPI Purchase event failed", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "meta_capi_request_failed",
    };
  }
}
