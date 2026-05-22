import { NextResponse } from "next/server";

export const runtime = "nodejs";

function retiredShopifyResponse() {
  return NextResponse.json(
    {
      error: "Shopify checkout has been retired.",
      replacement: "Use the Razorpay checkout APIs and local admin orders.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return retiredShopifyResponse();
}

export async function POST() {
  return retiredShopifyResponse();
}
