# URGENT: Create Razorpay Plan - Step by Step

## You're seeing this error because the plan doesn't exist yet in Razorpay!

Error: `The id provided does not exist`

---

## Quick Fix (5 minutes)

### Step 1: Login to Razorpay

Go to: **https://dashboard.razorpay.com/**

**Important**: Check if you're in **Test Mode** or **Live Mode** (top left corner)
- Your current setup is using **Test Mode** (based on the logs showing `test mode: true`)

### Step 2: Create the ₹2400 Plan

1. **Navigate to**: Subscriptions → Plans (from left sidebar)

2. **Click**: "+ Create Plan" button (top right)

3. **Fill in the form**:

   ```
   Plan Name: Print Edition Annual ₹2400
   
   Plan Type: Standard
   
   Billing Amount: 240000
   (This is in PAISE - ₹2400 = 240000 paise)
   
   Billing Currency: INR
   
   Billing Cycle: 
   - Period: 12
   - Interval: month(s)
   (OR select "1 year" if available)
   
   Description: 
   Annual subscription for Wander Nook Print Edition - 24 newspapers 
   delivered fortnightly, printables, and 1 travel journal
   
   Notes (optional):
   Created for website pricing update - ₹2400 annual plan
   ```

4. **Click**: "Create Plan" button

5. **COPY THE PLAN ID**: 
   - After creation, you'll see a Plan ID like: `plan_xxxxxxxxxx`
   - **Copy this ID** - you'll need it next!

---

## Step 3: Update BOTH Environment Variables

You currently have:
```bash
RAZORPAY_PRINT_PLAN_ID=plan_RUbQuilljn3O50  # ✅ Good
```

**Add this line too** (with the NEW plan ID you just created):
```bash
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_YOUR_NEW_PLAN_ID_HERE
```

### Your .env file should look like:

```bash
# Razorpay Credentials (should already exist)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Digital Plan (should already exist)
RAZORPAY_DIGITAL_PLAN_ID=plan_RGGDvOBG7Ey6NK
NEXT_PUBLIC_RAZORPAY_DIGITAL_PLAN_ID=plan_RGGDvOBG7Ey6NK

# Print Plan - ADD BOTH OF THESE (use the same plan ID for both)
RAZORPAY_PRINT_PLAN_ID=plan_YOUR_NEW_PLAN_ID_HERE
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_YOUR_NEW_PLAN_ID_HERE

# Shopify (should already exist)
NEXT_PUBLIC_SHOPIFY_DOMAIN=876a76-de.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your_shopify_token
# ... other Shopify variables
```

**IMPORTANT**: Use the **same plan ID** for both `RAZORPAY_PRINT_PLAN_ID` and `NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID`!

---

## Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Step 5: Test Again

1. Go to: http://localhost:3003 (or whatever port it's running on)
2. Scroll to Pricing section
3. Click "Get Everything!" for Print Edition
4. Fill in the form
5. Submit and check if it works now!

---

## Why This Happens?

**Two variables are needed**:

1. **`NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID`**: 
   - Frontend uses this (client-side JavaScript)
   - Sends this plan ID to the backend
   
2. **`RAZORPAY_PRINT_PLAN_ID`**: 
   - Backend uses this for validation
   - Compares with what frontend sent

---

## Still Getting Errors?

### Check 1: Verify the Plan Exists
1. Go to Razorpay Dashboard
2. Subscriptions → Plans
3. Find your ₹2400 plan
4. **Copy the exact Plan ID** (it's shown in the list)
5. Use that ID in your .env file

### Check 2: Confirm You're in Test Mode
- If your Razorpay key starts with `rzp_test_`, you're in Test Mode
- Create the plan in **Test Mode** in the dashboard
- Switch mode in dashboard (top left toggle)

### Check 3: Try Using Default Plan First
If you want to test quickly, use the existing working plan temporarily:
```bash
# Use the old ₹2200 plan just to test (temporarily)
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_RGGEByLCIXwHrL
RAZORPAY_PRINT_PLAN_ID=plan_RGGEByLCIXwHrL
```

This will use the old ₹2200 pricing but at least it will work while you set up the new plan.

---

## Visual Guide

```
Razorpay Dashboard → Subscriptions → Plans
     ↓
Click "+ Create Plan"
     ↓
Fill form with ₹2400 (240000 paise)
     ↓
Click "Create"
     ↓
COPY THE PLAN ID
     ↓
Add to .env:
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_xxxxx
RAZORPAY_PRINT_PLAN_ID=plan_xxxxx
     ↓
Restart server: npm run dev
     ↓
Test subscription!
```

---

## Quick Checklist

- [ ] Logged into Razorpay Dashboard
- [ ] Confirmed I'm in Test Mode (or Live Mode - whichever you're using)
- [ ] Created new plan with ₹2400 (240000 paise)
- [ ] Copied the Plan ID
- [ ] Added `NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID` to .env
- [ ] Added `RAZORPAY_PRINT_PLAN_ID` to .env (same value)
- [ ] Restarted dev server
- [ ] Tested subscription flow

---

## Need Help?

**Common Issues**:

1. **"Plan not found"** → You're in wrong mode (Test vs Live)
2. **"Amount mismatch"** → Check the plan amount is 240000 paise
3. **"Invalid plan ID"** → Double-check you copied the full ID correctly

**Razorpay Support**: https://razorpay.com/support/

---

**TIP**: Keep your Razorpay dashboard open while testing so you can see subscriptions being created in real-time!

