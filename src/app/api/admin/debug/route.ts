import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Add recommendations based on missing configs
    const recommendations: string[] = [];
    
    if (!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      recommendations.push("Set SHOPIFY_ADMIN_ACCESS_TOKEN in your .env file");
    }
    
    if (!process.env.RAZORPAY_DIGITAL_PLAN_ID || !process.env.RAZORPAY_PRINT_PLAN_ID) {
      recommendations.push("Set RAZORPAY_DIGITAL_PLAN_ID and RAZORPAY_PRINT_PLAN_ID in your .env file");
      recommendations.push("Create subscription plans in your Razorpay dashboard first");
    }

    const debugInfo = {
      shopify: {
        domain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ? '✅ Set' : '❌ Missing',
        adminToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
        apiVersion: process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || 'Not set',
      },
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing',
        keySecret: process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing',
        publicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing',
        testMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? '✅ Test Mode' : '❌ Live Mode',
        digitalPlanId: process.env.RAZORPAY_DIGITAL_PLAN_ID ? '✅ Set' : '❌ Missing',
        printPlanId: process.env.RAZORPAY_PRINT_PLAN_ID ? '✅ Set' : '❌ Missing',
      },
      recommendations
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "test-shopify") {
      // Test Shopify connection
      if (!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
        return NextResponse.json({
          success: false,
          error: "Shopify credentials not configured"
        });
      }

      const SHOPIFY_ADMIN_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/${process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION}`;
      
      const response = await fetch(`${SHOPIFY_ADMIN_URL}/customers.json?limit=1`, {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "Shopify connection successful"
        });
      } else {
        const errorText = await response.text();
        return NextResponse.json({
          success: false,
          error: `Shopify API error: ${response.status} - ${errorText}`
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Debug POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 