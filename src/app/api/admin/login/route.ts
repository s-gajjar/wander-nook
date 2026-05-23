import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { setSessionCookie } from "@/src/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password || "");

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  // Timing-safe password comparison (trim to handle copy-paste whitespace)
  const expected = Buffer.from(process.env.ADMIN_PASSWORD.trim(), "utf8");
  const provided = Buffer.from(password.trim(), "utf8");

  const isValid =
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided);

  if (!isValid) {
    // Add small delay to prevent brute force timing attacks
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  return setSessionCookie(res);
}
