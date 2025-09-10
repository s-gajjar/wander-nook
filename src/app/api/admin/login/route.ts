import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password || "");

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
} 