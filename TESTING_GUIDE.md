# 🧪 Testing Guide for Razorpay Subscriptions

## **Test Mode Setup**

### **1. Razorpay Test Keys**
Replace your live keys with test keys in `.env`:

```env
# LIVE KEYS (comment out for testing)
# RAZORPAY_KEY_ID=rzp_live_RGFdKPRfO6u3Mi
# RAZORPAY_KEY_SECRET=aKnGiCMiFvHw9zS287QynQDm
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_RGFdKPRfO6u3Mi

# TEST KEYS (uncomment for testing)
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
```

### **2. Get Test Keys from Razorpay Dashboard**
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch to **"Test Mode"** (toggle in top bar)
3. Go to **Settings → API Keys**
4. Generate/Copy test keys starting with `rzp_test_`

### **3. Create Test Subscription Plans**
In test mode, create subscription plans:
1. Go to **Subscriptions → Plans**
2. Create **Digital Plan**: ₹1500/year
3. Create **Print Plan**: ₹2200/year
4. Update plan IDs in `.env`:
```env
RAZORPAY_DIGITAL_PLAN_ID=plan_TEST_DIGITAL_ID
RAZORPAY_PRINT_PLAN_ID=plan_TEST_PRINT_ID
```

## **Testing Flow**

### **1. Test Digital Subscription**
1. Click **"Go Digital!"** button
2. Fill customer form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `9999999999`
3. Submit form
4. Should redirect to Razorpay payment page
5. Use test card details (see below)

### **2. Test Print Subscription**
1. Click **"Get Everything!"** button
2. Fill customer form with delivery address:
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `9999999999`
   - Address: `123 Test Street`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
3. Submit form
4. Should redirect to Razorpay payment page
5. Use test card details (see below)

## **Test Card Details**

### **Successful Payment**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

### **Failed Payment**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

### **Other Test Cards**
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Card Declined**: `4000 0000 0000 0069`
- **Expired Card**: `4000 0000 0000 0069`

## **What to Verify**

### **1. Customer in Shopify**
After successful subscription:
1. Go to Shopify Admin → Customers
2. Should see new customer with:
   - ✅ Correct name, email, phone
   - ✅ Delivery address (for print)
   - ✅ Tags: `subscription,razorpay,Print Edition`
   - ✅ Note about Razorpay subscription

### **2. Subscription in Razorpay**
1. Go to Razorpay Dashboard → Subscriptions
2. Should see new subscription with:
   - ✅ Customer details in notes
   - ✅ Correct plan ID
   - ✅ Status: Active (after payment)
   - ✅ 12-month duration

### **3. Frontend Behavior**
- ✅ Test mode warning appears: "🧪 Test Mode: No real payment will be charged"
- ✅ Customer form validation works
- ✅ Different fields for print vs digital
- ✅ Success messages appear
- ✅ Redirects to payment page

## **Debugging**

### **Check Logs**
```bash
npm run dev
# Watch for console logs:
# - "Creating Razorpay subscription with plan: ..."
# - "Subscription response: ..."
# - Shopify customer creation logs
```

### **Common Issues**

**1. "Plan not found" error**
- Check plan IDs in `.env`
- Ensure plans exist in Razorpay dashboard

**2. Shopify customer not created**
- Check `SHOPIFY_ADMIN_ACCESS_TOKEN` permissions
- Verify Shopify domain is correct

**3. Payment page doesn't open**
- Check test keys are correct
- Verify subscription plan exists

## **Production Checklist**

Before going live:
- [ ] Switch back to live Razorpay keys
- [ ] Update plan IDs to live plan IDs
- [ ] Test one real small payment
- [ ] Remove test mode warnings
- [ ] Enable Shopify payment gateway 