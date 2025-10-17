import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Helper function to get province code from state name
function getProvinceCode(state: string): string {
  const stateCodes: { [key: string]: string } = {
    'Gujarat': 'GJ',
    'Maharashtra': 'MH',
    'Karnataka': 'KA',
    'Tamil Nadu': 'TN',
    'Delhi': 'DL',
    'Uttar Pradesh': 'UP',
    'West Bengal': 'WB',
    'Rajasthan': 'RJ',
    'Kerala': 'KL',
    'Andhra Pradesh': 'AP',
    'Telangana': 'TS',
    'Haryana': 'HR',
    'Punjab': 'PB',
    'Odisha': 'OR',
    'Madhya Pradesh': 'MP',
    'Bihar': 'BR',
    'Jharkhand': 'JH',
    'Assam': 'AS',
  };
  return stateCodes[state] || state.substring(0, 2).toUpperCase();
}


// Helper function to validate and format phone number for Shopify
function formatPhoneForShopify(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
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

// Helper function to create Shopify order for subscription
async function createShopifyOrder(customerData: {
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

    const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;
    
    console.log('🔍 DEBUG: Creating Shopify order for subscription:', subscriptionId);
    
    // Determine product info based on plan type
    const productTitle = customerData.planType === 'Print Edition' 
      ? 'Print Edition Annual Subscription' 
      : 'Digital Explorer Annual Subscription';
    
    const orderPayload = {
      order: {
        customer: {
          id: shopifyCustomer.id
        },
        line_items: [
          {
            title: productTitle,
            price: (planAmount / 100).toFixed(2), // Convert from paise to rupees
            quantity: 1,
            requires_shipping: customerData.planType === 'Print Edition',
            taxable: false,
            product_exists: false, // This is a custom subscription product
            variant_title: customerData.planType,
            vendor: 'Wander Nook',
            name: productTitle,
            custom: true
          }
        ],
        currency: 'INR',
        financial_status: 'paid',
        fulfillment_status: customerData.planType === 'Print Edition' ? 'unfulfilled' : 'fulfilled',
        tags: `subscription,razorpay,${customerData.planType},${subscriptionId}`,
        note: `Razorpay Subscription ID: ${subscriptionId}`,
        note_attributes: [
          {
            name: 'Razorpay Subscription ID',
            value: subscriptionId
          },
          {
            name: 'Plan Type',
            value: customerData.planType
          },
          {
            name: 'Payment Method',
            value: 'Razorpay'
          }
        ],
        transactions: [
          {
            kind: 'sale',
            status: 'success',
            amount: (planAmount / 100).toFixed(2),
            currency: 'INR',
            gateway: 'Razorpay',
            source_name: 'web',
            test: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') || false
          }
        ],
        // Add shipping address for print edition
        ...(customerData.planType === 'Print Edition' && customerData.address && {
          shipping_address: {
            first_name: customerData.name.split(' ')[0] || customerData.name,
            last_name: customerData.name.split(' ').slice(1).join(' ') || '',
            address1: customerData.address,
            city: customerData.city,
            province: customerData.state,
            zip: customerData.pincode,
            country: 'India',
            country_code: 'IN',
            province_code: getProvinceCode(customerData.state || ''),
            phone: formatPhoneForShopify(customerData.phone)
          },
          billing_address: {
            first_name: customerData.name.split(' ')[0] || customerData.name,
            last_name: customerData.name.split(' ').slice(1).join(' ') || '',
            address1: customerData.address,
            city: customerData.city,
            province: customerData.state,
            zip: customerData.pincode,
            country: 'India',
            country_code: 'IN',
            province_code: getProvinceCode(customerData.state || ''),
            phone: formatPhoneForShopify(customerData.phone),
            email: customerData.email
          },
          // Ensure Shopify registers shipping by adding a zero-cost shipping line
          shipping_lines: [
            {
              title: 'Standard Shipping',
              price: 0,
              code: 'STANDARD',
              source: 'web'
            }
          ]
        })
      }
    };

    console.log('🔍 DEBUG: Creating Shopify order with payload:', JSON.stringify(orderPayload, null, 2));

    const response = await fetch(`${SHOPIFY_ADMIN_URL}/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
      body: JSON.stringify(orderPayload),
    });

    const responseText = await response.text();
    console.log('🔍 DEBUG: Shopify order API response status:', response.status);
    console.log('🔍 DEBUG: Shopify order API response preview:', responseText.substring(0, 300) + '...');

    if (!response.ok) {
      console.error('❌ Shopify order creation failed:', responseText);
      return null;
    }

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
  } catch (error) {
    console.error('❌ Failed to create Shopify order:', error);
    return null;
  }
}

// Helper function to get plan amount from Razorpay
async function getPlanAmount(planId: string): Promise<number> {
  try {
    const plan = await razorpay.plans.fetch(planId);
    const amount = typeof plan.item.amount === 'string' ? parseInt(plan.item.amount) : plan.item.amount;
    console.log('🔍 DEBUG: Fetched plan amount:', amount, 'paise for plan:', planId);
    return amount; // Amount in paise
  } catch (error) {
    console.error('❌ Failed to fetch plan amount:', error);
    // Fallback amounts based on plan type
    return planId.includes('print') ? 240000 : 150000; // Default amounts in paise
  }
}

async function createShopifyCustomer(customerData: {
  name: string;
  email: string;
  phone: string;
  planType: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  try {
    const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;
    
    console.log('🔍 DEBUG: Creating Shopify customer with domain:', process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN);
    
    // First, check if customer exists by email
    console.log('🔍 DEBUG: Checking if customer exists by email:', customerData.email);
    const emailSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=email:${encodeURIComponent(customerData.email)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );

    if (emailSearchResponse.ok) {
      const emailSearchResult = await emailSearchResponse.json();
      console.log('🔍 DEBUG: Email search result:', emailSearchResult);
      
      if (emailSearchResult.customers && emailSearchResult.customers.length > 0) {
        const existingCustomer = emailSearchResult.customers[0];
        console.log('🔍 DEBUG: Customer found by email:', existingCustomer.id);
        return await updateExistingCustomer(existingCustomer, customerData, SHOPIFY_ADMIN_URL);
      }
    }

    // If not found by email, check if customer exists by phone
    const formattedPhone = formatPhoneForShopify(customerData.phone);
    console.log('🔍 DEBUG: Checking if customer exists by phone:', formattedPhone);
    const phoneSearchResponse = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers/search.json?query=phone:${encodeURIComponent(formattedPhone)}`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );

    if (phoneSearchResponse.ok) {
      const phoneSearchResult = await phoneSearchResponse.json();
      console.log('🔍 DEBUG: Phone search result:', phoneSearchResult);
      
      if (phoneSearchResult.customers && phoneSearchResult.customers.length > 0) {
        const existingCustomer = phoneSearchResult.customers[0];
        console.log('🔍 DEBUG: Customer found by phone:', existingCustomer.id);
        return await updateExistingCustomer(existingCustomer, customerData, SHOPIFY_ADMIN_URL);
      }
    }
    
    // Create new customer if doesn't exist
    console.log('🔍 DEBUG: Customer not found by email or phone, creating new customer');
    
    const customerPayload = {
      customer: {
        first_name: customerData.name.split(' ')[0] || customerData.name,
        last_name: customerData.name.split(' ').slice(1).join(' ') || '',
        email: customerData.email,
        phone: formatPhoneForShopify(customerData.phone),
        tags: `subscription,razorpay,${customerData.planType}`,
        note: `Subscribed to ${customerData.planType} via Razorpay`,
        verified_email: true,
        accepts_marketing: false,
        ...(customerData.address && {
          addresses: [{
            address1: customerData.address,
            address2: '',
            city: customerData.city,
            province: customerData.state,
            zip: customerData.pincode,
            country: 'India',
            country_code: 'IN',
            province_code: getProvinceCode(customerData.state || ''),
            first_name: customerData.name.split(' ')[0] || customerData.name,
            last_name: customerData.name.split(' ').slice(1).join(' ') || '',
            phone: formatPhoneForShopify(customerData.phone),
            company: '',
            default: true,
          }]
        })
      }
    };

    console.log('🔍 DEBUG: Creating new Shopify customer with payload:', JSON.stringify(customerPayload, null, 2));

    const response = await fetch(`${SHOPIFY_ADMIN_URL}/customers.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
      body: JSON.stringify(customerPayload),
    });

    const responseText = await response.text();
    console.log('🔍 DEBUG: Shopify API response status:', response.status);
    console.log('🔍 DEBUG: Shopify API response preview:', responseText.substring(0, 200) + '...');

    if (!response.ok) {
      console.error('❌ Shopify customer creation failed:', responseText);
      
      // If creation failed due to phone or email conflict, try one more search and update
      const errorData = JSON.parse(responseText);
      if (errorData.errors && (errorData.errors.phone || errorData.errors.email)) {
        console.log('🔍 DEBUG: Creation failed due to duplicate phone/email, attempting fallback search...');
        
        // Try searching by phone again (maybe the first search missed it)
        const fallbackSearchResponse = await fetch(
          `${SHOPIFY_ADMIN_URL}/customers.json?limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
            },
          }
        );

        if (fallbackSearchResponse.ok) {
          const allCustomers = await fallbackSearchResponse.json();
          const matchingCustomer = allCustomers.customers?.find((customer: any) => 
            customer.phone === formatPhoneForShopify(customerData.phone) || customer.email === customerData.email
          );

          if (matchingCustomer) {
            console.log('🔍 DEBUG: Found conflicting customer in fallback search:', matchingCustomer.id);
            return await updateExistingCustomer(matchingCustomer, customerData, SHOPIFY_ADMIN_URL);
          }
        }
      }
      
      return null;
    }

    const result = JSON.parse(responseText);
    
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
  } catch (error) {
    console.error('❌ Failed to create Shopify customer:', error);
    return null;
  }
}

