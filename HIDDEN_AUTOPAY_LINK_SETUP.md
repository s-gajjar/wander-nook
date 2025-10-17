# Hidden ₹2200 Autopay Link - Quick Setup Guide

## Quick Reference

This document provides a quick setup guide for creating and managing a hidden ₹2200 autopay Razorpay link that is NOT visible on the website.

---

## Why a Hidden Link?

- **Purpose**: Offer special pricing (₹2200) to select customers via direct sharing
- **Use Cases**: 
  - Early bird offers
  - Referral discounts
  - VIP customer pricing
  - Promotional campaigns
  - Partnership deals

- **Important**: This link will NOT appear on your website. Only the ₹2400 public pricing is visible.

---

## Quick Setup Steps

### 1. Create Razorpay Subscription Plan (₹2200)

```
Dashboard → Subscriptions → Plans → + Create Plan

Plan Details:
├─ Name: Print Edition Annual - Special Offer ₹2200
├─ Amount: 220000 (in paise)
├─ Currency: INR
├─ Interval: 1 year / 12 months
├─ Description: Special pricing for Wander Nook Print Edition
└─ Tags: special-offer, discount-2200
```

**Copy the Plan ID**: `plan_xxxxxxxxxx`

### 2. Create Subscription Link

```
Dashboard → Subscriptions → Subscription Links → + Create

Configuration:
├─ Select Plan: [Your ₹2200 plan]
├─ Customer Details: Name, Email, Phone, Address (for delivery)
├─ Autopay: Enabled
└─ Notifications: SMS/Email (optional)
```

**Copy the Link**: `https://rzp.io/l/xxxxxxxx` or `https://pages.razorpay.com/xxxxxxxx`

### 3. Store Securely

Add to `.env` (server-side only):
```bash
# Hidden Special Offer - DO NOT expose to frontend
RAZORPAY_SPECIAL_PRINT_PLAN_ID=plan_xxxxxxxxxx
RAZORPAY_SPECIAL_PRINT_LINK=https://rzp.io/l/xxxxxxxx
```

⚠️ **CRITICAL**: Do NOT use `NEXT_PUBLIC_` prefix - this would expose it to the frontend!

---

## How to Share the Link

### 📧 Email Template

```markdown
Subject: Exclusive Offer - Wander Nook Print Edition

Dear [Customer Name],

Great news! As a valued member, you're eligible for our special pricing.

🎉 Special Price: ₹2200/year (Save ₹200!)

Click here to subscribe now: [YOUR_RAZORPAY_LINK]

What's included:
✓ 24 newspapers delivered fortnightly
✓ Printables and activities
✓ 1 travel journal

This exclusive offer is valid until [DATE].

Questions? Reply to this email.

Best regards,
Wander Nook Team
```

### 💬 WhatsApp Template

```
Hi [Name]! 👋

Special offer for you! 🎁

Get Wander Nook Print Edition at ₹2200/year
Regular price: ₹2400 | You save: ₹200 💰

Subscribe now: [SHORT_LINK]

✓ 24 newspapers + printables + journal 📚
✓ Delivered every 2 weeks 🚚
✓ Limited time offer ⏰

Reply "INFO" for more details!
```

### 📱 SMS Template

```
Wander Nook: Exclusive offer! Print Edition at Rs.2200/yr (Save Rs.200). 
Subscribe: [SHORT_LINK] 
Valid till [DATE]
```

---

## Creating a Short Link

To make sharing easier, use a URL shortener:

### Option 1: Razorpay Short URLs
- Razorpay automatically provides short URLs like `https://rzp.io/l/xxxxxxxx`

### Option 2: Custom Domain (Recommended)
Use a URL shortener to create branded links:
- Bitly: `bit.ly/wandernook-special`
- Rebrandly: `go.wandernook.com/special-2200`
- TinyURL: `tinyurl.com/wandernook-offer`

**Setup Example with Bitly:**
1. Go to https://bitly.com
2. Paste your Razorpay link
3. Create custom short link: `bit.ly/wandernook-print-offer`
4. Track clicks and analytics

---

## Tracking & Analytics

### In Razorpay Dashboard

1. **View Subscriptions**
   ```
   Dashboard → Subscriptions → All Subscriptions
   Filter by: [Your ₹2200 Plan ID]
   ```

2. **Track Metrics**
   - Number of subscriptions
   - Success rate
   - Failed payments
   - Customer details

3. **Export Data**
   ```
   Dashboard → Subscriptions → Export
   Date Range: [Select dates]
   Format: CSV/Excel
   ```

### In Shopify (if integrated)

1. Filter orders by tag: `special-offer` or `discount-2200`
2. View customer list with special pricing
3. Track fulfillment status

---

## Management Tips

### Do's ✅

- Keep the link in a password manager (1Password, LastPass, etc.)
- Document who you share it with
- Set expiration dates for offers
- Monitor usage regularly
- Create new links for different campaigns
- Use UTM parameters if tracking conversions
- Test the link before sharing
- Have a process for deactivating old links

### Don'ts ❌

