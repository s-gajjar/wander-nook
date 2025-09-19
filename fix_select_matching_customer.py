import re

path = 'src/app/api/razorpay/route.ts'
with open(path,'r') as f:
  s = f.read()

old_block = """
    // Check if response contains customer data (successful creation)
    if (result.customer) {
      console.log('✅ DEBUG: New Shopify customer created successfully:', result.customer.id);
      return result.customer;
    } else if (result.customers && result.customers.length > 0) {
      // This means customer already exists - use the first one
      console.log('⚠️ DEBUG: Customer already exists, using existing customer:', result.customers[0].id);
      return result.customers[0];
    } else {
      console.log('⚠️ DEBUG: Unexpected response format from Shopify:', Object.keys(result));
      return null;
    }
"""

new_block = """
    // Check if response contains customer data (successful creation)
    if (result.customer) {
      console.log('✅ DEBUG: New Shopify customer created successfully:', result.customer.id);
      return result.customer;
    } else if (Array.isArray(result.customers) && result.customers.length > 0) {
      // Choose only a matching customer by exact email or phone
      const formattedPhone = formatPhoneForShopify(customerData.phone);
      const matching = result.customers.find((c: any) => c?.email === customerData.email || c?.phone === formattedPhone);
      if (matching) {
        console.log('⚠️ DEBUG: Customer already exists, using matching existing customer:', matching.id);
        return matching;
      }
      console.log('⚠️ DEBUG: Customers array returned but no exact email/phone match. Treating as not found.');
      return null;
    } else {
      console.log('⚠️ DEBUG: Unexpected response format from Shopify:', Object.keys(result));
      return null;
    }
"""

if old_block in s:
  s = s.replace(old_block, new_block)
else:
  # fallback regex replacement of the customers branch
  s = re.sub(r"else if \(result\.customers[\s\S]*?return null;\n\s+\}", new_block, s)

with open(path,'w') as f:
  f.write(s)

print('✅ Updated selection to use only matching customer by email/phone')
