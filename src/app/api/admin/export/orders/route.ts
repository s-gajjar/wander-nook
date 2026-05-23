import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { recordAuditLog, getClientIp } from "@/src/lib/audit-log";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  await recordAuditLog({
    actor: "admin",
    action: "export.orders",
    resourceType: "order",
    resourceId: "all",
    ipAddress: getClientIp(request.headers),
  });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  const header = [
    "Order Number",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Plan",
    "Amount (INR)",
    "Payment Status",
    "Fulfillment Status",
    "Payment Method",
    "Razorpay Payment ID",
    "Razorpay Order ID",
    "Created At",
  ].join(",");

  const rows = orders.map((o) =>
    [
      o.orderNumber,
      `"${o.customer.fullName.replace(/"/g, '""')}"`,
      o.customer.email,
      o.customer.phone,
      o.planLabel,
      (o.amountPaise / 100).toFixed(2),
      o.status,
      o.fulfillmentStatus,
      o.paymentMethod,
      o.razorpayPaymentId,
      o.razorpayOrderId || "",
      o.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wandernook-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