- Don't add to website frontend code
- Don't commit to public GitHub repositories
- Don't share publicly on social media
- Don't use NEXT_PUBLIC_ prefix in env vars
- Don't lose track of active links
- Don't create too many overlapping offers

---

## Campaign Management

### Campaign Structure Example

```
Campaign: Early Bird Offer (Jan 2025)
├─ Plan ID: plan_early_bird_jan_2025
├─ Amount: ₹2200
├─ Link: https://rzp.io/l/earlybird
├─ Short URL: bit.ly/wn-earlybird
├─ Valid: Jan 1-31, 2025
├─ Target: 100 subscribers
└─ Shared via: Email newsletter, WhatsApp groups
```

### Tracking Spreadsheet Template

| Campaign | Link | Plan ID | Price | Start Date | End Date | Subscriptions | Revenue |
|----------|------|---------|-------|------------|----------|---------------|---------|
| Early Bird | bit.ly/wn-eb | plan_xxx | ₹2200 | 2025-01-01 | 2025-01-31 | 45 | ₹99,000 |
| Referral | bit.ly/wn-ref | plan_yyy | ₹2200 | 2025-02-01 | 2025-03-31 | 28 | ₹61,600 |
| Partner | bit.ly/wn-ptr | plan_zzz | ₹2200 | 2025-01-15 | 2025-12-31 | 12 | ₹26,400 |

---

## Deactivating/Expiring Links

### Option 1: Archive the Plan
```
Razorpay Dashboard → Subscriptions → Plans
→ Select plan → Archive
```
(This prevents new subscriptions but maintains existing ones)

### Option 2: Edit Payment Link
```
Razorpay Dashboard → Payment Links
→ Select link → Edit → Set expiration date
```

### Option 3: Delete Link
```
Razorpay Dashboard → Payment Links
→ Select link → Delete
```
⚠️ Careful: This is permanent!

---

## FAQ

### Q: Can customers see the ₹2400 public price after using the ₹2200 link?
**A**: Yes, they can visit your website and see the public pricing. However, their subscription is locked at ₹2200 for the renewal period.

### Q: Can I offer different special prices?
**A**: Yes! Create multiple plans (₹2200, ₹2100, ₹2000, etc.) with different links for different segments.

### Q: What happens when the subscription renews?
**A**: The customer will be charged at the same price (₹2200) on renewal unless you change their plan manually.

### Q: How do I upgrade someone from ₹2200 to ₹2400?
**A**: In Razorpay Dashboard, go to their subscription and change the plan manually.

### Q: Can I limit how many people use the link?
**A**: Razorpay doesn't have built-in limits, but you can:
- Monitor usage and deactivate after X subscriptions
- Use a tool like Zapier to automate deactivation
- Set expiration dates

### Q: Is this link secure?
**A**: Yes, Razorpay links are secure. However, anyone with the link can use it, so share carefully.

---

## Security Checklist

- [ ] Plan created with appropriate tags/labels
- [ ] Link stored in password manager
- [ ] NOT committed to version control
- [ ] NOT exposed via NEXT_PUBLIC_ env vars
- [ ] Shared only with authorized personnel
- [ ] Expiration date set (if applicable)
- [ ] Usage monitored regularly
- [ ] Documentation updated
- [ ] Team informed about new offer
- [ ] Support team has link details (for customer queries)

---

## Example: Complete Campaign Setup

### Scenario
You want to offer a special ₹2200 pricing to 50 early bird customers.

### Steps:

1. **Create Plan in Razorpay**
   - Name: "Print Edition - Early Bird Jan 2025"
   - Amount: ₹2200
   - Plan ID: `plan_earlybird_jan2025`

2. **Create Subscription Link**
   - Link: `https://rzp.io/l/earlybird2025`

3. **Create Short Link**
   - Bitly: `bit.ly/wn-earlybird`
   - Track clicks

4. **Store Securely**
   ```bash
   # .env (server-side only)
   RAZORPAY_EARLYBIRD_PLAN=plan_earlybird_jan2025
   RAZORPAY_EARLYBIRD_LINK=https://rzp.io/l/earlybird2025
   ```

5. **Create Email Campaign**
   - Send to your email list
   - Include short link
   - Set expiry: January 31, 2025

6. **Monitor Progress**
   - Check Razorpay dashboard daily
   - Track towards 50 subscriber goal
   - Deactivate link once goal reached

7. **After Campaign**
   - Archive the plan
   - Document results
   - Analyze conversion rate
   - Plan next campaign

---

## Support

For questions or issues:
- Razorpay Support: https://razorpay.com/support/
- Razorpay Docs: https://razorpay.com/docs/payments/subscriptions/
- Your Internal Team Docs: [Add your link here]

---

## Quick Commands

### Check if env var is exposed (should return nothing)
```bash
# This should NOT find the special link in frontend code
grep -r "RAZORPAY_SPECIAL_PRINT" src/
```

### Verify environment variables
```bash
# In your terminal
echo $RAZORPAY_SPECIAL_PRINT_LINK
# Should show the link if properly set
```

---

**Last Updated**: October 2024  
**Maintained By**: [Your Team Name]  
**Current Active Links**: Check team password manager or internal docs

