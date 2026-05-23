import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getSessionSecret(): string {
  return process.env.ADMIN_PASSWORD || "fallback-not-secure";
}

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/**
 * Creates an HMAC-signed session token.
 * Format: `timestamp.signature`
 */
export function createSessionToken(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `admin:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Validates an HMAC-signed session token.
 * Returns true only if signature matches AND token is not expired.
 */
export function validateSessionToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;

  const [timestampStr, signature] = token.split(".");
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return false;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > SESSION_MAX_AGE) return false;

  // Verify signature
  const payload = `admin:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Checks if the incoming request has a valid admin session.
 */
export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return false;
  return validateSessionToken(token);
}

/**
 * Returns a 401 JSON response for unauthorized API requests.
 */
export function adminUnauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Sets the session cookie on a response.
 */
export function setSessionCookie(response: NextResponse): NextResponse {
  const token = createSessionToken();
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
}
