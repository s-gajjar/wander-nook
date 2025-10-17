# Quick Reference Card - Pricing Update

## 🎯 At a Glance

**Old Price**: ₹2200  
**New Price**: ₹2400  
**Hidden Link**: ₹2200 (for special offers)

---

## 📋 What Was Done

✅ Website code updated to show ₹2400  
✅ FAQ updated  
✅ API fallback amounts updated  
✅ Documentation created  
⏳ Razorpay plans need to be created (see below)

---

## 🚀 Next Steps (Quick)

### 1. Create ₹2400 Plan in Razorpay
```
Dashboard → Subscriptions → Plans → Create
Amount: 240000 (paise)
Interval: 1 year
Copy Plan ID → Update env var: NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID
```

### 2. Create ₹2200 Hidden Link
```
Dashboard → Subscriptions → Plans → Create
Amount: 220000 (paise)
Create Subscription Link → Copy URL
Store in: RAZORPAY_SPECIAL_PRINT_LINK (NO NEXT_PUBLIC_ prefix!)
```

### 3. Update Environment Variables
```bash
# .env.local (local development)
NEXT_PUBLIC_RAZORPAY_PRINT_PLAN_ID=plan_YOUR_NEW_2400_PLAN

# Server-side only (hidden link)
RAZORPAY_SPECIAL_PRINT_LINK=https://rzp.io/l/xxxxxxxx

# Then restart: npm run dev
```

### 4. Production Deployment
```
1. Update env vars in Vercel/hosting dashboard
2. Deploy
3. Test payment flow
4. Monitor first transactions
```

---

## 📖 Full Documentation

- **Complete Setup Guide**: `RAZORPAY_PRICING_UPDATE.md`
- **Hidden Link Guide**: `HIDDEN_AUTOPAY_LINK_SETUP.md`
- **Summary**: `PRICING_UPDATE_SUMMARY.md`
- **This Card**: `QUICK_REFERENCE.md`

---

## 🔒 Security Reminder

✅ Use `NEXT_PUBLIC_` for public ₹2400 plan (shown on website)  
❌ Never use `NEXT_PUBLIC_` for hidden ₹2200 link (server-side only)

---

## 📞 Quick Links

- Razorpay Dashboard: https://dashboard.razorpay.com/
- Razorpay Docs: https://razorpay.com/docs/payments/subscriptions/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/

---

## ✅ Deployment Checklist

- [ ] Create ₹2400 Razorpay plan
- [ ] Create ₹2200 Razorpay plan
- [ ] Update local env vars
- [ ] Test locally
- [ ] Update production env vars
- [ ] Deploy
- [ ] Test live payment
- [ ] Monitor dashboard

---

**Need Help?** See `PRICING_UPDATE_SUMMARY.md` for detailed instructions.

