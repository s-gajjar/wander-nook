import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// This mimics exactly what the layout does
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    sessionCookie: session || null,
    sessionValue: session?.value || null,
    wouldRedirect: session?.value !== "authenticated",
    allCookieNames: allCookies.map((c) => c.name),
    allCookies: allCookies.map((c) => ({ name: c.name, value: c.value.slice(0, 30) })),
  });
}
