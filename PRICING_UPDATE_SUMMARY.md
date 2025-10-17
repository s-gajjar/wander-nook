# Pricing Update Summary - Print Edition ₹2200 → ₹2400

## Overview
This document summarizes all changes made to update the print subscription pricing from ₹2200 to ₹2400, and the setup for a hidden ₹2200 autopay link.

**Date**: October 17, 2025  
**Status**: ✅ Code Changes Complete - Razorpay Setup Pending

---

## ✅ Completed Changes

### 1. Website Code Updates

#### Files Modified:

1. **`src/components/LandingPage/Pricing/index.tsx`**
   - ✅ Updated Print Edition price from ₹2200 to ₹2400
   - ✅ Removed "originalAmount" (no longer showing strikethrough price)
   - ✅ Fixed TypeScript types to handle optional originalAmount
   - **Lines Changed**: 64-68, 332-351

2. **`src/components/LandingPage/FAQs/index.tsx`**
   - ✅ Updated FAQ text from "INR 2,200 per year (originally INR 2,400)" to "INR 2,400 per year"
   - **Lines Changed**: 49

3. **`src/app/api/razorpay/route.ts`**
   - ✅ Updated fallback amount from 220000 to 240000 (in paise)
   - **Lines Changed**: 223

### 2. Documentation Created

1. **`RAZORPAY_PRICING_UPDATE.md`** ✅
   - Complete guide for updating Razorpay plans
   - Step-by-step instructions for creating ₹2400 plan
   - Environment variable setup
   - Testing procedures
   - Troubleshooting guide

2. **`HIDDEN_AUTOPAY_LINK_SETUP.md`** ✅
   - Quick setup guide for hidden ₹2200 link
   - Campaign management templates
   - Sharing templates (Email, WhatsApp, SMS)
   - Security checklist
   - Tracking and analytics guide

---

## 🔄 Pending Actions (Razorpay Dashboard)

### Required Razorpay Setup:

#### Step 1: Create New ₹2400 Plan
```
1. Login to Razorpay Dashboard (https://dashboard.razorpay.com/)
2. Navigate to: Subscriptions → Plans
3. Click: + Create Plan
4. Configure:
   - Name: Print Edition Annual Subscription - ₹2400
   - Amount: 240000 (in paise)
   - Currency: INR
   - Interval: 1 year
   - Description: Annual subscription for Wander Nook Print Edition
5. Copy the Plan ID (e.g., plan_xxxxxxxxxx)
```

#### Step 2: Create Hidden ₹2200 Plan
```
1. In Razorpay Dashboard
2. Navigate to: Subscriptions → Plans
3. Click: + Create Plan
4. Configure:
   - Name: Print Edition Annual - Special Offer ₹2200
   - Amount: 220000 (in paise)
   - Currency: INR
   - Interval: 1 year
   - Description: Special pricing for select customers
   - Tags: special-offer, discount-2200
5. Copy the Plan ID

Then create Subscription Link:
6. Go to: Subscriptions → Subscription Links
7. Click: + Create Subscription Link
8. Select the ₹2200 plan
9. Configure customer details collection
10. Copy the Payment Link URL
```

#### Step 3: Update Environment Variables

**For Local Development** (`.env.local`):
```bash
# Update this with your new ₹2400 plan ID
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_NEW_2400_PLAN_ID

# Keep existing
NEXT_PUBLIC_RAZORPAY_DIGITAL_PLAN_ID=plan_RGGDvOBG7Ey6NK

# Add hidden ₹2200 plan (DO NOT use NEXT_PUBLIC_ prefix!)
RAZORPAY_SPECIAL_PRINT_PLAN_ID=plan_SPECIAL_2200_PLAN_ID
RAZORPAY_SPECIAL_PRINT_LINK=https://rzp.io/l/xxxxxxxx

# Your existing Razorpay credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
```

**For Production** (Vercel/Hosting Dashboard):
1. Go to your deployment platform
2. Navigate to Environment Variables
3. Update: `NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID` with new ₹2400 plan ID
4. Add: `RAZORPAY_SPECIAL_PRINT_PLAN_ID` (optional, server-side only)
5. Add: `RAZORPAY_SPECIAL_PRINT_LINK` (optional, server-side only)
6. Save and redeploy

#### Step 4: Test Before Going Live

**Test Mode Checklist:**
- [ ] Create test plans in Razorpay Test Mode
- [ ] Update test environment variables
- [ ] Test ₹2400 payment flow from website
- [ ] Test ₹2200 direct payment link
- [ ] Verify Shopify order creation (if applicable)
- [ ] Check webhook triggers

