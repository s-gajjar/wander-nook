import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({
    ok: true,
    ignored: true,
    reason: "Shopify order webhooks are retired. Razorpay/local orders are the source of truth.",
  });
}
