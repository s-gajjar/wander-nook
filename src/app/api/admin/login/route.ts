import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_VALUE, SESSION_MAX_AGE } from "@/src/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password || "").trim();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const expected = process.env.ADMIN_PASSWORD.trim();

  if (password !== expected) {
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Set cookie directly via header - most reliable method
  const cookieParts = [
    `${COOKIE_NAME}=${COOKIE_VALUE}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieParts.join("; "),
    },
  });
}
