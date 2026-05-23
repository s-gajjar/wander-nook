import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  unfulfilled: { label: "Processing", color: "#D97706", bg: "#FEF3C7" },
  fulfilled: { label: "Packed", color: "#7C3AED", bg: "#EDE9FE" },
  shipped: { label: "Shipped", color: "#2563EB", bg: "#DBEAFE" },
  delivered: { label: "Delivered", color: "#059669", bg: "#D1FAE5" },
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { id: token },
    include: { customer: true },
  });

  if (!order) {
    notFound();
  }

  const status = STATUS_CONFIG[order.fulfillmentStatus] || STATUS_CONFIG.unfulfilled;
  const shipping = order.shippingAddress as Record<string, string> | null;

  const timeline = [
    { label: "Order Placed", date: order.createdAt, done: true },
    { label: "Packed", date: order.fulfilledAt, done: !!order.fulfilledAt },
    { label: "Shipped", date: order.shippedAt, done: !!order.shippedAt },
    { label: "Delivered", date: order.deliveredAt, done: !!order.deliveredAt },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-bold text-[#111827]">Order Status</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">{order.orderNumber}</p>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
          {/* Current status */}
          <div className="text-center mb-6">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }}></span>
              {status.label}
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-0 mb-6">
            {timeline.map((step, i) => (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      step.done
                        ? "border-[#059669] bg-[#059669]"
                        : "border-[#D1D5DB] bg-white"
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <div
                      className={`w-0.5 h-8 ${
                        step.done && timeline[i + 1]?.done ? "bg-[#059669]" : "bg-[#E5E7EB]"
                      }`}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-[13px] font-medium ${step.done ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{formatDate(step.date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tracking info */}
          {order.trackingNumber && (
            <div className="rounded-xl bg-[#F3F4F6] p-4 mb-4">
              <p className="text-[11px] uppercase tracking-wider text-[#6B7280] font-medium">Tracking Number</p>
              <p className="text-[14px] font-mono font-semibold text-[#111827] mt-1">{order.trackingNumber}</p>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-[#4F46E5] hover:underline"
                >
                  Track shipment →
                </a>
              )}
            </div>
          )}

          {/* Order details */}
          <div className="border-t border-[#F3F4F6] pt-4 space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B7280]">Plan</span>
              <span className="font-medium text-[#111827]">{order.planLabel}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B7280]">Amount</span>
              <span className="font-semibold text-[#111827]">₹{(order.amountPaise / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B7280]">Ordered</span>
              <span className="text-[#374151]">{formatDate(order.createdAt)}</span>
            </div>
            {shipping && (
              <div className="pt-2 border-t border-[#F3F4F6]">
                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium mb-1">Shipping to</p>
                <p className="text-[12px] text-[#374151] leading-relaxed">
                  {shipping.name || order.customer.fullName}<br />
                  {shipping.addressLine1 || shipping.line1}
                  {(shipping.addressLine2 || shipping.line2) && <>, {shipping.addressLine2 || shipping.line2}</>}<br />
                  {shipping.city}, {shipping.state} {shipping.pincode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#9CA3AF] mt-4">
          Questions? Email us at <a href="mailto:contact@wandernook.in" className="underline">contact@wandernook.in</a>
        </p>
      </div>
    </div>
  );
}
