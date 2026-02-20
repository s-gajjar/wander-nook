import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  const customers = await prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
    include: {
      _count: {
        select: {
          invoices: true,
        },
      },
    },
  });

  return NextResponse.json({
    customers,
  });
}
