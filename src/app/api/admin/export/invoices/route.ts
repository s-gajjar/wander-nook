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
    action: "export.invoices",
    resourceType: "invoice",
    resourceId: "all",
    ipAddress: getClientIp(request.headers),
  });

  const invoices = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    include: { customer: true },
  });

  const header = [
    "Invoice Number",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Plan",
    "Billing Cycle",
    "Amount (INR)",
    "Status",
    "Issued At",
    "Email Sent At",
    "Razorpay Payment ID",
    "Razorpay Subscription ID",
  ].join(",");

  const rows = invoices.map((inv) =>
    [
      inv.invoiceNumber,
      `"${inv.customer.fullName.replace(/"/g, '""')}"`,
      inv.customer.email,
      inv.customer.phone,
      inv.planLabel,
      inv.billingCycle,
      (inv.amountPaise / 100).toFixed(2),
      inv.status,
      inv.issuedAt.toISOString(),
      inv.emailSentAt?.toISOString() || "",
      inv.razorpayPaymentId,
      inv.razorpaySubscriptionId,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wandernook-invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
