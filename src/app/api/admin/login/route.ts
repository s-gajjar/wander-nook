import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_VALUE, SESSION_MAX_AGE } from "@/src/lib/admin-auth";

export async function POST(req: NextRequest) {
  // Support both JSON and form data
  const contentType = req.headers.get("content-type") || "";
  let password = "";
  let redirectTo = "/admin";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    password = String(body?.password || "").trim();
    redirectTo = String(body?.next || "/admin");
  } else {
    const formData = await req.formData().catch(() => new FormData());
    password = String(formData.get("password") || "").trim();
    redirectTo = String(formData.get("next") || "/admin");
  }

  if (!process.env.ADMIN_PASSWORD) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }
    return new Response("Server not configured", { status: 500 });
  }

  const expected = process.env.ADMIN_PASSWORD.trim();

  if (password !== expected) {
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    // Redirect back to login with error
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("next", redirectTo);
    return NextResponse.redirect(loginUrl, 303);
  }

  // Build Set-Cookie header
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

  if (contentType.includes("application/json")) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieParts.join("; "),
      },
    });
  }

  // For form submissions: redirect with cookie set
  const destination = new URL(redirectTo, req.url);
  return new Response(null, {
    status: 303,
    headers: {
      "Location": destination.toString(),
      "Set-Cookie": cookieParts.join("; "),
    },
  });
}
