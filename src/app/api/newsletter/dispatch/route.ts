import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest } from "@/src/lib/admin-auth";
import { sendTransactionalEmail } from "@/src/lib/mailer";

export const runtime = "nodejs";

type DispatchBody = {
  subject?: string;
  html?: string;
  text?: string;
  limit?: number;
};

function sanitizeText(value: string | null | undefined, maxLength = 200) {
  return (value || "").trim().slice(0, maxLength);
}

function isAuthorized(request: NextRequest) {
  if (isAdminRequest(request)) {
    return true;
  }

  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const headerSecret = (request.headers.get("x-cron-secret") || "").trim();
  return Boolean(cronSecret && headerSecret && cronSecret === headerSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DispatchBody | null;
  const subject = sanitizeText(body?.subject, 140);
  const html = (body?.html || "").trim();
  const text = (body?.text || "").trim();

  if (!subject || !html) {
    return NextResponse.json(
      { error: "subject and html are required." },
      { status: 400 }
    );
  }

  const limit = Math.max(1, Math.min(Number(body?.limit || 50), 500));

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  const results = await Promise.allSettled(
    subscribers.map((subscriber) =>
      sendTransactionalEmail({
        to: subscriber.email,
        subject,
        html,
        text,
      })
    )
  );

  const delivered = results.filter(
    (result) => result.status === "fulfilled" && result.value.sent
  ).length;
  const skipped = results.filter(
    (result) => result.status === "fulfilled" && !result.value.sent
  ).length;
  const failed = results.filter((result) => result.status === "rejected").length;

  return NextResponse.json({
    ok: true,
    total: subscribers.length,
    delivered,
    skipped,
    failed,
  });
}
