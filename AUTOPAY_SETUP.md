# Shopify Autopay/Subscription Setup Guide

## Overview
This implementation uses Shopify selling plans to support two autopay options:
- Monthly recurring payment: INR 200 for 36 months
- Annual recurring payment: INR 2400 for 5 years (60 months total)

## Prerequisites
1. Shopify Plus or Shopify Advanced plan (required for native subscriptions)
2. Admin access to your Shopify store
3. Products with variants set up

## Setup Steps

### 1. Environment Variables
Add these to your `.env` file:

```bash
# Required Shopify variables
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_FRONT_ACCESS_TOKEN=your_storefront_token
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret

# New autopay selling plans (recommended)
NEXT_PUBLIC_MONTHLY_SELLING_PLAN_ID=gid://shopify/SellingPlan/...
NEXT_PUBLIC_ANNUAL_SELLING_PLAN_ID=gid://shopify/SellingPlan/...

# Optional dedicated variants for each billing mode
NEXT_PUBLIC_MONTHLY_VARIANT_ID=your_variant_id
NEXT_PUBLIC_ANNUAL_VARIANT_ID=your_variant_id

# Optional backward-compat fallback (variant only)
NEXT_PUBLIC_SHOPIFY_VARIANT_ID2=...
```

### 2. Create Selling Plans in Shopify Admin

#### Plan 1: Monthly Autopay (INR 200)
1. Go to Shopify Admin → Products → Selling plans
2. Create a new selling plan:
   - Name: "Monthly Autopay - INR 200"
   - Billing: Every 1 month
   - Max billing cycles: 36
   - Price: INR 200 each cycle
3. Copy the selling plan ID to `NEXT_PUBLIC_MONTHLY_SELLING_PLAN_ID`

#### Plan 2: Annual Autopay (INR 2400)
1. Create another selling plan:
   - Name: "Annual Autopay - INR 2400"
   - Billing: Every 1 year
   - Max billing cycles: 5
   - Price: INR 2400 each cycle
2. Copy the selling plan ID to `NEXT_PUBLIC_ANNUAL_SELLING_PLAN_ID`

### 3. Link Products to Selling Plans
1. Open the product variant used for subscription checkout
2. Attach both selling plans to that variant
3. Confirm billing interval and cycle limits are correct

### 4. Get Admin Access Token
1. Go to Shopify Admin → Apps → App and sales channel settings
2. Create a private app or use Shopify CLI
3. Enable these permissions:
   - `read_products`
   - `write_products` 
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `write_customers`
   - `write_purchase_options` (required to create/update selling plans via API)
   - `write_own_subscription_contracts` (alternative required scope depending app type)
   - Merchant user permission: `manage_orders_information`
4. Copy values:
   - Admin token to `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - Webhook secret to `SHOPIFY_WEBHOOK_SECRET`

### 5. Configure Webhooks for Payment Guard
1. In Shopify Admin webhook settings, create two webhooks:
   - `orders/create`
   - `orders/updated`
2. Set destination URL to:
   - `https://<your-domain>/api/shopify/webhooks/orders`
3. Use the same signing secret value in `SHOPIFY_WEBHOOK_SECRET`

## How It Works

### Current Implementation
- Checkout only allows lines that include a `sellingPlanId` (autopay enforced)
- The checkout request stores cart attributes to mark source as `wanderstamps-autopay`
- Webhook verifies payment state on order events for autopay-tagged orders
- If order is `pending`, `unpaid`, or `voided`, it is auto-cancelled via Admin API

### Why this helps with unpaid confirmations
- It prevents unpaid autopay orders from staying active in your order queue
- It reduces seller-side false positives for unpaid orders
- Shopify may still send default "order placed" notifications before cancellation depending on payment gateway behavior

### Features Enabled
- ✅ Automatic recurring payments
- ✅ Two billing choices (monthly and annual)
- ✅ Enforced selling plan checkout
- ✅ Unpaid autopay order auto-cancellation guard

### Customer Experience
1. Customer chooses monthly or annual autopay option
2. Redirected to Shopify checkout with subscription enabled
3. Completes payment and subscription is created
4. Shopify automatically charges them on the configured cycle
5. Customer can manage subscription in their Shopify account

## Testing
1. Use Shopify's test mode to test subscription creation
2. Verify both plans appear and map correctly in checkout
3. Simulate failed/incomplete payment and confirm order is auto-cancelled
4. Complete successful payment and confirm order remains active

## Troubleshooting

### Common Issues:
1. **"Selling plan not found"** - Verify selling plan IDs are correct
2. **"Insufficient permissions"** - Check admin token permissions
3. **Webhook 401** - Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify webhook secret
4. **Order still appears confirmed without payment email-wise** - Review Shopify notification templates/payment gateway flow

### Debug Steps:
1. Check browser console for API errors
2. Verify environment variables are loaded
3. Test API endpoints directly
4. Check webhook delivery logs in Shopify Admin
5. Check server logs for `/api/shopify/webhooks/orders`

## Next Steps
1. Configure custom email notifications on paid events only
2. Add analytics for plan selection and retention
3. Add internal alerting for repeated payment failures

## Support
- Shopify Subscriptions API docs: https://shopify.dev/docs/api/admin-rest/2024-01/resources/subscriptioncontract
- Selling Plans docs: https://shopify.dev/docs/api/admin-rest/2024-01/resources/sellingplan
