# Razorpay Pricing Update Guide

## Overview
This guide covers:
1. Updating the Print Edition subscription from ₹2200 to ₹2400 in Razorpay
2. Creating a hidden ₹2200 autopay link for manual use (not visible on website)

---

## Part 1: Update Print Edition to ₹2400

### Step 1: Create New Razorpay Plan for ₹2400

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/
   - Use your credentials to log in
   - Make sure you're in the correct mode (Test or Live)

2. **Navigate to Subscriptions**
   - From the left sidebar, click on **Subscriptions**
   - Click on **Plans**

3. **Create New Plan**
   - Click on **+ Create Plan** button
   - Fill in the following details:
     - **Plan Name**: `Print Edition Annual Subscription - ₹2400`
     - **Plan ID**: Let Razorpay auto-generate or create a custom ID (e.g., `plan_print_2400_annual`)
     - **Billing Amount**: `240000` (in paise, i.e., ₹2400)
     - **Billing Currency**: `INR`
     - **Billing Interval**: `1 year` or `12 months`
     - **Description**: `Annual subscription for Wander Nook Print Edition - 24 newspapers delivered fortnightly, printables, and 1 travel journal`
     - **Notes**: Add any internal notes you need

4. **Save the Plan**
   - Click **Create Plan**
   - **Copy the Plan ID** (it will look like `plan_xxxxxxxxxx`)

### Step 2: Update Environment Variables

1. **Update your `.env` file** (or `.env.local` for Next.js):
   ```bash
   # Replace the old plan ID with the new one
   NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_xxxxxxxxxx  # New ₹2400 plan ID
   
   # Keep the digital plan ID as is
   NEXT_PUBLIC_RAZORPAY_DIGITAL_PLAN_ID=plan_RGGDvOBG7Ey6NK  # Existing digital plan
   
   # Your Razorpay credentials (should already exist)
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
   ```

2. **If using Test Mode**, create the plan in Test Mode and use:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_secret_key
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_test_xxxxxxxxxx  # Test mode plan ID
   ```

### Step 3: Deploy Changes

1. **For Vercel/Production**:
   - Go to your deployment platform (e.g., Vercel Dashboard)
   - Navigate to **Settings** → **Environment Variables**
   - Update `NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID` with the new plan ID
   - Redeploy your application

2. **Restart Local Development Server**:
   ```bash
   npm run dev
   ```

### Step 4: Verify the Update

1. Go to your website pricing page
2. Click on "Get Everything!" for Print Edition
3. Fill in the customer form
4. Verify that the Razorpay payment page shows ₹2400
5. Check that the subscription is created correctly in Razorpay Dashboard

---

## Part 2: Create Hidden ₹2200 Autopay Link (Not on Website)

### Purpose
This creates a Razorpay payment link for ₹2200 with autopay enabled that can be shared manually with specific customers but won't appear on the website.

### Step 1: Create ₹2200 Subscription Plan

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/

2. **Create a Separate Plan for ₹2200**
   - Go to **Subscriptions** → **Plans**
   - Click **+ Create Plan**
   - Fill in:
     - **Plan Name**: `Print Edition Annual - Special Offer ₹2200`
     - **Billing Amount**: `220000` (in paise)
     - **Billing Currency**: `INR`
     - **Billing Interval**: `1 year` or `12 months`
     - **Description**: `Special pricing for Wander Nook Print Edition - Annual subscription`
   - Click **Create Plan**
   - **Copy the Plan ID** (e.g., `plan_special_2200_print`)

### Step 2: Create Payment Link with Autopay

#### Option A: Using Razorpay Payment Links

1. **Navigate to Payment Links**
   - From sidebar, click **Payment Links**
   - Click **+ Create Payment Link**

2. **Configure Payment Link**
   - **Title**: `Wander Nook Print Edition - Special Offer`
   - **Description**: `Annual subscription to Wander Nook Print Edition`
   - **Amount**: `240000` (₹2400) or use the subscription plan
   - **Link to Subscription Plan**: Select the ₹2200 plan you created
   - **Customer Details**: Choose what customer info to collect
     - Name (Required)
     - Email (Required)
     - Phone (Required)
     - Address (Required - for print delivery)
   - **Payment Options**: Enable all payment methods including autopay/UPI/Cards

3. **Advanced Settings**
   - **Send SMS/Email notification**: Enable if you want Razorpay to notify customers
   - **Custom webhook**: Optional, if you want specific notifications

4. **Create Link**
   - Click **Create Link**
   - **Copy the Payment Link URL** (looks like: `https://rzp.io/l/xxxxxxxx`)

#### Option B: Using Subscription Links

1. **Create Subscription Link**
   - Go to **Subscriptions** → **Subscription Links**
   - Click **+ Create Subscription Link**
   - Select the ₹2200 plan you created
   - Configure customer details to collect
   - Click **Create**
   - **Copy the Subscription Link**

### Step 3: Store the Link Securely

Since this link should **NOT** be visible on the website, store it securely:

1. **Add to `.env` file** (for admin reference only):
   ```bash
   # Hidden ₹2200 Special Offer Link (DO NOT expose to frontend)
   RAZORPAY_SPECIAL_PRINT_PLAN_ID=plan_special_2200_print
   RAZORPAY_SPECIAL_PRINT_LINK=https://rzp.io/l/xxxxxxxx
   ```