**Live Mode Checklist:**
- [ ] Create live plans in Razorpay Live Mode
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Test live payment (small amount)
- [ ] Verify email notifications
- [ ] Check Shopify integration
- [ ] Monitor first few transactions

---

## 📊 What Changed?

### Before:
- **Website Display**: ₹2200 (with strikethrough ₹2400)
- **Actual Price**: ₹2200
- **Razorpay Plan**: Single plan at ₹2200

### After:
- **Website Display**: ₹2400 (no strikethrough)
- **Actual Price**: ₹2400
- **Razorpay Plans**: 
  - Public plan at ₹2400 (visible on website)
  - Hidden plan at ₹2200 (for special offers, manual sharing only)

---

## 🔒 Security Notes

### Hidden ₹2200 Link:
- ❌ **DO NOT** add to website code
- ❌ **DO NOT** use `NEXT_PUBLIC_` prefix (this exposes to frontend)
- ❌ **DO NOT** commit payment link to public repos
- ✅ Store in password manager
- ✅ Document in secure internal wiki
- ✅ Share only with authorized team members
- ✅ Monitor usage regularly

### Environment Variable Rules:
```bash
# ✅ CORRECT - Exposed to frontend (public pricing)
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_2400_public

# ✅ CORRECT - Server-side only (hidden pricing)
RAZORPAY_SPECIAL_PRINT_PLAN_ID=plan_2200_special

# ❌ WRONG - Would expose hidden link to frontend!
NEXT_PUBLIC_RAZORPAY_SPECIAL_PRINT_LINK=https://...
```

---

## 📝 How to Use Hidden ₹2200 Link

### Use Cases:
1. **Early Bird Offers**: First 50 subscribers get ₹2200
2. **Referral Program**: Existing customers can share with friends
3. **Partner Deals**: Offer to partner organizations
4. **VIP Customers**: Loyalty rewards
5. **Promotional Campaigns**: Limited-time offers

### Sharing Methods:

**Email Campaign:**
- Use provided templates in `HIDDEN_AUTOPAY_LINK_SETUP.md`
- Track opens and clicks
- Set expiration dates

**WhatsApp/SMS:**
- Create short link using Bitly or Rebrandly
- Example: `bit.ly/wandernook-special`
- Personal touch for high-value customers

**Direct Sharing:**
- For VIP customers
- Partner organizations
- School administrators
- Bulk orders

---

## 📈 Monitoring & Tracking

### Daily Monitoring:
1. Check Razorpay Dashboard → Subscriptions
2. Filter by plan ID to see ₹2400 vs ₹2200 subscriptions
3. Monitor failed payments
4. Check Shopify orders (if integrated)

### Weekly Reports:
- Number of subscriptions at each price point
- Conversion rates
- Revenue breakdown
- Customer acquisition source

### Monthly Analysis:
- Total subscribers
- Churn rate
- Revenue vs projections
- Campaign effectiveness (for ₹2200 offers)

---

## 🚀 Deployment Steps

### Local Testing:
```bash
# 1. Update .env.local with new plan IDs
# 2. Restart development server
npm run dev

# 3. Test the pricing page
# Open: http://localhost:3000/#pricing

# 4. Test subscription flow
# Click "Get Everything!" and verify ₹2400 shows up
```

### Production Deployment:
```bash
# If using Vercel:
1. Update environment variables in Vercel dashboard
2. Trigger deployment or push to main branch

# If using other platforms:
1. Update environment variables in hosting dashboard
2. Rebuild and deploy
```

### Post-Deployment Verification:
- [ ] Visit live website and check pricing displays ₹2400
- [ ] Click "Get Everything!" button
- [ ] Verify Razorpay payment page shows ₹2400
- [ ] Complete a test transaction
- [ ] Check Shopify order is created correctly
- [ ] Verify email notifications are sent

---

## 📞 Support & Resources

### Documentation Files:
1. `RAZORPAY_PRICING_UPDATE.md` - Full Razorpay setup guide
2. `HIDDEN_AUTOPAY_LINK_SETUP.md` - Hidden link management
3. `AUTOPAY_SETUP.md` - General autopay information
4. This file - Quick reference summary

### External Resources:
- **Razorpay Docs**: https://razorpay.com/docs/payments/subscriptions/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **Razorpay Support**: https://razorpay.com/support/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/

### Internal Resources:
- Team password manager: [Your link]
- Internal wiki: [Your link]
- Support email: [Your email]

---

## 🐛 Troubleshooting

### Common Issues:

