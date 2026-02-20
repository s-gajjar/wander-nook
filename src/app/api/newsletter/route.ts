import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { trackConversionEvent } from "@/src/lib/conversion-tracking";

export const runtime = "nodejs";

function sanitizeText(value: string | null | undefined, maxLength = 120) {
  return (value || "").trim().slice(0, maxLength);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: string; name?: string; source?: string }
      | null;

    const email = sanitizeText((body?.email || "").toLowerCase(), 120);
    const name = sanitizeText(body?.name, 120);
    const source = sanitizeText(body?.source || "website", 60);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: {
        email,
      },
      update: {
        name: name || undefined,
        source,
        status: "active",
      },
      create: {
        email,
        name: name || null,
        source,
        status: "active",
      },
    });

    await trackConversionEvent({
      eventName: "newsletter_subscribed",
      customerEmail: email,
      metadata: {
        source,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscribe failed", error);
    return NextResponse.json(
      {
        error: "Failed to subscribe. Please try again.",
      },
      { status: 500 }
    );
  }
}