2. **Document it in a secure location**:
   - Keep a record in your password manager
   - Document in your internal wiki/notion
   - Share with team members who need access

### Step 4: Using the Hidden Link

#### How to Share with Customers:

1. **Email Template Example**:
   ```
   Subject: Special Offer - Wander Nook Print Edition Subscription

   Dear [Customer Name],

   We're pleased to offer you a special pricing for our Print Edition subscription!

   🎁 Special Price: ₹2200/year (Regular price: ₹2400/year)

   Click here to subscribe: [Your Payment Link]

   This subscription includes:
   - 24 newspapers delivered fortnightly
   - Printables included
   - 1 travel journal

   This link is exclusive and expires on [Date].

   Best regards,
   Wander Nook Team
   ```

2. **WhatsApp Message Template**:
   ```
   Hi [Name]! 👋

   Special offer just for you! 🎉

   Get our Print Edition subscription at ₹2200/year
   (Save ₹200!)

   Subscribe here: [Your Payment Link]

   Includes 24 newspapers + printables + travel journal 📰

   Limited time offer!
   ```

3. **SMS Template**:
   ```
   Wander Nook: Special offer! Print Edition subscription at Rs.2200/year (Save Rs.200). Subscribe: [Short Link]
   ```

### Step 5: Track Special Offers

1. **In Razorpay Dashboard**:
   - Go to **Subscriptions** → **All Subscriptions**
   - Filter by the ₹2200 plan ID
   - You can see all customers who subscribed using this special link

2. **Add Tags in Razorpay**:
   - When creating the plan, add tags like: `special-offer`, `discount-2200`
   - This helps you track these subscriptions separately

---

## Important Notes

### Security
- ❌ **DO NOT** add the ₹2200 link to the website frontend code
- ❌ **DO NOT** commit the payment link to public repositories
- ✅ Keep the link in secure, private documentation
- ✅ Share only with authorized team members
- ✅ Monitor usage regularly

### Razorpay Plan IDs
After creating both plans, you should have:
- **₹2400 Plan** (Public - on website): `NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID`
- **₹2200 Plan** (Hidden - manual sharing): `RAZORPAY_SPECIAL_PRINT_PLAN_ID` (NOT exposed to frontend)

### Environment Variables Summary

```bash
# .env or .env.local

# Public plans (exposed to frontend via NEXT_PUBLIC_*)
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_new_2400_print    # ₹2400 (visible on website)
NEXT_PUBLIC_RAZORPAY_DIGITAL_PLAN_ID=plan_RGGDvOBG7Ey6NK # ₹1500 (visible on website)

# Private plan (server-side only, NOT exposed to frontend)
RAZORPAY_SPECIAL_PRINT_PLAN_ID=plan_special_2200_print   # ₹2200 (hidden, for manual sharing)
RAZORPAY_SPECIAL_PRINT_LINK=https://rzp.io/l/xxxxxxxx    # Direct payment link

# Razorpay credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx

# Shopify (if applicable)
SHOPIFY_ADMIN_ACCESS_TOKEN=your_shopify_token
NEXT_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
# ... other Shopify vars
```

---

## Testing

### Test Mode (Before Going Live)

1. **Switch to Test Mode** in Razorpay Dashboard
2. Create test plans with the same configuration
3. Test the payment flow:
   - Public ₹2400 link on website
   - Hidden ₹2200 link via direct sharing
4. Verify webhooks and order creation in Shopify
5. Use Razorpay test cards: https://razorpay.com/docs/payments/payments/test-card-details/

### Live Mode Checklist

- [ ] ₹2400 plan created in Live Mode
- [ ] ₹2200 special plan created in Live Mode
- [ ] Environment variables updated in production
- [ ] Website tested and showing ₹2400
- [ ] Payment link for ₹2200 tested and working
- [ ] Payment link securely documented
- [ ] Team members informed about both plans
- [ ] Webhooks configured (if applicable)
- [ ] Shopify integration tested (if applicable)

---

## Support & Troubleshooting

### Common Issues

1. **"Plan not found" error**
   - Verify the plan ID is correct in `.env`
   - Ensure you're using the correct mode (Test vs Live)
   - Check that the plan is active in Razorpay Dashboard

2. **Wrong amount showing on payment page**
   - Clear browser cache
   - Verify environment variables are loaded (restart dev server)
   - Check that deployment platform has updated env vars

3. **Subscription not creating in Shopify**
   - Verify Shopify credentials are correct
   - Check Shopify API logs in Razorpay dashboard
   - Ensure webhook URLs are configured

### Razorpay Resources

- **Documentation**: https://razorpay.com/docs/
- **API Reference**: https://razorpay.com/docs/api/
- **Subscriptions**: https://razorpay.com/docs/payments/subscriptions/
- **Payment Links**: https://razorpay.com/docs/payment-links/
- **Support**: https://razorpay.com/support/

---

## Changelog

- **2024**: Updated Print Edition from ₹2200 to ₹2400
- **2024**: Created hidden ₹2200 autopay link for special offers
- Website code updated to reflect new pricing
- FAQ updated with new pricing information