**Issue**: "Plan not found" error
- **Solution**: Verify plan ID in environment variables matches Razorpay
- Check you're in correct mode (Test vs Live)

**Issue**: Still showing ₹2200 on website
- **Solution**: Clear browser cache, hard refresh (Cmd+Shift+R)
- Check environment variables loaded correctly

**Issue**: Payment page shows wrong amount
- **Solution**: Verify plan amount in Razorpay dashboard
- Check if you updated the correct plan (Test vs Live)

**Issue**: Hidden link not working
- **Solution**: Verify link is active in Razorpay
- Check plan ID is correct
- Test in incognito mode

---

## ✅ Checklist: Complete Rollout

### Code Changes:
- [x] Update Pricing component
- [x] Update FAQ component
- [x] Update API route fallback amount
- [x] Fix TypeScript errors
- [x] Test locally

### Razorpay Setup:
- [ ] Create ₹2400 plan (Live Mode)
- [ ] Create ₹2200 special plan (Live Mode)
- [ ] Create subscription link for ₹2200
- [ ] Copy all plan IDs and links

### Configuration:
- [ ] Update local .env file
- [ ] Update production environment variables
- [ ] Verify no NEXT_PUBLIC_ prefix on hidden link

### Testing:
- [ ] Test in development environment
- [ ] Test in staging (if available)
- [ ] Test in production with test transaction
- [ ] Verify Shopify integration
- [ ] Check email notifications

### Documentation:
- [x] Create setup guides
- [x] Document security practices
- [ ] Share with team
- [ ] Update internal wiki

### Launch:
- [ ] Deploy to production
- [ ] Monitor first transactions
- [ ] Prepare ₹2200 offer campaign (optional)
- [ ] Update marketing materials
- [ ] Inform customer support team

---

## 📅 Timeline Recommendation

**Day 1** (Today):
- ✅ Code changes complete
- ✅ Documentation ready
- ⏳ Create Razorpay plans

**Day 2**:
- Update environment variables
- Deploy to staging
- Test thoroughly

**Day 3**:
- Deploy to production
- Monitor closely
- Prepare support materials

**Week 1**:
- Launch ₹2200 special offer campaign (optional)
- Monitor metrics
- Gather feedback

---

## 🎉 Success Metrics

After 1 Week:
- [ ] All new subscriptions at ₹2400
- [ ] Zero critical errors
- [ ] Shopify integration working
- [ ] Customer support has no major issues

After 1 Month:
- [ ] Track subscription count vs projections
- [ ] Analyze ₹2400 conversion rate
- [ ] Measure ₹2200 campaign effectiveness (if running)
- [ ] Calculate revenue impact

---

## 📧 Notification Templates

### Team Announcement:
```
Subject: New Pricing Live - Print Edition Now ₹2400

Hi Team,

We've updated our Print Edition pricing from ₹2200 to ₹2400, effective immediately.

Key Changes:
- Website now shows ₹2400 (no strikethrough)
- New Razorpay plan created at ₹2400
- Special ₹2200 link available for promotions

Customer Support Notes:
- Existing subscribers keep their original pricing
- New subscriptions are at ₹2400
- Special ₹2200 offers available upon request (see internal docs)

Questions? Reply to this email.

Thanks!
```

### Customer Announcement (Optional):
```
Subject: Important Update: Print Edition Pricing

Dear Valued Customers,

We're writing to inform you about a pricing update for our Print Edition.

Effective [Date], our annual Print Edition subscription will be priced at ₹2400.

For You (Existing Subscribers):
✓ Your current subscription price remains unchanged
✓ You'll continue at your existing rate
✓ No action needed

Why This Change?
- Improved content quality
- Better paper quality
- Enhanced features
- Sustainable operations

Questions? Contact us at [email]

Thank you for your continued support!

Wander Nook Team
```

---

## 🔄 Future Updates

### If You Need to Change Pricing Again:

1. Update Pricing component (`src/components/LandingPage/Pricing/index.tsx`)
2. Update FAQ (`src/components/LandingPage/FAQs/index.tsx`)
3. Update API fallback amount (`src/app/api/razorpay/route.ts`)
4. Create new Razorpay plan
5. Update environment variables
6. Test and deploy
7. Update this documentation

### If You Want Multiple Hidden Links:

Create different plans for different segments:
- Early Bird: ₹2100
- Referral: ₹2150
- Partner: ₹2000
- Student: ₹1900

Each with its own plan ID and payment link.

---

**Last Updated**: October 17, 2025  
**Updated By**: AI Assistant  
**Version**: 1.0  
**Status**: Ready for Razorpay setup and deployment

