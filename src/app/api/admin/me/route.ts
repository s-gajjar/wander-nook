import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/src/lib/admin-auth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ isAdmin: isAdminRequest(req) });
}
