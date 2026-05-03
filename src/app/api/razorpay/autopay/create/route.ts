import { NextRequest, NextResponse } from "next/server";
import {
  getAutopayPlanConfig,
  getRazorpayKeyId,
  razorpayRequest,
} from "@/src/lib/razorpay-server";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";

export const runtime = "nodejs";

type CreateAutopayRequestBody = {
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
  tracking?: {
    fbp?: string;
    fbc?: string;
    eventSourceUrl?: string;
  };
};

type RazorpaySubscriptionResponse = {
  id: string;
  plan_id: string;
  status: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^[0-9]{10,15}$/.test(value);
}

function sanitizeText(value: string, maxLength = 100) {
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAutopayRequestBody;
    const planId = (body.planId || "").trim();
    const plan = getAutopayPlanConfig(planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected for autopay checkout" },
        { status: 400 }
      );
    }

    if (plan.id !== "monthly-autopay") {
      return NextResponse.json(
        { error: "Only the monthly plan supports recurring autopay checkout." },
        { status: 400 }
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
    const metaFbp = sanitizeText(body.tracking?.fbp || "", 120);
    const metaFbc = sanitizeText(body.tracking?.fbc || "", 240);
    const eventSourceUrl = sanitizeText(body.tracking?.eventSourceUrl || "", 300);

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide all required customer details (name, email, phone, address, city, state, pincode).",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (10-15 digits)." },
        { status: 400 }
      );
    }

    const razorpaySubscription = await razorpayRequest<RazorpaySubscriptionResponse>(
      "/subscriptions",
      {
        method: "POST",
        body: {
          plan_id: plan.razorpayPlanId,
          total_count: plan.totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            checkout_source: "wanderstamps-autopay",
            recurring_plan_id: plan.id,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            customer_city: city,
            customer_state: state,
            customer_pincode: pincode,
            customer_country: country,
            customer_address_1: addressLine1,
            ...(addressLine2 ? { customer_address_2: addressLine2 } : {}),
            ...(metaFbp ? { meta_fbp: metaFbp } : {}),
            ...(metaFbc ? { meta_fbc: metaFbc } : {}),
            ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
          },
        },
      }
    );

    await trackConversionEvent({
      eventName: "autopay_subscription_created",
      planId: plan.id,
      customerEmail: customerEmail,
      razorpaySubscriptionId: razorpaySubscription.id,
      metadata: {
        billingCycle: plan.cycle,
        amountPaise: plan.amountPaise,
        customerName,
        customerPhone,
        customerCity: city,
        customerState: state,
      },
    });

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      subscriptionId: razorpaySubscription.id,
      plan: {
        id: plan.id,
        label: plan.displayName,
        amountInr: plan.amountInr,
        cycle: plan.cycle,
        totalCount: plan.totalCount,
      },
    });
  } catch (error) {
    console.error("Failed to create Razorpay autopay subscription", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize autopay. Please try again.",
      },
      { status: 500 }
    );
  }
}
