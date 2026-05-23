import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/src/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearSessionCookie(res);
}
