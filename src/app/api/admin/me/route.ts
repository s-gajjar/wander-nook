import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const isAdmin = req.cookies.get("admin")?.value === "1";
  return NextResponse.json({ isAdmin });
} 