---
name: razorpay
description: |
  Integrate Razorpay payment processing for Indian and international payments — orders, checkout, subscriptions, refunds, webhooks, payment links, and UPI.
  TRIGGER: "razorpay", "payment gateway", "UPI payment", "razorpay checkout", "razorpay webhook",
  "razorpay subscription", "payment link", "razorpay order", "indian payments", "INR checkout",
  "razorpay refund", "payment verification", "razorpay api"
---

# Razorpay Integration Skill

Use this skill when the user asks about:

- Integrating Razorpay payments (orders, checkout, verification)
- Handling Razorpay webhooks
- Creating subscriptions / recurring payments
- Implementing UPI, cards, wallets, netbanking
- Payment links & invoices
- Refunds and disputes
- Razorpay route (split payments / marketplace)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  Your Server │────▶│  Razorpay API   │
│  (Checkout) │     │  (Orders +   │     │  razorpay.com   │
│             │◀────│   Verify)    │◀────│                 │
└─────────────┘     └──────────────┘     └─────────────────┘
                           ▲
                           │ Webhooks
                    ┌──────┴────────┐
                    │ Razorpay      │
                    │ Event System  │
                    └───────────────┘
```

## Payment Flow (Standard)

1. **Create Order** (server-side) → Get `order_id`
2. **Open Checkout** (client-side) → User pays
3. **Verify Payment** (server-side) → Validate signature
4. **Capture Payment** (if manual capture) → Confirm

---

## Server-Side: Create Order (Next.js API Route)

```typescript
// app/api/razorpay/create-order/route.ts
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { amount, currency = "INR", receipt, notes } = await req.json();

  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay expects paise
    currency,
    receipt,
    notes,
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  });
}
```

## Client-Side: Checkout

```typescript
// components/RazorpayCheckout.tsx
"use client";

import { useCallback } from "react";

interface RazorpayOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpayResponse) => void;
  onFailure?: (error: any) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpay() {
  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(
    async (options: RazorpayOptions) => {
      const loaded = await loadScript();
      if (!loaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description,
        order_id: options.orderId,
        prefill: options.prefill,
        handler: (response: RazorpayResponse) => {
          options.onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            options.onFailure?.({ reason: "checkout_closed" });
          },
        },
        theme: { color: "#528FF0" },
      });

      rzp.on("payment.failed", (response: any) => {
        options.onFailure?.(response.error);
      });

      rzp.open();
    },
    [loadScript]
  );

  return { openCheckout };
}
```

## Server-Side: Verify Payment Signature

```typescript
// app/api/razorpay/verify/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await req.json();

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  if (isValid) {
    // Update order status in DB
    // await prisma.order.update(...)
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}
```

## Webhook Handler

```typescript
// app/api/razorpay/webhook/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "payment.captured":
      // Payment successful — fulfill order
      const payment = event.payload.payment.entity;
      // await fulfillOrder(payment.order_id, payment.id);
      break;

    case "payment.failed":
      // Payment failed — notify user
      break;

    case "order.paid":
      // Order fully paid
      break;

    case "refund.created":
      // Refund initiated
      break;

    case "subscription.activated":
      // Subscription started
      break;

    case "subscription.charged":
      // Recurring charge successful
      break;

    case "subscription.cancelled":
      // Subscription cancelled
      break;

    default:
      console.log(`Unhandled event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}
```

## Subscriptions

```typescript
// Create a plan
const plan = await razorpay.plans.create({
  period: "monthly",
  interval: 1,
  item: {
    name: "Pro Plan",
    amount: 99900, // ₹999
    currency: "INR",
    description: "Monthly pro subscription",
  },
});

// Create a subscription
const subscription = await razorpay.subscriptions.create({
  plan_id: plan.id,
  total_count: 12, // 12 months
  quantity: 1,
  customer_notify: 1,
  notes: { user_id: "user_123" },
});
```

## Refunds

```typescript
// Full refund
const refund = await razorpay.payments.refund(paymentId, {
  speed: "optimum", // or "normal"
});

// Partial refund
const partialRefund = await razorpay.payments.refund(paymentId, {
  amount: 50000, // ₹500 in paise
  speed: "optimum",
  notes: { reason: "Customer request" },
});
```

## Payment Links (No-code checkout)

```typescript
const paymentLink = await razorpay.paymentLink.create({
  amount: 100000, // ₹1000
  currency: "INR",
  description: "Payment for order #123",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    contact: "+919876543210",
  },
  notify: { sms: true, email: true },
  callback_url: "https://yoursite.com/payment-success",
  callback_method: "get",
});
// paymentLink.short_url → share with customer
```

## Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Installation

```bash
npm install razorpay
```

## Key Points

- **Always verify signature server-side** — never trust client callbacks alone
- **Use webhooks as source of truth** — checkout callbacks can fail silently
- **Amount is in paise** — multiply by 100 (₹500 = 50000)
- **Idempotency** — use `receipt` field to prevent duplicate orders
- **Test mode** — use `rzp_test_*` keys, test cards: `4111 1111 1111 1111`
- **UPI** — works out of the box with Razorpay checkout, no extra config needed
- **International payments** — enable in Razorpay dashboard, supports USD/EUR/GBP etc.

## References

See [references/razorpay-api.md](references/razorpay-api.md) for full API reference.
