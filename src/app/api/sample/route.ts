import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, contactNo, city, schoolName } = body || {};
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Fire-and-forget DB write to avoid blocking download if DB is slow
    prisma.sampleRequest
      .create({ data: { name, email, contactNo, city, schoolName } })
      .catch((e) => console.error("Failed to save SampleRequest", e));

    // Always serve local public PDF for instant, reliable download
    const downloadPath = "/pdf/file-sample_150kB.pdf";

    return NextResponse.json({ ok: true, downloadPath });
  } catch (e) {
    console.error(e);
    // Even on error, allow the local download so user isn't blocked
    const downloadPath = "/pdf/file-sample_150kB.pdf";
    return NextResponse.json({ ok: false, downloadPath }, { status: 200 });
  }
} 