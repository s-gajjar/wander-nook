import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { isAdminRequest, adminUnauthorizedJson } from "@/src/lib/admin-auth";
import { recordAuditLog, getClientIp } from "@/src/lib/audit-log";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return adminUnauthorizedJson();
  }

  const { id } = await params;

  try {
    const body = await request.json() as {
      fulfillmentStatus?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    };

    const validStatuses = ["unfulfilled", "fulfilled", "shipped", "delivered"];
    if (body.fulfillmentStatus && !validStatuses.includes(body.fulfillmentStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid fulfillment status" }, { status: 400 });
    }

    // Fetch current state for audit log
    const currentOrder = await prisma.order.findUnique({ where: { id }, select: { fulfillmentStatus: true, trackingNumber: true } });
    if (!currentOrder) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.fulfillmentStatus) {
      updateData.fulfillmentStatus = body.fulfillmentStatus;
      if (body.fulfillmentStatus === "fulfilled") updateData.fulfilledAt = new Date();
      if (body.fulfillmentStatus === "shipped") {
        updateData.shippedAt = new Date();
        if (!updateData.fulfilledAt) updateData.fulfilledAt = new Date();
      }
      if (body.fulfillmentStatus === "delivered") {
        updateData.deliveredAt = new Date();
        if (!updateData.shippedAt) updateData.shippedAt = new Date();
        if (!updateData.fulfilledAt) updateData.fulfilledAt = new Date();
      }
    }

    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
    if (body.trackingUrl !== undefined) updateData.trackingUrl = body.trackingUrl;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Determine audit action
    const action = body.fulfillmentStatus === "shipped"
      ? "order.ship" as const
      : body.fulfillmentStatus === "delivered"
        ? "order.deliver" as const
        : body.trackingNumber
          ? "order.update_tracking" as const
          : "order.fulfill" as const;

    await recordAuditLog({
      actor: "admin",
      action,
      resourceType: "order",
      resourceId: id,
      metadata: {
        before: { fulfillmentStatus: currentOrder.fulfillmentStatus, trackingNumber: currentOrder.trackingNumber },
        after: { fulfillmentStatus: order.fulfillmentStatus, trackingNumber: order.trackingNumber },
      },
      ipAddress: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, fulfillmentStatus: order.fulfillmentStatus });
  } catch (error) {
    console.error("Fulfillment update error:", error);
    return NextResponse.json({ ok: false, error: "Order not found or update failed" }, { status: 404 });
  }
}
