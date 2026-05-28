import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";
import { ensureInvoiceForOnetimePayment } from "@/src/lib/invoice-service";

export const runtime = "nodejs";

function inferDurationMonths(planId: string): number {
  if (/annual|yearly/i.test(planId)) return 12;
  if (/monthly/i.test(planId)) return 1;
  return 12; // default to annual
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json(
      { error: "Can only generate invoices for paid orders" },
      { status: 400 }
    );
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findUnique({
    where: { razorpayPaymentId: order.razorpayPaymentId },
  });

  if (existingInvoice) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      invoiceId: existingInvoice.id,
      invoiceNumber: existingInvoice.invoiceNumber,
    });
  }

  try {
    const result = await ensureInvoiceForOnetimePayment({
      paymentId: order.razorpayPaymentId,
      razorpayOrderId: order.razorpayOrderId || "",
      sourceEvent: "admin_manual_generate",
      customerId: order.customerId,
      planId: order.planId,
      planLabel: order.planLabel,
      amountPaise: order.amountPaise,
      currency: order.currency,
      durationMonths: inferDurationMonths(order.planId),
    });

    return NextResponse.json({
      ok: true,
      alreadyExists: false,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      emailSent: result.emailSent,
      emailSkippedReason: result.emailSkippedReason,
    });
  } catch (error) {
    console.error("Manual invoice generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invoice generation failed" },
      { status: 500 }
    );
  }
}
