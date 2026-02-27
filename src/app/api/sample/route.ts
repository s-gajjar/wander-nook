import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, contactNo, city, schoolName } = body || {};
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await prisma.sampleRequest.create({ data: { name, email, contactNo, city, schoolName } });

    return NextResponse.json({
      ok: true,
      message: "Sample request submitted successfully.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit sample request" }, { status: 500 });
  }
}
