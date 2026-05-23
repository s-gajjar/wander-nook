import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSessionToken } from "@/src/lib/admin-auth";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

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

  // Create session token and set cookie via Set-Cookie header directly
  const token = createSessionToken();
  const isProduction = process.env.NODE_ENV === "production";
  const cookieParts = [
    `admin_session=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (isProduction) cookieParts.push("Secure");

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieParts.join("; "),
    },
  });
}
