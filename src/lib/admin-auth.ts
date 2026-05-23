import { NextRequest, NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
const COOKIE_NAME = "admin_session";
const COOKIE_VALUE = "authenticated";

/**
 * Validates admin session - just checks cookie exists with correct value.
 * Security relies on: HttpOnly + Secure + SameSite + password-gated setting.
 */
export function validateSessionToken(token: string): boolean {
  return token === COOKIE_VALUE;
}

/**
 * Checks if the incoming request has a valid admin session.
 * On Vercel Preview, Deployment Protection already guards access.
 */
export function isAdminRequest(request: NextRequest): boolean {
  if (process.env.VERCEL_ENV === "preview") return true;
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
  response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
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

export { COOKIE_NAME, COOKIE_VALUE, SESSION_MAX_AGE };
