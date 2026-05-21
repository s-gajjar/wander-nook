import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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
