import re

# Read the current file
with open('src/app/api/razorpay/route.ts', 'r') as f:
    content = f.read()

# Fix 1: Add null customer check in createShopifyOrder
old_createShopifyOrder = '''async function createShopifyOrder(customerData: {
  name: string;
  email: string;
  phone: string;
  planType: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}, shopifyCustomer: any, subscriptionId: string, planAmount: number) {
  try {
    const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;'''

new_createShopifyOrder = '''async function createShopifyOrder(customerData: {
  name: string;
  email: string;
  phone: string;
  planType: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}, shopifyCustomer: any, subscriptionId: string, planAmount: number) {
  try {
    // Handle null customer case
    if (!shopifyCustomer || !shopifyCustomer.id) {
      console.error('❌ Cannot create Shopify order: No valid customer provided');
      return null;
    }

    const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;'''

content = content.replace(old_createShopifyOrder, new_createShopifyOrder)

# Fix 2: Add phone number validation function
phone_validation_function = '''
// Helper function to validate and format phone number for Shopify
function formatPhoneForShopify(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\\D/g, '');
  
  // If it starts with 91 and has 12 digits, it's already formatted
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume it's Indian and add +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default fallback
  return phone;
}

'''

# Insert the phone validation function before createShopifyOrder
content = content.replace('// Helper function to create Shopify order for subscription', phone_validation_function + '// Helper function to create Shopify order for subscription')

# Fix 3: Use formatted phone in customer creation
old_customer_payload = '''    const customerPayload = {
      customer: {
        first_name: customerData.name.split(' ')[0] || customerData.name,
        last_name: customerData.name.split(' ').slice(1).join(' ') || '',
        email: customerData.email,
        phone: customerData.phone,'''

new_customer_payload = '''    const customerPayload = {
      customer: {
        first_name: customerData.name.split(' ')[0] || customerData.name,
        last_name: customerData.name.split(' ').slice(1).join(' ') || '',
        email: customerData.email,
        phone: formatPhoneForShopify(customerData.phone),'''

content = content.replace(old_customer_payload, new_customer_payload)

# Fix 4: Use formatted phone in address creation
old_address_phone = '''            phone: customerData.phone,'''
new_address_phone = '''            phone: formatPhoneForShopify(customerData.phone),'''

content = content.replace(old_address_phone, new_address_phone)

# Fix 5: Use formatted phone in shipping/billing addresses
old_shipping_phone = '''            phone: customerData.phone'''
new_shipping_phone = '''            phone: formatPhoneForShopify(customerData.phone)'''

content = content.replace(old_shipping_phone, new_shipping_phone)

# Fix 6: Handle null customer in order creation call
old_order_creation = '''        // Create Shopify order for the subscription
        const shopifyOrder = await createShopifyOrder(
          {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            planType,
            address: deliveryAddress,
            city,
            state,
            pincode,
          },
          shopifyCustomer,
          subscription.id,
          planAmount
        );'''

new_order_creation = '''        // Create Shopify order for the subscription (only if customer was created successfully)
        let shopifyOrder = null;
        if (shopifyCustomer && shopifyCustomer.id) {
          shopifyOrder = await createShopifyOrder(
            {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
              planType,
              address: deliveryAddress,
              city,
              state,
              pincode,
            },
            shopifyCustomer,
            subscription.id,
            planAmount
          );
        } else {
          console.log('⚠️ DEBUG: Skipping Shopify order creation due to customer creation failure');
        }'''

content = content.replace(old_order_creation, new_order_creation)

# Write the fixed content back
with open('src/app/api/razorpay/route.ts', 'w') as f:
    f.write(content)

print("✅ Fixed phone validation and null customer issues")
