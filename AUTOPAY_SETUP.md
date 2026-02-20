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
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
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

# Site URL (used in invoice links and SEO metadata)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Email provider for invoice delivery (choose either SMTP OR Resend)
# Option A: SMTP (Google Workspace compatible)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@wandernook.in
SMTP_PASS=your_google_workspace_app_password

# Option B: Resend
RESEND_API_KEY=re_xxxxx
MAIL_FROM=support@wandernook.in

# Optional branding overrides for invoice template
INVOICE_PRIMARY_LOGO_URL=/wander-stamps-logo.png
INVOICE_SECONDARY_LOGO_URL=/wander-logo.png

# Optional analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
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
  - Uses payment tags/metadata to avoid duplicate order creation.
  - Creates invoice record (idempotent by Razorpay payment id).
  - Sends invoice email with PDF attachment to customer.
- `POST /api/razorpay/autopay/webhook`
  - Verifies Razorpay webhook signature.
  - Handles `invoice.paid`, `subscription.charged`, and `payment.captured`.
  - Creates Shopify order server-side if browser callback was missed.
  - Creates/syncs invoice record for recurring charges.
  - Sends monthly/yearly invoice email with PDF attachment only on successful captured charges.

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
5. If callback is missed (for example, UPI app-switch flow), webhook fallback creates the order.

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
6. Configure Razorpay webhook URL:
   - `https://<your-domain>/api/razorpay/autopay/webhook`
   - Secret = `RAZORPAY_WEBHOOK_SECRET`
   - Events: `invoice.paid`, `subscription.charged`, `payment.captured`
7. Verify invoice email flow:
   - Open `/admin` and confirm invoice rows are created.
   - Confirm invoice email timestamp is populated.
   - Use `Resend Email` in `/admin` to manually resend when needed.

## Notes
- If payment is not yet `captured`, verify endpoint returns `409` and skips order creation.
- This prevents unpaid orders from being marked as confirmed by your custom flow.
