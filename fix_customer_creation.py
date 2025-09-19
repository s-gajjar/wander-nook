import re

# Read the current file
with open('src/app/api/razorpay/route.ts', 'r') as f:
    content = f.read()

# Fix the customer creation response handling
old_response_handling = '''    const result = JSON.parse(responseText);
    
    // Check if response contains customer data (successful creation)
    if (result.customer) {
      console.log('✅ DEBUG: New Shopify customer created successfully:', result.customer.id);
      return result.customer;
    } else if (result.customers) {
      // This suggests the API returned a list instead of creating - shouldn't happen with POST
      console.log('⚠️ DEBUG: API returned customer list instead of creating new customer');
      return null;
    } else {
      console.log('⚠️ DEBUG: Unexpected response format from Shopify:', Object.keys(result));
      return null;
    }'''

new_response_handling = '''    const result = JSON.parse(responseText);
    
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
    }'''

content = content.replace(old_response_handling, new_response_handling)

# Also fix the fallback search to use the formatted phone
old_fallback_search = '''          const matchingCustomer = allCustomers.customers?.find((customer: any) => 
            customer.phone === customerData.phone || customer.email === customerData.email
          );'''

new_fallback_search = '''          const matchingCustomer = allCustomers.customers?.find((customer: any) => 
            customer.phone === formatPhoneForShopify(customerData.phone) || customer.email === customerData.email
          );'''

content = content.replace(old_fallback_search, new_fallback_search)

# Write the fixed content back
with open('src/app/api/razorpay/route.ts', 'w') as f:
    f.write(content)

print("✅ Fixed customer creation response handling")
