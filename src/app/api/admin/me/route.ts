import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin_session");
  const allCookies = req.cookies.getAll().map(c => `${c.name}=${c.value}`);
  
  return NextResponse.json({
    authenticated: cookie?.value === "authenticated",
    cookieValue: cookie?.value || null,
    allCookieNames: allCookies.map(c => c.split("=")[0]),
    timestamp: new Date().toISOString(),
  });
}
