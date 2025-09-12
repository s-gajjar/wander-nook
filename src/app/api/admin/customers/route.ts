import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;

// Helper function to extract customer data from subscription notes
async function getCustomerDataFromRazorpay(customerId: string) {
  try {
    // This would require Razorpay API call - for now, return empty
    // In a real implementation, you'd fetch subscription data from Razorpay
    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to parse customer info from notes
function parseCustomerFromNote(note: string) {
  try {
    // Extract basic info from note patterns like "Subscribed to Print Edition via Razorpay"
    const planMatch = note.match(/Subscribed to (.*?) via/);
    return {
      plan_type: planMatch ? planMatch[1] : '',
    };
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated (you can add proper auth check here)
    // For now, we'll just check if the admin token exists
    if (!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Shopify admin access not configured" },
        { status: 500 }
      );
    }

    // Fetch all customers first, then filter for subscription-related ones
    // Request specific fields to ensure we get all the data we need
    const response = await fetch(
      `${SHOPIFY_ADMIN_URL}/customers.json?limit=250&fields=id,email,first_name,last_name,phone,created_at,updated_at,orders_count,state,total_spent,last_order_id,note,verified_email,tags,addresses,default_address`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch customers from Shopify" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Debug: Log the raw response to understand the data structure
    console.log('🔍 DEBUG: Raw Shopify response sample:', JSON.stringify(data.customers[0], null, 2));
    
    // Filter customers that have subscription-related indicators - more lenient filtering
    const subscriptionCustomers = data.customers.filter((customer: any) => {
      const tags = (customer.tags || "").toLowerCase();
      const note = (customer.note || "").toLowerCase();
      const email = (customer.email || "").toLowerCase();
      
      // Look for subscription indicators in tags, notes, or email patterns
      return tags.includes('subscription') || 
             tags.includes('razorpay') || 
             tags.includes('print edition') ||
             tags.includes('digital explorer') ||
             tags.includes('print') ||
             tags.includes('digital') ||
             note.includes('subscribed') ||
             note.includes('razorpay') ||
             note.includes('print edition') ||
             note.includes('digital explorer') ||
             // Also include customers with recurring orders or high spend (likely subscribers)
             (customer.orders_count > 0 && parseFloat(customer.total_spent) >= 1500) ||
             // Include customers with subscription-related email domains or test emails
             email.includes('test') ||
             email.includes('demo');
    });
    
    // Transform the data to include addresses more clearly
    const customers = await Promise.all(subscriptionCustomers.map(async (customer: any) => {
      // Debug log for mapping
      console.log(`🔍 DEBUG: Mapping customer ${customer.id}:`, {
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        hasAddresses: !!customer.addresses?.length
      });
      
      // Fetch detailed address information if needed
      let detailedAddresses = customer.addresses || [];
      if (customer.addresses && customer.addresses.length > 0) {
        try {
          const addressResponse = await fetch(
            `${SHOPIFY_ADMIN_URL}/customers/${customer.id}/addresses.json`,
            {
              headers: {
                "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
                "Content-Type": "application/json",
              },
            }
          );
          if (addressResponse.ok) {
            const addressData = await addressResponse.json();
            detailedAddresses = addressData.addresses || customer.addresses;
            console.log(`🔍 DEBUG: Fetched ${detailedAddresses.length} detailed addresses for customer ${customer.id}`);
          }
        } catch (error) {
          console.log(`⚠️ DEBUG: Could not fetch detailed addresses for customer ${customer.id}:`, error);
        }
      }
      
      // Parse additional info from notes if main fields are empty
      const noteInfo = parseCustomerFromNote(customer.note || '');
      
      return {
        id: customer.id,
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "", 
        phone: customer.phone || "",
        tags: customer.tags || "",
        note: customer.note || "",
        created_at: customer.created_at,
        addresses: detailedAddresses,
        orders_count: customer.orders_count || 0,
        total_spent: customer.total_spent || "0.00",
        verified_email: customer.verified_email || false,
        state: customer.state || "",
        // Add parsed info for display
        plan_type_from_note: noteInfo.plan_type || '',
      };
    }));

    console.log(`🔍 DEBUG: Found ${customers.length} subscription customers out of ${data.customers.length} total customers`);
    
    // Log a few sample customers for debugging
    if (customers.length > 0) {
      console.log('🔍 DEBUG: Sample subscription customers:', customers.slice(0, 3).map((c: any) => ({
        id: c.id,
        email: c.email,
        tags: c.tags,
        note: c.note,
        total_spent: c.total_spent
      })));
    }

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
      note: "Some customer details may be limited due to Shopify API restrictions. Check individual customer records in Shopify admin for complete information."
    });

  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}