// Helper function to update existing customer
async function updateExistingCustomer(existingCustomer: any, customerData: any, SHOPIFY_ADMIN_URL: string) {
  const currentTags = existingCustomer.tags || '';
  const subscriptionTags = `subscription,razorpay,${customerData.planType}`;
  
  // Prepare update payload
  const updatePayload: any = {
    customer: {
      id: existingCustomer.id,
    }
  };

  // Update tags if not already present
  if (!currentTags.includes('subscription') || !currentTags.includes(customerData.planType)) {
    const newTags = currentTags ? `${currentTags},${subscriptionTags}` : subscriptionTags;
    updatePayload.customer.tags = newTags;
    updatePayload.customer.note = `Updated: Subscribed to ${customerData.planType} via Razorpay`;
    console.log('🔍 DEBUG: Will update customer tags to:', newTags);
  }

  // Update email if different (and not empty)
  if (customerData.email && existingCustomer.email !== customerData.email) {
    updatePayload.customer.email = customerData.email;
    console.log('🔍 DEBUG: Will update customer email to:', customerData.email);
  }

  // Update phone if different (and not empty)
  if (customerData.phone && existingCustomer.phone !== customerData.phone) {
    updatePayload.customer.phone = customerData.phone;
    console.log('🔍 DEBUG: Will update customer phone to:', customerData.phone);
  }

  // Update name if different
  const newFirstName = customerData.name.split(' ')[0] || customerData.name;
  const newLastName = customerData.name.split(' ').slice(1).join(' ') || '';
  if (existingCustomer.first_name !== newFirstName || existingCustomer.last_name !== newLastName) {
    updatePayload.customer.first_name = newFirstName;
    updatePayload.customer.last_name = newLastName;
    console.log('🔍 DEBUG: Will update customer name to:', customerData.name);
  }

  // Add address if it's a print subscription with address data
  if (customerData.address && customerData.planType === 'Print Edition') {
    const addressPayload = {
      address1: customerData.address,
      address2: '',
      city: customerData.city,
      province: customerData.state,
      zip: customerData.pincode,
      country: 'India',
      country_code: 'IN',
      province_code: getProvinceCode(customerData.state || ''),
      first_name: newFirstName,
      last_name: newLastName,
      phone: customerData.phone,
      company: '',
      default: true,
    };

    // Add address separately since we can't add addresses in customer update
    try {
      const addressResponse = await fetch(`${SHOPIFY_ADMIN_URL}/customers/${existingCustomer.id}/addresses.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
        body: JSON.stringify({ address: addressPayload }),
      });

      if (addressResponse.ok) {
        const addressResult = await addressResponse.json();
        console.log('✅ DEBUG: Address added to existing customer:', addressResult.address?.id);
      } else {
        const addressError = await addressResponse.text();
        console.log('⚠️ DEBUG: Could not add address to existing customer:', addressError);
      }
    } catch (error) {
      console.log('⚠️ DEBUG: Error adding address to existing customer:', error);
    }
  }

  // Only update if there are changes to make
  if (Object.keys(updatePayload.customer).length > 1) { // More than just the ID
    console.log('🔍 DEBUG: Updating existing customer with payload:', JSON.stringify(updatePayload, null, 2));
    
    const updateResponse = await fetch(`${SHOPIFY_ADMIN_URL}/customers/${existingCustomer.id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
      body: JSON.stringify(updatePayload),
    });

    if (updateResponse.ok) {
      const updatedResult = await updateResponse.json();
      console.log('✅ DEBUG: Existing customer updated successfully:', updatedResult.customer?.id);
      return updatedResult.customer;
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Failed to update existing customer:', errorText);
    }
  }
  
  console.log('✅ DEBUG: Using existing customer without changes:', existingCustomer.id);
  return existingCustomer;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "create-subscription") {
      const body = await req.json();
      const { 
        planId, 
        customerName, 
        customerEmail, 
        customerPhone,
        deliveryAddress,
        city,
        state,
        pincode
      } = body;

      // Debug logs
      console.log('🔍 DEBUG: Received plan ID from frontend:', planId);
      console.log('🔍 DEBUG: Environment plan IDs:');
      console.log('   DIGITAL:', process.env.RAZORPAY_DIGITAL_PLAN_ID);
      console.log('   PRINT:', process.env.RAZORPAY_PRINT_PLAN_ID);

      if (!planId || !customerName || !customerEmail || !customerPhone) {
        return NextResponse.json(
          { error: "Plan ID, customer name, email, and phone are required" },
          { status: 400 }
        );
      }

      // Validate plan ID format
      if (!planId.startsWith('plan_')) {
        console.error('Invalid plan ID format:', planId);
        return NextResponse.json(
          { 
            error: "Invalid plan ID format. Please create test plans in Razorpay dashboard.",
            hint: "Plan ID should start with 'plan_'" 
          },
          { status: 400 }
        );
      }

      // Check if we're in test mode and provide helpful error
      const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');
      
      // Determine plan type - improved logic to handle missing env variables
      let planType = 'Digital Explorer'; // default
      
      if (process.env.RAZORPAY_PRINT_PLAN_ID && planId === process.env.RAZORPAY_PRINT_PLAN_ID) {
        planType = 'Print Edition';
      } else if (process.env.RAZORPAY_DIGITAL_PLAN_ID && planId === process.env.RAZORPAY_DIGITAL_PLAN_ID) {
        planType = 'Digital Explorer';
      } else {
        // Fallback: try to determine from the frontend data
        if (deliveryAddress || city || state || pincode) {
          planType = 'Print Edition';
          console.log('🔍 DEBUG: Plan type determined from address data: Print Edition');
        } else {
          console.log('🔍 DEBUG: Plan type defaulted to: Digital Explorer');
        }
      }

      console.log('🔍 DEBUG: Plan type determined as:', planType);
      console.log('🔍 DEBUG: Test mode:', isTestMode);
      console.log('🔍 DEBUG: Has delivery address:', !!deliveryAddress);

      // Create customer in Shopify for better management
      console.log('🔍 DEBUG: Creating Shopify customer with data:', {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        planType,
        hasAddress: !!deliveryAddress
      });

      const shopifyCustomer = await createShopifyCustomer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: deliveryAddress,
        city,
        state,
        pincode,
        planType,
      });

      console.log('🔍 DEBUG: Shopify customer creation result:', shopifyCustomer ? 'Success' : 'Failed');

      try {
        console.log('🔍 DEBUG: Creating Razorpay subscription with plan ID:', planId);
        
        // Create subscription with customer details
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          quantity: 1,
          total_count: 12, // Required field for subscriptions
          notes: {
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            delivery_address: deliveryAddress || '',
            city: city || '',
            state: state || '',
            pincode: pincode || '',
            plan_type: planType,
            shopify_customer_id: shopifyCustomer?.id || '',
            created_by: "wandernook_website",
          },
        });

        console.log('✅ DEBUG: Subscription created successfully:', subscription.id);

        // Get plan amount for order creation
        const planAmount = await getPlanAmount(planId);
        console.log('🔍 DEBUG: Plan amount for order:', planAmount);

        // Create Shopify order for the subscription (only if customer was created successfully)
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
        }

        console.log('🔍 DEBUG: Shopify order creation result:', shopifyOrder ? 'Success' : 'Failed');

        return NextResponse.json({
          success: true,
          subscription,
          shortUrl: subscription.short_url,
          shopifyCustomer: shopifyCustomer?.id,
          shopifyOrder: shopifyOrder?.id,
          orderTotal: shopifyOrder?.total_price,
          testMode: isTestMode,
        });

      } catch (razorpayError: any) {
        console.error("❌ DEBUG: Razorpay subscription creation failed:", razorpayError);
        
        if (razorpayError.error?.description?.includes('does not exist')) {
          return NextResponse.json({
            error: isTestMode 
              ? "Test plan not found. Please create test subscription plans in Razorpay dashboard (Test Mode)."
              : "Subscription plan not found. Please check your plan configuration.",
            hint: "Go to Razorpay Dashboard → Test Mode → Subscriptions → Plans → Create Plan",
            planId: planId,
            testMode: isTestMode,
            debugInfo: {
              receivedPlanId: planId,
              envDigitalPlan: process.env.RAZORPAY_DIGITAL_PLAN_ID,
              envPrintPlan: process.env.RAZORPAY_PRINT_PLAN_ID
            }
          }, { status: 400 });
        }

        return NextResponse.json({
          error: `Razorpay error: ${razorpayError.error?.description || razorpayError.message}`,
          testMode: isTestMode
        }, { status: 500 });
      }
    }

    if (action === "create-order") {
      const body = await req.json();
      const { amount, currency = "INR", receipt } = body;

      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt,
      });

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Razorpay API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "get-plans") {
      return NextResponse.json({
        digitalPlan: process.env.RAZORPAY_DIGITAL_PLAN_ID,
        printPlan: process.env.RAZORPAY_PRINT_PLAN_ID,
        testMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'),
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Razorpay API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
