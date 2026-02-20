import { NextRequest, NextResponse } from "next/server";

export function isAdminRequest(request: NextRequest) {
  return request.cookies.get("admin")?.value === "1";
}

export function adminUnauthorizedJson() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
