# Shopify Autopay/Subscription Setup Guide

## Overview
This implementation uses Shopify's native Subscriptions API to enable automatic recurring payments (autopay) for your subscription plans.

## Prerequisites
1. Shopify Plus or Shopify Advanced plan (required for native subscriptions)
2. Admin access to your Shopify store
3. Products with variants set up

## Setup Steps

### 1. Environment Variables
Add these to your `.env` file:

```bash
# Existing variables
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_FRONT_ACCESS_TOKEN=your_storefront_token
NEXT_PUBLIC_SHOPIFY_VARIANT_ID1=your_digital_variant_id
NEXT_PUBLIC_SHOPIFY_VARIANT_ID2=your_print_variant_id

# New variables for autopay
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token
NEXT_PUBLIC_PRINT_SELLING_PLAN_ID=your_print_selling_plan_id
NEXT_PUBLIC_DIGITAL_SELLING_PLAN_ID=your_digital_selling_plan_id
```

### 2. Create Selling Plans in Shopify Admin

#### For Print Edition (Annual):
1. Go to Shopify Admin → Products → Selling plans
2. Create a new selling plan:
   - Name: "Print Edition Annual"
   - Description: "Annual subscription for print edition"
   - Billing: Every 12 months
   - Price adjustment: Set your discount (e.g., 8.33% off for annual)
3. Copy the selling plan ID and add to `NEXT_PUBLIC_PRINT_SELLING_PLAN_ID`

#### For Digital Edition (Annual):
1. Create another selling plan:
   - Name: "Digital Edition Annual" 
   - Description: "Annual subscription for digital edition"
   - Billing: Every 12 months
   - Price adjustment: Set your discount
2. Copy the selling plan ID and add to `NEXT_PUBLIC_DIGITAL_SELLING_PLAN_ID`

### 3. Link Products to Selling Plans
1. Go to your product variants in Shopify Admin
2. For each variant, add the corresponding selling plan
3. Set the selling plan pricing and discounts

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
   - `read_subscriptions`
   - `write_subscriptions`
4. Copy the Admin API access token to `SHOPIFY_ADMIN_ACCESS_TOKEN`

## How It Works

### Current Implementation
- The pricing component now includes `sellingPlanId` in the checkout payload
- When customers click "Get Everything!" or "Go Digital!", they're redirected to Shopify checkout
- Shopify automatically handles the subscription creation and recurring billing
- Customers will be charged automatically based on the selling plan frequency

### Features Enabled
- ✅ Automatic recurring payments
- ✅ Customer subscription management
- ✅ Billing cycle management
- ✅ Failed payment retry logic (handled by Shopify)
- ✅ Customer portal for subscription management

### Customer Experience
1. Customer clicks subscription button
2. Redirected to Shopify checkout with subscription enabled
3. Completes payment and subscription is created
4. Shopify automatically charges them on the next billing cycle
5. Customer can manage subscription in their Shopify account

## Testing
1. Use Shopify's test mode to test subscription creation
2. Verify that selling plans are properly linked to products
3. Test the checkout flow with test payment methods
4. Confirm subscription appears in Shopify Admin

## Troubleshooting

### Common Issues:
1. **"Selling plan not found"** - Verify selling plan IDs are correct
2. **"Insufficient permissions"** - Check admin token permissions
3. **"Subscription creation failed"** - Ensure products are linked to selling plans

### Debug Steps:
1. Check browser console for API errors
2. Verify environment variables are loaded
3. Test API endpoints directly
4. Check Shopify Admin for subscription creation

## Next Steps
1. Set up webhooks for subscription events (optional)
2. Add customer portal customization
3. Implement subscription analytics
4. Add email notifications for subscription events

## Support
- Shopify Subscriptions API docs: https://shopify.dev/docs/api/admin-rest/2024-01/resources/subscriptioncontract
- Selling Plans docs: https://shopify.dev/docs/api/admin-rest/2024-01/resources/sellingplan
