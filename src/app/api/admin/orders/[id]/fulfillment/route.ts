import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    return NextResponse.json({ ok: true, fulfillmentStatus: order.fulfillmentStatus });
  } catch (error) {
    console.error("Fulfillment update error:", error);
    return NextResponse.json({ ok: false, error: "Order not found or update failed" }, { status: 404 });
  }
}
