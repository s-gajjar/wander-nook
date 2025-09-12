import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, contactNo, city, schoolName } = body || {};
    
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Validate contact number format (should include country code)
    if (contactNo && !contactNo.startsWith('+')) {
      console.warn('⚠️ Contact number received without country code:', contactNo);
    }

    console.log('✅ DEBUG: Storing sample request with data:', {
      name,
      email,
      contactNo, // This should be like "+919876543210"
      city,
      schoolName
    });

    // Fire-and-forget DB write to avoid blocking download if DB is slow
    prisma.sampleRequest
      .create({ data: { name, email, contactNo, city, schoolName } })
      .then((result) => {
        console.log('✅ DEBUG: Sample request saved successfully:', result.id, 'with phone:', result.contactNo);
      })
      .catch((e) => console.error("❌ Failed to save SampleRequest:", e));

    // Serve the Wander Nook Launch Issue PDF for download
    const downloadPath = "/pdf/Wander Nook Launch Issue.pdf";

    return NextResponse.json({ ok: true, downloadPath });
  } catch (e) {
    console.error(e);
    // Even on error, allow the local download so user isn't blocked
    const downloadPath = "/pdf/Wander Nook Launch Issue.pdf";
    return NextResponse.json({ ok: false, downloadPath }, { status: 200 });
  }
} 