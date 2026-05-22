import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Shopify selling plans have been retired.",
      replacement: "Create and manage plans in Razorpay, then map them with RAZORPAY_*_PLAN_ID.",
    },
    { status: 410 }
  );
}
