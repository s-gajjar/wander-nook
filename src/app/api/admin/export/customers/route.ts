import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true, orders: true } } },
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "Pincode",
    "Country",
    "Invoices",
    "Orders",
    "Created At",
  ].join(",");

  const rows = customers.map((c) =>
    [
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      `"${c.addressLine1.replace(/"/g, '""')}"`,
      `"${(c.addressLine2 || "").replace(/"/g, '""')}"`,
      c.city,
      c.state,
      c.pincode,
      c.country,
      c._count.invoices,
      c._count.orders,
      c.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wandernook-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
