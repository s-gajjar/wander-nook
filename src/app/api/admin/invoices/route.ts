import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";

export const runtime = "nodejs";

function sanitizeSearch(value: string | null) {
  return (value || "").trim().slice(0, 80);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  const search = sanitizeSearch(request.nextUrl.searchParams.get("q"));

  const invoices = await prisma.invoice.findMany({
    where: search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            { razorpayPaymentId: { contains: search, mode: "insensitive" } },
            { customer: { email: { contains: search, mode: "insensitive" } } },
            { customer: { fullName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: {
      issuedAt: "desc",
    },
    include: {
      customer: true,
    },
    take: 200,
  });

  return NextResponse.json({
    invoices,
  });
}
