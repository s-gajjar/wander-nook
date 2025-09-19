import re

path = 'src/app/api/razorpay/route.ts'
with open(path,'r') as f:
  s = f.read()

old = """
    const result = JSON.parse(responseText);
    
    if (result.order) {
      console.log('✅ DEBUG: Shopify order created successfully:', result.order.id, 'for amount:', result.order.total_price);
      return result.order;
    } else {
      console.log('⚠️ DEBUG: Unexpected order response format from Shopify:', Object.keys(result));
      return null;
    }
"""

new = """
    const result = JSON.parse(responseText);
    
    if (result.order) {
      console.log('✅ DEBUG: Shopify order created successfully:', result.order.id, 'for amount:', result.order.total_price);
      return result.order;
    } else if (Array.isArray(result.orders) && result.orders.length > 0) {
      console.log('✅ DEBUG: Shopify order returned in list shape, using first order:', result.orders[0].id);
      return result.orders[0];
    } else {
      console.log('⚠️ DEBUG: Unexpected order response format from Shopify:', Object.keys(result));
      return null;
    }
"""

if old in s:
  s = s.replace(old,new)
else:
  # try a looser regex replace
  s = re.sub(r"const result = JSON\.parse\(responseText\);\s+if \(result\.order\) \{[\s\S]*?return null;\n\s+\}", new, s)

with open(path,'w') as f:
  f.write(s)

print('✅ Updated order response handling for both order and orders shapes')
