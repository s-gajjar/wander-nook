# 🚨 URGENT FIX: Razorpay Test Mode vs Live Mode

## The Problem

Your error: "The id provided does not exist"

**Cause**: You created plans in LIVE MODE but your .env uses TEST MODE credentials!

---

## Quick Fix (2 minutes)

### Step 1: Check Your Dashboard Mode

1. Go to https://dashboard.razorpay.com/
2. Look at the **TOP LEFT** corner - you'll see a toggle that says either:
   - **"Test Mode"** (blue/test icon) OR
   - **"Live Mode"** (green icon)

### Step 2: Switch to TEST MODE

**Click the toggle to switch to "Test Mode"**

You'll see the dashboard refresh - now you're in test mode!

### Step 3: Check if Your Plan Exists in Test Mode

1. Go to: **Subscriptions** → **Plans**
2. Look for: `plan_RUbPNo3HjxJG5l`

**Do you see it?**

---

## If You DON'T See the Plan (Most Likely)

This means you created the plan in LIVE mode! You need to create it again in TEST mode:

### Create the Plan in TEST Mode:

1. Make sure you're in **Test Mode** (top left toggle)
2. Click **+ New Plan**
3. Fill in:
   ```
   Plan Name: Print Edition Annual Subscription - ₹2400
   Billing Amount: 240000 (paise)
   Billing Currency: INR
   Billing Cycle: Every Year (or 12 months)
   ```
4. Click **Create Plan**
5. **COPY THE NEW PLAN ID**
6. Update your .env file with this NEW test plan ID

---

## If You DO See the Plan

Then the issue is different. Try this:

1. Click on the plan `plan_RUbPNo3HjxJG5l`
2. Check if it says "Active" or "Inactive"
3. If inactive, activate it
4. Copy the exact Plan ID again (maybe there's a typo)

---

## Understanding Test vs Live Mode

**Test Mode:**
- Uses credentials: `rzp_test_xxxxxxxxx`
- No real money charged
- Plans created here are separate from Live mode
- Test plans can ONLY be used with TEST credentials

**Live Mode:**
- Uses credentials: `rzp_live_xxxxxxxxx`
- Real money gets charged
- Plans created here are separate from Test mode
- Live plans can ONLY be used with LIVE credentials

**They are COMPLETELY SEPARATE!**

---

## Your Current Setup

From your .env:
```bash
RAZORPAY_KEY_ID=rzp_test_RGGAHZL0iXGs11  # ← TEST MODE
```

So you MUST:
1. Be in TEST MODE in dashboard
2. Create plans in TEST MODE
3. Use test plan IDs

---

## Quick Visual Check

Look at your Razorpay dashboard screenshot:

```
TOP LEFT CORNER:
┌─────────────────────┐
│  🔵 Test Mode       │  ← Should show this
│     OR              │
│  🟢 Live Mode       │
└─────────────────────┘
```

If it says "Live Mode", **click it to switch to Test Mode!**

---

## After Switching to Test Mode

1. Create a NEW plan (the one you created in Live mode won't be visible)
2. Copy the new TEST plan ID
3. Update .env:
   ```bash
   NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_NEW_TEST_PLAN_ID_HERE
   RAZORPAY_PRINT_PLAN_ID=plan_NEW_TEST_PLAN_ID_HERE
   ```
4. Restart server: `npm run dev`
5. Test again!

---

## Still Not Working?

Try creating a completely new plan with a simple name:

```
Plan Name: Test Print 2400
Amount: 240000
Interval: 12 months
```

And use that plan ID instead. Sometimes Razorpay has caching issues with recently created plans.

---

## To Use LIVE MODE (For Real Payments)

If you want to use LIVE mode instead:

1. Switch to LIVE MODE in dashboard
2. Use your LIVE credentials in .env:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_RGFdKPRfO6u3Mi
   RAZORPAY_KEY_SECRET=aKnGiCMiFvHw9zS287QynQDm
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_RGFdKPRfO6u3Mi
   ```
3. Use the plans you already created (they're in Live mode)

**WARNING**: Live mode charges REAL MONEY! Use Test mode for testing!

