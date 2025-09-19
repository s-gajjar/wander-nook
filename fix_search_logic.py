import re

# Read the current file
with open('src/app/api/razorpay/route.ts', 'r') as f:
    content = f.read()

# Fix the email search to be more robust
old_email_search = '''    // First, check if customer exists by email
    console.log('🔍 DEBUG: Checking if customer exists by email:', customerData.email);
    const emailSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=email:${encodeURIComponent(customerData.email)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );'''

new_email_search = '''    // First, check if customer exists by email
    console.log('🔍 DEBUG: Checking if customer exists by email:', customerData.email);
    const emailSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=email:${encodeURIComponent(customerData.email)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );'''

# Fix the phone search to use formatted phone
old_phone_search = '''    // If not found by email, check if customer exists by phone
    console.log('🔍 DEBUG: Checking if customer exists by phone:', customerData.phone);
    const phoneSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=phone:${encodeURIComponent(customerData.phone)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );'''

new_phone_search = '''    // If not found by email, check if customer exists by phone
    const formattedPhone = formatPhoneForShopify(customerData.phone);
    console.log('🔍 DEBUG: Checking if customer exists by phone:', formattedPhone);
    const phoneSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=phone:${encodeURIComponent(formattedPhone)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );'''

content = content.replace(old_phone_search, new_phone_search)

# Write the fixed content back
with open('src/app/api/razorpay/route.ts', 'w') as f:
    f.write(content)

print("✅ Fixed search logic to use formatted phone numbers")
