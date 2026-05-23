import { NextRequest, NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const COOKIE_NAME = "admin_session";

/**
 * Base64url encode a string (works in both Node.js and Edge Runtime)
 */
function toBase64Url(str: string): string {
  // Use btoa which is available in both runtimes
  const base64 = btoa(
    str
      .split("")
      .map((c) => String.fromCharCode(c.charCodeAt(0)))
      .join("")
  );
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Creates a session token.
 * Format: timestamp.hash
 */
export function createSessionToken(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = process.env.ADMIN_PASSWORD || "";
  const payload = `${secret}:${timestamp}:wandernook-admin`;
  const hash = toBase64Url(payload);
  return `${timestamp}.${hash}`;
}

/**
 * Validates a session token.
 */
export function validateSessionToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;

  const dotIndex = token.indexOf(".");
  const timestampStr = token.substring(0, dotIndex);
  const hash = token.substring(dotIndex + 1);

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > SESSION_MAX_AGE) return false;

  // Verify hash by reconstructing it
  const secret = process.env.ADMIN_PASSWORD || "";
  if (!secret) return false;
  
  const payload = `${secret}:${timestamp}:wandernook-admin`;
  const expectedHash = toBase64Url(payload);

  return hash === expectedHash;
}

/**
 * Checks if the incoming request has a valid admin session.
 */
export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value;
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
  response.cookies.set(COOKIE_NAME, token, {
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
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
}

export { COOKIE_NAME, SESSION_MAX_AGE };
