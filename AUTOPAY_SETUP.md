# Razorpay Autopay + Shopify Order Flow

## Overview
This project now uses a **custom Razorpay checkout flow** for autopay plans, and creates a Shopify order **only after verified payment**.

Supported plans:
- Monthly autopay: INR 200, recurring for 36 cycles
- Annual autopay: INR 2400, recurring for 5 cycles

## Environment Variables
Add these in your deployment environment (Vercel Production):

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_MONTHLY_PLAN_ID=plan_xxxxx
RAZORPAY_ANNUAL_PLAN_ID=plan_xxxxx

# Shopify Admin
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx

# Variant mapping used when creating Shopify order after payment
SHOPIFY_MONTHLY_VARIANT_ID=12345678901234
SHOPIFY_ANNUAL_VARIANT_ID=12345678901234

# Existing webhook protection route
SHOPIFY_WEBHOOK_SECRET=xxxxxxxx
```

## Required Shopify App Scopes
- `read_orders`
- `write_orders`
- `read_products`

## Required Razorpay Setup
Create and keep active 2 Razorpay subscription plans:
1. Monthly plan
1. Annual plan

Map their IDs to:
- `RAZORPAY_MONTHLY_PLAN_ID`
- `RAZORPAY_ANNUAL_PLAN_ID`

## API Endpoints
New endpoints:
- `POST /api/razorpay/autopay/create`
  - Creates Razorpay subscription object for selected plan.
- `POST /api/razorpay/autopay/verify`
  - Verifies Razorpay signature.
  - Validates captured payment amount/currency.
  - Creates Shopify order after successful verification.
  - Uses tags/metadata to avoid duplicate order creation.

Existing webhook endpoint:
- `POST /api/shopify/webhooks/orders`
  - Keeps unpaid-order cancellation guard logic.

## Customer Flow
1. User clicks monthly or annual autopay card.
2. Custom form collects contact and address.
3. Razorpay checkout opens.
4. On successful Razorpay callback:
   - signature is verified server-side
   - payment capture status is validated
   - Shopify order is created as paid

No Shopify order is created before verified payment.

## Testing Checklist
1. Submit monthly plan with a test/live successful payment.
2. Confirm `/api/razorpay/autopay/verify` returns `200`.
3. Confirm Shopify order is created with tags:
   - `wanderstamps-autopay`
   - `razorpay-autopay`
   - `rzp-sub-...`
4. Retry same verify payload and confirm no duplicate order is created.
5. Confirm webhook endpoint still receives `orders/create` and `orders/updated` with `200`.

## Notes
- If payment is not yet `captured`, verify endpoint returns `409` and skips order creation.
- This prevents unpaid orders from being marked as confirmed by your custom flow.
